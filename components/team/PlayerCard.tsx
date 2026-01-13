"use client";

import { useState } from "react";
import type { Player } from "@/types/fpl";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface PlayerCardProps {
  player: Player;
  teamShortName: string;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isBench?: boolean;
}

export default function PlayerCard({
  player,
  teamShortName,
  isCaptain,
  isViceCaptain,
  isBench = false,
}: PlayerCardProps) {
  const [imageError, setImageError] = useState(false);

  const getPositionColor = (elementType: number) => {
    switch (elementType) {
      case 1: return { bg: "bg-yellow-500", text: "text-gray-900", border: "border-yellow-500" };
      case 2: return { bg: "bg-blue-500", text: "text-white", border: "border-blue-500" };
      case 3: return { bg: "bg-green-500", text: "text-gray-900", border: "border-green-500" };
      case 4: return { bg: "bg-red-500", text: "text-white", border: "border-red-500" };
      default: return { bg: "bg-gray-500", text: "text-white", border: "border-gray-500" };
    }
  };

  const colors = getPositionColor(player.element_type);
  const playerImageUrl = `/api/player-image/${player.code}`;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center",
        isBench && "opacity-70 scale-90"
      )}
    >
      {/* Captain/VC Badge */}
      {(isCaptain || isViceCaptain) && (
        <div
          className={cn(
            "absolute -top-1 -right-1 z-20 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg",
            isCaptain ? "bg-yellow-500 text-gray-900" : "bg-gray-300 text-gray-900"
          )}
        >
          {isCaptain ? "C" : "V"}
        </div>
      )}

      {/* Player Image */}
      <div className={cn(
        "w-16 h-20 rounded-lg overflow-hidden mb-1 border-2 shadow-lg bg-slate-800",
        colors.border
      )}>
        {!imageError ? (
          <img
            src={playerImageUrl}
            alt={player.web_name}
            className="w-full h-full object-cover object-top"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={cn(
            "w-full h-full flex items-center justify-center",
            colors.bg
          )}>
            <User className={cn("w-8 h-8", colors.text)} />
          </div>
        )}
      </div>

      {/* Player Info Card */}
      <div
        className={cn(
          "bg-slate-900/95 border rounded-lg px-3 py-2 text-center min-w-[90px] shadow-lg",
          isCaptain ? "border-yellow-500 ring-1 ring-yellow-500/50" :
          isViceCaptain ? "border-gray-400 ring-1 ring-gray-400/50" :
          "border-slate-600"
        )}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-white truncate max-w-[85px]">
            {player.web_name}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded font-medium",
              colors.bg,
              colors.text
            )}>
              {teamShortName}
            </span>
            <span className="text-sm font-bold text-green-400">
              {player.event_points}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
