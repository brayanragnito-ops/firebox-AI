import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Users, Plus, Trash2, Edit2, X } from "lucide-react";
import { apiClient } from "../lib/api-client";
import { useAuth } from "../contexts/auth";

interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
}

interface TeamMember {
  teamId: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
  joinedAt: string;
}

export default function TeamsPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const response = await apiClient.get("/api/teams");
      const data = await response.json();
      setTeams([...(data.owned || []), ...(data.member || [])]);
    } catch (error) {
      console.error("Failed to load teams:", error);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const response = await apiClient.get(`/api/teams/${teamId}/members`);
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error("Failed to load members:", error);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setLoading(true);

    try {
      const response = await apiClient.post("/api/teams", {
        name: newTeamName,
        description: newTeamDesc,
      });
      const data = await response.json();
      setTeams([...teams, data.team]);
      setNewTeamName("");
      setNewTeamDesc("");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create team:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTeam = (team: Team) => {
    setSelectedTeam(team);
    loadTeamMembers(team.id);
  };

  const handleInviteMember = async () => {
    if (!selectedTeam || !inviteEmail.trim()) return;
    setLoading(true);

    try {
      const response = await apiClient.post(`/api/teams/${selectedTeam.id}/members`, {
        email: inviteEmail,
        role: inviteRole,
      });
      const data = await response.json();
      alert(`Invitation sent to ${inviteEmail}. Share this link: ${data.inviteUrl}`);
      setInviteEmail("");
      setShowInviteForm(false);
    } catch (error) {
      console.error("Failed to invite member:", error);
      alert("Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedTeam) return;
    if (!confirm("Remove this member from the team?")) return;

    try {
      await apiClient.delete(`/api/teams/${selectedTeam.id}/members/${memberId}`);
      loadTeamMembers(selectedTeam.id);
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Delete this team? This cannot be undone.")) return;

    try {
      await apiClient.delete(`/api/teams/${teamId}`);
      setTeams(teams.filter((t) => t.id !== teamId));
      setSelectedTeam(null);
    } catch (error) {
      console.error("Failed to delete team:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users size={32} />
            Teams & Collaboration
          </h1>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
            <Plus size={16} />
            New Team
          </Button>
        </div>

        {/* Create Team Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Team Name</label>
                <Input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="My Awesome Team"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="Optional team description"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateTeam}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Create Team
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-8">
          {/* Teams List */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h2 className="font-semibold">Your Teams</h2>
              </div>
              <div className="divide-y max-h-96 overflow-y-auto">
                {teams.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No teams yet
                  </div>
                ) : (
                  teams.map((team) => (
                    <div
                      key={team.id}
                      onClick={() => handleSelectTeam(team)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedTeam?.id === team.id
                          ? "bg-blue-50 border-l-4 border-blue-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium text-sm">{team.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {team.description || "No description"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Team Details */}
          {selectedTeam ? (
            <div className="col-span-2 space-y-6">
              {/* Team Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold">{selectedTeam.name}</h2>
                  {user?.id === selectedTeam.ownerId && (
                    <Button
                      onClick={() => handleDeleteTeam(selectedTeam.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete Team
                    </Button>
                  )}
                </div>
                {selectedTeam.description && (
                  <p className="text-gray-600">{selectedTeam.description}</p>
                )}
              </div>

              {/* Team Members */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Team Members ({members.length})</h3>
                  {user?.id === selectedTeam.ownerId && (
                    <Button
                      onClick={() => setShowInviteForm(!showInviteForm)}
                      size="sm"
                      className="gap-1"
                    >
                      <Plus size={14} />
                      Invite Member
                    </Button>
                  )}
                </div>

                {/* Invite Form */}
                {showInviteForm && user?.id === selectedTeam.ownerId && (
                  <div className="border-b p-4 bg-blue-50">
                    <div className="flex gap-2 mb-2">
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="email@example.com"
                        className="flex-1"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="owner">Owner</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleInviteMember}
                        disabled={loading}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Send Invite
                      </Button>
                      <Button
                        onClick={() => setShowInviteForm(false)}
                        size="sm"
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Members List */}
                <div className="divide-y">
                  {members.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No members yet
                    </div>
                  ) : (
                    members.map((member) => (
                      <div
                        key={`${member.teamId}-${member.userId}`}
                        className="p-4 flex items-center justify-between hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium text-sm">{member.userId}</div>
                          <div className="text-xs text-gray-600">
                            <span
                              className={`inline-block px-2 py-1 rounded ${
                                member.role === "owner"
                                  ? "bg-red-100 text-red-700"
                                  : member.role === "editor"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </span>
                          </div>
                        </div>
                        {user?.id === selectedTeam.ownerId && member.userId !== selectedTeam.ownerId && (
                          <Button
                            onClick={() => handleRemoveMember(member.userId)}
                            size="sm"
                            variant="ghost"
                          >
                            <X size={16} className="text-red-500" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Select a team to manage members</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
