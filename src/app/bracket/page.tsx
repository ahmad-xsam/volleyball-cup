"use client";

import useSWR from "swr";
import { GitMerge } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BracketPage() {
  const { data, error, isLoading } = useSWR("/api/matches", fetcher, { refreshInterval: 5000 });

  if (error) return <div className="text-red-500 p-4 text-center glass-panel rounded-xl">Failed to load matches</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Tournament <span className="text-gradient">Bracket</span>
        </h1>
        <p className="mt-2 text-slate-400">Match schedules and results.</p>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <GitMerge className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            No matches scheduled yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.data?.map((match: any) => (
              <div key={match._id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex flex-col justify-center">
                <div className="text-xs text-slate-400 mb-3 flex justify-between items-center">
                  <span>Match #{match.matchNumber} &bull; Round {match.round}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                    match.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    match.status === 'ongoing' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-700/50 text-slate-400'
                  }`}>
                    {match.status}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className={`flex justify-between items-center p-2 rounded ${match.status === 'completed' && match.scoreA > match.scoreB ? 'bg-blue-500/10 border-l-2 border-blue-500 font-bold text-white' : 'text-slate-300'}`}>
                    <span className="truncate">{match.teamA?.name || 'TBD'}</span>
                    <span className="font-mono text-lg">{match.scoreA}</span>
                  </div>
                  
                  <div className={`flex justify-between items-center p-2 rounded ${match.status === 'completed' && match.scoreB > match.scoreA ? 'bg-blue-500/10 border-l-2 border-blue-500 font-bold text-white' : 'text-slate-300'}`}>
                    <span className="truncate">{match.teamB?.name || 'TBD'}</span>
                    <span className="font-mono text-lg">{match.scoreB}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
