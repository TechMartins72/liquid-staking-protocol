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
import { combineLatest, from, map, Observable } from "rxjs";
import { randomNonceBytes } from "./utils.js";
import type { ContractAddress } from "@midnight-ntwrk/compact-runtime";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";

const LiquidStakingContractInstance: LiquidStakingContract = new Contract(
  witnesses
);

export class LiquidStakingDeployedApi {
  public readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<DerivedState>;

  private constructor(
    deployedContract: DeployedLiquidStakingContract,
    providers: LiquidStakingContractProvider
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
        const user_pk = pureCircuits.public_key(privateState.secretKey);

        return {};
      }
    );
  }

  static joinOrDeployLiquidStakingContract = async (
    providers: LiquidStakingContractProvider,
    contractAddress?: ContractAddress
  ): Promise<LiquidStakingDeployedApi | undefined> => {
    try {
      console.log("Deploying Contract");
      const privateState = await this.getPrivateState(providers);
      console.log({ privateState });
      let deployedLiquidStakingContract;
      if (!contractAddress) {
        deployedLiquidStakingContract =
          await deployContract<LiquidStakingContract>(providers, {
            contract: LiquidStakingContractInstance,
            initialPrivateState: privateState,
            privateStateId: LiquidStakingPrivateStateKey,
            args: [randomNonceBytes(32)],
          });
        console.log("Contract Deployed");

        return new LiquidStakingDeployedApi(
          deployedLiquidStakingContract,
          providers
        );
      } else {
        console.log("Finding Contract");

        deployedLiquidStakingContract =
          await findDeployedContract<LiquidStakingContract>(providers, {
            contractAddress,
            contract: LiquidStakingContractInstance,
            privateStateId: LiquidStakingPrivateStateKey,
            initialPrivateState: await this.getPrivateState(providers),
          });
        console.log("Contract Found");
        return new LiquidStakingDeployedApi(
          deployedLiquidStakingContract,
          providers
        );
      }
    } catch (error: any) {
      throw error;
    }
  };

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

  static getLaunchPadLedgerState = (
    providers: LiquidStakingContractProvider,
    contractAddress: ContractAddress
  ): Promise<Ledger | null> =>
    providers.publicDataProvider
      .queryContractState(contractAddress)
      .then((contractState) =>
        contractState != null ? ledger(contractState.data) : null
      );
}

// export * from "./common-types.js"
// export * from "./utils.js"
