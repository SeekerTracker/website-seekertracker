import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AppsClient from './AppsClient'
import {
    SEO_DAPPS_DESCRIPTION,
    SEO_DAPPS_TITLE,
    SOLANA_DAPP_STORE_OFFICIAL_APP_COUNT,
    SOLANA_DAPP_STORE_OFFICIAL_CITATION,
} from 'app/(utils)/lib/dappStoreStats'

const BASE_URL = 'https://seekertracker.com'
// Static OG — OpenNext/CF is flaky with dynamic ImageResponse
const OG_IMAGE = `${BASE_URL}/og/dapps.png`

export const metadata: Metadata = {
    title: { absolute: SEO_DAPPS_TITLE },
    description: SEO_DAPPS_DESCRIPTION,
    // Public catalog URL is /dapps (/apps still rewrites to the same UI).
    alternates: {
        canonical: `${BASE_URL}/dapps`,
    },
    openGraph: {
        title: SEO_DAPPS_TITLE,
        description: SEO_DAPPS_DESCRIPTION,
        url: `${BASE_URL}/dapps`,
        images: [
            {
                url: OG_IMAGE,
                width: 1200,
                height: 630,
                alt: SEO_DAPPS_TITLE,
            },
        ],
        type: 'website',
        siteName: 'SeekerTracker',
    },
    twitter: {
        card: 'summary_large_image',
        title: SEO_DAPPS_TITLE,
        description: SEO_DAPPS_DESCRIPTION,
        images: [OG_IMAGE],
        creator: '@seeker_tracker',
    },
}

type Props = {
    searchParams: Promise<{ app?: string }>
}

/**
 * Catalog index. Legacy deep links `?app=com.foo` redirect to
 * dedicated pages at `/dapps/com.foo`.
 */
export default async function AppsPage({ searchParams }: Props) {
    const { app: appParam } = await searchParams
    if (appParam) {
        const decoded = decodeURIComponent(appParam)
        redirect(`/dapps/${encodeURIComponent(decoded)}`)
    }
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: SEO_DAPPS_TITLE,
        url: `${BASE_URL}/dapps`,
        description: SEO_DAPPS_DESCRIPTION,
        isPartOf: {
            "@type": "WebSite",
            name: "Seeker Tracker",
            url: BASE_URL,
        },
        about: {
            "@type": "ItemList",
            name: "Solana dApp Store",
            numberOfItems: SOLANA_DAPP_STORE_OFFICIAL_APP_COUNT,
            description: `Official Solana dApp Store catalog size as of 12 Nov 2026. Source: ${SOLANA_DAPP_STORE_OFFICIAL_CITATION}.`,
        },
        citation: SOLANA_DAPP_STORE_OFFICIAL_CITATION,
    }
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <AppsClient />
        </>
    )
}
