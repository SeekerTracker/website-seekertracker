import { track } from '@vercel/analytics';

// Custom event types for type safety
type AnalyticsEvents = {
    // Domain/Seeker events
    domain_search: { query: string };
    domain_view: { domain: string };
    domain_share: { domain: string; method: 'tweet' | 'copy' | 'telegram' | 'native' };

    // Navigation events
    page_view: { page: string };
    external_link: { url: string; label: string };

    // Wallet events
    wallet_connect: { wallet: string };
    wallet_disconnect: { wallet: string };

    // Telegram modal
    telegram_join: {};
    telegram_dismiss: {};

    // Export events
    export_csv: { count: number };

    // Apps page
    app_click: { app: string };

    // General interactions
    button_click: { button: string; page: string };
};

export function trackEvent<T extends keyof AnalyticsEvents>(
    event: T,
    properties: AnalyticsEvents[T]
) {
    track(event, properties);
}

// Convenience functions for common events
export const analytics = {
    domainSearch: (query: string) =>
        trackEvent('domain_search', { query }),

    domainView: (domain: string) =>
        trackEvent('domain_view', { domain }),

    domainShare: (domain: string, method: 'tweet' | 'copy' | 'telegram' | 'native') =>
        trackEvent('domain_share', { domain, method }),

    pageView: (page: string) =>
        trackEvent('page_view', { page }),

    externalLink: (url: string, label: string) =>
        trackEvent('external_link', { url, label }),

    walletConnect: (wallet: string) =>
        trackEvent('wallet_connect', { wallet }),

    walletDisconnect: (wallet: string) =>
        trackEvent('wallet_disconnect', { wallet }),

    telegramJoin: () =>
        trackEvent('telegram_join', {}),

    telegramDismiss: () =>
        trackEvent('telegram_dismiss', {}),

    exportCsv: (count: number) =>
        trackEvent('export_csv', { count }),

    appClick: (app: string) =>
        trackEvent('app_click', { app }),

    buttonClick: (button: string, page: string) =>
        trackEvent('button_click', { button, page }),
};
