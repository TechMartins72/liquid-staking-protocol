import {
  createContext,
  useState,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
} from "react";
import type { DappWalletState, NotificationType } from "../lib/types";
import { DAPP_WALLET_STATE } from "../lib/assets";

export const DappContext = createContext<DappConfigType | null>(null);

type routes = "dashboard" | "history" | "stakedetails";

interface DappConfigType {
  walletState: DappWalletState;
  setWalletState: Dispatch<SetStateAction<DappWalletState>>;
  notification: {
    type: NotificationType;
    message: string;
  } | null;
  setNotification: Dispatch<
    SetStateAction<{
      type: NotificationType;
      message: string;
    } | null>
  >;
  route: routes;
  setRoute: Dispatch<SetStateAction<routes>>;
}

const DappContextProvider: React.FC<Readonly<PropsWithChildren>> = ({
  children,
}) => {
  const [route, setRoute] = useState<routes>("dashboard");
  const [walletState, setWalletState] =
    useState<DappWalletState>(DAPP_WALLET_STATE);
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
  } | null>(null);

  const value: DappConfigType = {
    walletState,
    setWalletState,
    notification,
    setNotification,
    route,
    setRoute,
  };

  return <DappContext.Provider value={value}>{children}</DappContext.Provider>;
};

export default DappContextProvider;
