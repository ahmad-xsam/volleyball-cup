"use client";

import useSWR from "swr";
import { Trophy, Medal, Users } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StandingsPage() {
  const { data, error, isLoading } = useSWR("/api/teams", fetcher, { refreshInterval: 5000 }); // Poll every 5 seconds

  if (error) return <div className="text-red-500 p-4 text-center glass-panel rounded-xl">Failed to load standings</div>;
  
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Tournament <span className="text-gradient">Standings</span>
          </h1>
          <p className="mt-2 text-slate-400">Live updates from the PCH Cup arena.</p>
        </div>
      </div>

      <div className="glass-panel overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold w-16">Pos</th>
                <th scope="col" className="px-6 py-4 font-semibold">Team Name</th>
                <th scope="col" className="px-6 py-4 font-semibold text-center w-24">Draw #</th>
                <th scope="col" className="px-6 py-4 font-semibold text-center w-24">W</th>
                <th scope="col" className="px-6 py-4 font-semibold text-center w-24">L</th>
                <th scope="col" className="px-6 py-4 font-semibold text-center w-24">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-slate-800/20">
                    <td className="px-6 py-5"><div className="h-4 w-4 rounded bg-slate-700"></div></td>
                    <td className="px-6 py-5"><div className="h-4 w-32 rounded bg-slate-700"></div></td>
                    <td className="px-6 py-5"><div className="mx-auto h-4 w-8 rounded bg-slate-700"></div></td>
                    <td className="px-6 py-5"><div className="mx-auto h-4 w-8 rounded bg-slate-700"></div></td>
                    <td className="px-6 py-5"><div className="mx-auto h-4 w-8 rounded bg-slate-700"></div></td>
                    <td className="px-6 py-5"><div className="mx-auto h-4 w-8 rounded bg-slate-700"></div></td>
                  </tr>
                ))
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Users className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                    No teams registered yet.
                  </td>
                </tr>
              ) : (
                data?.data?.map((team: any, index: number) => (
                  <tr 
                    key={team._id} 
                    className="group transition-colors hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      {index === 0 ? (
                        <Medal className="h-6 w-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                      ) : index === 1 ? (
                        <Medal className="h-6 w-6 text-slate-300" />
                      ) : index === 2 ? (
                        <Medal className="h-6 w-6 text-amber-600" />
                      ) : (
                        <span className="font-medium text-slate-500 ml-1">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-white group-hover:text-blue-400 transition-colors">
                      {team.name}
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400 font-mono">
                      {team.drawNumber || '-'}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-emerald-400">
                      {team.wins}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-red-400">
                      {team.losses}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-full bg-blue-500/10 px-3 py-1 font-bold text-blue-400 ring-1 ring-blue-500/20">
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
  );
}
