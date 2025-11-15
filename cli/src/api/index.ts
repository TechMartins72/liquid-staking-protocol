import { combineLatest, concat, firstValueFrom, from, map, Observable, tap } from "rxjs";
import {
  DeployedHydraStakingOnchainContract,
  DerivedHydraStakingContractState,
  HydraStakingContract,
  HydraStakingContractProviders,
  HydraStakePrivateStateId,
  DeploymentParams,
} from "./common-types.js";
import {
  ContractAddress,
  encodeCoinPublicKey,
  encodeContractAddress,
} from "@midnight-ntwrk/compact-runtime";
import {
  deployContract,
  FinalizedCallTxData,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import {
  Contract,
  ledger,
  HydraStakePrivateState,
  witnesses,
  type CoinInfo,
  createHydraStakePrivateState,
} from "../../../contract/liquid-staking-contract/dist/index.js";
import { type Logger } from "pino";
import * as utils from "./utils.js";
import {
  encodeTokenType,
  nativeToken,
  tokenType,
} from "@midnight-ntwrk/ledger";

const HydraStakingContractInstance: HydraStakingContract = new Contract(witnesses);

export interface DeployedHydraStakeAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state: Observable<DerivedHydraStakingContractState>;
  readonly scaleFator$: Observable<number>;
}


export class HydraStakeAPI implements DeployedHydraStakeAPI {
  deployedContractAddress: string;
  state: Observable<DerivedHydraStakingContractState>;
  scaleFator$: Observable<number>
  /**
   * @param allReadyDeployedContract
   * @param logger becomes accessible s if they were decleared as static properties as part of the class
   */
  private constructor(
    providers: HydraStakingContractProviders,
    public readonly allReadyDeployedContract: DeployedHydraStakingOnchainContract,
    private logger?: Logger
  ) {
    this.deployedContractAddress =
      allReadyDeployedContract.deployTxData.public.contractAddress;

    // Set the state property
    this.state = combineLatest(
      [
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddress, {
            type: "all",
          })
          .pipe(
            map((contractState) => ledger(contractState.data)),
            tap((ledgerState) =>
              logger?.trace({
                ledgerStaeChanged: {
                  ledgerState: {
                    ...ledgerState,
                  },
                },
              })
            )
          ),
        concat(from(providers.privateStateProvider.get(HydraStakePrivateStateId))),
      ],
      (ledgerState, privateState) => {
        return {
          scaleFactor: ledgerState.SCALE_FACTOR,
          admins: ledgerState.admins,
          protocolTVL: ledgerState.protocolTVL,
          stAssetCoinColor: utils.uint8arraytostring(ledgerState.stAssetCoinColor),
          stakePoolStatus: ledgerState.stakePoolStatus,
          stakings: ledgerState.stakings,
          total_rewards_accrued: ledgerState.total_rewards_accrued,
          total_stAsset_Minted: ledgerState.total_stAsset_Minted,
          total_stake_withdrawn: ledgerState.total_stake_withdrawn,
          validAssetCoinType: utils.uint8arraytostring(ledgerState.validAssetCoinType)
        };
      }
    );

