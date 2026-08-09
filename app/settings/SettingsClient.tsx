"use client";

import React, { useState, useEffect } from "react";
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
  Bell,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Mail,
  Slack,
  MessageSquare,
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

type TabType = "repos" | "notifications" | "sources" | "team" | "keys";

interface SettingsClientProps {
  initialProjects: ConnectedRepo[];
  initialTeamMembers: OrgMember[];
  initialApiKeys: RealApiKey[];
  defaultTab?: TabType;
  hideNavbar?: boolean;
}

export function SettingsClient({
  initialProjects,
  initialTeamMembers,
  initialApiKeys,
  defaultTab = "repos",
  hideNavbar = false,
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [apiKeys, setApiKeys] = useState<RealApiKey[]>(initialApiKeys);
  const [repos, setRepos] = useState<ConnectedRepo[]>(initialProjects);
  const [mockSources] = useState(MOCK_ERROR_SOURCES);
  const [teamMembers] = useState<OrgMember[]>(initialTeamMembers);

  // Notification Settings state
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [notifyCriticalIncident, setNotifyCriticalIncident] = useState(true);
  const [notifyReviewOpened, setNotifyReviewOpened] = useState(true);
  const [notifyResolved, setNotifyResolved] = useState(true);

  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [isSavingNotifs, setIsSavingNotifs] = useState(false);
  const [saveNotifFeedback, setSaveNotifFeedback] = useState<string | null>(null);

  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [testSlackFeedback, setTestSlackFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailFeedback, setTestEmailFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [lastSuccessLog, setLastSuccessLog] = useState<any>(null);
  const [lastFailureLog, setLastFailureLog] = useState<any>(null);

  // Fetch Notification Settings on mount / tab switch
  const fetchNotificationSettings = async () => {
    setIsLoadingNotifs(true);
    try {
      const res = await fetch("/api/settings/notifications");
      const data = await res.json();
      if (res.ok && data.settings) {
        setSlackWebhookUrl(data.settings.slackWebhookUrl || "");
        setEmailEnabled(data.settings.emailEnabled || false);
        setSlackEnabled(data.settings.slackEnabled || false);
        setNotifyCriticalIncident(data.settings.notifyCriticalIncident ?? true);
        setNotifyReviewOpened(data.settings.notifyReviewOpened ?? true);
        setNotifyResolved(data.settings.notifyResolved ?? true);

        setLastSuccessLog(data.lastSuccessLog || null);
        setLastFailureLog(data.lastFailureLog || null);
      }
    } catch (err) {
      console.error("Failed loading notification settings:", err);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (activeTab === "notifications") {
      fetchNotificationSettings();
    }
  }, [activeTab]);

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingNotifs(true);
    setSaveNotifFeedback(null);

    try {
      const res = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slackWebhookUrl: slackWebhookUrl.trim(),
          emailEnabled,
          slackEnabled,
          notifyCriticalIncident,
          notifyReviewOpened,
          notifyResolved,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setSaveNotifFeedback("Notification settings saved successfully.");
      setTimeout(() => setSaveNotifFeedback(null), 3000);
    } catch (err: any) {
      setSaveNotifFeedback(`Error: ${err.message}`);
    } finally {
      setIsSavingNotifs(false);
    }
  };

  const handleSendTestSlack = async () => {
    setIsTestingSlack(true);
    setTestSlackFeedback(null);
    try {
      const res = await fetch("/api/settings/notifications/test-slack", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setTestSlackFeedback({ success: true, message: "Test Slack message delivered successfully!" });
      } else {
        setTestSlackFeedback({
          success: false,
          message: data.errorMessage || data.error || "Slack notification delivery failed.",
        });
      }
      if (data.log) {
        if (data.success) setLastSuccessLog(data.log);
        else setLastFailureLog(data.log);
      }
    } catch (err: any) {
      setTestSlackFeedback({ success: false, message: err.message || "Failed to trigger Slack test." });
    } finally {
      setIsTestingSlack(false);
    }
  };

  const handleSendTestEmail = async () => {
    setIsTestingEmail(true);
    setTestEmailFeedback(null);
    try {
      const res = await fetch("/api/settings/notifications/test-email", {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailFeedback({ success: true, message: `Test email sent successfully to ${data.log?.recipient || "target address"}!` });
      } else {
        setTestEmailFeedback({
          success: false,
          message: data.errorMessage || data.error || "Email notification delivery failed.",
        });
      }
      if (data.log) {
        if (data.success) setLastSuccessLog(data.log);
        else setLastFailureLog(data.log);
      }
    } catch (err: any) {
      setTestEmailFeedback({ success: false, message: err.message || "Failed to trigger email test." });
    } finally {
      setIsTestingEmail(false);
    }
  };

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

      const created = data.project;
      const newRepo: ConnectedRepo = {
        id: created.id,
        name: created.name,
        owner: created.name.split("/")[0] || "org",
        branch: "main",
        status: "connected",
        lastSynced: "Just now",
        incidentsCount: 0,
      };

      setRepos([newRepo, ...repos]);
      setIsAddRepoModalOpen(false);
    } catch (err: any) {
      setAddRepoError(err.message || "Failed to connect repository");
    } finally {
      setIsAddingRepo(false);
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

  const handleToggleDeployTracking = async (repoId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/projects/${repoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deploymentTrackingEnabled: enabled }),
      });
      if (!res.ok) throw new Error("Failed to update project deployment tracking setting");
      setRepos((prev) =>
        prev.map((r) => (r.id === repoId ? { ...r, deploymentTrackingEnabled: enabled } : r))
      );
    } catch (err) {
      console.error("Error toggling deployment tracking:", err);
      alert("Failed to update deployment tracking setting.");
    }
  };

  const getWebhookUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/api/webhooks/github`;
    }
    return "https://<your-domain>/api/webhooks/github";
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(getWebhookUrl());
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#08090a] flex flex-col font-mono text-[#c9d1d9]">
      {!hideNavbar && <Navbar />}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-4 font-mono">
          <h1 className="text-xl font-bold text-zinc-100 uppercase tracking-wide">
            Platform Settings & System Configuration
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            Configure connected VCS repositories, notification routing, alert ingestion webhooks, access control, and API tokens.
          </p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex border-b border-zinc-800 space-x-1 sm:space-x-2 overflow-x-auto font-mono">
          <button
            onClick={() => setActiveTab("repos")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono border-b-2 transition-colors whitespace-nowrap",
              activeTab === "repos"
                ? "border-emerald-400 text-emerald-400 bg-emerald-950/20 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Repositories ({repos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono border-b-2 transition-colors whitespace-nowrap",
              activeTab === "notifications"
                ? "border-emerald-400 text-emerald-400 bg-emerald-950/20 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab("sources")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono border-b-2 transition-colors whitespace-nowrap",
              activeTab === "sources"
                ? "border-emerald-400 text-emerald-400 bg-emerald-950/20 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Error Sources ({mockSources.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("team")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono border-b-2 transition-colors whitespace-nowrap",
              activeTab === "team"
                ? "border-emerald-400 text-emerald-400 bg-emerald-950/20 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Members ({teamMembers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("keys")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2.5 text-xs font-mono border-b-2 transition-colors whitespace-nowrap",
              activeTab === "keys"
                ? "border-emerald-400 text-emerald-400 bg-emerald-950/20 font-bold"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys ({apiKeys.length})</span>
          </button>
        </div>

        {/* TAB 1: Repositories */}
        {activeTab === "repos" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100">
                  Connected Code Repositories & Webhooks
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Repositories monitored for commit diff analysis, automated PR branches, and PR merge webhooks
                </p>
              </div>
              <button
                onClick={handleOpenAddRepoModal}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-md shadow-cyan-500/10"
              >
                <Plus className="w-4 h-4" />
                <span>Connect Repository</span>
              </button>
            </div>

            {/* GitHub Webhook Instructions Card */}
            <div className="p-6 rounded-2xl border border-cyan-900/50 bg-slate-900/70 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-cyan-900/30 pb-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    GitHub Webhook Integration Setup Instructions
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-2 py-0.5 rounded">
                  Real-time PR Merge Receiver
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                To enable automatic PR merge detection, add a Webhook in your GitHub Repository settings (<code className="text-cyan-300">Settings → Webhooks → Add webhook</code>):
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] font-semibold uppercase">Payload URL:</span>
                  <div className="flex items-center justify-between gap-2 text-cyan-300">
                    <span className="truncate">{getWebhookUrl()}</span>
                    <button
                      onClick={handleCopyWebhookUrl}
                      className="p-1 rounded hover:bg-slate-800 text-slate-400 shrink-0"
                      title="Copy URL"
                    >
                      {copiedWebhookUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 text-[11px] font-semibold uppercase">Configuration Details:</span>
                  <ul className="text-slate-300 text-[11px] space-y-0.5 list-disc list-inside">
                    <li>Content type: <code className="text-cyan-300">application/json</code></li>
                    <li>Events: Select <code className="text-cyan-300">Pull requests</code></li>
                    <li>Secret: Value of <code className="text-cyan-300">GITHUB_WEBHOOK_SECRET</code> in <code className="text-slate-400">.env</code></li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col space-y-4 shadow-xl"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-bold font-mono text-slate-100">
                          {repo.name}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                          {repo.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">
                        Target branch: <code className="text-cyan-300">{repo.branch}</code> | Incidents: {repo.incidentsCount}
                      </p>
                    </div>

                    {/* Deployment Tracking Toggle */}
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-200 font-mono block">
                          Deployment Confirmation Tracking
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {repo.deploymentTrackingEnabled
                            ? "ON: Merge → DEPLOYED (Requires manual resolution)"
                            : "OFF: Merge → RESOLVED (Auto-resolves incident)"}
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={repo.deploymentTrackingEnabled || false}
                          onChange={(e) => handleToggleDeployTracking(repo.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Notifications */}
        {activeTab === "notifications" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Incident Notification Channels & Toggles
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Decoupled event-driven notification routing via Slack incoming webhooks and Resend email API.
              </p>
            </div>

            {isLoadingNotifs ? (
              <div className="flex items-center justify-center p-12 text-cyan-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSaveNotifications} className="space-y-6">
                {/* Channel Toggles & Configurations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Slack Configuration Card */}
                  <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-5 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-sm font-bold text-slate-100">Slack Webhook Channel</h3>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slackEnabled}
                          onChange={(e) => setSlackEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300 font-mono">
                        Slack Incoming Webhook URL
                      </label>
                      <input
                        type="text"
                        placeholder="https://hooks.slack.com/services/T00/B00/XXXX"
                        value={slackWebhookUrl}
                        onChange={(e) => setSlackWebhookUrl(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                      />
                      <p className="text-[11px] text-slate-500">
                        Webhook URL saved securely in NotificationSettings for your organization.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={handleSendTestSlack}
                        disabled={isTestingSlack}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800 hover:bg-emerald-900/60 transition-colors disabled:opacity-50"
                      >
                        {isTestingSlack ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Send Test Slack Notification</span>
                      </button>
                    </div>

                    {testSlackFeedback && (
                      <div
                        className={cn(
                          "p-3 rounded-lg text-xs font-mono border flex items-center gap-2",
                          testSlackFeedback.success
                            ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                            : "bg-rose-950/40 border-rose-800 text-rose-300"
                        )}
                      >
                        {testSlackFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                        <span>{testSlackFeedback.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Email Configuration Card */}
                  <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-5 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-sm font-bold text-slate-100">Resend Email Channel</h3>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={emailEnabled}
                          onChange={(e) => setEmailEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                      </label>
                    </div>

                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      Emails are dispatched via Resend SDK using the configured <code className="text-cyan-300 font-mono">RESEND_API_KEY</code> environment variable.
                    </p>

                    <div className="pt-8 flex items-center justify-between border-t border-slate-800/60">
                      <button
                        type="button"
                        onClick={handleSendTestEmail}
                        disabled={isTestingEmail}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800 hover:bg-cyan-900/60 transition-colors disabled:opacity-50"
                      >
                        {isTestingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Send Test Email</span>
                      </button>
                    </div>

                    {testEmailFeedback && (
                      <div
                        className={cn(
                          "p-3 rounded-lg text-xs font-mono border flex items-center gap-2",
                          testEmailFeedback.success
                            ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                            : "bg-rose-950/40 border-rose-800 text-rose-300"
                        )}
                      >
                        {testEmailFeedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <XCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                        <span>{testEmailFeedback.message}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Per-Event Alert Filtering Toggles */}
                <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4 shadow-xl">
                  <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3">
                    Per-Event Alert Routing Rules
                  </h3>

                  <div className="space-y-3 pt-1">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer">
                      <div>
                        <span className="text-xs font-semibold text-slate-200 font-mono">
                          Notify on Critical Incidents
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Send alerts immediately when an incident is ingested with CRITICAL severity
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyCriticalIncident}
                        onChange={(e) => setNotifyCriticalIncident(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer">
                      <div>
                        <span className="text-xs font-semibold text-slate-200 font-mono">
                          Notify on Hotfix PR Opened
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Send alerts when Gemini generates a patch and opens a GitHub PR (IN_REVIEW status)
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyReviewOpened}
                        onChange={(e) => setNotifyReviewOpened(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer">
                      <div>
                        <span className="text-xs font-semibold text-slate-200 font-mono">
                          Notify on Incident Resolved
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Send alerts when an incident transitions to RESOLVED status
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifyResolved}
                        onChange={(e) => setNotifyResolved(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                      />
                    </label>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-4 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingNotifs}
                    className="px-5 py-2.5 rounded-xl text-xs font-mono font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                  >
                    {isSavingNotifs ? "Saving..." : "Save Notification Settings"}
                  </button>
                  {saveNotifFeedback && (
                    <span className="text-xs font-mono text-emerald-400 animate-pulse">
                      {saveNotifFeedback}
                    </span>
                  )}
                </div>
              </form>
            )}

            {/* Notification Log Section */}
            <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex items-center justify-between">
                <span>Recent Delivery Status (NotificationLog)</span>
                <button
                  onClick={fetchNotificationSettings}
                  className="text-xs text-cyan-400 hover:underline font-mono font-normal"
                >
                  Refresh Logs
                </button>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Last Successful Notification */}
                <div className="p-4 rounded-xl border border-emerald-900/60 bg-emerald-950/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Last Successful Notification
                    </span>
                    <span className="text-slate-400">
                      {lastSuccessLog ? new Date(lastSuccessLog.timestamp).toLocaleString() : "None"}
                    </span>
                  </div>
                  {lastSuccessLog ? (
                    <div className="text-xs font-mono text-slate-300 space-y-1">
                      <p>Provider: <strong className="text-emerald-300">{lastSuccessLog.provider}</strong></p>
                      <p>Event Type: <span className="text-slate-400">{lastSuccessLog.eventType}</span></p>
                      {lastSuccessLog.recipient && <p className="text-[11px] text-slate-400 truncate">Recipient: {lastSuccessLog.recipient}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No successful notifications logged yet.</p>
                  )}
                </div>

                {/* Last Failed Notification */}
                <div className="p-4 rounded-xl border border-rose-900/60 bg-rose-950/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" /> Last Failed Notification
                    </span>
                    <span className="text-slate-400">
                      {lastFailureLog ? new Date(lastFailureLog.timestamp).toLocaleString() : "None"}
                    </span>
                  </div>
                  {lastFailureLog ? (
                    <div className="text-xs font-mono text-slate-300 space-y-1">
                      <p>Provider: <strong className="text-rose-300">{lastFailureLog.provider}</strong></p>
                      <p>Event Type: <span className="text-slate-400">{lastFailureLog.eventType}</span></p>
                      {lastFailureLog.errorMessage && <p className="text-[11px] text-rose-300 truncate">Error: {lastFailureLog.errorMessage}</p>}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No failed notifications logged yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Error Sources */}
        {activeTab === "sources" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Connected Ingestion Error Sources
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Monitoring platforms sending webhook payloads into the ingestion pipeline
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockSources.map((source) => (
                <div
                  key={source.id}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between shadow-xl"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-100">
                      {source.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Status: <span className="text-emerald-400 capitalize">{source.status}</span> | Last event: {source.lastEventAt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Team Members */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Organization Team Members
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Users with access to incident dashboards, hotfix reviews, and workflow assignments
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300 font-mono text-xs font-bold">
                      {(member.user?.name || member.user?.email || "U").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-100">
                        {member.user?.name || "Member"}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800 px-2.5 py-1 rounded-md font-bold">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: API Keys */}
        {activeTab === "keys" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100">
                  Project Ingestion API Keys
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Authentication bearer tokens for SDKs and REST ingestion POST /api/ingest
                </p>
              </div>
              <button
                onClick={() => {
                  setKeyNameInput("");
                  setGenerateError(null);
                  setIsGenerateModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-colors shadow-md shadow-cyan-500/10"
              >
                <Plus className="w-4 h-4" />
                <span>Generate New API Key</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className={cn(
                    "p-5 rounded-2xl border bg-slate-900/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl transition-colors",
                    key.revoked ? "border-slate-800/50 opacity-60" : "border-slate-800"
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-bold font-mono text-slate-100">
                        {key.name}
                      </span>
                      {key.projectName && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                          Project: {key.projectName}
                        </span>
                      )}
                      {key.revoked ? (
                        <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 border border-rose-800 px-2 py-0.5 rounded font-bold">
                          REVOKED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono pt-1">
                      <span>Prefix: <code className="text-cyan-300">{key.keyPrefix}</code></span>
                      <span>•</span>
                      <span>Created: {key.createdAt}</span>
                      <span>•</span>
                      <span>Last used: {key.lastUsedAt}</span>
                    </div>
                  </div>

                  {!key.revoked && (
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-rose-400 bg-rose-950/40 border border-rose-900 hover:bg-rose-900/40 transition-colors"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Revoke Token</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* GENERATE API KEY MODAL */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <span>Generate Ingestion API Key</span>
              </h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {generateError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-lg text-xs text-rose-300 flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{generateError}</span>
              </div>
            )}

            <form onSubmit={handleCreateApiKey} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Key Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Production Ingestion Worker"
                  value={keyNameInput}
                  onChange={(e) => setKeyNameInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Target Project <span className="text-rose-400">*</span>
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {repos.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
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

      {/* ONE-TIME REVEAL MODAL */}
      {revealedRawKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-emerald-800/80 rounded-xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 text-emerald-400">
              <ShieldCheck className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-100">
                API Key Generated Successfully
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Please copy your raw API key now. <strong className="text-rose-400">It will never be shown again!</strong>
            </p>

            <div className="space-y-2">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between font-mono text-xs text-cyan-300 break-all select-all">
                <span>{revealedRawKey}</span>
                <button
                  onClick={handleCopyRawKey}
                  className="ml-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                >
                  {copiedKeyId === "revealed-key" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
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
