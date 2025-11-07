import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import DappContextProvider from "./contextProviders/DappContextProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DappContextProvider>
      <App />
    </DappContextProvider>
  </StrictMode>
);
