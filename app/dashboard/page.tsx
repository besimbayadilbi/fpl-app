"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTeamStore } from "@/store/teamStore";
import { useFPLCore } from "@/hooks/useFPLData";
import PitchView from "@/components/team/PitchView";
import TeamStats from "@/components/team/TeamStats";
import TransferPlanner from "@/components/transfers/TransferPlanner";
import Navigation from "@/components/layout/Navigation";
import { Loader2, Bot, ArrowRight, Sparkles, Brain } from "lucide-react";
import Link from "next/link";

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const teamIdParam = searchParams.get("teamId");

  const [activeTab, setActiveTab] = useState<"team" | "transfers" | "assistant">("team");

  const {
    teamId,
    teamName,
    managerName,
    players,
    captain,
    viceCaptain,
    budget,
    teamValue,
    isLoading: teamLoading,
    error: teamError,
    loadTeamById,
  } = useTeamStore();

  const { players: allPlayers, teams, fixtures, currentGameWeek, isLoading: dataLoading } = useFPLCore();

  useEffect(() => {
    if (teamIdParam && !teamId) {
      loadTeamById(parseInt(teamIdParam));
    }
  }, [teamIdParam, teamId, loadTeamById]);

  // Redirect if no team ID
  useEffect(() => {
    if (!teamIdParam && !teamId) {
      router.push("/");
    }
  }, [teamIdParam, teamId, router]);

  if (dataLoading || teamLoading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your team data...</p>
        </div>
      </div>
    );
  }

  if (teamError) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">!</div>
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Team</h2>
          <p className="text-gray-400 mb-6">{teamError}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 btn-glow rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <Navigation
        teamName={teamName}
        managerName={managerName}
        onChangeTeam={() => router.push("/")}
      />

      {/* Tabs */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("team")}
            className={`tab-button ${activeTab === "team" ? "active" : ""}`}
          >
            My Team
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`tab-button ${activeTab === "transfers" ? "active" : ""}`}
          >
            Transfer Planner
          </button>
          <button
            onClick={() => setActiveTab("assistant")}
            className={`tab-button ${activeTab === "assistant" ? "active" : ""}`}
          >
            AI Assistant
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-8">
        {activeTab === "team" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PitchView
                players={players}
                teams={teams}
                captain={captain}
                viceCaptain={viceCaptain}
              />
            </div>
            <div>
              <TeamStats
                players={players}
                budget={budget}
                teamValue={teamValue}
                currentGameWeek={currentGameWeek?.id || 0}
                teams={teams}
                fixtures={fixtures}
              />
            </div>
          </div>
        )}

        {activeTab === "transfers" && (
          <TransferPlanner
            teamPlayers={players}
            allPlayers={allPlayers}
            teams={teams}
            budget={budget}
            fixtures={fixtures}
          />
        )}

        {activeTab === "assistant" && (
          <div className="max-w-2xl mx-auto">
            {/* AI Assistant Promo Card */}
            <div className="bg-gradient-to-br from-green-900/30 to-slate-900 border border-green-500/30 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <Bot className="w-10 h-10 text-green-500" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">FPL AI Assistant</h2>

              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Get personalized transfer advice, captain picks, and strategy recommendations
                powered by GPT-4. Your team data is automatically included for context-aware suggestions.
              </p>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <Sparkles className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Transfer Strategy</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <Brain className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Captain Picks</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <Bot className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Differentials</p>
                </div>
              </div>

              <Link
                href="/ai-assistant"
                className="inline-flex items-center gap-2 px-8 py-4 btn-glow rounded-xl text-lg font-semibold"
              >
                Start Chatting
                <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="text-xs text-gray-600 mt-4">
                Powered by OpenAI GPT-4
              </p>
            </div>

            {/* Quick Questions */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Questions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  "Who should I captain this week?",
                  "What transfers should I make?",
                  "Which budget picks are trending?",
                  "Should I use my wildcard?",
                ].map((question, index) => (
                  <Link
                    key={index}
                    href={`/ai-assistant?q=${encodeURIComponent(question)}`}
                    className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500/50 rounded-xl text-left transition-all group"
                  >
                    <p className="text-gray-300 group-hover:text-white transition-colors">
                      {question}
                    </p>
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-green-500 mt-2 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
