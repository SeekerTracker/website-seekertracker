/**
 * Cloudflare Cron Worker — calls seekertracker domain indexer.
 * Secret: CRON_SECRET (must match main app)
 */
export default {
  async scheduled(event, env, ctx) {
    const secret = env.CRON_SECRET;
    const url =
      env.INDEX_URL ||
      "https://seekertracker.com/api/cron/index-domains?limit=50";
    const res = await fetch(url, {
      headers: secret ? { Authorization: `Bearer ${secret}` } : {},
    });
    const text = await res.text();
    console.log("index-domains", res.status, text.slice(0, 500));
    if (!res.ok) {
      throw new Error(`Indexer failed: ${res.status} ${text.slice(0, 200)}`);
    }
  },
};
