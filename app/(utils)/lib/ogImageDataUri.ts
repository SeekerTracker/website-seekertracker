/**
 * Prepare listing media for next/og ImageResponse on Cloudflare Workers.
 *
 * Satori cannot reliably fetch third-party <img src> URLs in the OpenNext
 * nodejs runtime — those images fail silently and leave empty frames. It
 * also cannot decode WebP/AVIF or video. Fetch bytes in this handler and
 * pass a PNG/JPEG/GIF data URI instead. images.weserv.nl is used only when
 * the origin is an unsupported still format or the file is too large to
 * embed; it is not on the happy path, because a Worker may not be able to
 * reach weserv (the previous proxy-as-<img src> approach failed for that
 * reason).
 */

const SATORI_TYPES = new Set(["image/png", "image/jpeg", "image/gif"]);
const CONVERT_TYPES = new Set(["image/webp", "image/avif"]);
/** Direct-embed cap. Typical store screenshots are 0.3–1.7 MB. */
const MAX_DIRECT_EMBED_BYTES = 2_500_000;
const MAX_SOURCE_BYTES = 8_000_000;
const FETCH_TIMEOUT_MS = 8_000;
const USER_AGENT = "SeekerTracker/1.0 OG";

export type OgImageSize = {
  width: number;
  height: number;
};

type Fetched = {
  bytes: Uint8Array;
  contentType: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

function toDataUri(bytes: Uint8Array, mime: string): string {
  return `data:${mime};base64,${bytesToBase64(bytes)}`;
}

function headerMime(contentType: string): string | null {
  const ct = contentType.split(";")[0].trim().toLowerCase();
  if (ct === "image/jpg") return "image/jpeg";
  if (
    ct === "image/png" ||
    ct === "image/jpeg" ||
    ct === "image/gif" ||
    ct === "image/webp" ||
    ct === "image/avif"
  ) {
    return ct;
  }
  if (ct.startsWith("video/")) return ct;
  return null;
}

/** Detect a still-image or video type from magic bytes, then Content-Type. */
export function sniffMediaType(
  bytes: Uint8Array,
  contentType = ""
): string | null {
  if (bytes.length >= 12) {
    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return "image/png";
    }
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return "image/jpeg";
    }
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return "image/gif";
    }
    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return "image/webp";
    }
    // ISO BMFF: ....ftypXXXX
    if (
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70
    ) {
      const brand = String.fromCharCode(
        bytes[8],
        bytes[9],
        bytes[10],
        bytes[11]
      );
      if (brand === "avif" || brand === "avis") return "image/avif";
      return "video/mp4";
    }
  }
  return headerMime(contentType);
}

function isVideoType(mime: string | null, contentType: string): boolean {
  if (mime && mime.startsWith("video/")) return true;
  return headerMime(contentType)?.startsWith("video/") === true;
}

async function cancelBody(res: Response): Promise<void> {
  try {
    await res.body?.cancel();
  } catch {
    /* ignore */
  }
}

async function fetchBytes(url: string): Promise<Fetched | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "image/png,image/jpeg,image/gif,image/webp,image/avif,image/*;q=0.8,*/*;q=0.1",
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      await cancelBody(res);
      return null;
    }
    const contentType = res.headers.get("content-type") || "";
    if (isVideoType(null, contentType)) {
      await cancelBody(res);
      return { bytes: new Uint8Array(), contentType };
    }
    const declared = Number(res.headers.get("content-length") || 0);
    if (declared > MAX_SOURCE_BYTES) {
      await cancelBody(res);
      return null;
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > MAX_SOURCE_BYTES) return null;
    return { bytes: buf, contentType };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function weservPngUrl(uri: string, size: OgImageSize): string {
  const params = new URLSearchParams({
    url: uri,
    output: "png",
    w: String(size.width),
    h: String(size.height),
    fit: "cover",
  });
  return `https://images.weserv.nl/?${params.toString()}`;
}

function embedIfSatoriSafe(
  bytes: Uint8Array,
  contentType: string,
  maxBytes = Number.POSITIVE_INFINITY
): string | null {
  if (bytes.byteLength < 24) return null;
  const mime = sniffMediaType(bytes, contentType);
  if (!mime || !SATORI_TYPES.has(mime)) return null;
  if (bytes.byteLength > maxBytes) return null;
  return toDataUri(bytes, mime);
}

async function convertViaWeserv(
  uri: string,
  size: OgImageSize
): Promise<string | null> {
  const converted = await fetchBytes(weservPngUrl(uri, size));
  if (!converted) return null;
  return embedIfSatoriSafe(converted.bytes, converted.contentType);
}

/**
 * Return a Satori-safe data URI for a listing image, or null on failure
 * (fetch error, timeout, video, unsupported format, empty body).
 */
export async function ogImageDataUri(
  uri: string | null | undefined,
  size: OgImageSize
): Promise<string | null> {
  if (!uri || !/^https?:\/\//i.test(uri)) return null;

  const original = await fetchBytes(uri);
  if (original) {
    const mime = sniffMediaType(original.bytes, original.contentType);
    if (isVideoType(mime, original.contentType)) return null;

    if (mime && SATORI_TYPES.has(mime)) {
      const embedded = embedIfSatoriSafe(
        original.bytes,
        original.contentType,
        MAX_DIRECT_EMBED_BYTES
      );
      if (embedded) return embedded;
      // Oversized but decodable — try a resized PNG, then give up.
      return convertViaWeserv(uri, size);
    }

    if (mime && CONVERT_TYPES.has(mime)) {
      return convertViaWeserv(uri, size);
    }
  }

  // Origin fetch failed (or type was unknown). Weserv may still be able
  // to retrieve and convert the asset.
  return convertViaWeserv(uri, size);
}

/** Map a list of URIs to data URIs in order (nulls preserved). */
export async function ogImageDataUris(
  uris: (string | null | undefined)[],
  size: OgImageSize
): Promise<(string | null)[]> {
  return Promise.all(uris.map((u) => ogImageDataUri(u, size)));
}
