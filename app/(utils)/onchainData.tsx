import { PublicKey } from "@solana/web3.js"
import { BEPATH, solanaWSConnection } from "./constant"
import { getFirstTxHash, getHashedName } from "./functions";
import { BN } from "bn.js";
import { DomainInfo, fetchDomainType } from "./constantTypes";

export const ANS_PROGRAM_ID = new PublicKey(
    'ALTNSZ46uaAUU7XUV6awvdorLGqAsPwa9shm7h4uP2FK',
);
export const TLD_HOUSE_PROGRAM_ID = new PublicKey(
    'TLDHkysf5pCnKsVA4gXpNvmy7psXLPEu4LAdDJthT9S',
);
export const AD_HASH_PREFIX = "ALT Name Service";

export const getOnchainDomainData = async (domain: string, subDomain: string): Promise<DomainInfo | undefined> => {

    subDomain.trim()
    domain.trim()

    const { subDomain_NA_Pkey, subDomain_TLD_Pkey } = get_subdomain_Pubkey(domain, subDomain)

    const [subDomain_ACC_DataBuff] = await Promise.all([
        solanaWSConnection.getAccountInfo(subDomain_NA_Pkey),
        solanaWSConnection.getAccountInfo(subDomain_TLD_Pkey)
    ])

    if (!subDomain_ACC_DataBuff) {
        return
    }
    const desSub_Acc_data = PA_Deserialize(subDomain_ACC_DataBuff.data);
    if (!desSub_Acc_data) {
        console.error("Failed to deserialize Subdomain TLD data")
        return
    }
    const { NA_Owner, createdAt, nonTransferable } = desSub_Acc_data;



    const firstTxHash = await getFirstTxHash(subDomain_NA_Pkey)
    if (!firstTxHash) {
        console.error("No transaction found for this domain")
    }

    const domainData: DomainInfo = {
        domain: domain,
        subdomain: subDomain,
        created_at: new Date(createdAt * 1000).toISOString(),
        subdomain_tx: firstTxHash.hash || "",
        subdomain_tx_blocktime: new Date(firstTxHash.blockTime * 1000).toISOString(),
        name_account: subDomain_NA_Pkey.toBase58(),
        tld_account: subDomain_TLD_Pkey.toBase58(),
        non_transferable: nonTransferable,
        owner: NA_Owner.toBase58(),
    }
    return domainData
}

// descrilize data
export type ParentAccountInfo = {
    discriminator: Uint8Array,
    NA_Pkey: PublicKey,
    NA_Owner: PublicKey,
    NA_Class: PublicKey,
    expiresAt: number,
    createdAt: number,
    nonTransferable: boolean,
}
export function PA_Deserialize(accountData: Buffer): ParentAccountInfo | undefined {

    // Helper to extract chunks easily
    let offset = 0;
    const next = (size: number): Buffer => {
        const chunk = accountData.subarray(offset, offset + size);
        offset += size;
        return chunk;
    };


    const discriminatorBuff = next(8);
    const NA_Buf = next(32);
    const NA_Owner_Buf = next(32);
    const NA_Class_Buf = next(32);
    const expiresAt_Buf = next(8);
    const createdAt_Buf = next(8);
    const transferableBuf = next(1)
    // const padding_buf = next(88);

    const data = {
        discriminator: new Uint8Array(discriminatorBuff),
        NA_Pkey: new PublicKey(NA_Buf),
        NA_Owner: new PublicKey(NA_Owner_Buf),
        NA_Class: new PublicKey(NA_Class_Buf),
        expiresAt: new BN(expiresAt_Buf, 'le').toNumber(),
        createdAt: new BN(createdAt_Buf, 'le').toNumber(),
        nonTransferable: transferableBuf[0] === 1,
    }
    return data


}

// pubkey find
export function get_domain_Pubkey(domain: string): {
    domain_NA_Pkey: PublicKey, domain_TLD_Pkey: PublicKey
} {

    const grandSeedName = AD_HASH_PREFIX + "ANS"
    const domainSeedName = AD_HASH_PREFIX + domain

    const grandHashedName = getHashedName(grandSeedName)
    const domainHashedName = getHashedName(domainSeedName)

    // NA domain account parent
    const grand_seeds = [
        grandHashedName,
        Buffer.alloc(32),
        Buffer.alloc(32),
    ]
    const Grand_domain_PN_Pkey = PublicKey.findProgramAddressSync(grand_seeds, ANS_PROGRAM_ID)[0] //always 3mX9b4AZaQehNoQGfckVcmgmA6bkBoFcbLj9RMmMyNcU

    // Domain account derive
    const Domain_PA_seeds = [
        domainHashedName,
        Buffer.alloc(32),
        Grand_domain_PN_Pkey.toBuffer(),
    ]
    const domain_NA_Pkey = PublicKey.findProgramAddressSync(Domain_PA_seeds, ANS_PROGRAM_ID)[0]

    const domain_TLD_Seed = [
        Buffer.from("tld_house"),
        Buffer.from(domain.toLowerCase())
    ]
    const domain_TLD_Pkey = PublicKey.findProgramAddressSync(domain_TLD_Seed, TLD_HOUSE_PROGRAM_ID)[0]
    return {
        domain_NA_Pkey,
        domain_TLD_Pkey
    }
}



export function get_subdomain_Pubkey(domain: string, subDomain: string): {
    domain_NA_Pkey: PublicKey,
    domain_TLD_Pkey: PublicKey,
    subDomain_NA_Pkey: PublicKey,
    subDomain_TLD_Pkey: PublicKey
} {
    const subDomainSeedName = AD_HASH_PREFIX + subDomain
    const subDomainHashedName = getHashedName(subDomainSeedName)


    const { domain_NA_Pkey, domain_TLD_Pkey } = get_domain_Pubkey(domain)

    const subDomainNASeed = [
        subDomainHashedName,
        Buffer.alloc(32),
        domain_NA_Pkey.toBuffer(),
    ]
    const subDomain_NA_Pkey = PublicKey.findProgramAddressSync(subDomainNASeed, ANS_PROGRAM_ID)[0]

    const subDomain_TLD_Seed = [
        getHashedName(AD_HASH_PREFIX + subDomain_NA_Pkey.toString()),
        domain_TLD_Pkey.toBuffer(),
        Buffer.alloc(32)
    ]
    const subDomain_TLD_Pkey = PublicKey.findProgramAddressSync(subDomain_TLD_Seed, ANS_PROGRAM_ID)[0]

    return {
        domain_NA_Pkey,
        domain_TLD_Pkey,
        subDomain_NA_Pkey,
        subDomain_TLD_Pkey
    }
}


export async function getApiUserData(userDomain: string): Promise<fetchDomainType | undefined> {
    try {
        const response = await fetch(BEPATH.domain, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ domain: userDomain }),
        });

        if (!response.ok) {
            console.error("❌ getApiUserData failed:", response.status, response.statusText);
            return undefined;
        }

        const data: fetchDomainType = await response.json();
        return data;
    } catch (error) {
        console.error("Error in getApiUserData:", error);
        return undefined;
    }
}
