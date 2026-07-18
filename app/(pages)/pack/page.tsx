"use client";

import Pack3D from "app/(components)/Pack3D";
import Backbutton from "app/(components)/shared/Backbutton";
import styles from "./page.module.css";

/**
 * Demo / reference page for the Jupiter-style 3D pack stage.
 * Visit: /pack
 */
export default function PackDemoPage() {
  return (
    <main className={styles.main}>
      <div className={styles.top}>
        <Backbutton />
      </div>

      <header className={styles.header}>
        <p className={styles.kicker}>3D pack stage</p>
        <h1 className={styles.title}>Seeker Gold Pack</h1>
        <p className={styles.sub}>
          Same technique as Jupiter Gacha: pre-rendered pack art (logo baked in)
          + CSS perspective and drag-to-spin. Not WebGL.
        </p>
      </header>

      <Pack3D
        src="/packs/seeker-gold.jpg"
        alt="Seeker Tracker Gold Pack"
        count={5}
        onOpen={() => {
          // Hook open flow later (wallet / claim / random SeekerID)
          window.location.href = "/";
        }}
      />

      <section className={styles.howto}>
        <h2>How this works</h2>
        <ol>
          <li>
            <strong>Art</strong> — a studio-style pack render with the Seeker
            Tracker logo on the front (<code>/packs/seeker-gold.jpg</code>).
          </li>
          <li>
            <strong>Stage</strong> — CSS <code>perspective</code> on the parent,
            each pack is <code>rotateY</code> + <code>translate3d</code>.
          </li>
          <li>
            <strong>Drag</strong> — pointer move updates <code>rotateY</code>;
            release applies simple inertia.
          </li>
          <li>
            <strong>Fan</strong> — side packs are offset in X/Z and dimmed so
            the center pack feels closest.
          </li>
        </ol>
        <p className={styles.file}>
          Component: <code>app/(components)/Pack3D.tsx</code>
        </p>
      </section>
    </main>
  );
}
