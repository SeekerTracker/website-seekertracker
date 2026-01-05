import type { CSSProperties } from "react";

declare global {
    interface Window {
        Jupiter: JupiterPlugin;
    }
}

export type WidgetPosition = "bottom-left" | "bottom-right" | "top-left" | "top-right";
export type WidgetSize = "sm" | "default";
export type SwapMode = "ExactInOrOut" | "ExactIn" | "ExactOut";
export type DEFAULT_EXPLORER = "Solana Explorer" | "Solscan" | "Solana Beach" | "SolanaFM";

export interface FormProps {
    swapMode?: SwapMode;
    initialAmount?: string;
    initialInputMint?: string;
    initialOutputMint?: string;
    fixedAmount?: boolean;
    fixedMint?: string;
    referralAccount?: string;
    referralFee?: number;
}

export interface QuoteResponse {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    otherAmountThreshold: string;
    swapMode: SwapMode;
    slippageBps: number;
    priceImpactPct: string;
    routePlan: unknown[];
}

export interface SwapResult {
    inputAddress: string;
    outputAddress: string;
    inputAmount: number;
    outputAmount: number;
}

export interface TransactionError {
    message?: string;
    code?: number;
}

export interface IForm {
    inputMint: string;
    outputMint: string;
    inputAmount: string;
    outputAmount: string;
}

export interface IScreen {
    screen: string;
}

export interface IInit {
    localStoragePrefix?: string;
    formProps?: FormProps;
    defaultExplorer?: DEFAULT_EXPLORER;
    autoConnect?: boolean;
    displayMode?: "modal" | "integrated" | "widget";
    integratedTargetId?: string;
    widgetStyle?: {
        position?: WidgetPosition;
        size?: WidgetSize;
    };
    containerStyles?: CSSProperties;
    containerClassName?: string;
    enableWalletPassthrough?: boolean;
    passthroughWalletContextState?: WalletPassthroughState;
    onRequestConnectWallet?: () => void | Promise<void>;
    onSwapError?: (params: {
        error?: TransactionError;
        quoteResponseMeta: QuoteResponse | null;
    }) => void;
    onSuccess?: (params: {
        txid: string;
        swapResult: SwapResult;
        quoteResponseMeta: QuoteResponse | null;
    }) => void;
    onFormUpdate?: (form: IForm) => void;
    onScreenUpdate?: (screen: IScreen) => void;
}

export interface WalletPassthroughState {
    publicKey: { toBase58: () => string } | null;
    connected: boolean;
    connecting: boolean;
    disconnecting: boolean;
    wallet: {
        adapter: {
            name: string;
            icon: string;
            publicKey: { toBase58: () => string } | null;
        };
    } | null;
    signTransaction?: (transaction: unknown) => Promise<unknown>;
    signAllTransactions?: (transactions: unknown[]) => Promise<unknown[]>;
    signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
    sendTransaction?: (transaction: unknown, connection: unknown) => Promise<string>;
}

export interface JupiterPlugin {
    _instance: unknown | null;
    init: (props: IInit) => void;
    resume: () => void;
    close: () => void;
    root: unknown | null;
    enableWalletPassthrough: boolean;
    onRequestConnectWallet: IInit["onRequestConnectWallet"];
    syncProps: (props: { passthroughWalletContextState?: WalletPassthroughState }) => void;
    onSwapError: IInit["onSwapError"];
    onSuccess: IInit["onSuccess"];
    onFormUpdate: IInit["onFormUpdate"];
    onScreenUpdate: IInit["onScreenUpdate"];
    localStoragePrefix: string;
}

export {};
