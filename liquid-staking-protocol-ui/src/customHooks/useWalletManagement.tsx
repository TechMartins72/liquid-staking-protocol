import { useState } from "react";

const useWalletManagement = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleConnect = async () => {
    let connected = false;
    let address: string | null = null;

    try {
      const lace = window.midnight?.mnLace;
      if (!lace) {
        setError("Lace wallet not installed");
        return;
      }

      const connectorAPI = await lace.enable();
      const isEnabled = await lace.isEnabled();

      if (isEnabled) {
        connected = true;
        setSuccess("Wallet Connected Successfully!");
        console.log("Connected to the wallet:", connectorAPI);

        const state = await connectorAPI.state();
        address = state.address;
        console.log({ address, state });
      }
    } catch (error) {
      setError("An error occurred, try again!");
    }

    setIsConnected(connected);
    setWalletAddress(address);
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setIsConnected(false);
  };

  return {
    handleConnect,
    handleDisconnect,
    isConnected,
    walletAddress,
    error,
    success,
  };
};

export default useWalletManagement;
