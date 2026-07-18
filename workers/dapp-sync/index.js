/**
 * Cloudflare Cron Worker — hourly dApp catalog sync into Turso.
 *
 * Prefer authenticated cron route when CRON_SECRET is set; otherwise
 * fall back to /api/dappstore?refresh=1 (also writes Turso + marks removed).
 *
 * Secrets (recommended): CRON_SECRET — same as main seekertracker Worker
 * Vars: SYNC_URL, REFRESH_URL
 */
export default {
  async scheduled(event, env, ctx) {
    const secret = env.CRON_SECRET;
    const cronUrl =
      env.SYNC_URL || "https://seekertracker.com/api/cron/sync-dapps";
    const refreshUrl =
      env.REFRESH_URL || "https://seekertracker.com/api/dappstore?refresh=1";

    // 1) Authenticated cron (preferred)
    if (secret) {
      const res = await fetch(cronUrl, {
        method: "GET",
        headers: { Authorization: `Bearer ${secret}` },
      });
      const text = await res.text();
      console.log("sync-dapps cron", res.status, text.slice(0, 800));
      if (res.ok) return;
      console.log("cron failed, falling back to refresh=", res.status);
    }

    // 2) Public refresh path — hydrates Turso from upstream
    const res2 = await fetch(refreshUrl, { method: "GET" });
    const text2 = await res2.text();
    console.log("dappstore refresh", res2.status, text2.slice(0, 400));
    if (!res2.ok) {
      throw new Error(
        `dApp sync failed: cron=${secret ? "tried" : "no-secret"} refresh=${res2.status}`
      );
    }
  },
};
