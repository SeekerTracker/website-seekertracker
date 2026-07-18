/**
 * Post alerts to the Seeker_Tracker Telegram channel.
 * Requires TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (default @Seeker_Tracker).
 */

const DEFAULT_CHAT = "@Seeker_Tracker";

export type NewDomainAlert = {
  subdomain: string;
  domain?: string;
  owner: string;
  rank: number;
  created_at: string;
  subdomain_tx?: string;
  /** On-chain name account (domain PDA) — shown as copyable mint/account */
  name_account?: string;
};

function botToken(): string | undefined {
  return process.env.TELEGRAM_BOT_TOKEN || process.env.TG_BOT_TOKEN;
}

function chatId(): string {
  return (
    process.env.TELEGRAM_CHAT_ID ||
    process.env.TG_CHAT_ID ||
    DEFAULT_CHAT
  );
}

export function telegramConfigured(): boolean {
  return Boolean(botToken());
}

async function tgApi(method: string, body: Record<string, unknown>) {
  const token = botToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN not set");
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    ok: boolean;
    description?: string;
    result?: unknown;
  };
  if (!json.ok) {
    throw new Error(json.description || `telegram ${method} failed`);
  }
  return json.result;
}

/** Escape for Telegram HTML parse_mode */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Format matches the channel style:
 *
 * 🔥 New SeekerID Activated!
 * 🌐 name.skr
 * 🏆 Rank: #N
 * 📊 Total: N SeekerIDs
 * ⏰ timestamp UTC
 * 💼 Mint: <code>full address</code>  ← tap to copy on Telegram
 * 👆 View … Profile
 * https://…
 */
function formatDomainAlert(d: NewDomainAlert, total?: number): string {
  const name = `${d.subdomain}${d.domain || ".skr"}`;
  const when = new Date(d.created_at)
    .toISOString()
    .replace("T", " ")
    .replace("Z", "");
  const totalCount = total ?? d.rank;
  // Prefer name account (domain PDA) as "mint"; fall back to owner wallet
  const mint = d.name_account || d.owner;

  const lines = [
    `🔥 <b>New SeekerID Activated!</b>`,
    ``,
    `🌐 <b>${esc(name)}</b>`,
    `🏆 Rank: #${d.rank.toLocaleString("en-US")}`,
    `📊 Total: ${totalCount.toLocaleString("en-US")} SeekerIDs`,
    `⏰ ${when} UTC`,
    ``,
    // <code> = tap-to-copy on iOS/Android Telegram
    `💼 Mint: <code>${esc(mint)}</code>`,
    ``,
    `👆 View ${esc(name)} Profile &amp; Analytics`,
    ``,
    // Working profile path (OG unfurl)
    `https://www.seekertracker.com/id/${encodeURIComponent(name)}`,
  ];
  return lines.join("\n");
}

/** Send one message per domain. Returns counts. */
export async function notifyNewDomains(
  domains: NewDomainAlert[],
  opts: { max?: number; total?: number } = {}
): Promise<{ sent: number; failed: number; errors: string[] }> {
  if (!telegramConfigured() || !domains.length) {
    return { sent: 0, failed: 0, errors: [] };
  }
  const max = opts.max ?? 30;
  const chat_id = chatId();
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const d of domains.slice(0, max)) {
    try {
      await tgApi("sendMessage", {
        chat_id,
        text: formatDomainAlert(d, opts.total),
        parse_mode: "HTML",
        // Link preview shows SeekerID OG passport card
        disable_web_page_preview: false,
        link_preview_options: {
          is_disabled: false,
          prefer_large_media: true,
        },
      });
      sent++;
      await new Promise((r) => setTimeout(r, 80));
    } catch (e) {
      failed++;
      errors.push(
        `${d.subdomain}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  if (domains.length > max) {
    try {
      await tgApi("sendMessage", {
        chat_id,
        text: `…and ${domains.length - max} more new SeekerIDs this cycle.\nhttps://seekertracker.com`,
        disable_web_page_preview: true,
      });
      sent++;
    } catch (e) {
      failed++;
      errors.push(`summary: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { sent, failed, errors };
}
