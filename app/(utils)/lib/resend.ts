/**
 * Resend helpers for Seeker Tracker transactional + broadcast mail.
 * Requires RESEND_API_KEY. From address must be a verified domain in Resend.
 */

const RESEND_API = "https://api.resend.com";

export const RESEND_FROM =
  process.env.RESEND_FROM || "Seeker Tracker <noreply@seekertracker.com>";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.seekertracker.com";

/** Preferred public catalog path (alias: /dapps via rewrite). */
export const CATALOG_PATH = "/dapps";

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

async function resendFetch(
  path: string,
  init: RequestInit & { method?: string } = {}
) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  const res = await fetch(`${RESEND_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (json.message as string) ||
      (json.name as string) ||
      `Resend ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export type SendEmailOpts = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  /** When true, attach List-Unsubscribe headers pointing at our branded page */
  listUnsubscribe?: boolean;
  tags?: { name: string; value: string }[];
};

export async function sendEmail(opts: SendEmailOpts) {
  const headers: Record<string, string> = {};
  if (opts.listUnsubscribe) {
    const unsubUrl = `${SITE_URL}/unsubscribe`;
    headers["List-Unsubscribe"] = `<${unsubUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  return resendFetch("/emails", {
    method: "POST",
    body: JSON.stringify({
      from: RESEND_FROM,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      reply_to: opts.replyTo,
      headers: Object.keys(headers).length ? headers : undefined,
      tags: opts.tags,
    }),
  });
}

/** Mark a contact unsubscribed in Resend (broadcasts stop). Creates if missing. */
export async function setContactUnsubscribed(
  email: string,
  unsubscribed: boolean
): Promise<{ id?: string; created?: boolean }> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Invalid email");
  }

  try {
    const updated = await resendFetch(
      `/contacts/${encodeURIComponent(normalized)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ unsubscribed }),
      }
    );
    return { id: updated.id as string | undefined };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/not found|404/i.test(msg)) throw e;
  }

  const created = await resendFetch("/contacts", {
    method: "POST",
    body: JSON.stringify({ email: normalized, unsubscribed }),
  });
  return { id: created.id as string | undefined, created: true };
}

export async function getContact(email: string) {
  const normalized = email.trim().toLowerCase();
  try {
    return await resendFetch(`/contacts/${encodeURIComponent(normalized)}`);
  } catch {
    return null;
  }
}
