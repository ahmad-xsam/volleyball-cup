"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Dices, Users, Eye, RotateCcw, AlertTriangle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Team {
  _id: string;
  name: string;
  logoUrl: string;
  drawNumber?: number;
}

export default function DrawPage() {
  const { data, mutate, isLoading } = useSWR("/api/teams", fetcher);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const teams: Team[] = data?.data || [];

  // Automatically reveal teams that already have draw numbers in the DB upon initial page load
  useEffect(() => {
    if (teams.length > 0) {
      const alreadyDrawn = teams.filter((t) => t.drawNumber !== null && t.drawNumber !== undefined);
      if (alreadyDrawn.length > 0) {
        setRevealedIds(new Set(alreadyDrawn.map((t) => t._id)));
      }
    }
  }, [data]);

  const handleStartDraw = async () => {
    setIsDrawing(true);
    setIsShuffling(true);
    setError("");

    // Simulate shuffling animation for 1.5 seconds
    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const res = await fetch("/api/draw", { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to draw numbers.");
        setIsShuffling(false);
      } else {
        // Set all cards to face-down (locked) initially
        setRevealedIds(new Set());
        setIsShuffling(false);
        await mutate(); // Refresh team data from DB
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
      setIsShuffling(false);
    } finally {
      setIsDrawing(false);
    }
  };

  const handleResetDraw = async () => {
    if (!confirm("Are you sure? This will delete all draw numbers and wipe the current tournament bracket!")) return;
    setIsResetting(true);
    setError("");
    try {
      const res = await fetch("/api/draw", { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to reset draw.");
      } else {
        setRevealedIds(new Set());
        await mutate();
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setIsResetting(false);
    }
  };

  const toggleReveal = (id: string) => {
    // Only allow clicking if the draw is completed (i.e. team has a draw number assigned)
    const team = teams.find((t) => t._id === id);
    if (!team || team.drawNumber === null || team.drawNumber === undefined) return;

    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleRevealAll = () => {
    // Staggered reveal animation
    const drawnTeams = teams.filter((t) => t.drawNumber !== null && t.drawNumber !== undefined);
    drawnTeams.forEach((team, index) => {
      setTimeout(() => {
        setRevealedIds((prev) => {
          const next = new Set(prev);
          next.add(team._id);
          return next;
        });
      }, index * 200); // 200ms stagger delay
    });
  };

  const hasDrawn = teams.some((t) => t.drawNumber !== null && t.drawNumber !== undefined);
  const allRevealed = teams.length > 0 && teams.every((t) => t.drawNumber !== null && revealedIds.has(t._id));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 glass-panel p-6 rounded-2xl border border-slate-700/50">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Participant <span className="text-gradient">Draw</span>
          </h1>
          <p className="mt-2 text-slate-400 text-sm">
            Draw numbers to decide tournament placement. Click each card to reveal the secret number!
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {/* Start Draw Button */}
          <button
            onClick={handleStartDraw}
            disabled={isDrawing || isResetting || isLoading || teams.length === 0}
            className="relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 px-6 py-2.5 font-bold text-sm text-white transition-all hover:scale-105 disabled:pointer-events-none disabled:opacity-50 shadow-lg shadow-blue-550/20 cursor-pointer"
          >
            {isShuffling ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Dices className="h-4 w-4" />
            )}
            <span>{isShuffling ? "Shuffling Cards..." : "Start Random Draw"}</span>
          </button>

          {/* Reveal All Button */}
          {hasDrawn && !allRevealed && (
            <button
              onClick={handleRevealAll}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2.5 font-bold text-sm text-slate-200 transition-colors"
            >
              <Eye className="h-4 w-4 text-emerald-450" />
              <span>Reveal All</span>
            </button>
          )}

          {/* Reset Button */}
          {hasDrawn && (
            <button
              onClick={handleResetDraw}
              disabled={isResetting || isDrawing}
              className="inline-flex items-center gap-2 rounded-xl bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 px-4 py-2.5 font-bold text-sm text-red-400 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset Draw</span>
            </button>
          )}
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/20 border border-red-500 text-red-400 rounded-xl">{error}</div>}

      {/* Main Card Arena */}
      <div className="glass-panel overflow-hidden rounded-2xl border border-slate-700/50 shadow-2xl p-6 min-h-[400px] flex flex-col justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-slate-400 text-sm">Loading participants...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Users className="mx-auto h-12 w-12 text-slate-700 mb-3" />
            <p className="font-semibold text-sm">No teams registered yet.</p>
            <p className="text-xs mt-1 text-slate-600">Please add teams in the Admin Panel first.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {teams.map((team: Team) => {
              const isRevealed = revealedIds.has(team._id);
              const isDrawn = team.drawNumber !== null && team.drawNumber !== undefined;

              return (
                <div
                  key={team._id}
                  onClick={() => isDrawn && toggleReveal(team._id)}
                  className={`relative w-full h-44 perspective-1000 cursor-pointer group`}
                >
                  {/* Inner Flipper card */}
                  <div
                    className={`relative w-full h-full preserve-3d transition-transform duration-700 rounded-2xl border shadow-lg ${
                      isRevealed ? "rotate-y-180 border-blue-550/50" : "border-slate-750/70"
                    } ${isShuffling ? "animate-shake animate-pulse-glow" : ""}`}
                  >
                    
                    {/* BACK OF CARD: Mystical face-down state */}
                    <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 flex flex-col items-center justify-center p-4 border border-slate-700/40">
                      {/* Volleyball watermark/graphic */}
                      <div className="absolute w-24 h-24 text-slate-800/10 -z-10 select-none">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2h2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 1.83-.62 3.5-1.67 4.93z" />
                        </svg>
                      </div>

                      <div className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 border border-dashed border-slate-600 font-black text-slate-500 text-lg flex group-hover:scale-110 group-hover:border-blue-500/50 group-hover:text-blue-400 transition-all shadow-inner">
                        ?
                      </div>
                      <span className="mt-3 text-sm font-semibold text-slate-350 text-center truncate w-full px-2">
                        {team.name}
                      </span>
                      {isDrawn ? (
                        <span className="mt-1 text-[10px] text-blue-400 font-bold uppercase tracking-wider animate-pulse">
                          Click to Reveal
                        </span>
                      ) : (
                        <span className="mt-1 text-[10px] text-slate-550 font-bold uppercase tracking-wider">
                          Awaiting Draw
                        </span>
                      )}
                    </div>

                    {/* FRONT OF CARD: Revealed State */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950/20 flex flex-col items-center justify-between p-4 border border-blue-550/45">
                      <div className="flex items-center justify-between w-full">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt={team.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-white border border-slate-700">
                            {team.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Revealed
                        </span>
                      </div>

                      <div className="text-center w-full px-2">
                        <span className="text-sm font-bold text-white block truncate">{team.name}</span>
                      </div>

                      <div className="flex items-center justify-between w-full border-t border-slate-800/80 pt-2 text-xs">
                        <span className="text-slate-400">Position slot:</span>
                        <div className="h-7 w-7 rounded-full bg-blue-650 flex items-center justify-center font-black text-white text-xs shadow-lg shadow-blue-500/20">
                          {team.drawNumber}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WARNING INFO BOX */}
      {hasDrawn && !allRevealed && (
        <div className="flex items-start gap-3 p-4 bg-blue-950/20 border border-blue-900/50 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-200 block">Draw Numbers Assigned!</span>
            <p>
              The drawing is finished in the database, but some numbers are still hidden under mystery cards. Click
              them to flip them over, or click <strong>Reveal All</strong> to reveal them all.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
