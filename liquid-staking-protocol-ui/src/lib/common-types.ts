import {
  Contract,
  type LiquidStakingPrivateState,
  type Witnesses
} from "@repo/liquid-staking-protocol-contract";
import type {
  DeployedContract,
  FoundContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import type {
  ImpureCircuitId,
  MidnightProviders,
} from "@midnight-ntwrk/midnight-js-types";
import type { DAppConnectorWalletAPI, ServiceUriConfig } from "@midnight-ntwrk/dapp-connector-api";

export interface WalletAndProvider {
  readonly wallet: DAppConnectorWalletAPI;
  readonly uris: ServiceUriConfig;
  readonly providers: LiquidStakingContractProvider;
}
export const LiquidStakingPrivateStateKey: string = "LiquidStakingPrivateState";

export type LiquidStakingContract = Contract<LiquidStakingPrivateState, Witnesses<LiquidStakingPrivateState>>;

export type LiquidStakingCircuits = ImpureCircuitId<
  Contract<LiquidStakingPrivateState>
>;  

export declare const toHex: (bytes: Uint8Array) => string;

export type LiquidStakingCircuitKeys = Exclude<
  keyof LiquidStakingContract["impureCircuits"],
  number | symbol
>;

export type LiquidStakingContractProvider = MidnightProviders<
  LiquidStakingCircuits,
  typeof LiquidStakingPrivateStateKey,
  LiquidStakingPrivateState
>;

export type DeployedLiquidStakingContract = 
  | DeployedContract<LiquidStakingContract>
  | FoundContract<LiquidStakingContract>;

export type DerivedState = {};
