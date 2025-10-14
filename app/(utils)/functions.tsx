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