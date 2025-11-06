import { Wallet, Settings, History } from "lucide-react";
import useWalletManagement from "../customHooks/useWalletManagement";

const Header = () => {
  const {
    // error,
    // success,
    handleConnect,
    // handleDisconnect,
    // walletAddress,
    // isConnected,
  } = useWalletManagement();
  const pathname = "/";
  const pathname2 = "/history";

  return (
    <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
            <Wallet className="w-6 h-6 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">LiquidStake</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                pathname === "/"
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground hover:text-accent"
              }`}
            >
              Dashboard
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
                pathname2 === "/history"
                  ? "bg-accent/20 text-accent"
                  : "text-muted-foreground hover:text-accent"
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>

          <button className="p-2 rounded-lg hover:bg-card transition-all cursor-pointer">
            <Settings className="w-5 h-5 text-muted-foreground hover:text-accent transition-all" />
          </button>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-all font-semibold text-sm cursor-pointer"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    </header>
  );
};
export default Header;
