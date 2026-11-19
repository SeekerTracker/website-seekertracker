const MELBOURNE = "Australia/Melbourne";

export function fmtSkr(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function fmtPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })}%`;
}

export function fmtWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-AU", {
      timeZone: MELBOURNE,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

/** Relative age from now, in plain English. */
export function fmtRelative(iso: string | null, now = Date.now()): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const sec = Math.max(0, Math.round((now - t) / 1000));
  if (sec < 45) return "just now";
  const min = Math.round(sec / 60);
  if (min < 60) return min === 1 ? "1 minute ago" : `${min} minutes ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return hr === 1 ? "1 hour ago" : `${hr} hours ago`;
  const day = Math.round(hr / 24);
  if (day === 1) return "yesterday";
  if (day < 30) return `${day} days ago`;
  const months = Math.round(day / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

/** Compact Melbourne time for stat tiles, e.g. "19 Nov, 3:30 am". */
export function fmtWhenShort(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-AU", {
      timeZone: MELBOURNE,
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
