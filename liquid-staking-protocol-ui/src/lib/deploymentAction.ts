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
  Observable,
  combineLatest,
  from,
} from "rxjs";
import { pipe as fnPipe } from "fp-ts/function";
import {
  type DAppConnectorAPI,
  type DAppConnectorWalletAPI,
  type ServiceUriConfig,
} from "@midnight-ntwrk/dapp-connector-api";
import semver from "semver";
import {
  createLiquidStakingPrivateState,
  type LiquidStakingPrivateState,
  Contract,
  ledger,
  witnesses,
  pureCircuits,
  type Ledger,
} from "@repo/liquid-staking-protocol-contract";
import {
  type DeployedLiquidStakingContract,
  type DerivedState,
  type LiquidStakingContract,
  type LiquidStakingContractProvider,
  LiquidStakingPrivateStateKey,
} from "./common-types.js";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import {
  getStakesInfo,
  randomNonceBytes,
  stringTo32ByteArray,
} from "./utils.js";
import {
  encodeTokenType,
  type ContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import {
  deployContract,
  findDeployedContract,
  type FinalizedCallTxData,
} from "@midnight-ntwrk/midnight-js-contracts";

const LiquidStakingContractInstance: LiquidStakingContract = new Contract(
  witnesses
);

export interface DeployedLiquidStakingAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<DerivedState>;
  stakeAsset: (
    color: string,
    amount: number,
    deployedContract: DeployedLiquidStakingContract
  ) => Promise<FinalizedCallTxData<LiquidStakingContract, "stakeAsset">>;
  redeemAsset: (
    color: string,
    amount: number,
    stakeId: string,
    deployedContract: DeployedLiquidStakingContract
  ) => Promise<FinalizedCallTxData<LiquidStakingContract, "redeemAsset">>;
}

export class LiquidStakingDeployedApi implements DeployedLiquidStakingAPI {
  public readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<DerivedState>;

  private constructor(
    providers: LiquidStakingContractProvider,
    public readonly deployedContract: DeployedLiquidStakingContract
  ) {
    this.deployedContractAddress =
      deployedContract.deployTxData.public.contractAddress;
    this.state$ = combineLatest(
      [
        // Combine public (ledger) state with...
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, {
            type: "all",
          })
          .pipe(map((contractState) => ledger(contractState.data))),
        from(
          providers.privateStateProvider.get(
            LiquidStakingPrivateStateKey
          ) as Promise<LiquidStakingPrivateState>
        ),
      ],
      // ...and combine them to produce the required derived state.
      (ledgerState, privateState) => {
        const user_pk = toHex(pureCircuits.public_key(privateState.secretKey));

        return {
          stakes: getStakesInfo(ledgerState.stakes),
          userSecretKey: user_pk,
        };
      }
    );
  }

  static deployContract = async (providers: LiquidStakingContractProvider) => {
    try {
      console.log("Deploying Contract");
      let deployedLiquidStakingContract =
        await deployContract<LiquidStakingContract>(providers, {
          contract: LiquidStakingContractInstance,
          initialPrivateState: await this.getPrivateState(providers),
          privateStateId: LiquidStakingPrivateStateKey,
          args: [randomNonceBytes(32)],
        });
      console.log("Contract Deployed");

      return new LiquidStakingDeployedApi(
        providers,
        deployedLiquidStakingContract
      );
    } catch (error) {
      console.log({ error });
    }
  };

  // static joinContract = async (
  //   providers: LiquidStakingContractProvider,
  //   contractAddress: ContractAddress
  // ): Promise<LiquidStakingDeployedApi | undefined> => {
  //   try {
  //     console.log("Joining Contract");
  //     const privateState = await this.getPrivateState(providers);
  //     console.log({ privateState });
  //     let deployedLiquidStakingContract =
  //       await findDeployedContract<LiquidStakingContract>(providers, {
  //         contractAddress,
  //         contract: LiquidStakingContractInstance,
  //         privateStateId: LiquidStakingPrivateStateKey,
  //         initialPrivateState: await this.getPrivateState(providers),
  //       });
  //     console.log("Contract Found");
  //     return new LiquidStakingDeployedApi(
  //       providers,
  //       deployedLiquidStakingContract
  //     );
  //   } catch (error) {
  //     console.log({ error });
  //   }
  // };

  async stakeAsset(
    color: string,
    amount: number,
    deployedContract: DeployedLiquidStakingContract
  ): Promise<FinalizedCallTxData<LiquidStakingContract, "stakeAsset">> {
    const coin = {
      nonce: randomNonceBytes(32),
      color: encodeTokenType(color),
      value: BigInt(amount),
    };

    return await deployedContract.callTx.stakeAsset(coin);
  }

  async redeemAsset(
    color: string,
    amount: number,
    stakeId: string,
    deployedContract: DeployedLiquidStakingContract
  ): Promise<FinalizedCallTxData<LiquidStakingContract, "redeemAsset">> {
    const coin = {
      nonce: randomNonceBytes(32),
      color: encodeTokenType(color),
      value: BigInt(amount),
    };

    return await deployedContract.callTx.redeemAsset(
      coin,
      stringTo32ByteArray(stakeId)
    );
  }

  private static async getPrivateState(
    providers: LiquidStakingContractProvider
  ): Promise<LiquidStakingPrivateState> {
    console.log("Getting private state");
    const existingPrivateState = await providers.privateStateProvider.get(
      LiquidStakingPrivateStateKey
    );
    return (
      existingPrivateState ??
      createLiquidStakingPrivateState(randomNonceBytes(32))
    );
  }

  static getLiquidStakingState = (
    providers: LiquidStakingContractProvider,
    contractAddress: ContractAddress
  ): Promise<Ledger | null> =>
    providers.publicDataProvider
      .queryContractState(contractAddress)
      .then((contractState) =>
        contractState != null ? ledger(contractState.data) : null
      );
}

export const connectWallet = async (): Promise<{
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
