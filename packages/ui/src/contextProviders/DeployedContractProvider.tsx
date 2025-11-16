import useNewMidnightWallet from "@/hooks/useNewMidnight";
import { HydraAPI, hydraStakePrivateStateId, type DeployedHydraAPI, type DerivedHydraStakeContractState, type HydraStakeContractProviders } from "@hydra/hydra-stake-api";
import type { HydraStakePrivateState } from "@hydra/hydra-stake-protocol";
import React, { useEffect, useState, type ReactNode } from "react"


interface DeployedContractContextType {
    contractState: DerivedHydraStakeContractState | undefined;
    deployedHydraAPI: DeployedHydraAPI | undefined;
    privateState: HydraStakePrivateState | undefined;
    isJoining: boolean;
    error: string;
    hasJoined: boolean;
    joinStakePool: (contractAddres: string, providers?: HydraStakeContractProviders) => Promise<void>;
}

export const DeployedContractContext = React.createContext<DeployedContractContextType | null>(null);

const DeployedContractProvider = ({ children }: { children: ReactNode }) => {
    const [contractState, setContractState] = useState<DerivedHydraStakeContractState | undefined>();
    const [deployedHydraAPI, setDeployedHydraAPI] = useState<DeployedHydraAPI | undefined>();
    const [privateState, setPrivateState] = useState<HydraStakePrivateState | undefined>();
    const [isJoining, setIsJoining] = useState(false);
    const [hasJoined, setHasJoined] = useState(false);
    const [error, setError] = useState("")

    /** Use providers from wallet context */
    const walletContext = useNewMidnightWallet();

    const joinStakePool = async (contractAddress: string, providers?: HydraStakeContractProviders) => {
        console.log("Trying to join contract with specified address", contractAddress)
        const providersToUse = providers ?? walletContext.providers;

        if (providersToUse == undefined) throw new Error("Failed to get wallet providers");
        setIsJoining(true);
        try {
            const api = await HydraAPI.joinHydraStakeContract(
                providersToUse,
                contractAddress
            )
            console.log("Deployed api")
            setDeployedHydraAPI(api);
            setIsJoining(false);
            setHasJoined(true);
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            setError(errMsg);
            setIsJoining(false);
        } finally {
            setError("");
            setIsJoining(false)
        }
    }


    const context: DeployedContractContextType = {
        deployedHydraAPI,
        contractState,
        privateState,
        isJoining,
        error,
        hasJoined,
        joinStakePool
    }

    useEffect(() => {
        if (!deployedHydraAPI) return;

        const state = deployedHydraAPI.state.subscribe((state) => {
            setContractState(state);
            console.log(`Current state ${state}`)
        })

        return () => state.unsubscribe();

    }, [deployedHydraAPI])

    useEffect(() => {
        if (!deployedHydraAPI && !walletContext.providers) {
            console.log("Failed to retrieve contract api");
            return;
        };

        (async function getPrivateState() {
            const storedPrivateState = await walletContext.providers?.privateStateProvider.get(hydraStakePrivateStateId);

            if (!storedPrivateState) return;

            setPrivateState(storedPrivateState);
        })();

    }, [hasJoined, deployedHydraAPI]);



    return <DeployedContractContext.Provider value={context}>
        {children}
    </DeployedContractContext.Provider>
}


export default DeployedContractProvider;