"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import {
  Plus,
  Trash2,
  Edit2,
  Settings,
  Network,
  Upload,
  X,
  Shield,
  Dices,
  Eye,
  RotateCcw,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trophy,
  GitMerge,
  Users,
  Calendar,
} from "lucide-react";

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

export default function AdminPage() {
  // SWR hooks
  const { data: teamsData, mutate: mutateTeams, isLoading: teamsLoading } = useSWR("/api/teams", fetcher);
  const { data: matchesData, mutate: mutateMatches, isLoading: matchesLoading } = useSWR("/api/matches", fetcher);

  const teams: Team[] = teamsData?.data || [];
  const matches: Match[] = matchesData?.data || [];

  // Tab state
  const [activeTab, setActiveTab] = useState<"teams" | "draw" | "bracket">("teams");

  // --- TAB 1: TEAMS STATE ---
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamLogo, setNewTeamLogo] = useState(""); // base64
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState("");
  const [editLogo, setEditLogo] = useState("");

  // --- TAB 2: DRAW STATE ---
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [drawError, setDrawError] = useState("");

  // --- TAB 3: BRACKET CANVAS STATE ---
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.85);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isGenerating, setIsGenerating] = useState(false);

  // Match Editor State (Shared modal for Tab 3)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [selectedTeamA, setSelectedTeamA] = useState("");
  const [selectedTeamB, setSelectedTeamB] = useState("");
  const [scoreA, setScoreA] = useState<string>("");
  const [scoreB, setScoreB] = useState<string>("");
  const [matchStatus, setMatchStatus] = useState<"scheduled" | "ongoing" | "completed">("scheduled");
  const [isSavingMatch, setIsSavingMatch] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Sync draw reveals when teams reload
  useEffect(() => {
    if (teams.length > 0) {
      const alreadyDrawn = teams.filter((t) => t.drawNumber !== null && t.drawNumber !== undefined);
      if (alreadyDrawn.length > 0) {
        setRevealedIds(new Set(alreadyDrawn.map((t) => t._id)));
      }
    }
  }, [teamsData]);

  // --- LOGO FILE UPLOADING UTILITY ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("Logo size must be under 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditLogo(reader.result as string);
      } else {
        setNewTeamLogo(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- TEAM CRUD ACTIONS ---
  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    await fetch("/api/teams", {
      method: "POST",
      body: JSON.stringify({ name: newTeamName, logoUrl: newTeamLogo }),
      headers: { "Content-Type": "application/json" },
    });

    setNewTeamName("");
    setNewTeamLogo("");
    mutateTeams();
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    await fetch(`/api/teams/${id}`, { method: "DELETE" });
    mutateTeams();
    mutateMatches();
  };

  const handleOpenEditTeamModal = (team: Team) => {
    setEditingTeam(team);
    setEditName(team.name);
    setEditLogo(team.logoUrl || "");
  };

  const handleSaveEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !editName.trim()) return;

    await fetch(`/api/teams/${editingTeam._id}`, {
      method: "PUT",
      body: JSON.stringify({ name: editName, logoUrl: editLogo }),
      headers: { "Content-Type": "application/json" },
    });

    setEditingTeam(null);
    mutateTeams();
    mutateMatches();
  };

  // --- DRAW ACTIONS ---
  const handleStartDraw = async () => {
    setIsDrawing(true);
    setIsShuffling(true);
    setDrawError("");

    await new Promise((resolve) => setTimeout(resolve, 1500));

    try {
      const res = await fetch("/api/draw", { method: "POST" });
      const json = await res.json();
      if (!json.success) {
        setDrawError(json.error || "Failed to draw numbers.");
        setIsShuffling(false);
      } else {
        setRevealedIds(new Set());
        setIsShuffling(false);
        await mutateTeams();
      }
    } catch (err: any) {
      setDrawError(err.message || "An error occurred.");
      setIsShuffling(false);
    } finally {
      setIsDrawing(false);
    }
  };

  const handleResetDraw = async () => {
    if (!confirm("Are you sure? This will delete all draw numbers and wipe the current tournament bracket!")) return;
    setIsResetting(true);
    setDrawError("");
    try {
      const res = await fetch("/api/draw", { method: "DELETE" });
      const json = await res.json();
      if (!json.success) {
        setDrawError(json.error || "Failed to reset draw.");
      } else {
        setRevealedIds(new Set());
        await mutateTeams();
        await mutateMatches();
      }
    } catch (err: any) {
      setDrawError(err.message || "An error occurred.");
    } finally {
      setIsResetting(false);
    }
  };

  const toggleReveal = (id: string) => {
    const team = teams.find((t) => t._id === id);
    if (!team || team.drawNumber === null || team.drawNumber === undefined) return;

    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRevealAllDraw = () => {
    const drawnTeams = teams.filter((t) => t.drawNumber !== null && t.drawNumber !== undefined);
    drawnTeams.forEach((team, index) => {
      setTimeout(() => {
        setRevealedIds((prev) => {
          const next = new Set(prev);
          next.add(team._id);
          return next;
        });
      }, index * 200);
    });
  };

  // --- BRACKET CANVAS ACTIONS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".match-card") || (e.target as HTMLElement).closest(".btn-control")) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setScale((s) => Math.min(s + 0.1, 1.5));
  const zoomOut = () => setScale((s) => Math.max(s - 0.1, 0.4));
  const resetZoom = () => {
    setScale(0.85);
    setPan({ x: 0, y: 0 });
  };

  const handleGenerateBracket = async () => {
    if (
      !confirm(
        "Warning: This will DELETE all existing matches and generate a new knockout bracket based on registered teams and their draw numbers. Continue?"
      )
    )
      return;
    setIsGenerating(true);
    const res = await fetch("/api/matches/generate", { method: "POST" });
    const json = await res.json();
    if (!json.success) {
      alert(json.error || "Failed to generate bracket");
    }
    mutateMatches();
    mutateTeams();
    setIsGenerating(false);
  };

  // Open Match Editor Modal
  const openMatchEditor = (match: Match) => {
    setEditingMatch(match);
    setSelectedTeamA(match.teamA?._id || "");
    setSelectedTeamB(match.teamB?._id || "");
    setScoreA(match.scoreA !== null ? match.scoreA.toString() : "");
    setScoreB(match.scoreB !== null ? match.scoreB.toString() : "");
    setMatchStatus(match.status);
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMatch) return;

    setIsSavingMatch(true);
    try {
      const res = await fetch(`/api/matches/${editingMatch._id}`, {
        method: "PUT",
        body: JSON.stringify({
          teamA: selectedTeamA || null,
          teamB: selectedTeamB || null,
          scoreA: scoreA === "" ? null : parseInt(scoreA),
          scoreB: scoreB === "" ? null : parseInt(scoreB),
          status: matchStatus,
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setEditingMatch(null);
        mutateMatches();
        mutateTeams();
      } else {
        alert("Failed to update match.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred.");
    } finally {
      setIsSavingMatch(false);
    }
  };

  // Helper renderers
  const renderLogoPlaceholder = (name: string, size = "w-8 h-8 text-xs") => {
    const initials = name ? name.substring(0, 2).toUpperCase() : "VS";
    return (
      <div className={`${size} rounded-full bg-slate-700 flex items-center justify-center font-bold text-white border border-slate-600 shrink-0`}>
        {initials}
      </div>
    );
  };

  // Group matches by round for bracket canvas
  const rounds: { [key: number]: Match[] } = {};
  matches.forEach((match: Match) => {
    if (!rounds[match.round]) rounds[match.round] = [];
    rounds[match.round].push(match);
  });
  const roundKeys = Object.keys(rounds).map(Number).sort((a, b) => a - b);
  const totalRounds = roundKeys.length;

  const hasDrawn = teams.some((t) => t.drawNumber !== null && t.drawNumber !== undefined);
  const allRevealed = teams.length > 0 && teams.every((t) => t.drawNumber !== null && revealedIds.has(t._id));

  // Render bracket match card inside canvas
  const renderBracketMatchCard = (match: Match, side: "left" | "right" | "center") => {
    const isWinnerA = match.status === "completed" && match.scoreA !== null && match.scoreB !== null && match.scoreA > match.scoreB;
    const isWinnerB = match.status === "completed" && match.scoreA !== null && match.scoreB !== null && match.scoreB > match.scoreA;
    const hasTeamA = !!match.teamA;
    const hasTeamB = !!match.teamB;
    const isTopBranch = match.position % 2 !== 0;

    return (
      <div key={match._id} className="relative py-6 flex flex-col justify-center items-center">
        {/* Connector Line */}
        {side !== "center" && (
          <>
            {side === "left" ? (
              <div
                className={`absolute w-8 right-[-32px] border-r-2 border-slate-700
                  ${isTopBranch ? "top-[50%] h-[50%] border-t-2 rounded-tr-xl" : "bottom-[50%] h-[50%] border-b-2 rounded-br-xl"}
                `}
              />
            ) : (
              <div
                className={`absolute w-8 left-[-32px] border-l-2 border-slate-700
                  ${isTopBranch ? "top-[50%] h-[50%] border-t-2 rounded-tl-xl" : "bottom-[50%] h-[50%] border-b-2 rounded-bl-xl"}
                `}
              />
            )}
          </>
        )}

        {/* Card */}
        <div
          onClick={() => openMatchEditor(match)}
          className="match-card w-64 bg-slate-900/90 hover:bg-slate-800/80 hover:scale-[1.02] border transition-all duration-300 rounded-2xl overflow-hidden shadow-xl cursor-pointer border-slate-800/80"
        >
          <div className="bg-slate-950/75 px-3 py-1.5 text-[9px] text-slate-450 font-bold flex justify-between border-b border-slate-800/60">
            <span>MATCH #{match.matchNumber}</span>
            <span
              className={`uppercase tracking-widest font-black ${
                match.status === "completed"
                  ? "text-emerald-450"
                  : match.status === "ongoing"
                  ? "text-amber-450 animate-pulse"
                  : "text-slate-550"
              }`}
            >
              {match.status}
            </span>
          </div>

          <div className="flex flex-col">
            {/* Team A */}
            <div
              className={`flex justify-between items-center px-3 py-2.5 border-b border-slate-850/60 transition-colors ${
                isWinnerA ? "bg-blue-500/5" : ""
              } ${!hasTeamA ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                {match.teamA ? (
                  <>
                    {match.teamA.logoUrl ? (
                      <img src={match.teamA.logoUrl} alt={match.teamA.name} className="w-6 h-6 rounded-full object-cover border border-slate-750" />
                    ) : (
                      renderLogoPlaceholder(match.teamA.name, "w-6 h-6 text-[8px]")
                    )}
                    <span className={`text-xs truncate font-semibold ${isWinnerA ? "text-white font-black" : "text-slate-350"}`}>
                      {match.teamA.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-slate-850 border border-dashed border-slate-700 flex items-center justify-center text-slate-650 font-bold text-[8px]">BYE</div>
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
              className={`flex justify-between items-center px-3 py-2.5 transition-colors ${
                isWinnerB ? "bg-blue-500/5" : ""
              } ${!hasTeamB ? "opacity-60" : ""}`}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                {match.teamB ? (
                  <>
                    {match.teamB.logoUrl ? (
                      <img src={match.teamB.logoUrl} alt={match.teamB.name} className="w-6 h-6 rounded-full object-cover border border-slate-750" />
                    ) : (
                      renderLogoPlaceholder(match.teamB.name, "w-6 h-6 text-[8px]")
                    )}
                    <span className={`text-xs truncate font-semibold ${isWinnerB ? "text-white font-black" : "text-slate-350"}`}>
                      {match.teamB.name}
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 rounded-full bg-slate-850 border border-dashed border-slate-700 flex items-center justify-center text-slate-650 font-bold text-[8px]">BYE</div>
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
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 h-screen flex flex-col overflow-hidden">
      
      {/* HEADER & TAB NAVIGATION */}
      <div className="px-6 pt-4 shrink-0 flex flex-col gap-4 border-b border-slate-800/80 pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Tournament <span className="text-gradient">Admin Panel</span>
            </h1>
            <p className="text-xs text-slate-400">Complete setup suite: teams details, random draw, and interactive bracket.</p>
          </div>
        </div>

        {/* Tab switch buttons */}
        <div className="flex border-b border-slate-800/60 w-fit gap-1 bg-slate-900/60 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("teams")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "teams" ? "bg-blue-650 text-white shadow-lg shadow-blue-500/10" : "text-slate-400 hover:text-slate-205 hover:bg-slate-800/40"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Teams Manager</span>
          </button>
          <button
            onClick={() => setActiveTab("draw")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "draw" ? "bg-purple-650 text-white shadow-lg shadow-purple-500/10" : "text-slate-400 hover:text-slate-205 hover:bg-slate-800/40"
            }`}
          >
            <Dices className="w-4 h-4" />
            <span>Random Draw</span>
          </button>
          <button
            onClick={() => setActiveTab("bracket")}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "bracket" ? "bg-gradient-to-r from-blue-600 to-purple-650 text-white shadow-lg" : "text-slate-400 hover:text-slate-205 hover:bg-slate-800/40"
            }`}
          >
            <GitMerge className="w-4 h-4" />
            <span>Bracket Editor</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT PANEL */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        
        {/* --- TAB 1: TEAMS MANAGER --- */}
        {activeTab === "teams" && (
          <div className="grid gap-6 md:grid-cols-12 h-full overflow-hidden">
            {/* Left: Add form */}
            <div className="md:col-span-4 glass-panel p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-start">
              <h2 className="text-md font-bold mb-4 flex items-center gap-2 border-b border-slate-800 pb-2">
                <Settings className="w-4 h-4 text-blue-450" /> Add New Participant
              </h2>
              <form onSubmit={handleAddTeam} className="space-y-4">
                <input
                  type="text"
                  placeholder="Team Name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  required
                />

                <div className="flex items-center justify-between gap-4 border border-dashed border-slate-750 p-3 rounded-lg bg-slate-900/40">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-750 text-xs px-3 py-2 rounded-lg border border-slate-700 transition-colors text-slate-350 font-bold shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Logo
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, false)} className="hidden" />
                  </label>
                  {newTeamLogo ? (
                    <div className="flex items-center gap-1.5 bg-slate-850 px-2 py-1 rounded border border-slate-750 truncate">
                      <img src={newTeamLogo} alt="Preview" className="w-5 h-5 rounded-full object-cover shrink-0" />
                      <span className="text-[10px] text-slate-400 truncate max-w-[80px]">uploaded</span>
                      <button type="button" onClick={() => setNewTeamLogo("")} className="text-slate-400 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-550">No logo chosen</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-xs py-2 rounded-lg font-bold transition-all text-white flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Team
                </button>
              </form>
            </div>

            {/* Right: Team Grid */}
            <div className="md:col-span-8 glass-panel p-5 rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden">
              <h2 className="text-md font-bold mb-4 border-b border-slate-800 pb-2 flex justify-between items-center">
                <span>Registered Teams ({teams.length})</span>
                {teamsLoading && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-slate-400"></div>}
              </h2>

              <div className="flex-1 overflow-y-auto custom-scrollbar grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pr-1">
                {teams.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-slate-550 text-xs">No teams registered. Add teams above.</div>
                ) : (
                  teams.map((team) => (
                    <div
                      key={team._id}
                      className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between hover:border-slate-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate">
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt={team.name} className="w-8 h-8 rounded-full object-cover border border-slate-750 shrink-0" />
                        ) : (
                          renderLogoPlaceholder(team.name, "w-8 h-8 text-[10px]")
                        )}
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-white truncate">{team.name}</h4>
                          <span className="text-[9px] text-slate-500 font-bold block">Draw #: {team.drawNumber || "TBD"}</span>
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => handleOpenEditTeamModal(team)}
                          className="text-slate-400 hover:text-white p-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team._id)}
                          className="text-red-400 hover:text-red-300 p-1.5 bg-slate-850 hover:bg-red-950/20 border border-slate-800 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: DRAW CONSOLE --- */}
        {activeTab === "draw" && (
          <div className="flex flex-col h-full gap-4 overflow-hidden">
            {/* Draw Actions */}
            <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl shrink-0">
              <div className="text-xs">
                <span className="font-bold text-white block">Participant Draw Dashboard</span>
                <span className="text-slate-400">Perform the random seed draw to decide knockout placing.</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleStartDraw}
                  disabled={isDrawing || isResetting || teams.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                >
                  {isShuffling ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                  ) : (
                    <Dices className="w-3.5 h-3.5" />
                  )}
                  <span>{isShuffling ? "Shuffling..." : "Start Random Draw"}</span>
                </button>
                {hasDrawn && !allRevealed && (
                  <button
                    onClick={handleRevealAllDraw}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 text-slate-205"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-450" />
                    <span>Reveal All</span>
                  </button>
                )}
                {hasDrawn && (
                  <button
                    onClick={handleResetDraw}
                    disabled={isResetting || isDrawing}
                    className="bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-xs px-3 py-2 rounded-lg font-bold flex items-center gap-1.5 text-red-400"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Draw</span>
                  </button>
                )}
              </div>
            </div>

            {drawError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">{drawError}</div>}

            {/* Draw Arena */}
            <div className="flex-1 glass-panel border border-slate-700/50 p-5 rounded-2xl overflow-y-auto custom-scrollbar">
              {teams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-550 text-xs">
                  <Users className="w-10 h-10 mb-2 text-slate-800" />
                  <span>No teams available. Register teams in Tab 1 first.</span>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {teams.map((team) => {
                    const isRevealed = revealedIds.has(team._id);
                    const isDrawn = team.drawNumber !== null && team.drawNumber !== undefined;

                    return (
                      <div
                        key={team._id}
                        onClick={() => isDrawn && toggleReveal(team._id)}
                        className="relative w-full h-32 perspective-1000 cursor-pointer group"
                      >
                        <div
                          className={`relative w-full h-full preserve-3d transition-transform duration-700 rounded-xl border ${
                            isRevealed ? "rotate-y-180 border-purple-550/40" : "border-slate-800"
                          } ${isShuffling ? "animate-shake animate-pulse-glow" : ""}`}
                        >
                          {/* Face down */}
                          <div className="absolute inset-0 backface-hidden rounded-xl bg-slate-900 flex flex-col items-center justify-center p-3">
                            <span className="h-7 w-7 rounded-full bg-slate-850 flex items-center justify-center font-bold text-slate-500 text-xs">?</span>
                            <span className="mt-2 text-xs font-bold text-slate-350 truncate w-full text-center px-1">{team.name}</span>
                          </div>

                          {/* Face up */}
                          <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl bg-slate-900 flex flex-col items-center justify-between p-3 border border-purple-650/30">
                            <span className="text-[9px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded font-black self-end">REVEALED</span>
                            <span className="text-xs font-bold text-white block truncate w-full text-center">{team.name}</span>
                            <div className="flex justify-between w-full text-[9px] text-slate-500 border-t border-slate-850 pt-1.5 items-center">
                              <span>Position slot:</span>
                              <span className="h-5 w-5 bg-purple-650 text-white rounded-full flex items-center justify-center font-black">{team.drawNumber}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- TAB 3: BRACKET CANVAS --- */}
        {activeTab === "bracket" && (
          <div className="flex flex-col h-full gap-4 overflow-hidden">
            {/* Bracket controls */}
            <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-xl shrink-0">
              <div className="text-xs">
                <span className="font-bold text-white block">Draggable Dual-Sided Bracket Editor</span>
                <span className="text-slate-400">Click any card to edit score, adjust teams, or set status.</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleGenerateBracket}
                  disabled={isGenerating || teams.length < 2}
                  className="bg-blue-650 hover:bg-blue-700 disabled:opacity-50 text-white text-xs px-4 py-2 rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-500/10"
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>{isGenerating ? "Generating..." : "Generate Bracket"}</span>
                </button>
                <div className="flex gap-1 bg-slate-850 p-1 rounded-lg border border-slate-750">
                  <button onClick={zoomIn} className="btn-control p-1 text-slate-350 hover:text-white rounded"><ZoomIn className="w-4 h-4" /></button>
                  <button onClick={zoomOut} className="btn-control p-1 text-slate-350 hover:text-white rounded"><ZoomOut className="w-4 h-4" /></button>
                  <button onClick={resetZoom} className="btn-control p-1 text-slate-350 hover:text-white rounded"><Maximize2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`flex-1 relative overflow-hidden bg-slate-950/80 border border-slate-800/80 rounded-2xl shadow-inner cursor-grab ${
                isDragging ? "cursor-grabbing" : ""
              }`}
              style={{
                backgroundImage: `radial-gradient(rgba(100, 116, 139, 0.1) 1.5px, transparent 1.5px)`,
                backgroundSize: "24px 24px",
              }}
            >
              {matchesLoading ? (
                <div className="absolute inset-0 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
              ) : roundKeys.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-550">
                  <GitMerge className="h-12 w-12 text-slate-800 mb-2" />
                  <span className="text-xs">No bracket created. Setup teams and click "Generate Bracket" above.</span>
                </div>
              ) : (
                <div
                  className="absolute origin-center transition-transform duration-75"
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                    left: "50%",
                    top: "50%",
                    marginLeft: `-${(totalRounds * 2 + 1) * 150}px`,
                    marginTop: "-300px",
                    width: `${(totalRounds * 2 + 1) * 300}px`,
                    height: "600px",
                  }}
                >
                  <div className="flex h-full items-stretch justify-center relative select-none">
                    
                    {/* Left wing */}
                    {Array.from({ length: totalRounds - 1 }).map((_, i) => {
                      const roundIndex = i + 1;
                      const matchesInRound = rounds[roundIndex] || [];
                      const leftMatches = matchesInRound
                        .filter((m) => m.position <= matchesInRound.length / 2)
                        .sort((a, b) => a.position - b.position);

                      return (
                        <div key={`left-round-${roundIndex}`} className="flex flex-col justify-around w-72 relative py-8 px-4">
                          <div className="absolute top-2 left-0 right-0 text-center font-black text-slate-400 uppercase tracking-widest text-[9px]">Round {roundIndex}</div>
                          {leftMatches.map((m) => renderBracketMatchCard(m, "left"))}
                        </div>
                      );
                    })}

                    {/* Center Final */}
                    <div className="flex flex-col justify-center items-center w-80 relative py-8 px-4 border-x border-slate-900/40 bg-slate-950/20">
                      <div className="absolute top-2 left-0 right-0 text-center font-black text-gradient uppercase tracking-widest text-[10px] flex items-center justify-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Grand Final
                      </div>
                      {rounds[totalRounds]?.map((m) => renderBracketMatchCard(m, "center"))}
                    </div>

                    {/* Right wing (Reversed) */}
                    {Array.from({ length: totalRounds - 1 })
                      .map((_, i) => totalRounds - 1 - i)
                      .map((roundIndex) => {
                        const matchesInRound = rounds[roundIndex] || [];
                        const rightMatches = matchesInRound
                          .filter((m) => m.position > matchesInRound.length / 2)
                          .sort((a, b) => a.position - b.position);

                        return (
                          <div key={`right-round-${roundIndex}`} className="flex flex-col justify-around w-72 relative py-8 px-4">
                            <div className="absolute top-2 left-0 right-0 text-center font-black text-slate-400 uppercase tracking-widest text-[9px]">Round {roundIndex}</div>
                            {rightMatches.map((m) => renderBracketMatchCard(m, "right"))}
                          </div>
                        );
                      })}

                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* --- SHARED MODAL: EDIT TEAM --- */}
      {editingTeam && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full mx-4 shadow-2xl relative animate-in scale-in duration-300">
            <button onClick={() => setEditingTeam(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white"><Shield className="w-5 h-5 text-blue-400" /> Edit Team</h3>
            <form onSubmit={handleSaveEditTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1">Team Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-450 mb-1">Team Logo</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-xs px-3 py-2 rounded-lg border border-slate-700 transition-colors text-slate-350 font-bold shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    Change Logo
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, true)} className="hidden" />
                  </label>
                  {editLogo ? (
                    <div className="flex items-center gap-1.5 bg-slate-850 px-2 py-1.5 rounded border border-slate-750">
                      <img src={editLogo} alt="Preview" className="w-5 h-5 rounded-full object-cover border border-slate-700 shrink-0" />
                      <button type="button" onClick={() => setEditLogo("")} className="text-slate-400 hover:text-white"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No logo uploaded.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4 mt-2">
                <button type="button" onClick={() => setEditingTeam(null)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-4 py-2 rounded-lg font-bold text-slate-300">Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2 rounded-lg font-bold text-white">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- SHARED MODAL: EDIT BRACKET MATCH --- */}
      {editingMatch && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full mx-4 shadow-2xl relative animate-in scale-in duration-300">
            <button onClick={() => setEditingMatch(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
            <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-white"><GitMerge className="w-5 h-5 text-blue-455" /> Edit Match #{editingMatch.matchNumber}</h3>
            <form onSubmit={handleSaveMatch} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase">Team A (Top)</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    value={selectedTeamA}
                    onChange={(e) => setSelectedTeamA(e.target.value)}
                  >
                    <option value="">-- Bye / Empty --</option>
                    {teams.map((t) => (
                      <option key={t._id} value={t._id}>{t.name} (Draw #{t.drawNumber})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Score"
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-center text-xs font-bold font-mono text-white focus:outline-none"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-455 uppercase">Team B (Bottom)</label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    value={selectedTeamB}
                    onChange={(e) => setSelectedTeamB(e.target.value)}
                  >
                    <option value="">-- Bye / Empty --</option>
                    {teams.map((t) => (
                      <option key={t._id} value={t._id}>{t.name} (Draw #{t.drawNumber})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Score"
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-center text-xs font-bold font-mono text-white focus:outline-none"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-450 uppercase">Match Status</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  value={matchStatus}
                  onChange={(e) => setMatchStatus(e.target.value as any)}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="ongoing">🟢 Live / Ongoing</option>
                  <option value="completed">🏆 Completed (Save advances winner & updates standings)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4 mt-3">
                <button type="button" onClick={() => setEditingMatch(null)} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-4 py-2.5 rounded-lg font-bold text-slate-300">Cancel</button>
                <button type="submit" disabled={isSavingMatch} className="bg-blue-600 hover:bg-blue-700 text-xs px-5 py-2.5 rounded-lg font-bold text-white">{isSavingMatch ? "Saving..." : "Save Match"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
