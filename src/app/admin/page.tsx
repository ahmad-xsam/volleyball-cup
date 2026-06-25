"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Trash2, Edit2, Settings, Network, Upload, X, Shield, ArrowRight } from "lucide-react";

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
  const { data: teamsData, mutate: mutateTeams } = useSWR("/api/teams", fetcher);
  const { data: matchesData, mutate: mutateMatches } = useSWR("/api/matches", fetcher);

  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamLogo, setNewTeamLogo] = useState(""); // base64 string
  const [isGenerating, setIsGenerating] = useState(false);

  // Edit Team state
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState("");
  const [editLogo, setEditLogo] = useState("");

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
  };

  const handleOpenEditModal = (team: Team) => {
    setEditingTeam(team);
    setEditName(team.name);
    setEditLogo(team.logoUrl || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam || !editName.trim()) return;

    await fetch(`/api/teams/${editingTeam._id}`, {
      method: "PUT",
      body: JSON.stringify({ name: editName, logoUrl: editLogo }),
      headers: { "Content-Type": "application/json" },
    });

    setEditingTeam(null);
    mutateTeams();
    mutateMatches(); // in case team logo/name changed, updates matches
  };

  const handleUpdateMatchScore = async (id: string, scoreA: number | null, scoreB: number | null, status: string) => {
    await fetch(`/api/matches/${id}`, {
      method: "PUT",
      body: JSON.stringify({ scoreA, scoreB, status }),
      headers: { "Content-Type": "application/json" },
    });
    mutateMatches();
    mutateTeams();
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

  // Render SVG Initials logo placeholder
  const renderLogoPlaceholder = (name: string, size = "w-8 h-8 text-xs") => {
    const initials = name ? name.substring(0, 2).toUpperCase() : "VS";
    return (
      <div className={`${size} rounded-full bg-slate-700 flex items-center justify-center font-bold text-white border border-slate-600`}>
        {initials}
      </div>
    );
  };

  const teams = teamsData?.data || [];
  const matches = matchesData?.data || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Admin <span className="text-gradient">Panel</span>
        </h1>
        <p className="mt-2 text-slate-400">Manage tournament teams, logos, and update match details.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* TEAMS MANAGEMENT (5 columns) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-700/50 flex flex-col h-[650px]">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-slate-700/50 pb-3">
            <Settings className="w-5 h-5 text-blue-400" /> Manage Teams ({teams.length})
          </h2>

          {/* Add Team Form */}
          <form onSubmit={handleAddTeam} className="space-y-4 mb-6 bg-slate-800/30 p-4 rounded-xl border border-slate-700/30">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Team Name"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1 font-bold shadow-lg shadow-blue-655/20 shrink-0"
              >
                <Plus className="w-4 h-4" /> Add Team
              </button>
            </div>

            {/* Logo Upload Input */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-xs px-3 py-2 rounded-lg border border-slate-700 transition-colors text-slate-300">
                <Upload className="w-3.5 h-3.5" />
                Upload Logo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, false)}
                  className="hidden"
                />
              </label>

              {newTeamLogo ? (
                <div className="flex items-center gap-2 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-750">
                  <img src={newTeamLogo} alt="Preview" className="w-6 h-6 rounded-full object-cover" />
                  <span className="text-[10px] text-slate-400 truncate max-w-[80px]">logo.png</span>
                  <button type="button" onClick={() => setNewTeamLogo("")} className="text-slate-400 hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-slate-500">No logo uploaded yet.</span>
              )}
            </div>
          </form>

          {/* Teams List */}
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
            {teams.length === 0 ? (
              <p className="text-slate-550 text-sm text-center py-12">No teams registered yet.</p>
            ) : (
              teams.map((team: Team) => (
                <div
                  key={team._id}
                  className="flex justify-between items-center bg-slate-800/40 hover:bg-slate-800/60 px-4 py-3 rounded-xl border border-slate-750/30 transition-all"
                >
                  <div className="flex items-center gap-3">
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={team.name} className="w-8 h-8 rounded-full object-cover border border-slate-700" />
                    ) : (
                      renderLogoPlaceholder(team.name)
                    )}
                    <div>
                      <div className="font-semibold text-slate-200 text-sm">{team.name}</div>
                      <div className="text-[10px] text-slate-400">
                        Draw #: <span className="font-mono text-blue-400">{team.drawNumber || "TBD"}</span> | Pts:{" "}
                        <span className="font-mono text-emerald-400">{team.points}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(team)}
                      className="text-slate-450 hover:text-white bg-slate-800 p-2 rounded-lg border border-slate-700/50 transition-colors"
                      title="Edit Team"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team._id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/20 bg-slate-800 p-2 rounded-lg border border-slate-700/50 transition-all"
                      title="Delete Team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MATCHES MANAGEMENT (7 columns) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-700/50 flex flex-col h-[650px]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Network className="w-5 h-5 text-purple-400" /> Match Controller ({matches.length})
            </h2>
            <button
              onClick={handleGenerateBracket}
              disabled={isGenerating || teams.length < 2}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1 font-bold shadow-lg shadow-purple-650/20"
            >
              {isGenerating ? "Generating..." : "Generate Bracket"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {matches.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <Network className="mx-auto h-12 w-12 text-slate-700 mb-3" />
                <p className="text-sm">No matches created yet.</p>
                <p className="text-xs mt-1 text-slate-600">Register teams, perform the draw, then click Generate Bracket.</p>
              </div>
            ) : (
              matches.map((match: Match) => (
                <div
                  key={match._id}
                  className="bg-slate-800/30 p-4 rounded-xl border border-slate-700/30 hover:border-slate-700/70 transition-all space-y-3"
                >
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-b border-slate-800 pb-2">
                    <span className="bg-slate-850 px-2 py-0.5 rounded text-blue-400">Match #{match.matchNumber}</span>
                    <span>Round {match.round} - Match {match.position}</span>
                    <span
                      className={`px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                        match.status === "completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : match.status === "ongoing"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                          : "bg-slate-800 text-slate-400 border border-slate-750"
                      }`}
                    >
                      {match.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 items-center gap-2">
                    {/* Team A name & logo */}
                    <div className="col-span-2 flex flex-col items-center text-center gap-1.5">
                      {match.teamA ? (
                        <>
                          {match.teamA.logoUrl ? (
                            <img src={match.teamA.logoUrl} alt={match.teamA.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                          ) : (
                            renderLogoPlaceholder(match.teamA.name, "w-10 h-10 text-sm")
                          )}
                          <span className="text-xs font-bold text-slate-200 truncate w-full">{match.teamA.name}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-slate-850 border border-dashed border-slate-700 flex items-center justify-center text-slate-550 font-bold text-xs">BYE</div>
                          <span className="text-xs text-slate-500 font-semibold italic">Bye/TBD</span>
                        </>
                      )}
                    </div>

                    {/* Scores Inputs */}
                    <div className="col-span-3 flex items-center justify-center gap-2 px-2">
                      <input
                        type="number"
                        placeholder="0"
                        className="w-12 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded text-center py-1.5 font-bold font-mono text-sm text-white focus:outline-none"
                        defaultValue={match.scoreA === null ? "" : match.scoreA}
                        disabled={!match.teamA || !match.teamB}
                        onBlur={(e) =>
                          handleUpdateMatchScore(
                            match._id,
                            e.target.value === "" ? null : parseInt(e.target.value),
                            match.scoreB,
                            match.status
                          )
                        }
                      />
                      <span className="text-slate-550 font-bold">:</span>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-12 bg-slate-900 border border-slate-700 focus:border-blue-500 rounded text-center py-1.5 font-bold font-mono text-sm text-white focus:outline-none"
                        defaultValue={match.scoreB === null ? "" : match.scoreB}
                        disabled={!match.teamA || !match.teamB}
                        onBlur={(e) =>
                          handleUpdateMatchScore(
                            match._id,
                            match.scoreA,
                            e.target.value === "" ? null : parseInt(e.target.value),
                            match.status
                          )
                        }
                      />
                    </div>

                    {/* Team B name & logo */}
                    <div className="col-span-2 flex flex-col items-center text-center gap-1.5">
                      {match.teamB ? (
                        <>
                          {match.teamB.logoUrl ? (
                            <img src={match.teamB.logoUrl} alt={match.teamB.name} className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                          ) : (
                            renderLogoPlaceholder(match.teamB.name, "w-10 h-10 text-sm")
                          )}
                          <span className="text-xs font-bold text-slate-200 truncate w-full">{match.teamB.name}</span>
                        </>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-slate-850 border border-dashed border-slate-700 flex items-center justify-center text-slate-550 font-bold text-xs">BYE</div>
                          <span className="text-xs text-slate-500 font-semibold italic">Bye/TBD</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Match Status Selector */}
                  <div className="flex justify-center border-t border-slate-800 pt-2.5">
                    <select
                      className={`text-xs px-3 py-1.5 rounded-lg bg-slate-900 border font-semibold focus:outline-none transition-colors ${
                        match.status === "completed"
                          ? "border-emerald-500/50 text-emerald-400"
                          : match.status === "ongoing"
                          ? "border-amber-500/50 text-amber-400"
                          : "border-slate-700 text-slate-350"
                      }`}
                      value={match.status}
                      disabled={!match.teamA || !match.teamB}
                      onChange={(e) => handleUpdateMatchScore(match._id, match.scoreA, match.scoreB, e.target.value)}
                    >
                      <option value="scheduled">Scheduled</option>
                      <option value="ongoing">🟢 Live / Ongoing</option>
                      <option value="completed">🏆 Completed</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* EDIT TEAM MODAL */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-md w-full mx-4 shadow-2xl relative animate-in scale-in duration-300">
            <button
              onClick={() => setEditingTeam(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
              <Shield className="w-5 h-5 text-blue-400" /> Edit Team Details
            </h3>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Team Name</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Team Logo</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-xs px-3 py-2 rounded-lg border border-slate-700 transition-colors text-slate-350">
                    <Upload className="w-3.5 h-3.5" />
                    Change Logo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, true)}
                      className="hidden"
                    />
                  </label>

                  {editLogo ? (
                    <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-750">
                      <img src={editLogo} alt="Preview" className="w-6 h-6 rounded-full object-cover border border-slate-700" />
                      <button type="button" onClick={() => setEditLogo("")} className="text-slate-400 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500">No logo uploaded.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs px-4 py-2.5 rounded-lg font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-xs px-4 py-2.5 rounded-lg font-bold text-white transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
