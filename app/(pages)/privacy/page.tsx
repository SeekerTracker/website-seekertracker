import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Privacy Policy - Seeker Tracker",
    description: "Privacy Policy for Seeker Tracker",
};

export default function PrivacyPage() {
    return (
        <div className={styles.main}>
            <div className={styles.backButton}>
                <Link href={"/"}>
                    ← Back to Tracker
                </Link>
            </div>
            <div className={styles.container}>
                <h1 className={styles.title}>Privacy Policy</h1>
                <div className={styles.content}>
                    <p className={styles.lastUpdated}>Last Updated: January 2025</p>

                    <section>
                        <h2>Introduction</h2>
                        <p>
                            Welcome to Seeker Tracker. We respect your privacy and are committed to protecting
                            your personal data. This privacy policy will inform you about how we handle your
                            data when you use our website and services.
                        </p>
                    </section>

                    <section>
                        <h2>Information We Collect</h2>
                        <p>We may collect the following types of information:</p>
                        <ul>
                            <li><strong>Wallet Information:</strong> When you connect your wallet, we collect your public wallet address</li>
                            <li><strong>Usage Data:</strong> Information about how you use our website, including pages visited and features used</li>
                            <li><strong>Technical Data:</strong> IP address, browser type, device information, and similar technical information</li>
                            <li><strong>On-Chain Data:</strong> Publicly available blockchain data related to SeekerID domains</li>
                        </ul>
                    </section>

                    <section>
                        <h2>How We Use Your Information</h2>
                        <p>We use the collected information for the following purposes:</p>
                        <ul>
                            <li>To provide and maintain our service</li>
                            <li>To enable wallet connectivity and authentication</li>
                            <li>To track and display SeekerID domain information</li>
                            <li>To improve and optimize our website and services</li>
                            <li>To analyze usage patterns and trends</li>
                            <li>To communicate with you about service updates</li>
                        </ul>
                    </section>

                    <section>
                        <h2>Data Storage and Security</h2>
                        <p>
                            We implement appropriate technical and organizational security measures to protect
                            your personal data. However, please note that no method of transmission over the
                            internet is 100% secure.
                        </p>
                        <p>
                            Blockchain data is publicly available and permanently stored on the blockchain.
                            We do not have control over data stored on the blockchain.
                        </p>
                    </section>

                    <section>
                        <h2>Third-Party Services</h2>
                        <p>We may use third-party services that collect, monitor, and analyze data:</p>
                        <ul>
                            <li>Vercel Analytics for website performance monitoring</li>
                            <li>Helius RPC for blockchain data</li>
                            <li>Jupiter API for pricing information</li>
                            <li>Solana blockchain network</li>
                        </ul>
                        <p>
                            These third parties have their own privacy policies governing the use of your information.
                        </p>
                    </section>

                    <section>
                        <h2>Cookies and Tracking</h2>
                        <p>
                            We may use cookies and similar tracking technologies to track activity on our website
                            and store certain information. You can instruct your browser to refuse all cookies
                            or to indicate when a cookie is being sent.
                        </p>
                    </section>

                    <section>
                        <h2>Your Rights</h2>
                        <p>You have the right to:</p>
                        <ul>
                            <li>Access your personal data</li>
                            <li>Request correction of your personal data</li>
                            <li>Request deletion of your personal data</li>
                            <li>Object to processing of your personal data</li>
                            <li>Request transfer of your personal data</li>
                        </ul>
                    </section>

                    <section>
                        <h2>Children&apos;s Privacy</h2>
                        <p>
                            Our service is not intended for users under the age of 13. We do not knowingly
                            collect personal information from children under 13.
                        </p>
                    </section>

                    <section>
                        <h2>Changes to This Privacy Policy</h2>
                        <p>
                            We may update our Privacy Policy from time to time. We will notify you of any
                            changes by posting the new Privacy Policy on this page and updating the
                            &quot;Last Updated&quot; date.
                        </p>
                    </section>

                    <section>
                        <h2>Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us through
                            our official channels on Twitter <Link href="https://twitter.com/Seeker_Tracker" target="_blank" rel="noopener noreferrer">@Seeker_Tracker</Link>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
