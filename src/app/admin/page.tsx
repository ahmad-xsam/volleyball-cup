"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Trash2, Edit2, Settings } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminPage() {
  const { data: teamsData, mutate: mutateTeams } = useSWR("/api/teams", fetcher);
  const { data: matchesData, mutate: mutateMatches } = useSWR("/api/matches", fetcher);

  const [newTeamName, setNewTeamName] = useState("");
  
  const [newMatch, setNewMatch] = useState({
    teamA: "",
    teamB: "",
    matchNumber: 1,
    round: 1,
  });

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName) return;
    await fetch("/api/teams", {
      method: "POST",
      body: JSON.stringify({ name: newTeamName }),
      headers: { "Content-Type": "application/json" },
    });
    setNewTeamName("");
    mutateTeams();
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await fetch(`/api/teams/${id}`, { method: "DELETE" });
    mutateTeams();
  };

  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatch.teamA || !newMatch.teamB) return;
    await fetch("/api/matches", {
      method: "POST",
      body: JSON.stringify(newMatch),
      headers: { "Content-Type": "application/json" },
    });
    setNewMatch({ teamA: "", teamB: "", matchNumber: newMatch.matchNumber + 1, round: newMatch.round });
    mutateMatches();
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await fetch(`/api/matches/${id}`, { method: "DELETE" });
    mutateMatches();
  };

  const handleUpdateMatchScore = async (id: string, scoreA: number, scoreB: number, status: string) => {
    await fetch(`/api/matches/${id}`, {
      method: "PUT",
      body: JSON.stringify({ scoreA, scoreB, status }),
      headers: { "Content-Type": "application/json" },
    });
    mutateMatches();
    mutateTeams(); // Scores might affect standings
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          Admin <span className="text-gradient">Panel</span>
        </h1>
        <p className="mt-2 text-slate-400">Manage teams and matches.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Teams Management */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-400"/> Manage Teams
          </h2>
          
          <form onSubmit={handleAddTeam} className="flex gap-2 mb-6">
            <input 
              type="text" 
              placeholder="Team Name" 
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-1">
              <Plus className="w-4 h-4"/> Add
            </button>
          </form>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {teamsData?.data?.map((team: any) => (
              <div key={team._id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-lg border border-slate-700/30">
                <span className="font-medium text-slate-200">{team.name}</span>
                <button onClick={() => handleDeleteTeam(team._id)} className="text-red-400 hover:text-red-300 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Matches Management */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400"/> Manage Matches
          </h2>
          
          <form onSubmit={handleAddMatch} className="flex flex-col gap-3 mb-6">
            <div className="flex gap-2">
              <select 
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                value={newMatch.teamA}
                onChange={(e) => setNewMatch({...newMatch, teamA: e.target.value})}
              >
                <option value="">Select Team A</option>
                {teamsData?.data?.map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <select 
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                value={newMatch.teamB}
                onChange={(e) => setNewMatch({...newMatch, teamB: e.target.value})}
              >
                <option value="">Select Team B</option>
                {teamsData?.data?.map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <input type="number" placeholder="Match #" className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" value={newMatch.matchNumber} onChange={(e) => setNewMatch({...newMatch, matchNumber: parseInt(e.target.value)})} />
              <input type="number" placeholder="Round" className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white" value={newMatch.round} onChange={(e) => setNewMatch({...newMatch, round: parseInt(e.target.value)})} />
              <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                <Plus className="w-4 h-4"/> Add Match
              </button>
            </div>
          </form>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {matchesData?.data?.map((match: any) => (
              <div key={match._id} className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/30 space-y-3">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Match #{match.matchNumber} (Round {match.round})</span>
                  <button onClick={() => handleDeleteMatch(match._id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-right text-sm font-medium">{match.teamA?.name}</div>
                  <input 
                    type="number" 
                    className="w-12 bg-slate-900 border border-slate-600 rounded text-center py-1"
                    defaultValue={match.scoreA}
                    onBlur={(e) => handleUpdateMatchScore(match._id, parseInt(e.target.value), match.scoreB, match.status)}
                  />
                  <span className="text-slate-500">-</span>
                  <input 
                    type="number" 
                    className="w-12 bg-slate-900 border border-slate-600 rounded text-center py-1"
                    defaultValue={match.scoreB}
                    onBlur={(e) => handleUpdateMatchScore(match._id, match.scoreA, parseInt(e.target.value), match.status)}
                  />
                  <div className="flex-1 text-left text-sm font-medium">{match.teamB?.name}</div>
                </div>

                <div className="flex justify-center mt-2">
                  <select 
                    className={`text-xs px-2 py-1 rounded bg-slate-900 border ${match.status === 'completed' ? 'border-emerald-500 text-emerald-400' : 'border-slate-600 text-slate-300'}`}
                    defaultValue={match.status}
                    onChange={(e) => handleUpdateMatchScore(match._id, match.scoreA, match.scoreB, e.target.value)}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
