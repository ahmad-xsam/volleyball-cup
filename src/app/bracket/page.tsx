"use client";

import useSWR from "swr";
import { GitMerge, Trophy } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Team {
  _id: string;
  name: string;
  logoUrl: string;
  drawNumber?: number;
}

interface Match {
  _id: string;
  teamA?: Team;
  teamB?: Team;
  scoreA: number | null;
  scoreB: number | null;
  status: "scheduled" | "ongoing" | "completed";
  round: number;
  matchNumber: number;
  position: number;
}

export default function BracketPage() {
  const { data, error, isLoading } = useSWR("/api/matches", fetcher, { refreshInterval: 5000 });

  if (error) return <div className="text-red-500 p-4 text-center glass-panel rounded-xl">Failed to load matches</div>;

  // Group matches by round
  const rounds: { [key: number]: Match[] } = {};
  if (data?.data) {
    data.data.forEach((match: Match) => {
      if (!rounds[match.round]) rounds[match.round] = [];
      rounds[match.round].push(match);
    });
  }

  const roundKeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);

  // Render SVG Initials logo placeholder
  const renderLogoPlaceholder = (name: string, size = "w-6 h-6 text-[9px]") => {
    const initials = name ? name.substring(0, 2).toUpperCase() : "VS";
    return (
      <div className={`${size} rounded-full bg-slate-700 flex items-center justify-center font-bold text-white border border-slate-600 shrink-0`}>
        {initials}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 h-full flex flex-col">
      <div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Tournament <span className="text-gradient">Bracket</span>
        </h1>
        <p className="mt-2 text-slate-400 text-sm">Knockout stage bracket. Live updates as scores change.</p>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-700/50 shadow-2xl p-6 flex-1 overflow-x-auto custom-scrollbar min-h-[500px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-slate-400 text-sm">Loading bracket matches...</p>
          </div>
        ) : roundKeys.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <GitMerge className="mx-auto h-12 w-12 text-slate-700 mb-3" />
            <p className="font-semibold text-sm">No bracket generated yet.</p>
            <p className="text-xs mt-1 text-slate-650 font-medium">Generate the bracket from the Admin Panel.</p>
          </div>
        ) : (
          <div className="flex gap-16 min-w-max p-4 items-stretch select-none">
            {roundKeys.map((roundIndex, i) => {
              const isFinal = i === roundKeys.length - 1;
              const matchesInRound = rounds[roundIndex].sort((a, b) => a.position - b.position);

              return (
                <div key={roundIndex} className="flex flex-col justify-around w-72 relative py-8">
                  {/* Round Header */}
                  <div className="absolute -top-4 left-0 right-0 text-center font-black text-slate-400 uppercase tracking-widest text-[10px]">
                    {isFinal ? (
                      <span className="text-gradient font-black flex items-center justify-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Grand Final
                      </span>
                    ) : (
                      `Round ${roundIndex}`
                    )}
                  </div>
                  
                  {matchesInRound.map((match: Match) => {
                    const isTopBranch = match.position % 2 !== 0;
                    
                    const hasTeamA = !!match.teamA;
                    const hasTeamB = !!match.teamB;
                    
                    const isWinnerA = match.status === "completed" && match.scoreA !== null && match.scoreB !== null && match.scoreA > match.scoreB;
                    const isWinnerB = match.status === "completed" && match.scoreA !== null && match.scoreB !== null && match.scoreB > match.scoreA;

                    return (
                      <div key={match._id} className="relative py-6 flex-1 flex flex-col justify-center">
                        
                        {/* Connector lines to next round */}
                        {!isFinal && (
                          <div 
                            className={`absolute w-8 right-[-32px] border-r-2 border-slate-750/70
                              ${isTopBranch ? 'top-[50%] h-[50%] border-t-2 rounded-tr-xl' : 'bottom-[50%] h-[50%] border-b-2 rounded-br-xl'}
                            `} 
                          />
                        )}
                        
                        {/* Connector line from previous round */}
                        {i > 0 && (
                          <div className="absolute w-8 left-[-32px] top-[50%] border-t-2 border-slate-750/70" />
                        )}

                        {/* Match Card */}
                        <div 
                          className={`relative z-10 bg-slate-900/90 border transition-all duration-300 rounded-xl overflow-hidden shadow-xl ${
                            match.status === "ongoing"
                              ? "border-amber-500/50 shadow-amber-550/10 animate-pulse-glow"
                              : match.status === "completed"
                              ? "border-slate-800"
                              : "border-slate-800/80"
                          }`}
                        >
                          {/* Match Details Header */}
                          <div className="bg-slate-950/75 px-3 py-1.5 text-[9px] text-slate-450 font-bold flex justify-between border-b border-slate-800/80">
                            <span className="tracking-wide">MATCH #{match.matchNumber}</span>
                            <span 
                              className={`uppercase tracking-widest font-black ${
                                match.status === "completed"
                                  ? "text-emerald-450"
                                  : match.status === "ongoing"
                                  ? "text-amber-450 animate-pulse"
                                  : "text-slate-500"
                              }`}
                            >
                              {match.status}
                            </span>
                          </div>

                          {/* Team Slots */}
                          <div className="flex flex-col">
                            {/* Team A */}
                            <div 
                              className={`flex justify-between items-center px-3 py-2.5 border-b border-slate-850/60 ${
                                isWinnerA ? "bg-blue-500/5" : ""
                              } ${!hasTeamA ? "opacity-60" : ""}`}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                {match.teamA ? (
                                  <>
                                    {match.teamA.logoUrl ? (
                                      <img src={match.teamA.logoUrl} alt={match.teamA.name} className="w-6 h-6 rounded-full object-cover border border-slate-750" />
                                    ) : (
                                      renderLogoPlaceholder(match.teamA.name)
                                    )}
                                    <span className={`text-xs truncate font-semibold ${isWinnerA ? "text-white font-black" : "text-slate-350"}`}>
                                      {match.teamA.name}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-6 h-6 rounded-full bg-slate-850 border border-dashed border-slate-700 flex items-center justify-center text-slate-600 font-bold text-[8px]">BYE</div>
                                    <span className="text-xs text-slate-550 font-semibold italic">Bye/TBD</span>
                                  </>
                                )}
                              </div>
                              <span className={`text-xs font-bold font-mono ${isWinnerA ? "text-blue-400" : "text-slate-550"}`}>
                                {match.scoreA !== null ? match.scoreA : "-"}
                              </span>
                            </div>

                            {/* Team B */}
                            <div 
                              className={`flex justify-between items-center px-3 py-2.5 ${
                                isWinnerB ? "bg-blue-500/5" : ""
                              } ${!hasTeamB ? "opacity-60" : ""}`}
                            >
                              <div className="flex items-center gap-2 truncate pr-2">
                                {match.teamB ? (
                                  <>
                                    {match.teamB.logoUrl ? (
                                      <img src={match.teamB.logoUrl} alt={match.teamB.name} className="w-6 h-6 rounded-full object-cover border border-slate-750" />
                                    ) : (
                                      renderLogoPlaceholder(match.teamB.name)
                                    )}
                                    <span className={`text-xs truncate font-semibold ${isWinnerB ? "text-white font-black" : "text-slate-350"}`}>
                                      {match.teamB.name}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-6 h-6 rounded-full bg-slate-850 border border-dashed border-slate-700 flex items-center justify-center text-slate-600 font-bold text-[8px]">BYE</div>
                                    <span className="text-xs text-slate-550 font-semibold italic">Bye/TBD</span>
                                  </>
                                )}
                              </div>
                              <span className={`text-xs font-bold font-mono ${isWinnerB ? "text-blue-400" : "text-slate-550"}`}>
                                {match.scoreB !== null ? match.scoreB : "-"}
                              </span>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
