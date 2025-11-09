import { useContext, useState } from "react";
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer";
import Header from "./components/Header";
import StakingModal from "./components/StakingModal";
import NotificationCenter from "./components/NotificationCenter";
import { DappContext } from "./contextProviders/DappContextProvider";
import HistoryPage from "./components/History";
import StakeDetailPage from "./components/StakeDetails";
import { MidnightWalletContext } from "./contextProviders/MidnightWalletProvider";
import { DeployedContractProvider } from "./contextProviders/DeployedContractProvider";
import UnauthenticatedPage from "./components/UnauthenticatedPage";

function App() {
  const { notification, setNotification, route } = useContext(DappContext)!;
  const { hasConnected } = useContext(MidnightWalletContext)!;
  const [isStakingOpen, setIsStakingOpen] = useState(false);

  const handleStakeClick = () => setIsStakingOpen(true);

  const handleStakingComplete = (success: boolean, message: string) => {
    setNotification({ type: success ? "success" : "error", message });
    setIsStakingOpen(false);
    setTimeout(() => setNotification(null), 4000);
  };

  return hasConnected ? (
    <DeployedContractProvider>
      <>
        <Header />
        {route === "dashboard" && <Dashboard onStakeClick={handleStakeClick} />}
        {route === "history" && <HistoryPage />}
        {route === "stakedetails" && <StakeDetailPage />}
        <StakingModal
          isOpen={isStakingOpen}
          onClose={() => setIsStakingOpen(false)}
          onComplete={handleStakingComplete}
        />
        <NotificationCenter notification={notification} />
        <Footer />
      </>
    </DeployedContractProvider>
  ) : (
    <>
      <UnauthenticatedPage />
      <NotificationCenter notification={notification} />
    </>
  );
}

export default App;
