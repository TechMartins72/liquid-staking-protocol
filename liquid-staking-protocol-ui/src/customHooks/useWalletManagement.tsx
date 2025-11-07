import { useContext, useState } from "react";
import { DAPP_WALLET_STATE } from "../lib/assets";
import { DappContext } from "../contextProviders/DappContextProvider";

const useWalletManagement = () => {
  const { walletState, setWalletState, setNotification } =
    useContext(DappContext)!;

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const handleConnect = async () => {
    if (walletState.connectionSuccess) {
      return;
    }

    setIsConnecting(true);

    try {
      if (window.midnight) {
        const connectorAPI = await window.midnight?.mnLace!.enable();

        const isEnabled = await window.midnight?.mnLace!.isEnabled();
        if (isEnabled) {
          const state = await connectorAPI.state();
          setWalletAddress(state.address);
          console.log({ state });
          setWalletState((prevState) => ({
            ...prevState,
            walletState: state,
            connectionSuccess: true,
          }));
          setNotification({
            type: "success",
            message: "Wallet connected successfully!",
          });
        }
      } else {
        setWalletState((prevState) => ({
          ...prevState,
          connectionError: true,
        }));
        setNotification({
          type: "error",
          message: "Lace wallet not installed",
        });
      }
    } catch (error) {
      console.log("An error occurred:", error);
      setNotification({
        type: "error",
        message: "An error occured. Try again!",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setWalletState(DAPP_WALLET_STATE);
    setNotification({
      type: "success",
      message: "Wallet disconnected successfully!",
    });
  };

  return {
    handleConnect,
    handleDisconnect,
    isConnecting,
    walletAddress,
    walletState,
  };
};

export default useWalletManagement;
