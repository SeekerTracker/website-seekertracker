
export type BasicDataLib = {
    solPrice: number;
    backendHealth: boolean;
    seekerData: SeekerData;
};

export type SeekerData = {
    lifeTimeSolFees: number;
}

export type BagsCreator = {
    isCreator: boolean;
    wallet: string;
    username: string;
    royaltyBps: number;
    providerUsername: string;
    provider: string;
    pfp: string;
}

export type DomainInfo = {
    domain: string;
    subdomain: string;
    created_at: string;
    subdomain_tx: string;
    subdomain_tx_blocktime: string;
    name_account: string;
    tld_account: string;
    owner: string;
    non_transferable: boolean;
}