import { DeployedContractContext } from "@/contextProviders/DeployedContractProvider";
import { useContext } from "react"

const useDeployment = () => {
    const context = useContext(DeployedContractContext);
    if (!context) throw new Error("Failed to initialize wallet context");

    return context;
}

export default useDeployment;