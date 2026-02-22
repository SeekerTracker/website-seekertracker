"use client";

import React from "react";
import styles from "./page.module.css";
import Backbutton from "app/(components)/shared/Backbutton";
import Link from "next/link";
import Image from "next/image";

// Note: metadata export is in layout.tsx for this route

interface Winner {
  number: number;
  handle: string;
  name: string;
  description: string;
  tweetId: string;
  tweetImage: string;
  project?: string;
  projectHandle?: string;
}

const winners: Winner[] = [
  {
    number: 1,
    handle: "iclipz",
    name: "iclipz",
    description:
      "Creator of the platform and tech behind SeekerTracker.com AND the Telegram bot. After the idea was posted, he delivered a fully functional solution overnight. Amazing talent by the legend from the eGaming Industry.",
    tweetId: "2007375180692369791",
    tweetImage: "https://pbs.twimg.com/media/G9uhDR-asAEagDI.jpg",
  },
  {
    number: 2,
    handle: "ImmaDominion",
    name: "ImmaDominion",
    description:
      "Developer behind the Solana Mobile app SOL.NEW — the FIRST ever Solana Launchpad / Token Creator on the Solana Mobile Seeker Dapp Store. Built using Flutter and the Solana Mobile Wallet Adapter — it really was ahead of its time.",
    tweetId: "2007376060476993906",
    tweetImage: "https://pbs.twimg.com/media/G9uherIbgAA0dw4.jpg",
    project: "SOL.NEW",
  },
  {
    number: 3,
    handle: "Trololo",
    name: "Trololo",
    description:
      "Developer behind the ONLY Offline LLM Solana Chat Bot on the Solana Dapp Store. For those that are privacy focused — it's the best way to use a GPT without revealing your metadata and stay offline.",
    tweetId: "2007376859953258643",
    tweetImage: "https://pbs.twimg.com/media/G9uidFmasAUFKZV.jpg",
  },
  {
    number: 4,
    handle: "VersatileBeingX",
    name: "VersatileBeingX",
    description:
      "Building Seeker Staker — the tool for staking your TRACKER tokens. A great way to show off what's possible with the Solana stack! Earn, Burn, Yield, Lock and More!",
    tweetId: "2007377666379526529",
    tweetImage: "https://pbs.twimg.com/media/G9uiv_EaYAA5uA7.jpg",
    project: "Seeker Staker",
  },
  {
    number: 5,
    handle: "LookWhatIbuild",
    name: "LookWhatIbuild",
    description:
      "An exceptional developer who has built amazing things using Dialect and currently working on Blink.fun using Solana Blinks technology.",
    tweetId: "2007379149745442930",
    tweetImage: "https://pbs.twimg.com/media/G9ukaBbasAgTmAh.jpg",
    project: "Blink.fun",
    projectHandle: "getblinkdotfun",
  },
  {
    number: 6,
    handle: "RVAClassic",
    name: "RVAClassic",
    description:
      "Currently pursuing life as the Founder of Operator Uplift. We are expecting magic from this upcoming champion.",
    tweetId: "2007379908612567364",
    tweetImage: "https://pbs.twimg.com/media/G9uk4RUasAgSQl7.jpg",
    project: "Operator Uplift",
    projectHandle: "OperatorUplift",
  },
  {
    number: 7,
    handle: "nickshirleyy",
    name: "Nick Shirley",
    description:
      "The unofficial Truth Seeker and Hero — offered a Seeker as a small token of appreciation for the courage he has shown.",
    tweetId: "2007380469369974945",
    tweetImage: "https://pbs.twimg.com/media/G9ul24Qa8AAXGJK.jpg",
  },
  {
    number: 8,
    handle: "0xharp",
    name: "0xharp",
    description:
      "Like a raging bull. Came into the Solana Ecosystem recently and started working with Lazor Kit, Metaplex and even Marinade Finance with contributions to Jupiter Unified Wallet Kit.",
    tweetId: "2008071809401585925",
    tweetImage: "https://pbs.twimg.com/media/G94ZYn9a0AAie6u.jpg",
  },
  {
    number: 9,
    handle: "Fahimul_Shihab",
    name: "Fahimul Shihab",
    description:
      "Shipping the Mobile App faster than Bitcoin can build a block! Amazing talent — be sure to hit up Astrolab Builder if you need any App.",
    tweetId: "2010814193755378161",
    tweetImage: "https://pbs.twimg.com/media/G-fYXL9bQAAqXRV.jpg",
    project: "Astrolab",
    projectHandle: "AstrolabBuilder",
  },
  {
    number: 10,
    handle: "guillaumetch",
    name: "Guillaume",
    description:
      "The dev behind GotSOLpay — choosing to change the way Point Of Sale becomes Point of SOL. Look out for the Dapp in the SDS very shortly.",
    tweetId: "2014142798258143608",
    tweetImage: "https://pbs.twimg.com/media/G_OWXK6bAAACSpC.jpg",
    project: "GotSOLpay",
    projectHandle: "GotSOLpay",
  },
  {
    number: 11,
    handle: "OmegaXhealth",
    name: "OmegaX Health",
    description:
      "Bringing the best of health and AI with the knowledge and talent of Dr. Sabijan into your pocket. Soon you can do it straight from your Seeker.",
    tweetId: "2021004483736842417",
    tweetImage: "https://pbs.twimg.com/media/HAwMUokakAAwAqX.jpg",
    project: "OmegaX Health",
  },
];

export default function WinnersPage() {
  return (
    <div className={styles.container}>
      <Backbutton />
      <div className={styles.header}>
        <h1 className={styles.title}>🏆 Seeker Winners</h1>
        <p className={styles.subtitle}>
          Seeker Tracker awards Solana Ecosystem contributors with a brand new{" "}
          <Link
            href="https://x.com/solanamobile"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            @solanamobile
          </Link>{" "}
          Seeker
        </p>
        <Link
          href="https://x.com/seeker_tracker/status/2007374242627866703"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.threadLink}
        >
          View original thread on 𝕏
        </Link>
      </div>

      <div className={styles.grid}>
        {winners.map((winner) => (
          <Link
            key={winner.number}
            href={`https://x.com/Seeker_Tracker/status/${winner.tweetId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.cardLink}
          >
            <div className={styles.card}>
              <div className={styles.cardImageSection}>
                <div className={styles.tweetImageWrapper}>
                  <Image
                    src={winner.tweetImage}
                    alt={`Winner #${winner.number}`}
                    fill
                    className={styles.tweetImage}
                    unoptimized
                  />
                  <div className={styles.numberOverlay}>#{winner.number}</div>
                </div>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                  <div className={styles.pfpWrapper}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://unavatar.io/twitter/${winner.handle}`}
                      alt={winner.handle}
                      className={styles.pfp}
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className={styles.nameSection}>
                    <span className={styles.winnerName}>@{winner.handle}</span>
                    {winner.project && (
                      <span className={styles.projectBadge}>
                        {winner.project}
                      </span>
                    )}
                  </div>
                </div>
                <p className={styles.description}>{winner.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
