"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { MOCK_ERROR_SOURCES } from "@/lib/mock-data";
import { ConnectedRepo, OrgMember } from "@/lib/types";
import {
  GitBranch,
  Radio,
  Users,
  Key,
  Plus,
  Check,
  Copy,
  ShieldCheck,
  AlertTriangle,
  Ban,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface RealApiKey {
  id: string;
  name: string;
  projectId: string;
  projectName?: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string;
  revoked: boolean;
}

type TabType = "repos" | "sources" | "team" | "keys";

interface SettingsClientProps {
  initialProjects: ConnectedRepo[];
  initialTeamMembers: OrgMember[];
  initialApiKeys: RealApiKey[];
}

export function SettingsClient({
  initialProjects,
  initialTeamMembers,
  initialApiKeys,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>("repos");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<RealApiKey[]>(initialApiKeys);
  const [repos, setRepos] = useState<ConnectedRepo[]>(initialProjects);
  const [mockSources, setMockSources] = useState(MOCK_ERROR_SOURCES);
  const [teamMembers] = useState<OrgMember[]>(initialTeamMembers);

  // Generate Key Modal state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [keyNameInput, setKeyNameInput] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialProjects[0]?.id || ""
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // One-time reveal modal state
  const [revealedRawKey, setRevealedRawKey] = useState<string | null>(null);

  const handleCopyRawKey = () => {
    if (revealedRawKey) {
      navigator.clipboard.writeText(revealedRawKey);
      setCopiedKeyId("revealed-key");
      setTimeout(() => setCopiedKeyId(null), 2000);
    }
  };

  // Connect Repo Modal state
  const [isAddRepoModalOpen, setIsAddRepoModalOpen] = useState(false);
  const [repoNameInput, setRepoNameInput] = useState("");
  const [repoUrlInput, setRepoUrlInput] = useState("");
  const [isAddingRepo, setIsAddingRepo] = useState(false);
  const [addRepoError, setAddRepoError] = useState<string | null>(null);

  const handleOpenAddRepoModal = () => {
    setRepoNameInput("");
    setRepoUrlInput("");
    setAddRepoError(null);
    setIsAddRepoModalOpen(true);
  };

  const handleConnectRepo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoNameInput.trim()) {
      setAddRepoError("Please enter a repository name (e.g. org/repo-name).");
      return;
    }

    setIsAddingRepo(true);
    setAddRepoError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: repoNameInput.trim(),
          repoUrl: repoUrlInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to connect repository");
      }

      const createdProject = data.project;
      const newRepo: ConnectedRepo = {
        id: createdProject.id,
        name: createdProject.name,
        owner: createdProject.name.split("/")[0] || "org",
        branch: "main",
        status: "connected",
        lastSynced: "Just now",
        incidentsCount: 0,
      };

      setRepos((prev) => [newRepo, ...prev]);
      setIsAddRepoModalOpen(false);
      setRepoNameInput("");
      setRepoUrlInput("");
    } catch (err: any) {
      console.error("Connect repo error:", err);
      setAddRepoError(err.message || "Failed to connect repository");
    } finally {
      setIsAddingRepo(false);
    }
  };

  const handleAddSource = () => {
    const name = prompt("Enter Error Ingestion Source Name:", "Custom Webhook Endpoint");
    if (name) {
      setMockSources([
        ...mockSources,
        {
          id: `src-${Date.now()}`,
          name: name,
          type: "custom_webhook",
          status: "active",
          lastEventAt: "Just connected",
        },
      ]);
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyNameInput.trim()) {
      setGenerateError("Please enter a name for the API key.");
      return;
    }
    if (!selectedProjectId) {
      setGenerateError("Please select a target project.");
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: keyNameInput.trim(),
          projectId: selectedProjectId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create API key");
      }

      const created = data.key;
      const newApiKeyRecord: RealApiKey = {
        id: created.id,
        name: created.name,
        projectId: created.projectId,
        projectName: created.projectName,
        keyPrefix: created.keyMasked,
        createdAt: new Date().toLocaleDateString(),
        lastUsedAt: "Never",
        revoked: false,
      };

      setApiKeys([newApiKeyRecord, ...apiKeys]);
      setRevealedRawKey(created.rawKey);
      setIsGenerateModalOpen(false);
      setKeyNameInput("");
    } catch (err: any) {
      setGenerateError(err.message || "Failed to create API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API Key? Ingestion requests using this key will immediately fail.")) {
      return;
    }

    try {
      const res = await fetch("/api/keys/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to revoke API key");
        return;
      }

      setApiKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, revoked: true } : k))
      );
    } catch (err) {
      console.error("Revoke error:", err);
      alert("Failed to revoke API key. Check console for details.");
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="border-b border-slate-800/80 pb-6">
          <h1 className="text-2xl font-bold text-slate-100">
            Platform Settings & Integrations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure connected VCS repositories, alert ingestion webhooks, access control, and API tokens.
          </p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("repos")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-xs font-semibold font-mono border-b-2 transition-colors whitespace-nowrap",
              activeTab === "repos"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            <GitBranch className="w-4 h-4" />
            <span>Repositories ({repos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("sources")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-xs font-semibold font-mono border-b-2 transition-colors whitespace-nowrap",
              activeTab === "sources"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            <Radio className="w-4 h-4" />
            <span>Error Sources ({mockSources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("team")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-xs font-semibold font-mono border-b-2 transition-colors whitespace-nowrap",
              activeTab === "team"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            <Users className="w-4 h-4" />
            <span>Team Members ({teamMembers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("keys")}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-xs font-semibold font-mono border-b-2 transition-colors whitespace-nowrap",
              activeTab === "keys"
                ? "border-cyan-400 text-cyan-400 bg-cyan-950/20"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            <Key className="w-4 h-4" />
            <span>API Keys ({apiKeys.length})</span>
          </button>
        </div>

        {/* TAB 1: Repositories */}
        {activeTab === "repos" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-200">
                  Connected Code Repositories
                </h2>
                <p className="text-xs text-slate-400">
                  Patchwork monitors commits & pulls diffs automatically across these repos (wired to database).
                </p>
              </div>

              <button
                onClick={handleOpenAddRepoModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-md shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Connect Repo</span>
              </button>
            </div>

            {repos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repos.map((repo) => (
                  <div
                    key={repo.id}
                    className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4 text-cyan-400" />
                          <span className="font-bold text-sm text-slate-100 font-mono">
                            {repo.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">
                          Target Branch: <span className="text-slate-200">{repo.branch}</span>
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-950/60 border border-emerald-800 text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {repo.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-3 border-t border-slate-800/60">
                      <span>Synced {repo.lastSynced}</span>
                      <span className="text-cyan-400">{repo.incidentsCount} linked incidents</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/30 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-300">No Repositories Connected</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your organization has no repositories in the database yet. Click "Connect Repo" to add one.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Error Sources */}
        {activeTab === "sources" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-200">
                  Alert Ingestion Sources
                </h2>
                <p className="text-xs text-slate-400">
                  Integrations receiving real-time crash reports and telemetry alerts.
                </p>
              </div>

              <button
                onClick={handleAddSource}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-md shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Source</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockSources.map((source) => (
                <div
                  key={source.id}
                  className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Radio className="w-4 h-4 text-purple-400" />
                        <span className="font-bold text-sm text-slate-100">
                          {source.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono uppercase">
                        Type: {source.type}
                      </p>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono border",
                        source.status === "active"
                          ? "bg-emerald-950/60 border-emerald-800 text-emerald-300"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      )}
                    >
                      {source.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-3 border-t border-slate-800/60">
                    <span>Last event: {source.lastEventAt}</span>
                    <button className="text-xs text-slate-400 hover:text-cyan-400">
                      Configure Webhook
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Team Members */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-200">
                  Engineering Team & On-Call Roster
                </h2>
                <p className="text-xs text-slate-400">
                  Members authorized to approve Patchwork automated pull requests (wired to database).
                </p>
              </div>

              <button
                onClick={() => alert("Invite link copied to clipboard!")}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-md shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Invite Team Member</span>
              </button>
            </div>

            {teamMembers.length > 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden divide-y divide-slate-800/80">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-300 font-mono text-sm font-bold">
                        {(member.user?.name || member.user?.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-100">
                          {member.user?.name || "Team Member"}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          {member.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                        <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/30 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-300">No Team Members Found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No members are currently associated with your organization in the database.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: API Keys (Wired to Real ApiKey Table) */}
        {activeTab === "keys" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-200">
                  Ingestion & Agent API Keys
                </h2>
                <p className="text-xs text-slate-400">
                  Secret Bearer tokens used by error monitoring clients & CLI tools to send incident payloads.
                </p>
              </div>

              <button
                onClick={() => {
                  setSelectedProjectId(initialProjects[0]?.id || "");
                  setIsGenerateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-md shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Generate New Key</span>
              </button>
            </div>

            {apiKeys.length > 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden divide-y divide-slate-800/80">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/80 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-cyan-400" />
                        <span className="font-semibold text-sm text-slate-100">
                          {key.name}
                        </span>
                        {key.projectName && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {key.projectName}
                          </span>
                        )}
                        {key.revoked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                            <Ban className="w-3 h-3" />
                            REVOKED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <code className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 inline-block">
                        {key.keyPrefix}
                      </code>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono text-slate-400">
                      <div className="text-right">
                        <p className="text-slate-300">Created: {key.createdAt}</p>
                        <p className="text-slate-500 text-[11px]">Last used: {key.lastUsedAt}</p>
                      </div>

                      {!key.revoked && (
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-lg border border-rose-800/80 transition-colors"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/30 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-300">No API Keys Generated</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Generate an API key to authenticate error report ingestion from your external services or CLI.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* GENERATE NEW API KEY MODAL */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <span>Generate API Key</span>
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generateError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{generateError}</span>
              </div>
            )}

            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Target Project
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {initialProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Key Name / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sentry Production Ingestion"
                  value={keyNameInput}
                  onChange={(e) => setKeyNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : "Generate Key"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ONE-TIME FULL KEY REVEAL MODAL */}
      {revealedRawKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-xl p-6 space-y-6 shadow-2xl shadow-cyan-950/50">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-800 text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-100">
                  Save Your API Key
                </h3>
                <p className="text-xs text-slate-400">
                  Please copy this secret API key now. <strong className="text-amber-300 font-semibold">You will not be able to see it again!</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Full Ingestion API Key
              </label>
              <div className="flex items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 break-all select-all">
                <span className="flex-1">{revealedRawKey}</span>
                <button
                  onClick={handleCopyRawKey}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold rounded transition-colors shrink-0"
                >
                  {copiedKeyId === "revealed-key" ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setRevealedRawKey(null)}
                className="px-5 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
              >
                I Have Saved My Key
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CONNECT REPOSITORY MODAL */}
      {isAddRepoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-cyan-400" />
                <span>Connect Code Repository</span>
              </h3>
              <button
                onClick={() => setIsAddRepoModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addRepoError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{addRepoError}</span>
              </div>
            )}

            <form onSubmit={handleConnectRepo} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Repository Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. fetchhub/notification-service"
                  value={repoNameInput}
                  onChange={(e) => setRepoNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Repository URL (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://github.com/fetchhub/notification-service"
                  value={repoUrlInput}
                  onChange={(e) => setRepoUrlInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRepoModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingRepo}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isAddingRepo ? "Connecting..." : "Connect Repo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
