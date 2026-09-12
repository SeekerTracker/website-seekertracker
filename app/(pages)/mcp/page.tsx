import Link from "next/link";
import Backbutton from "app/(components)/shared/Backbutton";
import styles from "../developers/page.module.css";

const ENDPOINT = "https://seekertracker.com/api/mcp";

const TOOLS = [
  {
    name: "lookup_id",
    args: "domain",
    blurb: "SeekerID by name. Accepts metasal or metasal.skr. Owner, rank, created_at, profile URL.",
  },
  {
    name: "lookup_wallet",
    args: "wallet",
    blurb: "All .skr names owned by a base58 Solana wallet.",
  },
  {
    name: "search_apps",
    args: "q, limit?",
    blurb: "Search the Seeker dApp catalog by name, package, or publisher.",
  },
  {
    name: "get_app",
    args: "package",
    blurb: "One listing by androidPackage, e.g. com.snakeseeker.",
  },
];

export default function McpDocsPage() {
  return (
    <div className={styles.main}>
      <Backbutton />
      <header className={styles.header}>
        <p className={styles.eyebrow}>MCP</p>
        <h1 className={styles.title}>Seeker Tracker MCP</h1>
        <p className={styles.lead}>
          Live .skr SeekerIDs and Solana Seeker dApps over the Model Context Protocol.
          Streamable HTTP. No auth. Same data as the public JSON API.
        </p>
        <div className={styles.links}>
          <a href={ENDPOINT} className={styles.primary}>
            Open endpoint
          </a>
          <Link href="/developers" className={styles.secondary}>
            REST docs
          </Link>
          <a href="/llms.txt" className={styles.secondary}>
            llms.txt
          </a>
        </div>
      </header>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Endpoint</h2>
        <pre className={styles.code}>{ENDPOINT}</pre>
        <p className={styles.cardLead} style={{ marginTop: "0.85rem", marginBottom: 0 }}>
          Transport: streamable HTTP. GET returns discovery JSON. POST is JSON-RPC
          (initialize, tools/list, tools/call).
        </p>
      </section>

      <section className={styles.card} id="tools">
        <h2 className={styles.sectionTitle}>Tools</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tool</th>
                <th>Args</th>
                <th>What it does</th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr key={t.name}>
                  <td>
                    <code>{t.name}</code>
                  </td>
                  <td>
                    <code>{t.args}</code>
                  </td>
                  <td>{t.blurb}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Claude Code</h2>
        <pre className={styles.code}>{`claude mcp add seekertracker ${ENDPOINT} --transport http`}</pre>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Codex</h2>
        <pre className={styles.code}>{`codex mcp add seekertracker --url ${ENDPOINT}`}</pre>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Cursor / Claude Desktop</h2>
        <pre className={styles.code}>{`{
  "mcpServers": {
    "seekertracker": {
      "url": "${ENDPOINT}"
    }
  }
}`}</pre>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Hermes</h2>
        <pre className={styles.code}>{`mcp_servers:
  seekertracker:
    url: "${ENDPOINT}"`}</pre>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Try it</h2>
        <pre className={styles.code}>{`curl -sS ${ENDPOINT}

curl -sS ${ENDPOINT} \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

curl -sS ${ENDPOINT} \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"lookup_id","arguments":{"domain":"metasal.skr"}}}'

curl -sS ${ENDPOINT} \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_apps","arguments":{"q":"snake","limit":5}}}'`}</pre>
      </section>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Also</h2>
        <ul className={styles.list}>
          <li>
            REST index: <Link href="/api">/api</Link>
          </li>
          <li>
            OpenAPI: <a href="/openapi.json">/openapi.json</a>
          </li>
          <li>
            Human catalog: <Link href="/dapps">/dapps</Link>
          </li>
          <li>
            SeekerID profile: <code>/id/{"{name.skr}"}</code>
          </li>
        </ul>
      </section>
    </div>
  );
}
