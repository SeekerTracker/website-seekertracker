import { NextRequest, NextResponse } from "next/server";
import { PublicKey, Connection, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import { io } from "socket.io-client";
import {
    WS_URL,
    CONN_RPC_URL,
    REQUIRED_TRACKER_BALANCE,
} from "../../(utils)/constant";
import { getTrackerTokenBalance } from "../../(utils)/lib/tokenBalance";
import { DomainInfo } from "../../(utils)/constantTypes";

type ExportRequestBody = {
    walletAddress: string;
    signedTransaction: string;
    message: string;
    filter: {
        type: "all" | "before" | "first";
        beforeTimestamp?: string;
        firstN?: string;
    };
};

// Rate limiting: 1 successful call per 3 minutes per wallet
const RATE_LIMIT_MS = 3 * 60 * 1000;
const successfulCalls = new Map<string, number>();

function isRateLimited(walletAddress: string): { limited: boolean; remainingSeconds: number } {
    const lastCall = successfulCalls.get(walletAddress);
    if (!lastCall) return { limited: false, remainingSeconds: 0 };

    const elapsed = Date.now() - lastCall;
    if (elapsed < RATE_LIMIT_MS) {
        return { limited: true, remainingSeconds: Math.ceil((RATE_LIMIT_MS - elapsed) / 1000) };
    }
    return { limited: false, remainingSeconds: 0 };
}

function recordSuccessfulCall(walletAddress: string): void {
    successfulCalls.set(walletAddress, Date.now());
}

type FetchOptions = {
    maxCount?: number;
    beforeTimestamp?: number;
    onProgress?: (current: number, total: number) => void;
};

// Fetch domains via WebSocket with early stopping optimization
async function fetchDomainsViaWebSocket(options: FetchOptions = {}): Promise<DomainInfo[]> {
    return new Promise((resolve, reject) => {
        const socket = io(WS_URL, {
            transports: ["websocket"],
            timeout: 60000,
        });

        const LIMIT = 1000;
        let allDomains: DomainInfo[] = [];
        let totalDomains = 0;
        let currentPage = 1;

        const timeout = setTimeout(() => {
            socket.disconnect();
            reject(new Error("WebSocket timeout - took too long to fetch domains"));
        }, 300000);

        socket.on("connect", () => {
            console.log("WebSocket connected, fetching page 1...");
            socket.emit("getDomains", { sortBy: "oldest", limit: LIMIT, page: currentPage });
        });

        socket.on("sortedDomains", (data: { data: DomainInfo[]; totalDomains: number }) => {
            const pageDomains = data.data || [];
            totalDomains = data.totalDomains || 0;

            if (options.beforeTimestamp) {
                const filteredDomains = pageDomains.filter(
                    (d) => new Date(d.created_at).getTime() < options.beforeTimestamp!
                );
                allDomains = [...allDomains, ...filteredDomains];

                if (filteredDomains.length < pageDomains.length) {
                    clearTimeout(timeout);
                    socket.disconnect();
                    resolve(allDomains);
                    return;
                }
            } else {
                allDomains = [...allDomains, ...pageDomains];
            }

            const targetCount = options.maxCount || totalDomains;

            if (options.onProgress) {
                options.onProgress(allDomains.length, targetCount);
            }

            const reachedMaxCount = options.maxCount && allDomains.length >= options.maxCount;
            const reachedTotal = allDomains.length >= totalDomains;
            const emptyPage = pageDomains.length === 0;

            if (reachedMaxCount || reachedTotal || emptyPage) {
                clearTimeout(timeout);
                socket.disconnect();

                if (options.maxCount && allDomains.length > options.maxCount) {
                    allDomains = allDomains.slice(0, options.maxCount);
                }

                resolve(allDomains);
            } else {
                currentPage++;
                socket.emit("getDomains", { sortBy: "oldest", limit: LIMIT, page: currentPage });
            }
        });

        socket.on("connect_error", (err) => {
            clearTimeout(timeout);
            socket.disconnect();
            reject(err);
        });

        socket.on("disconnect", (reason) => {
            if (reason !== "io client disconnect") {
                clearTimeout(timeout);
                reject(new Error(`WebSocket disconnected: ${reason}`));
            }
        });
    });
}

export async function POST(request: NextRequest) {
    try {
        const body: ExportRequestBody = await request.json();
        const { walletAddress, signedTransaction, message, filter } = body;

        // 1. Validate request
        if (!walletAddress || !signedTransaction || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // 2. Verify wallet address
        let publicKey: PublicKey;
        try {
            publicKey = new PublicKey(walletAddress);
        } catch {
            return NextResponse.json(
                { error: "Invalid wallet address" },
                { status: 400 }
            );
        }

        // 3. Verify the signed transaction
        try {
            const txBytes = bs58.decode(signedTransaction);
            const transaction = Transaction.from(txBytes);

            // Check that the transaction was signed by the claimed wallet
            const signature = transaction.signature;
            if (!signature) {
                return NextResponse.json(
                    { error: "Transaction not signed" },
                    { status: 401 }
                );
            }

            // Verify the fee payer matches the claimed wallet
            if (!transaction.feePayer?.equals(publicKey)) {
                return NextResponse.json(
                    { error: "Transaction signer does not match wallet" },
                    { status: 401 }
                );
            }

            // Verify the signature is valid
            const isValid = transaction.verifySignatures();
            if (!isValid) {
                return NextResponse.json(
                    { error: "Invalid transaction signature" },
                    { status: 401 }
                );
            }
        } catch (err) {
            console.error("Transaction verification error:", err);
            return NextResponse.json(
                { error: "Failed to verify transaction signature" },
                { status: 401 }
            );
        }

        // 4. Verify message timestamp (prevent replay attacks, 5 min window)
        const timestampMatch = message.match(/Timestamp: (\d+)/);
        if (timestampMatch) {
            const timestamp = parseInt(timestampMatch[1]);
            const now = Date.now();
            if (now - timestamp > 5 * 60 * 1000) {
                return NextResponse.json(
                    { error: "Request expired. Please try again." },
                    { status: 401 }
                );
            }
        }

        // 5. Check rate limit (1 successful call per 3 minutes)
        const rateLimit = isRateLimited(walletAddress);
        if (rateLimit.limited) {
            return NextResponse.json(
                { error: `Rate limited. Please wait ${rateLimit.remainingSeconds} seconds before downloading again.` },
                { status: 429 }
            );
        }

        // 6. Verify token balance server-side
        const connection = new Connection(CONN_RPC_URL);
        const balance = await getTrackerTokenBalance(connection, publicKey);

        if (balance < REQUIRED_TRACKER_BALANCE) {
            return NextResponse.json(
                {
                    error: `Insufficient $TRACKER balance. Required: ${REQUIRED_TRACKER_BALANCE.toLocaleString()}, Current: ${balance.toLocaleString()}`,
                },
                { status: 403 }
            );
        }

        // 5. Create streaming response for progress updates
        const encoder = new TextEncoder();
        const stream = new TransformStream();
        const writer = stream.writable.getWriter();

        // Start async fetch in background
        (async () => {
            try {
                const fetchOptions: FetchOptions = {
                    onProgress: async (current, total) => {
                        const percent = Math.round((current / total) * 100);
                        await writer.write(encoder.encode(`PROGRESS:${percent}\n`));
                    },
                };

                if (filter.type === "before" && filter.beforeTimestamp) {
                    fetchOptions.beforeTimestamp = parseInt(filter.beforeTimestamp);
                } else if (filter.type === "first" && filter.firstN) {
                    fetchOptions.maxCount = parseInt(filter.firstN);
                }

                const domains = await fetchDomainsViaWebSocket(fetchOptions);

                if (domains.length === 0) {
                    await writer.write(encoder.encode("ERROR:No domain data available\n"));
                    await writer.close();
                    return;
                }

                // Generate CSV
                const csvHeader = "activation_number,domain,owner,activation_timestamp\n";
                const csvRows = domains
                    .map((d) => {
                        const domainName = `${d.subdomain}${d.domain}`;
                        const timestamp = new Date(d.created_at).toISOString();
                        const escapedDomain = domainName.replace(/"/g, '""');
                        const escapedOwner = d.owner.replace(/"/g, '""');
                        return `${d.rank || 0},"${escapedDomain}","${escapedOwner}","${timestamp}"`;
                    })
                    .join("\n");

                const csv = csvHeader + csvRows;

                // Send CSV marker and content
                await writer.write(encoder.encode("CSV_START\n"));
                await writer.write(encoder.encode(csv));
                await writer.close();

                // Record successful call for rate limiting
                recordSuccessfulCall(walletAddress);
            } catch (err) {
                console.error("Export error:", err);
                await writer.write(encoder.encode(`ERROR:${(err as Error).message}\n`));
                await writer.close();
            }
        })();

        return new Response(stream.readable, {
            headers: {
                "Content-Type": "text/plain",
                "Transfer-Encoding": "chunked",
            },
        });
    } catch (error) {
        console.error("Export error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
