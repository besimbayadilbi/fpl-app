"use client";

import { useState, useMemo, useEffect } from "react";
import type { Player, Team, TransferPlan, Transfer, Fixture } from "@/types/fpl";
import { Settings2, TrendingUp, ArrowRightLeft, Info, Target, AlertTriangle, Sparkles, RefreshCw, Bot } from "lucide-react";
import TransferCard from "./TransferCard";
import { formatPrice, getPositionName } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TransferPlannerProps {
  teamPlayers: Player[];
  allPlayers: Player[];
  teams: Team[];
  budget: number;
  fixtures?: Fixture[];
}

interface TransferSuggestion {
  playerOut: Player;
  playerIn: Player;
  expectedGain: number;
  metrics: {
    base: number;
    mins: number;
    fixt: number;
    form: number;
  };
}

interface ExtendedTransferPlan extends TransferPlan {
  priorityTeams?: string[];
  avoidTeams?: string[];
  currentGameweek?: number;
  horizonEnd?: number;
  topPicks?: {
    midfielders: { id: number; name: string; team: string; form: string; price: number }[];
    forwards: { id: number; name: string; team: string; form: string; price: number }[];
    defenders: { id: number; name: string; team: string; form: string; price: number }[];
  };
}

export default function TransferPlanner({
  teamPlayers,
  allPlayers,
  teams,
  budget,
  fixtures = [],
}: TransferPlannerProps) {
  const [horizon, setHorizon] = useState(3);
  const [freeTransfers, setFreeTransfers] = useState(1);
  const [riskAppetite, setRiskAppetite] = useState(50);
  const [allowHits, setAllowHits] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [transferPlan, setTransferPlan] = useState<ExtendedTransferPlan | null>(null);
  const [aiStrategy, setAiStrategy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showMetricInfo, setShowMetricInfo] = useState(false);

  // Generate AI strategy
  const generateAIStrategy = async () => {
    setIsAILoading(true);
    setError(null);

    try {
      const riskLevel = riskAppetite < 40 ? "low" : riskAppetite > 60 ? "high" : "medium";

      const response = await fetch("/api/ai-strategy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          players: teamPlayers,
          budget,
          freeTransfers,
          horizon,
          riskAppetite: riskLevel,
          allowHits,
          teams,
          fixtures,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setAiStrategy(data.strategy);
    } catch (err) {
      console.error("Error generating AI strategy:", err);
      setError("Failed to generate AI strategy. Please try again.");
    } finally {
      setIsAILoading(false);
    }
  };

  // Generate fixture-based plan
  const generateTransferPlan = async () => {
    setIsLoading(true);
    setTransferPlan(null);
    setError(null);

    try {
      const response = await fetch("/api/transfers/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId: 123,
          horizon,
          freeTransfers,
          riskAppetite,
          allowHits,
          teamPlayerIds: teamPlayers.map(p => p.id),
          budget,
        }),
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data: ExtendedTransferPlan = await response.json();
      setTransferPlan(data);
    } catch (err) {
      console.error("Error generating transfer plan:", err);
      setError("Failed to generate transfer plan. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate both plans
  const generatePlans = async () => {
    await Promise.all([generateTransferPlan(), generateAIStrategy()]);
  };

  // Generate transfer suggestions
  const suggestions = useMemo(() => {
    const teamPlayerIds = new Set(teamPlayers.map(p => p.id));
    const teamTeams = teamPlayers.reduce((acc, p) => {
      acc[p.team] = (acc[p.team] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const results: TransferSuggestion[] = [];

    teamPlayers.forEach(playerOut => {
      const availableBudget = budget + playerOut.now_cost;

      const candidates = allPlayers
        .filter(p => {
          if (p.element_type !== playerOut.element_type) return false;
          if (teamPlayerIds.has(p.id)) return false;
          if (p.now_cost > availableBudget) return false;
          const sameTeamCount = teamTeams[p.team] || 0;
          if (p.team !== playerOut.team && sameTeamCount >= 3) return false;
          if (p.status !== 'a' && p.status !== 'd') return false;
          return true;
        })
        .slice(0, 100);

      candidates.forEach(playerIn => {
        const formDiff = (parseFloat(playerIn.form) || 0) - (parseFloat(playerOut.form) || 0);
        const ppgDiff = (parseFloat(playerIn.points_per_game) || 0) - (parseFloat(playerOut.points_per_game) || 0);

        const baseScore = Math.min(100, Math.max(0, 50 + ppgDiff * 10));
        const minsScore = playerIn.status === 'a' ? 80 : 40;
        const fixtScore = 70;
        const formScore = Math.min(100, Math.max(0, 50 + formDiff * 20));

        const expectedGain = (baseScore * 0.3 + minsScore * 0.2 + fixtScore * 0.2 + formScore * 0.3) / 10;

        if (expectedGain > 5) {
          results.push({
            playerOut,
            playerIn,
            expectedGain,
            metrics: {
              base: baseScore,
              mins: minsScore,
              fixt: fixtScore,
              form: formScore,
            },
          });
        }
      });
    });

    return results
      .sort((a, b) => b.expectedGain - a.expectedGain)
      .slice(0, 9);
  }, [teamPlayers, allPlayers, budget]);

  const getTeamShortName = (teamId: number) => {
    return teams.find(t => t.id === teamId)?.short_name || "???";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Configuration Panel */}
      <div className="lg:col-span-1">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-24">
          <div className="flex items-center gap-2 mb-6">
            <Settings2 className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-white">CONFIGURATION</h3>
          </div>

          <div className="space-y-6">
            {/* Prediction Horizon */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Prediction Horizon ({horizon} GWs)
              </label>
              <input
                type="range"
                min="1"
                max="6"
                value={horizon}
                onChange={(e) => setHorizon(parseInt(e.target.value))}
                className="w-full accent-green-500"
              />
            </div>

            {/* Free Transfers */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Free Transfers ({freeTransfers})
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={freeTransfers}
                onChange={(e) => setFreeTransfers(parseInt(e.target.value))}
                className="w-full accent-green-500"
              />
            </div>

            {/* Risk Appetite */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Risk Appetite ({riskAppetite < 40 ? "Safe" : riskAppetite > 60 ? "Risky" : "Balanced"})
              </label>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Safe</span>
                <span>Risky</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={riskAppetite}
                onChange={(e) => setRiskAppetite(parseInt(e.target.value))}
                className="w-full accent-green-500"
              />
            </div>

            {/* Allow Hits */}
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-400">Allow Hits (-4)</label>
              <button
                onClick={() => setAllowHits(!allowHits)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  allowHits ? "bg-green-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    allowHits ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            {/* Generate Button */}
            <button
              onClick={generatePlans}
              disabled={isLoading || isAILoading}
              className="w-full py-3 btn-glow rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              {isLoading || isAILoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>{isAILoading ? "AI Analyzing..." : "Loading..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>GENERATE PLANS</span>
                </>
              )}
            </button>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </div>

          {/* Metrics Legend */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <button
              onClick={() => setShowMetricInfo(!showMetricInfo)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
            >
              <Info className="w-4 h-4" />
              <span>What do metrics mean?</span>
            </button>

            {showMetricInfo && (
              <div className="mt-4 space-y-3 text-xs">
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-green-400 font-semibold mb-1">ETV (Expected Transfer Value)</p>
                  <p className="text-gray-400">Combined score predicting point gain from making a transfer. Higher is better.</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-blue-400 font-semibold mb-1">Base</p>
                  <p className="text-gray-400">Historical points per game baseline. Shows consistent performers.</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-yellow-400 font-semibold mb-1">Mins</p>
                  <p className="text-gray-400">Playing time reliability. Higher means more likely to start.</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-purple-400 font-semibold mb-1">Fixt</p>
                  <p className="text-gray-400">Upcoming fixture difficulty. Higher means easier opponents ahead.</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-orange-400 font-semibold mb-1">Form</p>
                  <p className="text-gray-400">Recent performance trend over the last few gameweeks.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Suggestions */}
      <div className="lg:col-span-3">
        {/* AI Strategy */}
        {aiStrategy && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-green-500" />
                <h2 className="text-2xl font-bold text-white">AI TRANSFER STRATEGY</h2>
              </div>
              <button
                onClick={generateAIStrategy}
                disabled={isAILoading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm text-gray-300 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isAILoading ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            </div>

            <div className="bg-gradient-to-br from-green-900/20 to-slate-900 border border-green-500/30 rounded-xl p-6">
              <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2 text-gray-200" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-base font-bold mt-3 mb-2 text-gray-200" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-sm font-semibold mt-3 mb-1 text-gray-300" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2 text-gray-300" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1 text-gray-300" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1 text-gray-300" {...props} />,
                    li: ({node, ...props}) => <li className="text-gray-300" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-semibold text-gray-200" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                  }}
                >
                  {aiStrategy}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* Fixture-Based Plan */}
        {transferPlan && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-white">FIXTURE ANALYSIS</h2>
            </div>

            {/* Priority Teams */}
            {transferPlan.priorityTeams && transferPlan.priorityTeams.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <h3 className="text-sm font-semibold text-green-400">PRIORITY TEAMS</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {transferPlan.priorityTeams.map((team: string) => (
                      <span key={team} className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm font-medium">
                        {team}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Easiest fixtures through GW{transferPlan.horizonEnd}</p>
                </div>

                {transferPlan.avoidTeams && transferPlan.avoidTeams.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <h3 className="text-sm font-semibold text-red-400">AVOID / SELL</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {transferPlan.avoidTeams.map((team: string) => (
                        <span key={team} className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm font-medium">
                          {team}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Tough fixtures ahead - consider selling</p>
                  </div>
                )}
              </div>
            )}

            {/* Top Picks */}
            {transferPlan.topPicks && (
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-4 mb-6">
                <h3 className="text-sm font-semibold text-white mb-4">TOP PICKS BY POSITION</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Midfielders */}
                  <div>
                    <p className="text-xs text-green-400 font-semibold mb-2">MIDFIELDERS</p>
                    {transferPlan.topPicks.midfielders?.map((p, i) => (
                      <div key={p.id} className="flex justify-between items-center py-1 border-b border-slate-700 last:border-0">
                        <span className="text-sm text-white">{p.name} ({p.team})</span>
                        <span className="text-xs text-gray-400">{p.form} form</span>
                      </div>
                    ))}
                  </div>
                  {/* Forwards */}
                  <div>
                    <p className="text-xs text-red-400 font-semibold mb-2">FORWARDS</p>
                    {transferPlan.topPicks.forwards?.map((p, i) => (
                      <div key={p.id} className="flex justify-between items-center py-1 border-b border-slate-700 last:border-0">
                        <span className="text-sm text-white">{p.name} ({p.team})</span>
                        <span className="text-xs text-gray-400">{p.form} form</span>
                      </div>
                    ))}
                  </div>
                  {/* Defenders */}
                  <div>
                    <p className="text-xs text-blue-400 font-semibold mb-2">DEFENDERS</p>
                    {transferPlan.topPicks.defenders?.map((p, i) => (
                      <div key={p.id} className="flex justify-between items-center py-1 border-b border-slate-700 last:border-0">
                        <span className="text-sm text-white">{p.name} ({p.team})</span>
                        <span className="text-xs text-gray-400">{p.form} form</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Best Single Transfer */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">BEST SINGLE TRANSFER</h2>
          <p className="text-gray-400 text-sm mt-1">Based on your current squad and budget</p>
        </div>

        {suggestions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <ArrowRightLeft className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              No transfer suggestions available. Your team is looking good!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {suggestions.map((suggestion, index) => (
              <TransferCard
                key={`${suggestion.playerOut.id}-${suggestion.playerIn.id}`}
                playerOut={suggestion.playerOut}
                playerIn={suggestion.playerIn}
                playerOutTeam={getTeamShortName(suggestion.playerOut.team)}
                playerInTeam={getTeamShortName(suggestion.playerIn.team)}
                expectedGain={suggestion.expectedGain}
                metrics={suggestion.metrics}
                rank={index + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
