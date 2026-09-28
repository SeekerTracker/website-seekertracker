"use client";

import { useEffect, useRef, useState } from "react";
import { useAccount, useConnector } from "@solana/connector/react";
import WalletButton from "app/(components)/wallet/WalletButton";
import styles from "./page.module.css";

type Config = {
  appId: string;
  botWallet: string;
  scopes: string[];
  roomId: string | null;
  canCreateRooms: boolean;
  embedReady?: boolean;
};

const THEME = {
  mode: "dark" as const,
  primaryColor: "#00ff00",
  backgroundColor: "#001a1a",
  accentColor: "#00ff66",
  incomingBubbleColor: "#0a2a2a",
  headerColor: "#0a2a2a",
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
};

const EMBED_URL = "https://embed.cherry.fun";

const LAYOUT = {
  showHeader: true,
  headerTitle: "Seeker Tracker",
  showMemberCount: true,
  showInput: true,
};

export default function ChatClient() {
  const hostRef = useRef<HTMLDivElement>(null);
  const { address } = useAccount();
  const { connected } = useConnector();
  const [config, setConfig] = useState<Config | null>(null);
  const [roomId, setRoomId] = useState("");
  const [content, setContent] = useState("gm from Seeker Tracker");
  const [log, setLog] = useState("");
  const [status, setStatus] = useState("Loading chat");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [debug, setDebug] = useState(false);
  const instRef = useRef<{ unmount?: () => void } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDebug(params.get("debug") === "1");
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cherry/config", { cache: "no-store" });
        const json = (await res.json()) as Config & { ok?: boolean; error?: string };
        if (!res.ok || json.ok === false) {
          throw new Error(json.error || "Config failed");
        }
        if (cancelled) return;
        setConfig(json);
        if (json.roomId) setRoomId(json.roomId);
        setStatus("");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Config failed");
          setStatus("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const appId = config?.appId;
    const id = config?.roomId;
    if (!appId || !id) return;
    let cancelled = false;
    (async () => {
      try {
        await mountWith(appId, id);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Embed failed");
        }
      }
    })();
    return () => {
      cancelled = true;
      try {
        instRef.current?.unmount?.();
      } catch {
        /* ignore */
      }
    };
  }, [config?.appId, config?.roomId]);

  async function mountWith(appId: string, id: string) {
    setError("");
    try {
      instRef.current?.unmount?.();
    } catch {
      /* ignore */
    }
    const { CherryEmbed } = await import("@cherrydotfun/chat-embed-sdk");
    const chat = new CherryEmbed({
      appId,
      container: hostRef.current || "#st-cherry-chat",
      roomId: id,
      mode: "single",
      embedUrl: EMBED_URL,
      theme: THEME,
      layout: LAYOUT,
    });
    await chat.mount();
    instRef.current = chat as { unmount?: () => void };
    setMounted(true);
  }

  async function mountEmbed() {
    if (!config?.appId || !roomId.trim()) {
      setError("Need appId and roomId");
      return;
    }
    await mountWith(config.appId, roomId.trim());
  }

  async function send() {
    const res = await fetch("/api/cherry/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: roomId.trim(), content }),
    });
    const json = await res.json();
    setLog(JSON.stringify(json, null, 2));
  }

  async function read() {
    const res = await fetch(
      `/api/cherry/messages?roomId=${encodeURIComponent(roomId.trim())}`,
    );
    const json = await res.json();
    setLog(JSON.stringify(json, null, 2));
  }

  return (
    <>
      <section className={styles.walletBar}>
        <p className={styles.walletCopy}>
          {connected && address
            ? "Wallet connected. Use Connect in the chat to sign in as this wallet."
            : "Connect a Solana wallet, then sign in inside the chat."}
        </p>
        <WalletButton />
      </section>

      {status ? <p className={styles.status}>{status}</p> : null}
      {error ? <p className={`${styles.status} ${styles.error}`}>{error}</p> : null}

      {config && !config.appId ? (
        <section className={styles.card}>
          <p className={styles.meta}>
            Cherry needs a Chat Embed ID from the portal. The project key is not
            that ID.
          </p>
          <p className={styles.meta}>
            1. Open{" "}
            <a
              href="https://portal.cherry.fun/dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              portal.cherry.fun
            </a>
          </p>
          <p className={styles.meta}>2. Chat embeds, New embed, name Seeker Tracker</p>
          <p className={styles.meta}>
            3. Allow origins: https://seekertracker.metasal.xyz ,
            http://127.0.0.1:8002 , https://seekertracker.com
          </p>
          <p className={styles.meta}>4. Enable it, copy the embed ID, paste it here</p>
        </section>
      ) : (
        <div id="st-cherry-chat" ref={hostRef} className={styles.frame} />
      )}

      {debug ? (
        <>
          {config ? (
            <section className={styles.card}>
              <p className={styles.meta}>
                appId <code>{config.appId}</code>
              </p>
              <p className={styles.meta}>
                bot <code>{config.botWallet}</code>
              </p>
              <p className={styles.meta}>
                scopes {config.scopes.join(", ") || "none"}
              </p>
            </section>
          ) : null}

          <section className={styles.card}>
            <label htmlFor="room" className={styles.label}>
              Room ID
            </label>
            <input
              id="room"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={styles.input}
            />
            <label htmlFor="msg" className={styles.label}>
              Message
            </label>
            <input
              id="msg"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className={styles.input}
            />
            <div className={styles.actions}>
              <button type="button" className={styles.primary} onClick={() => void send()}>
                Send via API
              </button>
              <button type="button" className={styles.secondary} onClick={() => void read()}>
                Read
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => void mountEmbed()}
              >
                {mounted ? "Remount embed" : "Mount embed"}
              </button>
            </div>
          </section>
          {log ? <pre className={styles.log}>{log}</pre> : null}
        </>
      ) : null}
    </>
  );
}
