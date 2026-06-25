"use client";

import useSWR from "swr";
import { Trophy, Medal, Users, Activity, Calendar } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Team {
  _id: string;
  name: string;
  logoUrl: string;
  drawNumber?: number;
  wins: number;
  losses: number;
  points: number;
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

export default function StandingsPage() {
  const { data: teamsData, error: teamsError, isLoading: teamsLoading } = useSWR("/api/teams", fetcher, { refreshInterval: 5000 });
  const { data: matchesData, error: matchesError, isLoading: matchesLoading } = useSWR("/api/matches", fetcher, { refreshInterval: 5000 });

  if (teamsError || matchesError) {
    return <div className="text-red-500 p-4 text-center glass-panel rounded-xl">Failed to load live data</div>;
  }

  const teams: Team[] = teamsData?.data || [];
  const matches: Match[] = matchesData?.data || [];

  // Filter matches
  const ongoingMatches = matches.filter((m) => m.status === "ongoing");
  const upcomingMatches = matches.filter((m) => m.status === "scheduled" && m.teamA && m.teamB).slice(0, 3);

  // Render SVG Initials logo placeholder
  const renderLogoPlaceholder = (name: string, size = "w-8 h-8 text-xs") => {
    const initials = name ? name.substring(0, 2).toUpperCase() : "VS";
    return (
      <div className={`${size} rounded-full bg-slate-700 flex items-center justify-center font-bold text-white border border-slate-600 shrink-0`}>
        {initials}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            PCH Cup <span className="text-gradient">Arena</span>
          </h1>
          <p className="mt-2 text-slate-400">Live standings, real-time match scores, and knockout progress.</p>
        </div>
      </div>

      {/* REAL-TIME MATCH TICKER SECTION */}
      {ongoingMatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-red-400">
            <Activity className="w-5 h-5 text-red-550 animate-pulse" /> Live Matches Now
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ongoingMatches.map((match) => (
              <div 
                key={match._id} 
                className="relative overflow-hidden rounded-2xl border border-red-500/35 bg-red-950/10 p-5 shadow-lg animate-pulse-glow"
              >
                {/* Header info */}
                <div className="flex justify-between items-center text-[10px] font-semibold text-slate-450 border-b border-red-950/40 pb-2 mb-3">
                  <span>Match #{match.matchNumber} (Round {match.round})</span>
                  <span className="flex items-center gap-1 bg-red-500/10 text-red-450 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold text-[9px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                    Live
                  </span>
                </div>

                {/* Score panel */}
                <div className="flex items-center justify-between gap-2">
                  {/* Team A */}
                  <div className="flex-1 flex flex-col items-center text-center">
                    {match.teamA?.logoUrl ? (
                      <img src={match.teamA.logoUrl} alt={match.teamA.name} className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                    ) : (
                      renderLogoPlaceholder(match.teamA?.name || "TBD", "w-12 h-12 text-sm")
                    )}
                    <span className="mt-2 text-xs font-bold text-slate-100 truncate w-full">{match.teamA?.name || "TBD"}</span>
                  </div>

                  {/* Live score display */}
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black font-mono text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                      {match.scoreA !== null ? match.scoreA : 0}
                    </span>
                    <span className="text-slate-500 font-bold">:</span>
                    <span className="text-3xl font-black font-mono text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                      {match.scoreB !== null ? match.scoreB : 0}
                    </span>
                  </div>

                  {/* Team B */}
                  <div className="flex-1 flex flex-col items-center text-center">
                    {match.teamB?.logoUrl ? (
                      <img src={match.teamB.logoUrl} alt={match.teamB.name} className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                    ) : (
                      renderLogoPlaceholder(match.teamB?.name || "TBD", "w-12 h-12 text-sm")
                    )}
                    <span className="mt-2 text-xs font-bold text-slate-100 truncate w-full">{match.teamB?.name || "TBD"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPCOMING MATCHES OR FALLBACK */}
      {ongoingMatches.length === 0 && upcomingMatches.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-md font-bold flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4 text-blue-450" /> Next Matches
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingMatches.map((match) => (
              <div 
                key={match._id}
                className="glass-panel p-4 rounded-xl border border-slate-750 bg-slate-800/20 flex flex-col justify-between"
              >
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold pb-2 border-b border-slate-800 mb-2.5">
                  <span>Match #{match.matchNumber}</span>
                  <span className="uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-400">Scheduled</span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2 truncate">
                    {match.teamA?.logoUrl ? (
                      <img src={match.teamA.logoUrl} alt={match.teamA.name} className="w-6 h-6 rounded-full object-cover border border-slate-750" />
                    ) : (
                      renderLogoPlaceholder(match.teamA?.name || "TBD", "w-6 h-6 text-[9px]")
                    )}
                    <span className="text-xs font-bold text-slate-350 truncate">{match.teamA?.name}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-550 shrink-0">VS</span>
                  <div className="flex items-center gap-2 truncate">
                    {match.teamB?.logoUrl ? (
                      <img src={match.teamB.logoUrl} alt={match.teamB.name} className="w-6 h-6 rounded-full object-cover border border-slate-750" />
                    ) : (
                      renderLogoPlaceholder(match.teamB?.name || "TBD", "w-6 h-6 text-[9px]")
                    )}
                    <span className="text-xs font-bold text-slate-350 truncate">{match.teamB?.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STANDINGS TABLE SECTION */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-450" /> Leaderboard Standings
        </h2>

        <div className="glass-panel overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/60 text-xs uppercase text-slate-400 border-b border-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold w-16 text-center">Pos</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Team</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center w-24">Draw #</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center w-24">W</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center w-24">L</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-center w-24">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {teamsLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse bg-slate-800/10">
                      <td className="px-6 py-5"><div className="mx-auto h-4 w-4 rounded bg-slate-800"></div></td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-800"></div>
                          <div className="h-4 w-32 rounded bg-slate-800"></div>
                        </div>
                      </td>
                      <td className="px-6 py-5"><div className="mx-auto h-4 w-8 rounded bg-slate-800"></div></td>
                      <td className="px-6 py-5"><div className="mx-auto h-4 w-8 rounded bg-slate-800"></div></td>
                      <td className="px-6 py-5"><div className="mx-auto h-4 w-8 rounded bg-slate-800"></div></td>
                      <td className="px-6 py-5"><div className="mx-auto h-4 w-8 rounded bg-slate-800"></div></td>
                    </tr>
                  ))
                ) : teams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                      <Users className="mx-auto h-12 w-12 text-slate-700 mb-3" />
                      No teams registered yet.
                    </td>
                  </tr>
                ) : (
                  teams.map((team: Team, index: number) => (
                    <tr 
                      key={team._id} 
                      className="group transition-colors hover:bg-slate-800/30"
                    >
                      {/* Medal or Position Rank */}
                      <td className="px-6 py-4 text-center font-bold">
                        {index === 0 ? (
                          <div className="flex justify-center">
                            <Medal className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                          </div>
                        ) : index === 1 ? (
                          <div className="flex justify-center">
                            <Medal className="h-6 w-6 text-slate-350" />
                          </div>
                        ) : index === 2 ? (
                          <div className="flex justify-center">
                            <Medal className="h-6 w-6 text-amber-600" />
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-500 font-mono">{index + 1}</span>
                        )}
                      </td>

                      {/* Name & Logo */}
                      <td className="px-6 py-4 font-semibold text-white group-hover:text-blue-400 transition-colors">
                        <div className="flex items-center gap-3">
                          {team.logoUrl ? (
                            <img src={team.logoUrl} alt={team.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                          ) : (
                            renderLogoPlaceholder(team.name)
                          )}
                          <span className="truncate max-w-[180px] md:max-w-none">{team.name}</span>
                        </div>
                      </td>

                      {/* Draw Number */}
                      <td className="px-6 py-4 text-center text-slate-400 font-mono font-bold text-xs">
                        {team.drawNumber || '-'}
                      </td>

                      {/* Wins */}
                      <td className="px-6 py-4 text-center font-bold font-mono text-emerald-400">
                        {team.wins}
                      </td>

                      {/* Losses */}
                      <td className="px-6 py-4 text-center font-bold font-mono text-red-400">
                        {team.losses}
                      </td>

                      {/* Points */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-blue-500/10 px-3 py-1 font-extrabold text-blue-405 ring-1 ring-blue-500/20 text-xs font-mono shadow-sm">
                          {team.points}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
