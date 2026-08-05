import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";
import Backbutton from "app/(components)/shared/Backbutton";

export const metadata: Metadata = {
    title: "Terms of Use - Seeker Tracker",
    description:
        "Terms of Use for Seeker Tracker website, Snake Seeker, and related Solana Mobile apps and services.",
};

export default function TermsPage() {
    return (
        <div className={styles.main}>
            <Backbutton />
            <div className={styles.container}>
                <h1 className={styles.title}>Terms of Use</h1>
                <div className={styles.content}>
                    <p className={styles.lastUpdated}>Last Updated: August 2026</p>

                    <section>
                        <h2>Agreement to Terms</h2>
                        <p>
                            These Terms of Use (&quot;Terms&quot;) govern your access to and use of
                            Seeker Tracker websites, including{" "}
                            <Link href="https://seekertracker.com">seekertracker.com</Link>, the
                            Snake game experience at{" "}
                            <Link href="https://seekertracker.com/snake">/snake</Link>, the Snake
                            Seeker mobile application for Solana Mobile / Seeker
                            (&quot;Snake&quot; or the &quot;App&quot;), and related APIs and
                            services (together, the &quot;Services&quot;).
                        </p>
                        <p>
                            By accessing or using the Services, you agree to these Terms. If you do
                            not agree, do not use the Services.
                        </p>
                    </section>

                    <section>
                        <h2>Who We Are</h2>
                        <p>
                            The Services are operated by Seeker Tracker (&quot;we&quot;,
                            &quot;us&quot;, or &quot;our&quot;). Contact:{" "}
                            <a href="mailto:snake@seekertracker.com">snake@seekertracker.com</a>{" "}
                            or{" "}
                            <Link
                                href="https://x.com/seeker_tracker"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                @seeker_tracker
                            </Link>{" "}
                            on X.
                        </p>
                    </section>

                    <section>
                        <h2>Eligibility</h2>
                        <p>
                            You must be at least 13 years old (or the age of digital consent in your
                            jurisdiction) to use the Services. If you use the Services on behalf of
                            an organization, you represent that you have authority to bind that
                            organization.
                        </p>
                    </section>

                    <section>
                        <h2>The Services</h2>
                        <p>Seeker Tracker provides tools related to Solana Mobile and Seeker, including:</p>
                        <ul>
                            <li>Website explorer, directories, leaderboards, and developer resources</li>
                            <li>
                                Snake Seeker — a mobile snake game with optional Solana wallet
                                connect, scores, leaderboards, and TRACKER token-related features
                            </li>
                            <li>APIs and informational pages about apps and network activity</li>
                        </ul>
                        <p>
                            Features may change, be limited by region or device, or require a
                            compatible Solana wallet and network connectivity.
                        </p>
                    </section>

                    <section>
                        <h2>Wallets, Blockchain, and Tokens</h2>
                        <ul>
                            <li>
                                You are solely responsible for your wallet, seed phrases, private
                                keys, and any transactions you approve.
                            </li>
                            <li>
                                Blockchain transactions are irreversible. Network fees (e.g. SOL)
                                may apply and are paid by you.
                            </li>
                            <li>
                                TRACKER and any other tokens referenced by the Services are not
                                offered as investment advice. Token features (including any
                                airdrops or rewards) are optional, may change or end at any time,
                                and may require holding a minimum balance or meeting other
                                eligibility rules displayed in the App or on the website.
                            </li>
                            <li>
                                We do not custody your assets. Connecting a wallet does not create
                                a fiduciary relationship.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2>Acceptable Use</h2>
                        <p>You agree not to:</p>
                        <ul>
                            <li>Use the Services for unlawful, fraudulent, or abusive purposes</li>
                            <li>Attempt to disrupt, scrape abusively, or reverse engineer the Services except as allowed by law</li>
                            <li>Interfere with other users, leaderboards, airdrops, or scoring systems (including bots or exploits)</li>
                            <li>Misrepresent affiliation with us or Solana Mobile</li>
                            <li>Upload malware or attempt unauthorized access to our systems</li>
                        </ul>
                    </section>

                    <section>
                        <h2>Accounts and Scores</h2>
                        <p>
                            Game scores, leaderboard entries, and related data may be associated with
                            your wallet address and optional .skr domain. We may remove or adjust
                            entries that result from abuse, bugs, or policy violations.
                        </p>
                    </section>

                    <section>
                        <h2>Intellectual Property</h2>
                        <p>
                            The Services, including software, branding, and content we create, are
                            owned by us or our licensors. See also our{" "}
                            <Link href="/copyright">Copyright</Link> and{" "}
                            <Link href="/license">License</Link> pages. You receive a limited,
                            non-exclusive, non-transferable license to use the App and website for
                            personal, non-commercial purposes in accordance with these Terms.
                        </p>
                    </section>

                    <section>
                        <h2>Third-Party Services</h2>
                        <p>
                            The Services may integrate or link to third parties (wallets, RPC
                            providers, Solana Mobile dApp Store, analytics, email, and others).
                            Their terms and privacy policies apply to your use of those services. We
                            are not responsible for third-party services.
                        </p>
                    </section>

                    <section>
                        <h2>Disclaimers</h2>
                        <p>
                            THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS
                            AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR
                            IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                            AND NON-INFRINGEMENT. We do not warrant that the Services will be
                            uninterrupted, secure, or error-free, or that leaderboards, prices, or
                            airdrops will be accurate or available.
                        </p>
                    </section>

                    <section>
                        <h2>Limitation of Liability</h2>
                        <p>
                            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE AND OUR AFFILIATES WILL NOT
                            BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
                            PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, TOKENS, OR GOODWILL,
                            ARISING FROM YOUR USE OF THE SERVICES OR BLOCKCHAIN TRANSACTIONS. OUR
                            TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICES WILL NOT EXCEED
                            ONE HUNDRED U.S. DOLLARS (US $100) OR THE AMOUNT YOU PAID US (IF ANY)
                            IN THE TWELVE MONTHS BEFORE THE CLAIM, WHICHEVER IS GREATER.
                        </p>
                    </section>

                    <section>
                        <h2>Indemnity</h2>
                        <p>
                            You agree to indemnify and hold us harmless from claims, damages, and
                            expenses (including reasonable legal fees) arising from your use of the
                            Services, your wallet activity, or your violation of these Terms.
                        </p>
                    </section>

                    <section>
                        <h2>Privacy</h2>
                        <p>
                            Our collection and use of information is described in our{" "}
                            <Link href="/privacy">Privacy Policy</Link>.
                        </p>
                    </section>

                    <section>
                        <h2>Termination</h2>
                        <p>
                            We may suspend or terminate access to the Services at any time if you
                            violate these Terms or if we discontinue a feature. Provisions that by
                            nature should survive (including disclaimers and limitations of
                            liability) will survive termination.
                        </p>
                    </section>

                    <section>
                        <h2>Changes</h2>
                        <p>
                            We may update these Terms by posting a revised version on this page and
                            updating the &quot;Last Updated&quot; date. Continued use after changes
                            constitutes acceptance of the revised Terms.
                        </p>
                    </section>

                    <section>
                        <h2>Governing Law</h2>
                        <p>
                            These Terms are governed by the laws of Victoria, Australia, without
                            regard to conflict-of-law rules, except where mandatory consumer
                            protections in your jurisdiction apply.
                        </p>
                    </section>

                    <section>
                        <h2>Contact</h2>
                        <p>
                            Questions about these Terms:{" "}
                            <a href="mailto:snake@seekertracker.com">snake@seekertracker.com</a>{" "}
                            or{" "}
                            <Link
                                href="https://x.com/seeker_tracker"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                @seeker_tracker
                            </Link>
                            .
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
