import { PublicKey } from '@solana/web3.js';
import crypto from 'crypto';
import { solanaWSConnection } from './constant';


export function sha256Hash(input: string): Buffer {
    return crypto.createHash('sha256').update(input).digest();
}
export function getHashedName(name: string): Buffer {
    const input = name;
    const str = sha256Hash(input)
    return str
}

export async function getFirstTxHash(account: string | PublicKey): Promise<{ hash: string | undefined, blockTime: number }> {
    let txHash = undefined;
    let blockTime = 0;

    if (typeof account == 'string') {
        account = new PublicKey(account);
    }

    try {
        let isFetching = true;
        let before: string | undefined = undefined;

        while (isFetching) {
            const allSigantures = await solanaWSConnection.getSignaturesForAddress(account,
                {
                    limit: 1000,
                    before: before
                },
                "confirmed"
            )
            if (allSigantures.length > 0) {
                before = allSigantures[allSigantures.length - 1].signature;
                if (allSigantures.length < 1000) {
                    isFetching = false;

                    const withoutErrors = allSigantures.filter(sig => !sig.err).reverse();
                    const lastTx = withoutErrors[0];
                    if (lastTx) {
                        txHash = lastTx.signature;
                        blockTime = lastTx.blockTime || 0;
                    }
                }
            }
        }


    } catch (error) {
        console.error("Error fetching first transaction hash:", error);

    } finally {
        return {
            hash: txHash,
            blockTime: blockTime
        };
    }

}

export const getPaginationItems = (
    currentPage: number,
    totalPages: number,
    siblingCount: number = 2
) => {
    const firstPage = 1;
    const lastPage = totalPages;

    const leftRange = Math.max(currentPage - siblingCount, firstPage);
    const rightRange = Math.min(currentPage + siblingCount, lastPage);

    const items = new Set<number>();
    items.add(firstPage);
    items.add(lastPage);

    for (let i = leftRange; i <= rightRange; i++) {
        items.add(i);
    }

    const sortedNumbers = Array.from(items).sort((a, b) => a - b);
    const paginationWithDots: (number | string)[] = [];

    for (let i = 0; i < sortedNumbers.length; i++) {
        const num = sortedNumbers[i];

        if (i > 0) {
            const prevNum = sortedNumbers[i - 1];
            if (num - prevNum === 2) {
                paginationWithDots.push(prevNum + 1);
            }
            else if (num - prevNum > 2) {
                paginationWithDots.push("...");
            }
        }

        paginationWithDots.push(num);
    }

    return paginationWithDots;
};