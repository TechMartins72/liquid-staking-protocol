import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./polyfills.ts"
import "./index.css";

import App from "./App.tsx";
import DappContextProvider from "./contextProviders/DappContextProvider.tsx";
import {
  setNetworkId,
  type NetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";

const networkId = import.meta.env.VITE_NETWORK_ID as NetworkId;
setNetworkId(networkId);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DappContextProvider>
      <App />
    </DappContextProvider>
  </StrictMode>
);
