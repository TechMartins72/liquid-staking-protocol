import {
  Contract,
  Witnesses,
  HydraStakePrivateState,
  Stake,
  QualifiedCoinInfo,
  StakePoolStatus,
} from "../../../contract/liquid-staking-contract/dist/index";
import { MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";

export const contractAddress =
  "02002355b40f3a15136ed0eed0a977ae859d1c94f2d6975f1a8294ebed2525d4d2ff";
export const HydraStakePrivateStateId = "HydraStakePrivateState";
export type HydraStakePrivateStateId = typeof HydraStakePrivateStateId;
export type HydraStakingContract = Contract<
  HydraStakePrivateState,
  Witnesses<HydraStakePrivateState>
>;
export type TokenCircuitKeys = Exclude<
  keyof HydraStakingContract["impureCircuits"],
  number | symbol
>;
export type HydraStakingContractProviders = MidnightProviders<
  TokenCircuitKeys,
  HydraStakePrivateStateId,
  HydraStakePrivateState
>;
export type DeployedHydraStakingOnchainContract = FoundContract<HydraStakingContract>;
export type DerivedHydraStakingContractState = {
  readonly scaleFactor: bigint,
  readonly admins: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array<ArrayBufferLike>): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>;
  },
  readonly protocolTVL: QualifiedCoinInfo,
  readonly stAssetCoinColor: string,
  readonly stakePoolStatus: StakePoolStatus,
  readonly stakings: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array<ArrayBufferLike>): boolean;
    lookup(key_0: Uint8Array): Stake;
    [Symbol.iterator](): Iterator<[Uint8Array, Stake]>;
  },
  readonly total_rewards_accrued: bigint,
  readonly total_stAsset_Minted: bigint,
  readonly total_stake_withdrawn: bigint,
  readonly validAssetCoinType: string
};

export type DerivedStaker = {
  id: Uint8Array;
  staker: Stake;
};

export interface DeploymentParams {
  validAssetContractAddress: string;
  scaleFactor: number;
  stDomainSeperator: string;
  delegationContractAddress: string;
}