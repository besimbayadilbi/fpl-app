"use client";

import { useState } from "react";
import type { Player } from "@/types/fpl";
import { cn } from "@/lib/utils";
import { User, Info } from "lucide-react";

interface TransferCardProps {
  playerOut: Player;
  playerIn: Player;
  playerOutTeam: string;
  playerInTeam: string;
  expectedGain: number;
  metrics: {
    base: number;
    mins: number;
    fixt: number;
    form: number;
  };
  rank: number;
  gameweek?: number;
}

const metricExplanations = {
  base: "Base Score: Expected points based on historical performance and points per game",
  mins: "Minutes: Playing time reliability - higher means more consistent starts",
  fixt: "Fixtures: Upcoming fixture difficulty - green means easier opponents",
  form: "Form: Recent performance trend over the last few gameweeks",
};

export default function TransferCard({
  playerOut,
  playerIn,
  playerOutTeam,
  playerInTeam,
  expectedGain,
  metrics,
  rank,
  gameweek,
}: TransferCardProps) {
  const [imageErrorOut, setImageErrorOut] = useState(false);
  const [imageErrorIn, setImageErrorIn] = useState(false);
  const [showMetricInfo, setShowMetricInfo] = useState<string | null>(null);

  const getMetricColor = (value: number) => {
    if (value >= 70) return "bg-green-500";
    if (value >= 50) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const formatPrice = (price: number) => `£${(price / 10).toFixed(1)}m`;

  return (
    <div className="transfer-card relative">
      {/* ETV Badge */}
      <div className="absolute -top-2 -right-2 bg-green-500 text-gray-900 px-2 py-1 rounded-md text-sm font-bold z-10">
        +{expectedGain.toFixed(1)} ETV
      </div>

      {/* Gameweek Badge */}
      {gameweek && (
        <div className="absolute -top-2 -left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-bold z-10">
          GW{gameweek}
        </div>
      )}

      {/* Rank */}
      <div className="absolute top-2 left-2 text-xs text-gray-500 font-semibold">
        #{rank}
      </div>

      {/* Players */}
      <div className="flex items-center justify-between mb-4 pt-4">
        {/* Player Out */}
        <div className="text-center flex-1">
          <p className="text-xs text-red-400 font-semibold mb-2">OUT</p>
          <div className="w-14 h-16 mx-auto mb-2 rounded-lg overflow-hidden border-2 border-red-500/50 bg-slate-800">
            {!imageErrorOut ? (
              <img
                src={`/api/player-image/${playerOut.code}`}
                alt={playerOut.web_name}
                className="w-full h-full object-cover object-top"
                onError={() => setImageErrorOut(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-red-500/20">
                <User className="w-6 h-6 text-red-400" />
              </div>
            )}
          </div>
          <p className="text-white font-semibold text-sm">{playerOut.web_name}</p>
          <p className="text-xs text-gray-500">{playerOutTeam}</p>
          <p className="text-xs text-red-400">{formatPrice(playerOut.now_cost)}</p>
        </div>

        {/* Arrow */}
        <div className="text-gray-600 text-2xl px-2">→</div>

        {/* Player In */}
        <div className="text-center flex-1">
          <p className="text-xs text-green-400 font-semibold mb-2">IN</p>
          <div className="w-14 h-16 mx-auto mb-2 rounded-lg overflow-hidden border-2 border-green-500/50 bg-slate-800">
            {!imageErrorIn ? (
              <img
                src={`/api/player-image/${playerIn.code}`}
                alt={playerIn.web_name}
                className="w-full h-full object-cover object-top"
                onError={() => setImageErrorIn(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-green-500/20">
                <User className="w-6 h-6 text-green-400" />
              </div>
            )}
          </div>
          <p className="text-white font-semibold text-sm">{playerIn.web_name}</p>
          <p className="text-xs text-gray-500">{playerInTeam}</p>
          <p className="text-xs text-green-400">{formatPrice(playerIn.now_cost)}</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2 group relative">
            <span className="text-xs text-gray-500 w-10 capitalize cursor-help"
              onMouseEnter={() => setShowMetricInfo(key)}
              onMouseLeave={() => setShowMetricInfo(null)}
            >
              {key}
            </span>
            <div className="flex-1 metric-bar">
              <div
                className={cn("metric-bar-fill", getMetricColor(value))}
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 w-8 text-right">{value}</span>

            {/* Tooltip */}
            {showMetricInfo === key && (
              <div className="absolute left-0 bottom-full mb-2 bg-slate-800 border border-slate-600 rounded-lg p-2 text-xs text-gray-300 w-48 z-20 shadow-lg">
                {metricExplanations[key as keyof typeof metricExplanations]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cost difference */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Cost Difference:</span>
          <span className={cn(
            "font-semibold",
            playerIn.now_cost > playerOut.now_cost ? "text-red-400" : "text-green-400"
          )}>
            {playerIn.now_cost > playerOut.now_cost ? "+" : ""}
            {formatPrice(playerIn.now_cost - playerOut.now_cost)}
          </span>
        </div>
      </div>
    </div>
  );
}
