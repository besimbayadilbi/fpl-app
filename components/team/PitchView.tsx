"use client";

import { useMemo } from "react";
import type { Player, Team } from "@/types/fpl";
import PlayerCard from "./PlayerCard";

interface PitchViewProps {
  players: Player[];
  teams: Team[];
  captain: number | null;
  viceCaptain: number | null;
}

export default function PitchView({ players, teams, captain, viceCaptain }: PitchViewProps) {
  // Split players into starting 11 and bench
  // In FPL, the first 11 are starters (ordered by position)
  const { starters, bench, formation } = useMemo(() => {
    const sorted = [...players].sort((a, b) => a.element_type - b.element_type);

    const gks = sorted.filter(p => p.element_type === 1);
    const defs = sorted.filter(p => p.element_type === 2);
    const mids = sorted.filter(p => p.element_type === 3);
    const fwds = sorted.filter(p => p.element_type === 4);

    // Determine likely formation from starting 11
    // Default formation: 1 GK, then based on player positions
    const startingGK = gks.slice(0, 1);
    const startingDefs = defs.slice(0, Math.min(defs.length, 5));
    const startingMids = mids.slice(0, Math.min(mids.length, 5));
    const startingFwds = fwds.slice(0, Math.min(fwds.length, 3));

    // If we have 11 starters, figure out formation
    // For now, assume typical formations
    let defCount = 4, midCount = 4, fwdCount = 2;
    const totalOutfield = startingDefs.length + startingMids.length + startingFwds.length;

    if (totalOutfield >= 10) {
      // Try to detect formation
      if (fwds.length >= 3) {
        defCount = 3; midCount = 4; fwdCount = 3;
      } else if (defs.length >= 5) {
        defCount = 5; midCount = 3; fwdCount = 2;
      } else {
        defCount = 4; midCount = 4; fwdCount = 2;
      }
    }

    const starters = [
      ...startingGK,
      ...defs.slice(0, defCount),
      ...mids.slice(0, midCount),
      ...fwds.slice(0, fwdCount),
    ].slice(0, 11);

    const starterIds = new Set(starters.map(p => p.id));
    const bench = players.filter(p => !starterIds.has(p.id));

    return {
      starters,
      bench,
      formation: `${defCount}-${midCount}-${fwdCount}`,
    };
  }, [players]);

  const getTeamShortName = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    return team?.short_name || "???";
  };

  // Group starters by position for rendering
  const gk = starters.filter(p => p.element_type === 1);
  const def = starters.filter(p => p.element_type === 2);
  const mid = starters.filter(p => p.element_type === 3);
  const fwd = starters.filter(p => p.element_type === 4);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* Pitch */}
      <div className="pitch-gradient relative min-h-[600px] p-4">
        {/* Pitch lines decoration */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white rounded-full" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-b border-l border-r border-white" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-t border-l border-r border-white" />
        </div>

        {/* Players */}
        <div className="relative z-10 flex flex-col items-center gap-4 py-4">
          {/* Forwards */}
          <div className="flex justify-center gap-4 flex-wrap">
            {fwd.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                teamShortName={getTeamShortName(player.team)}
                isCaptain={captain === player.id}
                isViceCaptain={viceCaptain === player.id}
              />
            ))}
          </div>

          {/* Midfielders */}
          <div className="flex justify-center gap-4 flex-wrap mt-6">
            {mid.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                teamShortName={getTeamShortName(player.team)}
                isCaptain={captain === player.id}
                isViceCaptain={viceCaptain === player.id}
              />
            ))}
          </div>

          {/* Defenders */}
          <div className="flex justify-center gap-4 flex-wrap mt-6">
            {def.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                teamShortName={getTeamShortName(player.team)}
                isCaptain={captain === player.id}
                isViceCaptain={viceCaptain === player.id}
              />
            ))}
          </div>

          {/* Goalkeeper */}
          <div className="flex justify-center gap-4 flex-wrap mt-6">
            {gk.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                teamShortName={getTeamShortName(player.team)}
                isCaptain={captain === player.id}
                isViceCaptain={viceCaptain === player.id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bench */}
      <div className="bg-slate-800/50 p-4">
        <h3 className="text-sm font-semibold text-gray-400 text-center mb-4 uppercase tracking-wider">
          Substitutes
        </h3>
        <div className="flex justify-center gap-4 flex-wrap">
          {bench.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              teamShortName={getTeamShortName(player.team)}
              isCaptain={false}
              isViceCaptain={false}
              isBench
            />
          ))}
        </div>
      </div>
    </div>
  );
}
