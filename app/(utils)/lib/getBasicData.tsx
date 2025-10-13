import { BEPATH, SEEKER_TOKEN_ADDRESS, solanaWSConnection } from "../constant";
import { PublicKey } from "@solana/web3.js";
import { BagsCreator, BasicDataLib, SeekerData } from "../constantTypes";

// ------------------ 🧩 Helper: Safe Fetch with Timeout ------------------
async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout = 10000
): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return res;
    } catch (err) {
        clearTimeout(id);
        if (err instanceof Error && err.name === "AbortError") {
            console.error(`⏳ Timeout fetching ${url}`);
        } else {
            console.error(`❌ Fetch failed: ${url}`, err);
        }
        throw err;
    }
}

// ------------------ 🧩 Constants ------------------
const BagsApiKey = "bags_prod_YSeO3hc_FZ2g0myg7ppNtBSxR6zetFKg41xlpFwtpP8";

const defaultData: BasicDataLib = {
    solPrice: 0,
    backendHealth: false,
    seekerData: {
        lifeTimeSolFees: 0,
    },
};

// ------------------ 🧠 Main Functions ------------------
export async function getBasicData(): Promise<BasicDataLib> {
    const [aResult, bResult] = await Promise.allSettled([
        fetchInitialData(),
        fetchBackendHealth(),
    ]);

    const a = aResult.status === "fulfilled" ? aResult.value : null;
    const b = bResult.status === "fulfilled" ? bResult.value : false;

    if (!a) return defaultData;

    const { solUsdPrice, seekerData } = a;

    return {
        solPrice: solUsdPrice,
        seekerData,
        backendHealth: b,
    };
}

// ------------------ 🏥 Backend Health ------------------
export async function fetchBackendHealth() {
    try {
        const res = await fetchWithTimeout(BEPATH.health, { next: { revalidate: 5 } }, 5000);
        return res.ok;
    } catch {
        return false;
    }
}

// ------------------ 💰 Price + Seeker Data ------------------
export async function fetchInitialData() {
    try {
        const priceDataRes = await fetchWithTimeout(
            BEPATH.priceData,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticker: "SOLUSDC" }),
                next: { revalidate: 5 },
            },
            8000
        );

        const priceData = await priceDataRes.json();
        const usdPrice = priceData?.usdPrice ?? 0;

        const seekerFund = await getSeekerFundData(usdPrice);

        const seekerData: SeekerData = {
            lifeTimeSolFees: parseFloat(seekerFund.lifetimeFees.toFixed(2)),
        };

        return { solUsdPrice: usdPrice, seekerData };
    } catch (error) {
        console.error("Error fetching initial data:", error);
    }
}

// ------------------ 🏦 Seeker Fund Aggregator ------------------
const getSeekerFundData = async (usdPrice: number) => {
    const [lifetimeFees, creators, fundBalance] = await Promise.allSettled([
        getTokenLifetimeFees(SEEKER_TOKEN_ADDRESS),
        getTokenCreators(SEEKER_TOKEN_ADDRESS),
        getSeekerFundBalance(),
    ]);

    const lf = lifetimeFees.status === "fulfilled" ? lifetimeFees.value : 0;
    const cr = creators.status === "fulfilled" ? creators.value : [];
    const fb = fundBalance.status === "fulfilled" ? fundBalance.value : 0;

    const creator = cr.find((c: BagsCreator) => c.isCreator);
    const feeShareUsers = cr.filter((c: BagsCreator) => !c.isCreator);

    const lifetimeFeesUSD = lf * usdPrice;
    const fundBalanceUSD = fb * usdPrice;

    return {
        tokenAddress: SEEKER_TOKEN_ADDRESS,
        lifetimeFees: lf,
        lifetimeFeesFormatted: lf.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
        lifetimeFeesUSD,
        lifetimeFeesUSDFormatted: lifetimeFeesUSD.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
        fundBalance: fb,
        fundBalanceFormatted: fb.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
        fundBalanceUSD,
        fundBalanceUSDFormatted: fundBalanceUSD.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }),
        creator,
        feeShareUsers,
        totalUsers: cr.length,
        bagsUrl: `https://bags.fm/${SEEKER_TOKEN_ADDRESS}`,
    };
};

// ------------------ 🪙 Bags API: Lifetime Fees ------------------
const getTokenLifetimeFees = async (tokenAddress: string): Promise<number> => {
    const url = `https://public-api-v2.bags.fm/api/v1/token-launch/lifetime-fees?tokenMint=${tokenAddress}`;
    const options = { method: "GET", headers: { "x-api-key": BagsApiKey }, next: { revalidate: 5 } };

    try {
        const response = await fetchWithTimeout(url, options, 8000);
        const data = await response.json();
        const lamports = data?.response || 0;
        return lamports / 1e9;
    } catch (error) {
        console.error({ error }, "Failed to get token lifetime fees");
        return 0;
    }
};

// ------------------ 👥 Bags API: Creators ------------------
const getTokenCreators = async (tokenAddress: string): Promise<BagsCreator[]> => {
    const url = `https://public-api-v2.bags.fm/api/v1/token-launch/creator/v3?tokenMint=${tokenAddress}`;
    const options = { method: "GET", headers: { "x-api-key": BagsApiKey }, next: { revalidate: 5 } };

    try {
        const response = await fetchWithTimeout(url, options, 8000);
        const data: { success: boolean; response: BagsCreator[] } = await response.json();
        return data.response || [];
    } catch (error) {
        console.error({ error }, "Failed to get token creators");
        return [];
    }
};

// ------------------ 💼 Solana Fund Balance ------------------
const getSeekerFundBalance = async (): Promise<number> => {
    const SeekerAddress = new PublicKey("ehipS3kn9GUSnEMgtB9RxCNBVfH5gTNRVxNtqFTBAGS");
    try {
        const balance = await solanaWSConnection.getBalance(SeekerAddress);
        return balance / 1e9;
    } catch (error) {
        console.error({ error }, "Failed to get Seeker fund balance");
        return 0;
    }
};
