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

function formatDomainAlert(d: NewDomainAlert): string {
  const name = `${d.subdomain}${d.domain || ".skr"}`;
  const ownerShort = `${d.owner.slice(0, 4)}…${d.owner.slice(-4)}`;
  const when = new Date(d.created_at).toISOString().replace("T", " ").slice(0, 19);
  const lines = [
    `New SeekerID: ${name}`,
    `Rank #${d.rank}`,
    `Owner: ${ownerShort}`,
    `Activated: ${when} UTC`,
    // Profile URL — Telegram will unfurl the OG card image
    `https://seekertracker.com/id/${d.subdomain}.skr`,
  ];
  if (d.subdomain_tx) {
    lines.push(`Tx: https://solscan.io/tx/${d.subdomain_tx}`);
  }
  return lines.join("\n");
}

/** Send one message per domain. Returns counts. */
export async function notifyNewDomains(
  domains: NewDomainAlert[],
  opts: { max?: number } = {}
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
      // Enable link preview so Telegram shows the new OG profile card
      await tgApi("sendMessage", {
        chat_id,
        text: formatDomainAlert(d),
        disable_web_page_preview: false,
      });
      sent++;
      // light rate limit (~1 msg / 50ms under TG limits)
      await new Promise((r) => setTimeout(r, 80));
    } catch (e) {
      failed++;
      errors.push(`${d.subdomain}: ${e instanceof Error ? e.message : String(e)}`);
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