    this.scaleFator$ = this.state.pipe(
      map((state) => Number(state.scaleFactor)) 
    )
  }

  static async deployHydraStakingContract(
    providers: HydraStakingContractProviders,
    deploymentParams: DeploymentParams,
    logger?: Logger
  ): Promise<HydraStakeAPI> {
    logger?.info("deploy contract");
    /**
     * Should deploy a new contract to the blockchain
     * Return the newly deployed contract
     * Log the resulting data about of the newly deployed contract using (logger)
     */
    const deployedContract = await deployContract<HydraStakingContract>(providers, {
      contract: HydraStakingContractInstance,
      initialPrivateState: await HydraStakeAPI.getPrivateState(providers),
      privateStateId: HydraStakePrivateStateId,
      args: [
        utils.randomNonceBytes(32),
        encodeTokenType(nativeToken()),
        utils.pad(deploymentParams.stDomainSeperator, 32),
        encodeContractAddress(deploymentParams.delegationContractAddress),
        BigInt(deploymentParams.scaleFactor)
      ],
    });

    logger?.trace({
      message: "Deployment successfull",
      contractDeployed: {
        finalizedDeployTxData: deployedContract.deployTxData.public,
      },
    });

    return new HydraStakeAPI(providers, deployedContract, logger);
  }

  static async joinHydraStakingContract(
    providers: HydraStakingContractProviders,
    contractAddress: string,
    logger?: Logger
  ): Promise<HydraStakeAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });
    /**
     * Should deploy a new contract to the blockchain
     * Return the newly deployed contract
     * Log the resulting data about of the newly deployed contract using (logger)
     */
    const existingContract = await findDeployedContract<HydraStakingContract>(
      providers,
      {
        contract: HydraStakingContractInstance,
        contractAddress: contractAddress,
        privateStateId: HydraStakePrivateStateId,
        initialPrivateState: await HydraStakeAPI.getPrivateState(providers),
      }
    );

    logger?.trace({
      message: "Found contract sucessfully",
      contractJoined: {
        finalizedDeployTxData: existingContract.deployTxData.public,
      },
    });
    return new HydraStakeAPI(providers, existingContract, logger);
  }

  coin(amount: number): CoinInfo {
    return {
      color: encodeTokenType(nativeToken()),
      nonce: utils.randomNonceBytes(32),
      value: BigInt(amount),
    };
  }

  stCoin(amount: number): CoinInfo {
    return {
      color: encodeTokenType(
        tokenType(utils.pad("hydra:htDUST", 32), this.deployedContractAddress)
      ),
      nonce: utils.randomNonceBytes(32),
      value: BigInt(amount),
    };
  }

  async stake(amount: number){
    const scaleFactor = await firstValueFrom(this.scaleFator$);console.log(
  this.allReadyDeployedContract.callTx.stake.toString()
);

    const txData = await this.allReadyDeployedContract.callTx.stake(this.coin(
      amount * 1_000_000
    ));

    this.logger?.trace({
      message: `Staked ${amount} tokens succesfully`,
      transationDetails: {
        blockHash: txData.public.blockHash,
        blockHeight: txData.public.blockHash,
      }
    })
  }

  async redeem(amount: number){
    const scaleFactor = await firstValueFrom(this.scaleFator$);
    const txData = await this.allReadyDeployedContract.callTx.redeem(this.stCoin(
      amount * scaleFactor
    ));

    this.logger?.trace({
      message: `Redeemed ${amount} tokens succesfully`,
      transationDetails: {
        blockHash: txData.public.blockHash,
        blockHeight: txData.public.blockHash,
      }
    })
  }

  async delegate(){
    const txData = await this.allReadyDeployedContract.callTx.delegate();

    this.logger?.trace({
      message: `Delegated tokens succesfully`,
      transationDetails: {
        blockHash: txData.public.blockHash,
        blockHeight: txData.public.blockHash,
      }
    })
  }

  async recieveDelegateRewards(amount: number){
    const scaleFactor = await firstValueFrom(this.scaleFator$);
    const txData = await this.allReadyDeployedContract.callTx.recieveDelegateReward(this.coin(
      amount * scaleFactor
    ));

    this.logger?.trace({
      message: `Recieve ${amount} tokens as delegate reward succesfully`,
      transationDetails: {
        blockHash: txData.public.blockHash,
        blockHeight: txData.public.blockHash,
      }
    })
  }

  async setTokenType(){
    const txData = await this.allReadyDeployedContract.callTx.setTokenColor();

    this.logger?.trace({
      message: `Set token color succesfully`,
      transationDetails: {
        blockHash: txData.public.blockHash,
        blockHeight: txData.public.blockHash,
      }
    })
  }


  // Used to get the private state from the wallets privateState Provider
  private static async getPrivateState(
    providers: HydraStakingContractProviders
  ): Promise<HydraStakePrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(
      HydraStakePrivateStateId
    );
    return (
      existingPrivateState ?? {
        secretKey: createHydraStakePrivateState(utils.randomNonceBytes(32))
          .secretKey,
        stakeMetadata: {
          deposit_amount: BigInt(0),
          redeemable: BigInt(0),
          stAssets_minted: BigInt(0)
        },
      }
    );
  }
}

export * as utils from "./utils.js";

export * from "./common-types.js";