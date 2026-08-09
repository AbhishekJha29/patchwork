"use client";

import React, { useState } from "react";
import { Incident, ConnectedRepo, OrgMember } from "@/lib/types";
import { SidebarNav, NavView } from "./SidebarNav";
import { PaneIncidentList } from "./PaneIncidentList";
import { PaneIncidentDetail } from "./PaneIncidentDetail";
import { PaneOperatorConsole } from "./PaneOperatorConsole";
import { PullRequestsView } from "./PullRequestsView";
import { VerificationView } from "./VerificationView";
import { SettingsClient, RealApiKey } from "@/app/settings/SettingsClient";

interface WorkspaceLayoutProps {
  initialIncidents: Incident[];
  initialProjects?: ConnectedRepo[];
  initialTeamMembers?: OrgMember[];
  initialApiKeys?: RealApiKey[];
  initialView?: NavView;
  initialSelectedIncidentId?: string | null;
}

export function WorkspaceLayout({
  initialIncidents,
  initialProjects = [],
  initialTeamMembers = [],
  initialApiKeys = [],
  initialView = "command_center",
  initialSelectedIncidentId,
}: WorkspaceLayoutProps) {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [currentView, setCurrentView] = useState<NavView>(initialView);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(
    initialSelectedIncidentId !== undefined
      ? initialSelectedIncidentId
      : initialIncidents[0]?.id || null
  );

  // Find currently selected incident
  const selectedIncident =
    incidents.find((i) => i.id === selectedIncidentId) ||
    incidents[0] ||
    null;

  const pullRequestsCount = incidents.filter(
    (i) => i.fix?.diff || i.fix?.prUrl
  ).length;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08090a] font-mono text-[#c9d1d9] console-scanlines">
      {/* PANE 1 — Left Sidebar (fixed width ~200px, persistent across all views) */}
      <SidebarNav
        currentView={currentView}
        onSelectView={(view) => setCurrentView(view)}
        incidentsCount={incidents.length}
        reposCount={initialProjects.length}
        prsCount={pullRequestsCount}
      />

      {/* Main Workspace Area (Renders Panes 2, 3, 4 when in Command Center / Incidents mode) */}
      <main className="flex-1 flex overflow-hidden">
        {(currentView === "command_center" || currentView === "incidents") && (
          <>
            {/* PANE 2 — Incident List (narrow column ~280px) */}
            <PaneIncidentList
              incidents={incidents}
              selectedId={selectedIncidentId}
              onSelectIncident={(id) => setSelectedIncidentId(id)}
            />

            {/* PANE 3 — Incident Detail (main / widest panel) */}
            <PaneIncidentDetail incident={selectedIncident} />

            {/* PANE 4 — Right Sidebar OPERATOR CONSOLE (~220px) */}
            <PaneOperatorConsole incident={selectedIncident} />
          </>
        )}

        {currentView === "repositories" && (
          <div className="flex-1 overflow-y-auto">
            <SettingsClient
              initialProjects={initialProjects}
              initialTeamMembers={initialTeamMembers}
              initialApiKeys={initialApiKeys}
              defaultTab="repos"
              hideNavbar
            />
          </div>
        )}

        {currentView === "pull_requests" && (
          <PullRequestsView incidents={incidents} />
        )}

        {currentView === "verification" && (
          <VerificationView incidents={incidents} />
        )}

        {currentView === "settings" && (
          <div className="flex-1 overflow-y-auto">
            <SettingsClient
              initialProjects={initialProjects}
              initialTeamMembers={initialTeamMembers}
              initialApiKeys={initialApiKeys}
              defaultTab="repos"
              hideNavbar
            />
          </div>
        )}
      </main>
    </div>
  );
}
