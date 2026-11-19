/**
 * Official Solana dApp Store catalog size, as stated by Solana Mobile.
 *
 * A verifiable official URL for this exact 1,618 figure (12 Nov 2026) was not
 * found at implementation time. Do not invent a source link. Last published
 * official milestones were "over 1,500 apps" on 14 Oct 2026 (Solana Mobile
 * blog) and "crossed 1,500 dApps" on 22 Oct 2026 (X @solanamobile).
 *
 * Seeker Tracker's own /dapps catalog is a separately labelled subset:
 * unique apps indexed in Turso from the store explore API, not the official
 * headline total.
 */
export const SOLANA_DAPP_STORE_OFFICIAL_APP_COUNT = 1618;
export const SOLANA_DAPP_STORE_OFFICIAL_APP_COUNT_FORMATTED = "1,618";
export const SOLANA_DAPP_STORE_OFFICIAL_AS_OF = "2026-11-12";
export const SOLANA_DAPP_STORE_OFFICIAL_AS_OF_LABEL = "12 Nov 2026";
export const SOLANA_DAPP_STORE_OFFICIAL_SOURCE_NAME = "Solana Mobile";
export const SOLANA_DAPP_STORE_OFFICIAL_SOURCE_URL: string | null = null;
export const SOLANA_DAPP_STORE_OFFICIAL_CITATION = "Solana Mobile, 12 Nov 2026";

/** Root / home meta, Open Graph, Twitter, and JSON-LD description. */
export const SEO_HOME_DESCRIPTION =
  "Search and track .skr SeekerIDs, the Solana dApp Store's 1,618 apps (Solana Mobile, 12 Nov 2026), SKR stats, and analytics. Public API for agents.";

export const SEO_DAPPS_TITLE = "Seeker dApp Store — 1,618 apps for Solana Seeker";

export const SEO_DAPPS_DESCRIPTION =
  "1,618 apps on the Solana dApp Store (Solana Mobile, 12 Nov 2026). Browse Seeker Tracker's indexed catalog, a subset of the official store.";
