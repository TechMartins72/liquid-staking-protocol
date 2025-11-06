import type React from "react";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

export default function StatsCard({
  title,
  value,
  change,
  icon,
}: StatsCardProps) {
  return (
    <div className="glass glass-hover rounded-2xl p-6 border border-border/50 group transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-all">
          {icon}
        </div>
        <span className="text-sm font-semibold text-accent">{change}</span>
      </div>
      <h3 className="text-muted-foreground text-sm mb-2">{title}</h3>
      <p className="text-2xl md:text-3xl font-bold text-foreground">{value}</p>
    </div>
  );
}
