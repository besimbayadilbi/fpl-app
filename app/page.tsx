"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ArrowRight, TrendingUp, Users, Zap, Search, Hash, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResult {
  teamId: number;
  teamName: string;
  managerName: string;
  rank: number;
  totalPoints: number;
}

export default function LandingPage() {
  const [searchMode, setSearchMode] = useState<"id" | "name">("id");
  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAnalyzeById = async () => {
    if (!teamId.trim()) {
      setError("Please enter your Team ID");
      return;
    }

    const id = parseInt(teamId.trim());
    if (isNaN(id) || id <= 0) {
      setError("Please enter a valid Team ID");
      return;
    }

    setIsLoading(true);
    setError("");
    router.push(`/dashboard?teamId=${id}`);
  };

  const handleSearchByName = async () => {
    if (!teamName.trim() || teamName.length < 3) {
      setError("Please enter at least 3 characters");
      return;
    }

    setIsSearching(true);
    setError("");
    setSearchResults([]);

    try {
      const response = await fetch(`/api/search-team?q=${encodeURIComponent(teamName)}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
      } else if (data.results.length === 0) {
        setError("No teams found. Try a different search or use Team ID.");
      } else {
        setSearchResults(data.results);
      }
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectTeam = (teamId: number) => {
    setIsLoading(true);
    router.push(`/dashboard?teamId=${teamId}`);
  };

  return (
    <main className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-lg w-full text-center">
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500/50 mb-6">
            <Trophy className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-5xl font-bold mb-2">
            <span className="text-white">FPL</span>
            <span className="text-green-500"> ANALYTICS</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Advanced metrics and transfer recommendations for your fantasy team.
          </p>
        </div>

        {/* Search Mode Tabs */}
        <div className="flex gap-2 mb-6 justify-center">
          <button
            onClick={() => {
              setSearchMode("id");
              setError("");
              setSearchResults([]);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              searchMode === "id"
                ? "bg-green-500 text-gray-900"
                : "bg-slate-800 text-gray-400 hover:text-white"
            )}
          >
            <Hash className="w-4 h-4" />
            Team ID
          </button>
          <button
            onClick={() => {
              setSearchMode("name");
              setError("");
              setSearchResults([]);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
              searchMode === "name"
                ? "bg-green-500 text-gray-900"
                : "bg-slate-800 text-gray-400 hover:text-white"
            )}
          >
            <Search className="w-4 h-4" />
            Search by Name
          </button>
        </div>

        {/* Team ID Input */}
        {searchMode === "id" && (
          <div className="space-y-4 mb-8">
            <div className="relative">
              <input
                type="number"
                value={teamId}
                onChange={(e) => {
                  setTeamId(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyzeById()}
                placeholder="Enter your FPL Team ID"
                className="w-full px-6 py-4 bg-slate-900 border-2 border-green-500/30 rounded-xl text-white text-center text-lg placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleAnalyzeById}
              disabled={isLoading}
              className="w-full py-4 btn-glow rounded-xl text-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  ANALYZE TEAM
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p className="text-xs text-gray-500">
              Find your Team ID on the{" "}
              <a
                href="https://fantasy.premierleague.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500 hover:underline"
              >
                FPL website
              </a>
              {" "}→ Points → Check URL for the number
            </p>
          </div>
        )}

        {/* Search by Name */}
        {searchMode === "name" && (
          <div className="space-y-4 mb-8">
            <div className="relative">
              <input
                type="text"
                value={teamName}
                onChange={(e) => {
                  setTeamName(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearchByName()}
                placeholder="Enter team or manager name"
                className="w-full px-6 py-4 bg-slate-900 border-2 border-green-500/30 rounded-xl text-white text-center text-lg placeholder-gray-500 focus:outline-none focus:border-green-500 transition-all"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleSearchByName}
              disabled={isSearching || teamName.length < 3}
              className="w-full py-4 btn-glow rounded-xl text-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  SEARCH TEAMS
                  <Search className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                <p className="text-sm text-gray-400 mb-2">
                  Found {searchResults.length} team(s):
                </p>
                {searchResults.map((result) => (
                  <button
                    key={result.teamId}
                    onClick={() => handleSelectTeam(result.teamId)}
                    disabled={isLoading}
                    className="w-full p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-green-500/50 rounded-xl text-left transition-all disabled:opacity-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-white font-semibold">{result.teamName}</p>
                        <p className="text-sm text-gray-400">{result.managerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-semibold">{result.totalPoints} pts</p>
                        <p className="text-xs text-gray-500">Rank: {result.rank.toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-500">
              Search in the overall FPL league. Results may take a moment.
            </p>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 card-hover">
            <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Transfer Planner</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 card-hover">
            <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Team Analysis</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 card-hover">
            <Zap className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">AI Assistant</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-center text-gray-600 text-sm">
        <p>Not affiliated with the Premier League.</p>
        <p>Designed for FPL managers who want to win.</p>
      </footer>
    </main>
  );
}
