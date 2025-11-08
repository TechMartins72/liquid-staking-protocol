import {
  type DAppConnectorAPI,
  type DAppConnectorWalletAPI,
  type ServiceUriConfig,
} from "@midnight-ntwrk/dapp-connector-api";
import semver from "semver";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import {
  type BalancedTransaction,
  type UnbalancedTransaction,
  createBalancedTx,
} from "@midnight-ntwrk/midnight-js-types";
import {
  type CoinInfo,
  Transaction,
  type TransactionId,
} from "@midnight-ntwrk/ledger";
import { Transaction as ZswapTransaction } from "@midnight-ntwrk/zswap";
import {
  getLedgerNetworkId,
  getZswapNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { type LiquidStakingCircuitKeys } from "../lib/common-types";
import {
  concatMap,
  filter,
  firstValueFrom,
  interval,
  map,
  of,
  take,
  tap,
  throwError,
  timeout,
  catchError,
} from "rxjs";
import { pipe as fnPipe } from "fp-ts/function";
import type { WalletAndProvider } from "../lib/common-types";

import {
  createContext,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";
import type { NotificationType } from "../lib/types";
import type { DAppConnectorWalletState } from "@midnight-ntwrk/dapp-connector-api";
import { LiquidStakingDeployedApi } from "../lib/deploymentAction";

export const DappContext = createContext<DappConfigType | null>(null);

type routes = "dashboard" | "history" | "stakedetails";

interface DappConfigType {
  walletState: DAppConnectorWalletState | null;
  setWalletState: Dispatch<SetStateAction<DAppConnectorWalletState | null>>;
  handleDisconnect: () => void;
  isConnecting: boolean;
  walletAddress: string | null;
  notification: {
    type: NotificationType;
    message: string;
  } | null;
  setNotification: Dispatch<
    SetStateAction<{
      type: NotificationType;
      message: string;
    } | null>
  >;
  route: routes;
  setRoute: Dispatch<SetStateAction<routes>>;
  handleConnectToContract: () => void;
}

const DappContextProvider: React.FC<Readonly<PropsWithChildren>> = ({
  children,
}) => {
  const [route, setRoute] = useState<routes>("dashboard");
  const [walletState, setWalletState] =
    useState<DAppConnectorWalletState | null>(null);
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
  } | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const connectWallet = async (): Promise<{
    wallet: DAppConnectorWalletAPI;
    uris: ServiceUriConfig;
  }> => {
    const COMPATIBLE_CONNECTOR_API_VERSION = "1.x";
    return firstValueFrom(
      fnPipe(
        interval(100),
        map(() => window.midnight?.mnLace),
        tap((connectorAPI) => {
          console.info(connectorAPI, "Check for wallet connector API");
        }),
        filter(
          (connectorAPI): connectorAPI is DAppConnectorAPI => !!connectorAPI
        ),
        concatMap((connectorAPI) =>
          semver.satisfies(
            connectorAPI.apiVersion,
            COMPATIBLE_CONNECTOR_API_VERSION
          )
            ? of(connectorAPI)
            : throwError(() => {
                console.error(
                  {
                    expected: COMPATIBLE_CONNECTOR_API_VERSION,
                    actual: connectorAPI.apiVersion,
                  },
                  "Incompatible version of wallet connector API"
                );

                return new Error(
                  `Incompatible version of Midnight Lace wallet found. Require '${COMPATIBLE_CONNECTOR_API_VERSION}', got '${connectorAPI.apiVersion}'.`
                );
              })
        ),
        tap((connectorAPI) => {
          console.info(
            connectorAPI,
            "Compatible wallet connector API found. Connecting."
          );
        }),
        take(1),
        timeout({
          first: 1_000,
          with: () =>
            throwError(() => {
              console.error("Could not find wallet connector API");

              return new Error(
                "Could not find Midnight Lace wallet. Extension installed?"
              );
            }),
        }),
        concatMap(async (connectorAPI) => {
          const isEnabled = await connectorAPI.isEnabled();

          console.info(isEnabled, "Wallet connector API enabled status");

          return connectorAPI;
        }),
        timeout({
          first: 5_000,
          with: () =>
            throwError(() => {
              console.error("Wallet connector API has failed to respond");

              return new Error(
                "Midnight Lace wallet has failed to respond. Extension enabled?"
              );
            }),
        }),
        concatMap(async (connectorAPI) => ({
          walletConnectorAPI: await connectorAPI.enable(),
          connectorAPI,
        })),
        catchError((error, apis) =>
          error
            ? throwError(() => {
                console.error("Unable to enable connector API");
                return new Error("Application is not authorized");
              })
            : apis
        ),
        concatMap(async ({ walletConnectorAPI, connectorAPI }) => {
          const uris = await connectorAPI.serviceUriConfig();

          console.info(
            "Connected to wallet connector API and retrieved service configuration"
          );

          return { wallet: walletConnectorAPI, uris };
        })
      )
    );
  };

  const initialWalletAndProviders = async (): Promise<WalletAndProvider> => {
    const { wallet, uris } = await connectWallet();
    console.log({ uris });
    const walletState = await wallet.state();
    setWalletState(walletState);
    setWalletAddress(walletState.address);

    const providers = {
      privateStateProvider: levelPrivateStateProvider({
        privateStateStoreName: "liquid-staking-private-state",
      }),
      zkConfigProvider: new FetchZkConfigProvider<LiquidStakingCircuitKeys>(
        window.location.origin,
        fetch.bind(window)
      ),
      proofProvider: httpClientProofProvider(uris.proverServerUri),
      publicDataProvider: indexerPublicDataProvider(
        uris.indexerUri,
        uris.indexerWsUri
      ),
      walletProvider: {
        coinPublicKey: walletState.coinPublicKey,
        encryptionPublicKey: walletState.encryptionPublicKey,
        balanceTx(
          tx: UnbalancedTransaction,
          newCoins: CoinInfo[]
        ): Promise<BalancedTransaction> {
          return wallet
            .balanceAndProveTransaction(
              ZswapTransaction.deserialize(
                tx.serialize(getLedgerNetworkId()),
                getZswapNetworkId()
              ),
              newCoins
            )
            .then((zswapTx) =>
              Transaction.deserialize(
                zswapTx.serialize(getZswapNetworkId()),
                getLedgerNetworkId()
              )
            )
            .then(createBalancedTx)
            .finally(() => {
              console.log("balanceTxDone");
            });
        },
      },
      midnightProvider: {
        submitTx(tx: BalancedTransaction): Promise<TransactionId> {
          return wallet.submitTransaction(tx);
        },
      },
    };

    return { wallet, uris, providers };
  };

  const handleConnectToContract = async () => {
    try {
      setIsConnecting(true);
      const { providers } = await initialWalletAndProviders();

      const api =
        await LiquidStakingDeployedApi.joinOrDeployLiquidStakingContract(
          providers
        );
      console.log({ api });
    } catch (error) {
      console.log(error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setWalletState(null);
    setNotification({
      type: "success",
      message: "Wallet disconnected successfully!",
    });
  };

  const value: DappConfigType = {
    walletState,
    setWalletState,
    notification,
    setNotification,
    route,
    setRoute,
    handleDisconnect,
    isConnecting,
    walletAddress,
    handleConnectToContract,
  };

  return <DappContext.Provider value={value}>{children}</DappContext.Provider>;
};

export default DappContextProvider;
