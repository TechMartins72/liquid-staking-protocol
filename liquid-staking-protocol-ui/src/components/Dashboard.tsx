import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Zap, Lock, ArrowUpRight } from "lucide-react";
import StatsCard from "./StatsCard";
import { useContext } from "react";
import { DappContext } from "../contextProviders/DappContextProvider";
import { MidnightWalletContext } from "@/contextProviders/MidnightWalletProvider";

interface DashboardProps {
  onStakeClick: () => void;
}

const stakingData = [
  { month: "Jan", amount: 4000 },
  { month: "Feb", amount: 5200 },
  { month: "Mar", amount: 6800 },
  { month: "Apr", amount: 7400 },
  { month: "May", amount: 8900 },
  { month: "Jun", amount: 9800 },
];

const rewardsData = [
  { day: "Mon", rewards: 120 },
  { day: "Tue", rewards: 150 },
  { day: "Wed", rewards: 140 },
  { day: "Thu", rewards: 180 },
  { day: "Fri", rewards: 200 },
  { day: "Sat", rewards: 190 },
  { day: "Sun", rewards: 220 },
];

const Dashboard = ({ onStakeClick }: DashboardProps) => {
  const { setNotification } = useContext(DappContext)!;
  const {
    state: { hasConnected },
  } = useContext(MidnightWalletContext)!;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="glass glass-hover rounded-2xl p-8 border border-border/50">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-linear-to-r from-foreground to-accent bg-clip-text text-transparent mb-2">
                  Welcome Back
                </h1>
                <p className="text-muted-foreground text-lg">
                  Maximize your crypto returns with our liquid staking protocol
                </p>
              </div>
              <button
                onClick={() => {
                  hasConnected
                    ? onStakeClick()
                    : setNotification({
                        type: "error",
                        message: "Connect wallet to stake",
                      });
                }}
                className="px-8 py-3 bg-accent text-accent-foreground rounded-xl font-semibold hover:shadow-lg hover:glow-accent-hover transition-all duration-300 flex items-center gap-2 whitespace-nowrap cursor-pointer"
              >
                <Zap className="w-5 h-5" />
                Start Staking
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total Staked"
              value="245.82 tDUST"
              change="+12.5%"
              icon={<Lock className="w-5 h-5 text-accent" />}
            />
            <StatsCard
              title="Est. Annual Yield"
              value="18.4%"
              change="+2.1%"
              icon={<TrendingUp className="w-5 h-5 text-accent" />}
            />
            <StatsCard
              title="Total Rewards"
              value="12.48 tDUST"
              change="+8.3%"
              icon={<ArrowUpRight className="w-5 h-5 text-accent" />}
            />
            <StatsCard
              title="Validator Count"
              value="48"
              change="+5"
              icon={<Zap className="w-5 h-5 text-accent" />}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Staking Growth Chart */}
            <div className="glass glass-hover rounded-2xl p-6 border border-border/50">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent glow-accent" />
                Staking Growth
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stakingData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0, 217, 255, 0.1)"
                  />
                  <XAxis stroke="rgba(232, 232, 255, 0.5)" />
                  <YAxis stroke="rgba(232, 232, 255, 0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0A4D",
                      border: "1px solid rgba(0, 217, 255, 0.3)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#E8E8FF" }}
                  />
                  <Bar dataKey="amount" fill="#00D9FF" radius={8} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Rewards Over Time */}
            <div className="glass glass-hover rounded-2xl p-6 border border-border/50">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent glow-accent" />
                Weekly Rewards
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={rewardsData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0, 217, 255, 0.1)"
                  />
                  <XAxis stroke="rgba(232, 232, 255, 0.5)" />
                  <YAxis stroke="rgba(232, 232, 255, 0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0A4D",
                      border: "1px solid rgba(0, 217, 255, 0.3)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#E8E8FF" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rewards"
                    stroke="#00D9FF"
                    dot={{ fill: "#00D9FF", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
