import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import type { LedgerInfo, PoolType, Stakes } from "./common-types";
import type { Ledger, Stake } from "@repo/hydra-stake-protocol";
export const randomNonceBytes = (length: number): Uint8Array => {
  const newBytes = new Uint8Array(length);
  crypto.getRandomValues(newBytes);
  return newBytes;
};

export function stringTo32ByteArray(input: string): Uint8Array {
  // Create a new 32-byte array filled with zeros
  const result = new Uint8Array(32);
  // Convert string to UTF-8 bytes
  const encoder = new TextEncoder();
  const encoded = encoder.encode(input);
  const copyLength = Math.min(encoded.length, 32);
  result.set(encoded.subarray(0, copyLength));

  return result;
}

/** Filters admin list */
const filterPools = (pools: {
  isEmpty(): boolean;
  size(): bigint;
  member(key_0: { bytes: Uint8Array }): boolean;
  lookup(key_0: { bytes: Uint8Array }): Uint8Array;
  [Symbol.iterator](): Iterator<[{ bytes: Uint8Array }, Uint8Array]>
}): PoolType => {
  let poolsInfo: PoolType = [];
  
    for (const pool of pools) {
      poolsInfo.push([
        toHex(pool[0].bytes),
        toHex(pool[1])
      ])
    }
  return poolsInfo;
};


const filterAdmin = (admins: {
  isEmpty(): boolean;
  size(): bigint;
  member(elem_0: Uint8Array): boolean;
  [Symbol.iterator](): Iterator<Uint8Array>;
}): string[] => {
  let adminList: string[] = [];
  if (admins.isEmpty()) {
    return [];
  } else {
    for (const admin of admins) {
      adminList.push(toHex(admin));
    }
  }
  return adminList;
};

/** Filters stakes list: return a list of list [userPubKey >> stakeInfo] */
const filterStakes = (stakes: {
  isEmpty(): boolean;
  size(): bigint;
  member(key_0: Uint8Array): boolean;
  lookup(key_0: Uint8Array): Stake;
  [Symbol.iterator](): Iterator<[Uint8Array, Stake]>;
}): Stakes => {
  let allStakes: Stakes = [];
  if (stakes.isEmpty()) {
    return [];
  } else {
    for (const stake of stakes) {
      allStakes.push([
        toHex(stake[0]),
        {
          stakeId: toHex(stake[1].staker_id),
          stakeHash: toHex(stake[1].stake_hash),
          status: stake[1].status,
          createAt: Number(stake[1].created_at),
        },
      ]);
    }
  }
  return allStakes;
};

/** Refines contract's ledger and returns readable format for user UX */
export const getLedgerRefinedData = (ledger: Ledger, userPk: string): LedgerInfo => {
  /** Object destructuring for better user UX and enhanced code readability */
  const {
    total_rewards_accrued,
    total_stake_withdrawn,
    total_stAsset_Minted,
    protocolTVL,
    stakePoolStatus,
    stakings,
    admins,
    validAssetCoinType,
    SCALE_FACTOR,
    PoolsInfo
  } = ledger;

  const poolInfo: LedgerInfo = {
    userPk,
    pools: filterPools(PoolsInfo),
    total_stAsset_Minted: Number(total_stAsset_Minted),
    total_rewards_accrued: Number(total_rewards_accrued),
    total_stake_withdrawn: Number(total_stake_withdrawn),
    protocolTVL: Number(protocolTVL),
    stakePoolStatus: stakePoolStatus,
    stakings: filterStakes(stakings),
    admins: filterAdmin(admins),
    assetCoinColor: toHex(validAssetCoinType),
    SCALE_FACTOR: Number(SCALE_FACTOR),
  };

  return poolInfo;
};
