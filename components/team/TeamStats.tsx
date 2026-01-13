"use client";

import { useState } from "react";
import type { Player, Team, Fixture } from "@/types/fpl";
import { TrendingUp, Wallet, Target, Brain, Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

interface TeamStatsProps {
  players: Player[];
  budget: number;
  teamValue: number;
  currentGameWeek: number;
  teams?: Team[];
  fixtures?: Fixture[];
}

export default function TeamStats({
  players,
  budget,
  teamValue,
  currentGameWeek,
  teams = [],
  fixtures = [],
}: TeamStatsProps) {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [lineupSuggestion, setLineupSuggestion] = useState<string | null>(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingLineup, setIsLoadingLineup] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showLineup, setShowLineup] = useState(true);

  const totalPoints = players.reduce((sum, p) => sum + p.event_points, 0);
  const totalValue = players.reduce((sum, p) => sum + p.now_cost, 0);

  const generateTeamAnalysis = async () => {
    setIsLoadingAnalysis(true);
    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "team",
          players,
          teams,
          budget,
          teamValue,
          fixtures,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiAnalysis(data.result);
    } catch (error) {
      console.error("Error generating analysis:", error);
      setAiAnalysis("Failed to generate analysis. Please try again.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  const generateLineupSuggestion = async () => {
    setIsLoadingLineup(true);
    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "lineup",
          players,
          teams,
          fixtures,
          gameweek: currentGameWeek,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setLineupSuggestion(data.result);
    } catch (error) {
      console.error("Error generating lineup:", error);
      setLineupSuggestion("Failed to generate lineup. Please try again.");
    } finally {
      setIsLoadingLineup(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Gameweek Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-white">GAMEWEEK {currentGameWeek}</h3>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Points</span>
            <span className="text-2xl font-bold text-white">{totalPoints}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Bank</span>
            <span className="text-xl font-semibold text-green-500">
              {formatPrice(budget)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">Team Value</span>
            <span className="text-xl font-semibold text-white">
              {formatPrice(totalValue)}
            </span>
          </div>
        </div>
      </div>

      {/* AI Team Analysis */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="flex items-center justify-between w-full mb-4"
        >
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-white">AI TEAM ANALYSIS</h3>
          </div>
          {showAnalysis ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showAnalysis && (
          <>
            {!aiAnalysis ? (
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-4">
                  Get AI-powered insights about your team&apos;s strengths, weaknesses, and areas for improvement.
                </p>
                <button
                  onClick={generateTeamAnalysis}
                  disabled={isLoadingAnalysis}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition-colors"
                >
                  {isLoadingAnalysis ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze My Team
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="whitespace-pre-line text-sm text-gray-300 leading-relaxed">
                    {aiAnalysis}
                  </div>
                </div>
                <button
                  onClick={generateTeamAnalysis}
                  disabled={isLoadingAnalysis}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-gray-300 flex items-center justify-center gap-2 transition-colors"
                >
                  {isLoadingAnalysis ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Regenerate Analysis"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* AI Lineup Suggestion */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <button
          onClick={() => setShowLineup(!showLineup)}
          className="flex items-center justify-between w-full mb-4"
        >
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-white">LINEUP OPTIMIZER</h3>
          </div>
          {showLineup ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showLineup && (
          <>
            {!lineupSuggestion ? (
              <div className="text-center">
                <p className="text-gray-400 text-sm mb-4">
                  Get AI suggestions for your optimal starting 11 and captain choice.
                </p>
                <button
                  onClick={generateLineupSuggestion}
                  disabled={isLoadingLineup}
                  className="w-full py-3 btn-glow rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  {isLoadingLineup ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Target className="w-5 h-5" />
                      Suggest Lineup
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-800/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="whitespace-pre-line text-sm text-gray-300 leading-relaxed">
                    {lineupSuggestion}
                  </div>
                </div>
                <button
                  onClick={generateLineupSuggestion}
                  disabled={isLoadingLineup}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-gray-300 flex items-center justify-center gap-2 transition-colors"
                >
                  {isLoadingLineup ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Regenerate Lineup"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Squad Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
          Squad Breakdown
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-gray-400 text-sm">Goalkeepers</span>
            </div>
            <span className="text-white font-medium">
              {players.filter(p => p.element_type === 1).length}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-400 text-sm">Defenders</span>
            </div>
            <span className="text-white font-medium">
              {players.filter(p => p.element_type === 2).length}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-gray-400 text-sm">Midfielders</span>
            </div>
            <span className="text-white font-medium">
              {players.filter(p => p.element_type === 3).length}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-gray-400 text-sm">Forwards</span>
            </div>
            <span className="text-white font-medium">
              {players.filter(p => p.element_type === 4).length}
            </span>
          </div>
        </div>
      </div>

      {/* Chat Link */}
      <Link
        href="/ai-assistant"
        className="block bg-gradient-to-r from-green-900/30 to-slate-900 border border-green-500/30 rounded-xl p-4 hover:border-green-500/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-white font-semibold">Ask AI Assistant</p>
            <p className="text-xs text-gray-500">Get personalized FPL advice</p>
          </div>
        </div>
      </Link>
    </div>
  );
}
