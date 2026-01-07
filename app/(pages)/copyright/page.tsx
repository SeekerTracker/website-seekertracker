import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Copyright - Seeker Tracker",
    description: "Copyright information for Seeker Tracker",
};

export default function CopyrightPage() {
    return (
        <div className={styles.main}>
            <div className={styles.backButton}>
                <Link href={"/"}>
                    ← Back to Tracker
                </Link>
            </div>
            <div className={styles.container}>
                <h1 className={styles.title}>Copyright</h1>
                <div className={styles.content}>
                    <section>
                        <h2>Copyright Notice</h2>
                        <p>
                            © 2025 Seeker Tracker. All rights reserved.
                        </p>
                        <p>
                            The content, design, graphics, and other materials on this website are protected
                            by copyright laws and are the property of Seeker Tracker or its content suppliers.
                        </p>
                    </section>

                    <section>
                        <h2>Permitted Use</h2>
                        <p>
                            You may view, download, and print pages from this website for your personal,
                            non-commercial use, subject to the restrictions set out below:
                        </p>
                        <ul>
                            <li>You must not modify the content in any way</li>
                            <li>You must not use any content for commercial purposes without prior written consent</li>
                            <li>You must retain all copyright and other proprietary notices</li>
                            <li>You must not reproduce, duplicate, copy, or resell any part of the website</li>
                        </ul>
                    </section>

                    <section>
                        <h2>Trademarks</h2>
                        <p>
                            Seeker Tracker and related logos are trademarks of Seeker Tracker. All other
                            trademarks, service marks, and trade names referenced on this site are the
                            property of their respective owners.
                        </p>
                    </section>

                    <section>
                        <h2>Third-Party Content</h2>
                        <p>
                            This website may contain content and links to third-party websites. We do not
                            claim ownership of such content and materials. The copyright for such content
                            remains with the respective owners.
                        </p>
                    </section>

                    <section>
                        <h2>Contact</h2>
                        <p>
                            If you have any questions regarding copyright or content usage, please contact us
                            through our official channels.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
