const APPS = "https://api.cherry.fun/api/v1/apps";

type CherryJson = Record<string, unknown>;

function apiKey(): string | null {
  const k = process.env.CHERRY_API_KEY?.trim();
  return k || null;
}

export async function cherry(
  method: string,
  path: string,
  body?: unknown,
  query?: Record<string, string>,
): Promise<{ ok: boolean; status: number; data: CherryJson }> {
  const key = apiKey();
  if (!key) {
    return { ok: false, status: 503, data: { error: "CHERRY_API_KEY missing" } };
  }
  const url = new URL(`${APPS}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v) url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  let data: CherryJson = {};
  try {
    data = text ? (JSON.parse(text) as CherryJson) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

export type CherryStatus = {
  appId: string;
  botWallet: string;
  scopes: string[];
  roomId: string | null;
  canCreateRooms: boolean;
  embedReady: boolean;
};

const ROOM_TITLE = "Seeker Tracker";

function asRooms(data: CherryJson): CherryJson[] {
  for (const k of ["groups", "rooms", "items", "data"]) {
    const v = data[k];
    if (Array.isArray(v)) return v as CherryJson[];
  }
  return [];
}

function roomIdOf(row: CherryJson): string {
  const id = row.roomId || row.id || row.groupId;
  return typeof id === "string" ? id : "";
}

function titleOf(row: CherryJson): string {
  const t = row.title || row.name;
  return typeof t === "string" ? t : "";
}

async function ensureRoom(botWallet: string): Promise<string | null> {
  const pinned = (process.env.CHERRY_ROOM_ID || "").trim();
  if (pinned) return pinned;

  const listed = await cherry("GET", "/groups");
  const existing = asRooms(listed.data).find(
    (row) => titleOf(row) === ROOM_TITLE && roomIdOf(row),
  );
  if (existing) {
    const vis = existing.visibility;
    const avatar = existing.avatarUrl || existing.avatar_url;
    if (vis !== "public" || !avatar) await brandRoom(roomIdOf(existing));
    return roomIdOf(existing);
  }

  const ownerWallet =
    (process.env.CHERRY_OWNER_WALLET || "").trim() || botWallet;
  if (!ownerWallet) return null;

  const created = await cherry("POST", "/groups", {
    ownerWallet,
    title: ROOM_TITLE,
    description: "Seeker Tracker community chat",
  });
  const roomId =
    typeof created.data.roomId === "string" ? created.data.roomId : "";
  if (!created.ok || !roomId) return null;

  await brandRoom(roomId);
  await cherry("POST", `/groups/${roomId}/messages`, {
    content: "Seeker Tracker chat is live. Connect a Solana wallet to talk.",
  });
  return roomId;
}

async function brandRoom(roomId: string) {
  await cherry("PATCH", `/groups/${roomId}`, {
    title: ROOM_TITLE,
    description: "Seeker Tracker community chat",
    avatarUrl: "https://seekertracker.com/logo.png",
    visibility: "public",
  });
}

export async function getCherryStatus(): Promise<
  { ok: true; status: CherryStatus } | { ok: false; status: number; error: string }
> {
  if (!apiKey()) {
    return { ok: false, status: 503, error: "CHERRY_API_KEY missing" };
  }
  const me = await cherry("GET", "/me");
  if (!me.ok) {
    return { ok: false, status: me.status, error: "Cherry /me failed" };
  }
  const scopes = Array.isArray(me.data.scopes)
    ? me.data.scopes.filter((s): s is string => typeof s === "string")
    : [];
  const appId = (process.env.CHERRY_EMBED_ID || "").trim();
  const botWallet =
    typeof me.data.botWallet === "string" ? me.data.botWallet : "";
  const canCreateRooms = scopes.includes("groups:create");
  let roomId = (process.env.CHERRY_ROOM_ID || "").trim() || null;
  if (!roomId && canCreateRooms) {
    roomId = await ensureRoom(botWallet);
  }
  return {
    ok: true,
    status: {
      appId,
      botWallet,
      scopes,
      roomId,
      canCreateRooms,
      embedReady: Boolean(appId),
    },
  };
}
