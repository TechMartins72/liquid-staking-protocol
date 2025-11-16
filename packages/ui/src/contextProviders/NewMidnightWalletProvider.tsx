import { connectWallet } from "@/lib/walletConnection";
import { hydraStakePrivateStateId, type HydraStakeContractProviders, type HydraStakePrivateStateId, type TokenCircuitKeys } from "@hydra/hydra-stake-api";
import type { HydraStakePrivateState } from "@hydra/hydra-stake-protocol";
import type { CoinInfo } from "@midnight-ntwrk/compact-runtime";
import type { DAppConnectorWalletAPI } from "@midnight-ntwrk/dapp-connector-api";
import {
    Transaction as ZswapTransaction,
    type TransactionId,
} from "@midnight-ntwrk/zswap";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { getLedgerNetworkId, getZswapNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { createBalancedTx, type BalancedTransaction, type UnbalancedTransaction } from "@midnight-ntwrk/midnight-js-types";
import type { Logger } from "pino";
import React, { useCallback, useMemo, useState, type PropsWithChildren } from "react";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { Transaction } from "@midnight-ntwrk/ledger";

interface WalletStateType {
    address: string | undefined;
    coinPublicKey: string | undefined;
    encryptedCoinPublicKey: string | undefined;
    uris: {
        proofServerUri: string | undefined;
        substrateNodeUri: string | undefined;
        indexerUri: string | undefined;
        indexerWsUri: string | undefined;
    },
    isConnected: boolean;
}

export interface ContextType extends WalletStateType {
    connect: () => Promise<HydraStakeContractProviders>;
    disconnect: () => void;
    isConnecting: boolean;
    error: string;
    providers: HydraStakeContractProviders | undefined;
}

export const NewMidnightWalletContext = React.createContext<ContextType | null>(null)

const NewMidnightWalletProvider = ({ children }: PropsWithChildren<{ logger: Logger }>) => {
    const [hasConnected, setHasConnected] = useState(false);
    const [walletState, setWalletState] = useState<WalletStateType | undefined>();
    const [error, setError] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [_, setWalletAPI] = useState<DAppConnectorWalletAPI | undefined>();
    const [providers, setProviders] = useState<HydraStakeContractProviders | undefined>();

    const connect = useCallback(async (): Promise<HydraStakeContractProviders> => {
    setIsConnecting(true);
    try {
        const { wallet, uris } = await connectWallet();
        const walletState = await wallet.state();
        if (walletState.address == undefined) {
            throw new Error("Failed to retrieve wallet state");
        }

        setHasConnected(true);

        const newWalletState: WalletStateType = {
            address: walletState.address,
            coinPublicKey: walletState.coinPublicKey,
            encryptedCoinPublicKey: walletState.encryptionPublicKey,
            uris: {
                ...uris,
                proofServerUri: import.meta.env.VITE_PROOF_SERVER_URI
            },
            isConnected: true
        }

        // Setup providers immediately
        const newProviders: HydraStakeContractProviders = {
            privateStateProvider: levelPrivateStateProvider<HydraStakePrivateStateId, HydraStakePrivateState>({
                privateStateStoreName: hydraStakePrivateStateId
            }),
            zkConfigProvider: new FetchZkConfigProvider<TokenCircuitKeys>(
                window.location.origin,
                fetch.bind(window)
            ),
            publicDataProvider: indexerPublicDataProvider(
                import.meta.env.VITE_INDEXER_URL,
                import.meta.env.VITE_INDEXER_WS_URL
            ),
            midnightProvider: {
                submitTx(tx: BalancedTransaction): Promise<TransactionId> {
                    return wallet.submitTransaction(tx);
                }
            },
            walletProvider: {
                coinPublicKey: newWalletState.coinPublicKey as string,
                encryptionPublicKey: newWalletState?.encryptedCoinPublicKey as string,
                balanceTx(tx: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
                    return wallet?.balanceAndProveTransaction(
                        ZswapTransaction.deserialize(
                            tx.serialize(getLedgerNetworkId()),
                            getZswapNetworkId()
                        ),
                        newCoins
                    ).then((zswapTx) =>
                        Transaction.deserialize(
                            zswapTx.serialize(getZswapNetworkId()),
                            getLedgerNetworkId()
                        )
                    ).then(createBalancedTx)
                }
            },
            proofProvider: httpClientProofProvider<TokenCircuitKeys>(newWalletState.uris.proofServerUri as string)
        }

        console.log("wallet state", newWalletState);
        setWalletAPI(wallet);
        setWalletState(newWalletState);
        setProviders(newProviders);
        setIsConnecting(false);
        
        return newProviders; // Return providers
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        setError(errMsg);
        setIsConnecting(false);
        throw error; // Re-throw to handle in the caller
    } finally {
        setIsConnecting(false);
        setError("");
    }
}, [])

    const disconnect = useCallback(() => {
        setHasConnected(false);
        setWalletState(undefined);
        setIsConnecting(true);
        setError("");
    }, [])

    /** Context assignment */
    const context: ContextType = useMemo(() => {
        return {
            address: walletState?.address ?? undefined,
            coinPublicKey: walletState?.coinPublicKey ?? undefined,
            encryptedCoinPublicKey: walletState?.encryptedCoinPublicKey ?? undefined,
            uris: walletState?.uris ?? {
                proofServerUri: walletState?.uris.proofServerUri ?? undefined,
                substrateNodeUri: walletState?.uris.substrateNodeUri ?? undefined,
                indexerUri: walletState?.uris.indexerUri ?? undefined,
                indexerWsUri: walletState?.uris.indexerWsUri ?? undefined
            },
            isConnected: hasConnected,
            connect,
            disconnect,
            isConnecting,
            error,
            providers
        }
    }, [walletState, hasConnected])

    return (
        <NewMidnightWalletContext.Provider value={context}>
            {children}
        </NewMidnightWalletContext.Provider>
    )
}


export default NewMidnightWalletProvider;