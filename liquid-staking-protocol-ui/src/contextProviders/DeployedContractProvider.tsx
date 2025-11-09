import type { DerivedState } from "@/lib/common-types";
import {
  LiquidStakingDeployedApi,
  type DeployedLiquidStakingAPI,
} from "@/lib/deploymentAction";
import type { LiquidStakingPrivateState } from "@repo/liquid-staking-protocol-contract";
import type { Logger } from "pino";
import {
  createContext,
  useContext,
  useState,
  type PropsWithChildren,
} from "react";
import { MidnightWalletContext } from "./MidnightWalletProvider";
import { DappContext } from "./DappContextProvider";

export interface DeploymentProvider {
  readonly privateState: LiquidStakingPrivateState | null;
  readonly isJoining: boolean;
  readonly hasJoined: boolean;
  readonly liquidStakingApi: DeployedLiquidStakingAPI | undefined;
  readonly contractState: DerivedState | undefined;
  //   onJoinContract: () => Promise<void>;
  onDeployContract: () => Promise<void>;
  //   clearError: () => void;
}

export const DeployedContractContext = createContext<DeploymentProvider | null>(
  null
);

interface DeployedContractProviderProps extends PropsWithChildren {
  logger?: Logger;
  contractAddress?: string;
}

export const DeployedContractProvider = ({
  children,
  logger,
  //   contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS,
}: DeployedContractProviderProps) => {
  const [liquidStakingApi, setLiquidStakingApi] = useState<
    DeployedLiquidStakingAPI | undefined
  >(undefined);
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [contractState, setContractState] = useState<DerivedState | undefined>(
    undefined
  );
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [privateState, setPrivateState] =
    useState<LiquidStakingPrivateState | null>(null);
  //   const [userRole, setUserRole] = useState<"admin" | "user">("user");

  // Use the custom hook instead of useContext directly
  const { hasConnected, providers } = useContext(MidnightWalletContext)!;
  const { setNotification } = useContext(DappContext)!;

  const onDeployContract = async () => {
    if (isJoining || hasJoined) return;

    // Validate requirements
    if (!hasConnected) {
      setNotification({
        type: "error",
        message: "Wallet must be connected before joining contract",
      });
      return;
    }

    if (!providers) {
      setNotification({
        type: "error",
        message: "Provider not configured",
      });
      return;
    }

    setIsJoining(true);
    setNotification(null);

    try {
      console.log("deploying contract now...");
      const deployedAPI =
        await LiquidStakingDeployedApi.deployContract(providers);

      setLiquidStakingApi(deployedAPI);
      setNotification({
        type: "success",
        message: "Contract Deployed Successfully",
      });
      setHasJoined(true);
      logger?.info({ contractAddress: deployedAPI?.deployedContractAddress });
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "Failed to deploy contract";
      setNotification({
        type: "error",
        message: "An error occured",
      });
      logger?.error("Failed to deploy contract" + errMsg);
    } finally {
      setIsJoining(false);
    }
  };

  //   const onJoinContract = async () => {
  //     if (isJoining || hasJoined) return;

  //     // Validate requirements
  //     if (!hasConnected) {
  //       setNotification({
  //         type: "error",
  //         message: "Wallet must be connected before joining contract",
  //       });
  //       return;
  //     }

  //     if (!contractAddress) {
  //       setNotification({
  //         type: "error",
  //         message: "Contract address not configured",
  //       });
  //       return;
  //     }

  //     setIsJoining(true);
  //     setNotification(null);

  //     try {
  //       const deployedAPI = await LiquidStakingDeployedApi.joinContract(
  //         walletProvider,
  //         contractAddress,
  //         logger
  //       );

  //       setStateraApi(deployedAPI);
  //       toast.success("Onboarded successfully");
  //       setHasJoined(true);
  //       logger?.info("Successfully joined contract", { contractAddress });
  //     } catch (error) {
  //       const errMsg =
  //         error instanceof Error
  //           ? error.message
  //           : `Failed to join contract at ${contractAddress}`;
  //       setNotification(errMsg);
  //       toast.error(errMsg);
  //       logger?.error("Failed to join contract", {
  //         error: errMsg,
  //         contractAddress,
  //       });
  //     } finally {
  //       setIsJoining(false);
  //     }
  //   };

  //   const clearError = useCallback(() => {
  //     setNotification(null);
  //   }, []);

  //   useEffect(() => {
  //     if (!stateraApi) return;

  //     const stateSubscription = stateraApi.state.subscribe(setContractState);

  //     return () => stateSubscription.unsubscribe();
  //   }, [stateraApi]);

  //   useEffect(() => {
  //     if (!stateraApi && !walletContext) return;
  //     (async function fetchPrivateState() {
  //       const userPrivateState = await walletContext?.privateStateProvider.get(
  //         "LiquidStakingPrivateState"
  //       );

  //       if (userPrivateState) {
  //         setPrivateState(userPrivateState);
  //       } else return;
  //     })();
  //   }, [walletContext?.privateStateProvider, contractState]);

  //   useEffect(() => {
  //     if (!contractState) return;

  //     const walletAddressHex = parseCoinPublicKeyToHex(
  //       walletContext?.state.coinPublicKey as string,
  //       getZswapNetworkId()
  //     );

  //     const role =
  //       decodeCoinPublicKey(contractState.super_admin) == walletAddressHex ||
  //       contractState.admins.findIndex(
  //         (admin) => decodeCoinPublicKey(admin) == walletAddressHex
  //       ) != -1
  //         ? "admin"
  //         : "user";

  //     console.log("USER ROLE:", role);

  //     setUserRole(role);
  //   }, [stateraApi, contractState]);

  const contextValue: DeploymentProvider = {
    isJoining,
    hasJoined,
    liquidStakingApi,
    onDeployContract,
    // clearError,
    contractState,
    privateState,
  };

  return (
    <DeployedContractContext.Provider value={contextValue}>
      {children}
    </DeployedContractContext.Provider>
  );
};
