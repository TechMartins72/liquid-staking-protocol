import { NewMidnightWalletContext } from "@/contextProviders/NewMidnightWalletProvider"
import { useContext } from "react"

const useNewMidnightWallet = () => {
    const context = useContext(NewMidnightWalletContext);
    if (!context) throw new Error("Failed to initialize wallet context");

    return context;
}

export default useNewMidnightWallet;