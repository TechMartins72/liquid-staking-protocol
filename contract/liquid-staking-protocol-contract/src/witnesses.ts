import { Ledger } from "./managed/liquid-staking-protocol/contract/index.cjs";
import { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import { v4 as uuidv4 } from "uuid";

export type LiquidStakingPrivateState = {
  readonly secretKey: Uint8Array;
};

export const createLiquidStakingPrivateState = (secretKey: Uint8Array) => ({
  secretKey,
});

export const witnesses = {
  local_secret_key: (
    state: WitnessContext<Ledger, LiquidStakingPrivateState>
  ): [LiquidStakingPrivateState, Uint8Array] => {
    state.privateState.secretKey;
    return [state.privateState, state.privateState.secretKey];
  },
  generateStakeId: ({
    privateState,
  }: WitnessContext<Ledger, LiquidStakingPrivateState>): [
    LiquidStakingPrivateState,
    Uint8Array,
  ] => {
    const randomId = uuidv4();
    const encoder = new TextEncoder();
    const stakeId = encoder.encode(randomId);
    return [privateState, stakeId];
  },
  getTime: ({
    privateState,
  }: WitnessContext<Ledger, LiquidStakingPrivateState>): [
    LiquidStakingPrivateState,
    bigint,
  ] => {
    const currentTime = BigInt(Date.now());
    return [privateState, currentTime];
  },
  getTotalValue: (
    { privateState }: WitnessContext<Ledger, LiquidStakingPrivateState>,
    amount: bigint,
    time: bigint
  ): [LiquidStakingPrivateState, bigint] => {
    return [privateState, amount];
  },
};
