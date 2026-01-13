"use client";

import { Trophy, LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";

interface NavigationProps {
  teamName: string;
  managerName: string;
  onChangeTeam: () => void;
}

export default function Navigation({ teamName, managerName, onChangeTeam }: NavigationProps) {
  return (
    <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <span className="font-bold text-white">FPL</span>
              <span className="font-bold text-green-500"> ANALYTICS</span>
            </div>
          </Link>

          {/* Team Info */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-white font-medium">{teamName || "My Team"}</p>
              <p className="text-sm text-gray-400">{managerName || "Manager"}</p>
            </div>
            <button
              onClick={onChangeTeam}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Change</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
