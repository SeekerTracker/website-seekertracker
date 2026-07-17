// Custom event types for type safety
type AnalyticsEvents = {
    domain_search: { query: string };
    domain_view: { domain: string };
    domain_share: { domain: string; method: 'tweet' | 'copy' | 'telegram' | 'native' };
    page_view: { page: string };
    external_link: { url: string; label: string };
    wallet_connect: { wallet: string };
    wallet_disconnect: { wallet: string };
    telegram_join: {};
    telegram_dismiss: {};
    export_csv: { count: number };
    app_click: { app: string };
    button_click: { button: string; page: string };
};

function gtagTrack(event: string, properties?: Record<string, unknown>) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, properties || {});
    }
}

export function trackEvent<T extends keyof AnalyticsEvents>(
    event: T,
    properties: AnalyticsEvents[T]
) {
    gtagTrack(event, properties as Record<string, unknown>);
}

export const analytics = {
    domainSearch: (query: string) => trackEvent('domain_search', { query }),
    domainView: (domain: string) => trackEvent('domain_view', { domain }),
    domainShare: (domain: string, method: 'tweet' | 'copy' | 'telegram' | 'native') =>
        trackEvent('domain_share', { domain, method }),
    pageView: (page: string) => trackEvent('page_view', { page }),
    externalLink: (url: string, label: string) => trackEvent('external_link', { url, label }),
    walletConnect: (wallet: string) => trackEvent('wallet_connect', { wallet }),
    walletDisconnect: (wallet: string) => trackEvent('wallet_disconnect', { wallet }),
    telegramJoin: () => trackEvent('telegram_join', {}),
    telegramDismiss: () => trackEvent('telegram_dismiss', {}),
    exportCsv: (count: number) => trackEvent('export_csv', { count }),
    appClick: (app: string) => trackEvent('app_click', { app }),
    buttonClick: (button: string, page: string) => trackEvent('button_click', { button, page }),
};
