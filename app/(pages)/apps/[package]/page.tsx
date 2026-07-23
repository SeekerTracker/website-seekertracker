import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SITE_ORIGIN } from "app/(utils)/constant";
import { fetchAppByPackage, type DApp } from "../fetchApp";
import AppShareBar from "./AppDetailClient";
import styles from "./package.module.css";

const BASE_URL = SITE_ORIGIN.replace(/\/$/, "") || "https://www.seekertracker.com";

type Props = {
  params: Promise<{ package: string }>;
};

function decodePackageParam(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getTotalReviews(reviewsByRating?: number[]) {
  if (!reviewsByRating?.length) return 0;
  return reviewsByRating.reduce((sum, count) => sum + count, 0);
}

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;
  const stars: ReactNode[] = [];

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} className={styles.star}>
        &#9733;
      </span>
    );
  }
  if (hasHalf) {
    stars.push(
      <span key="half" className={styles.starHalf}>
        &#9733;
      </span>
    );
  }
  for (let i = stars.length; i < 5; i++) {
    stars.push(
      <span key={`empty-${i}`} className={styles.starEmpty}>
        &#9733;
      </span>
    );
  }
  return stars;
}

function appPath(androidPackage: string) {
  return `${BASE_URL}/dapps/${encodeURIComponent(androidPackage)}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { package: pkg } = await params;
  const decodedPackage = decodePackageParam(pkg);
  const app = await fetchAppByPackage(decodedPackage);

  if (!app?.lastRelease) {
    return {
      title: "App Not Found | Seeker dApp Store",
      description: "This dApp was not found in the Seeker catalog.",
      robots: { index: false, follow: true },
    };
  }

  const release = app.lastRelease;
  const name = release.displayName || decodedPackage;
  const title = `${name} | Seeker dApp Store`;
  const description =
    release.subtitle ||
    release.description?.slice(0, 160) ||
    `Discover ${name} on the Seeker dApp Store — apps optimized for Solana Seeker.`;
  const ogImageUrl = `${BASE_URL}/api/apps/og?app=${encodeURIComponent(decodedPackage)}`;
  const pathApps = appPath(decodedPackage);

  return {
    title,
    description,
    alternates: {
      canonical: pathApps,
    },
    openGraph: {
      title: name,
      description,
      url: pathApps,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
      type: "website",
      siteName: "SeekerTracker",
    },
    twitter: {
      card: "summary_large_image",
      title: name,
      description,
      images: [ogImageUrl],
      creator: "@seeker_tracker",
    },
  };
}

function JsonLd({ app, path }: { app: DApp; path: string }) {
  const release = app.lastRelease;
  if (!release) return null;

  const name = release.displayName || app.androidPackage;
  const totalReviews = getTotalReviews(app.rating?.reviewsByRating);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    applicationCategory: "MobileApplication",
    operatingSystem: "Android",
    url: path,
    description:
      release.subtitle || release.description?.slice(0, 300) || undefined,
    identifier: app.androidPackage,
  };

  if (release.icon?.uri) {
    data.image = release.icon.uri;
  }
  if (release.publisherDetails?.name) {
    data.author = {
      "@type": "Organization",
      name: release.publisherDetails.name,
      url:
        release.publisherDetails.websiteOverride ||
        release.publisherDetails.website ||
        undefined,
    };
  }
  if (release.androidDetails?.version) {
    data.softwareVersion = release.androidDetails.version;
  }
  if (app.rating?.rating) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: app.rating.rating,
      bestRating: 5,
      worstRating: 1,
      ...(totalReviews > 0 ? { ratingCount: totalReviews } : {}),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function AppPage({ params }: Props) {
  const { package: pkg } = await params;
  const decodedPackage = decodePackageParam(pkg);
  const app = await fetchAppByPackage(decodedPackage);

  if (!app?.lastRelease) {
    notFound();
  }

  const release = app.lastRelease!;
  const name = release.displayName || decodedPackage;
  const pathApps = appPath(decodedPackage);
  const totalReviews = getTotalReviews(app.rating?.reviewsByRating);
  const isRemoved = app.status === "removed";
  const website =
    release.publisherDetails?.websiteOverride ||
    release.publisherDetails?.website ||
    "";

  return (
    <div className={styles.main}>
      <JsonLd app={app} path={pathApps} />

      <div className={styles.backRow}>
        <Link href="/dapps" className={styles.backLink}>
          ← All apps
        </Link>
      </div>

      <article className={styles.card}>
        <header className={styles.hero}>
          <div className={styles.icon}>
            {release.icon?.uri ? (
              <Image
                src={release.icon.uri}
                alt={name}
                width={96}
                height={96}
                unoptimized
                priority
              />
            ) : (
              <div className={styles.placeholderIcon}>
                {name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.titleArea}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{name}</h1>
              {isRemoved && (
                <span className={styles.removedBadge}>Removed</span>
              )}
              {release.claimed && (
                <span className={styles.claimedBadge}>Claimed</span>
              )}
            </div>
            {release.publisherDetails?.name && (
              <span className={styles.publisher}>
                {release.publisherDetails.name}
              </span>
            )}
            {app.rating?.rating != null && app.rating.rating > 0 && (
              <div className={styles.rating}>
                {renderStars(app.rating.rating)}
                <span className={styles.ratingValue}>
                  {app.rating.rating.toFixed(1)}
                  {totalReviews > 0 &&
                    ` (${totalReviews.toLocaleString()} reviews)`}
                </span>
              </div>
            )}
          </div>
        </header>

        {release.subtitle && (
          <p className={styles.subtitle}>{release.subtitle}</p>
        )}

        {release.blurb && <p className={styles.ownerBlurb}>{release.blurb}</p>}

        {(release.publisherDetails?.twitter ||
          release.publisherDetails?.telegram ||
          website) && (
          <div className={styles.ownerLinks}>
            {website && (
              <a
                className={styles.ownerLink}
                href={website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Website
              </a>
            )}
            {release.publisherDetails?.twitter && (
              <a
                className={styles.ownerLink}
                href={`https://x.com/${release.publisherDetails.twitter.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{release.publisherDetails.twitter.replace(/^@/, "")}
              </a>
            )}
            {release.publisherDetails?.telegram && (
              <a
                className={styles.ownerLink}
                href={`https://t.me/${release.publisherDetails.telegram.replace(/^@/, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram
              </a>
            )}
          </div>
        )}

        {release.description && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>About</h2>
            <p className={styles.description}>{release.description}</p>
          </section>
        )}

        {release.newInVersion && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>What&apos;s New</h2>
            <p className={styles.whatsNew}>{release.newInVersion}</p>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>App Info</h2>
          <div className={styles.details}>
            {release.updatedOn && (
              <div className={styles.detail}>
                <span className={styles.detailLabel}>Last Updated</span>
                <span className={styles.detailValue}>
                  {formatDate(release.updatedOn)}
                </span>
              </div>
            )}
            {release.androidDetails?.version && (
              <div className={styles.detail}>
                <span className={styles.detailLabel}>Version</span>
                <span className={styles.detailValue}>
                  {release.androidDetails.version}
                  {release.androidDetails.versionCode != null &&
                    ` (${release.androidDetails.versionCode})`}
                </span>
              </div>
            )}
            {release.androidDetails?.minSdk != null && (
              <div className={styles.detail}>
                <span className={styles.detailLabel}>Min Android SDK</span>
                <span className={styles.detailValue}>
                  {release.androidDetails.minSdk}
                </span>
              </div>
            )}
            {release.privacyPolicyUrl && (
              <div className={styles.detail}>
                <span className={styles.detailLabel}>Privacy Policy</span>
                <a
                  className={styles.detailLink}
                  href={release.privacyPolicyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View policy
                </a>
              </div>
            )}
            <div className={`${styles.detail} ${styles.detailFull}`}>
              <span className={styles.detailLabel}>Package</span>
              <span className={`${styles.detailValue} ${styles.packageMono}`}>
                {app.androidPackage}
              </span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Share</h2>
          <AppShareBar appName={name} shareUrl={pathApps} />
        </section>

        <div className={styles.actions}>
          <Link href="/dapps/manage" className={styles.primaryBtn}>
            Maintain listing
          </Link>
          <Link href="/dapps" className={styles.secondaryBtn}>
            Browse all apps
          </Link>
        </div>
      </article>
    </div>
  );
}
