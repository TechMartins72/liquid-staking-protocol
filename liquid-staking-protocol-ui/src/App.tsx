import { useState } from "react";
import Dashboard from "./components/Dashboard";
import Footer from "./components/Footer";
import Header from "./components/Header";
import StakingModal from "./components/StakingModal";
import NotificationCenter from "./components/NotificationCenter";

export type NotificationType = "success" | "error" | null;

function App() {
  const [isStakingOpen, setIsStakingOpen] = useState(false);
  const [notification, setNotification] = useState<{
    type: NotificationType;
    message: string;
  } | null>(null);

  const handleStakeClick = () => setIsStakingOpen(true);

  const handleStakingComplete = (success: boolean, message: string) => {
    setNotification({ type: success ? "success" : "error", message });
    setIsStakingOpen(false);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <>
      <Header />
      <Dashboard onStakeClick={handleStakeClick} />
      <StakingModal
        isOpen={isStakingOpen}
        onClose={() => setIsStakingOpen(false)}
        onComplete={handleStakingComplete}
      />
      <NotificationCenter
        notification={notification}
        onClose={() => setNotification(null)}
      />
      <Footer />
    </>
  );
}

export default App;
