"use client";

import { useState } from "react";
import useSWR from "swr";
import { UserPlus, Dices, Users } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function DrawPage() {
  const { data, mutate, isLoading } = useSWR("/api/teams", fetcher);
  const [isDrawing, setIsDrawing] = useState(false);
  const [error, setError] = useState("");

  const handleDraw = async () => {
    setIsDrawing(true);
    setError("");
    try {
      const res = await fetch("/api/draw", { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error);
      } else {
        mutate(); // refresh data
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsDrawing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Participant <span className="text-gradient">Draw</span>
          </h1>
          <p className="mt-2 text-slate-400">Randomly assign draw numbers to all registered teams.</p>
        </div>
        
        <button
          onClick={handleDraw}
          disabled={isDrawing || isLoading || data?.data?.length === 0}
          className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-3 font-bold text-white transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] disabled:pointer-events-none disabled:opacity-50"
        >
          <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-100%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(100%)]">
            <div className="relative h-full w-8 bg-white/20" />
          </div>
          {isDrawing ? (
             <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <Dices className="h-5 w-5" />
          )}
          <span>{isDrawing ? "Drawing..." : "Start Random Draw"}</span>
        </button>
      </div>

      {error && <div className="p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-xl">{error}</div>}

      <div className="glass-panel overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl p-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : data?.data?.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            No teams to draw.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data?.data?.map((team: any) => (
              <div 
                key={team._id} 
                className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-500 ${
                  team.drawNumber 
                    ? 'border-blue-500/50 bg-blue-950/30' 
                    : 'border-slate-700/50 bg-slate-800/30'
                }`}
              >
                <div className="flex justify-between items-center relative z-10">
                  <span className="font-semibold text-slate-200 truncate pr-2">{team.name}</span>
                  {team.drawNumber ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-black text-white shadow-lg shadow-blue-500/30">
                      {team.drawNumber}
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-dashed border-slate-600 font-medium text-slate-500 text-xs">
                      TBD
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
