'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  Hash,
  KeyRound,
  Mail,
  MessageCircle,
  Plug2,
  Plus,
  Server,
  Unplug,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type ConnectorId = 'google_drive' | 'gmail' | 'slack' | 'notion' | 'whatsapp';
type ConnectorState = 'connected' | 'ready' | 'needs_setup';

interface ConnectorDef {
  id: ConnectorId;
  label: string;
  icon: LucideIcon;
  accent: string;
  description: string;
  defaultServer: string;
  setupRequired?: boolean;
  capabilities: string[];
}

interface ConnectorConnection {
  state: ConnectorState;
  mcpServer: string;
  workspace: string;
  lastSync?: string;
}

const CONNECTORS: ConnectorDef[] = [
  {
    id: 'google_drive',
    label: 'Google Drive',
    icon: FolderOpen,
    accent: '#4285f4',
    description: 'Trip folders, contracts, passports, and itinerary exports.',
    defaultServer: 'mcp-google-drive',
    capabilities: ['Read docs', 'Write itinerary PDFs', 'Attach assets'],
  },
  {
    id: 'gmail',
    label: 'Gmail',
    icon: Mail,
    accent: '#ea4335',
    description: 'Traveler updates, operator follow-ups, and confirmations.',
    defaultServer: 'mcp-gmail',
    capabilities: ['Draft email', 'Send email', 'Search threads'],
  },
  {
    id: 'slack',
    label: 'Slack',
    icon: Hash,
    accent: '#4a154b',
    description: 'Team notifications, approval pings, and launch alerts.',
    defaultServer: 'mcp-slack',
    setupRequired: true,
    capabilities: ['Post updates', 'Read channels', 'Create reminders'],
  },
  {
    id: 'notion',
    label: 'Notion',
    icon: FileText,
    accent: '#1f2937',
    description: 'Briefs, itineraries, quote summaries, and trip databases.',
    defaultServer: 'mcp-notion',
    setupRequired: true,
    capabilities: ['Sync pages', 'Update databases', 'Publish briefs'],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    accent: '#25d366',
    description: 'Operator negotiations and traveler coordination.',
    defaultServer: 'mcp-whatsapp',
    capabilities: ['Send messages', 'Read replies', 'Log thread'],
  },
];

function initialConnections(tripId: string): Record<ConnectorId, ConnectorConnection> {
  return {
    google_drive: {
      state: 'ready',
      mcpServer: 'mcp-google-drive',
      workspace: `Noma/${tripId}`,
    },
    gmail: {
      state: 'ready',
      mcpServer: 'mcp-gmail',
      workspace: `trip:${tripId}`,
    },
    slack: {
      state: 'needs_setup',
      mcpServer: 'mcp-slack',
      workspace: '#trip-ops',
    },
    notion: {
      state: 'needs_setup',
      mcpServer: 'mcp-notion',
      workspace: 'Trips database',
    },
    whatsapp: {
      state: 'connected',
      mcpServer: 'mcp-whatsapp',
      workspace: `operators/${tripId}`,
      lastSync: '12m ago',
    },
  };
}

const STATUS_STYLES: Record<ConnectorState, string> = {
  connected: 'bg-[#d3eada] text-[#1f5742]',
  ready: 'bg-[#eef] text-[#446]',
  needs_setup: 'bg-[#fff3d4] text-[#7a5410]',
};

const STATUS_LABELS: Record<ConnectorState, string> = {
  connected: 'Connected',
  ready: 'Ready',
  needs_setup: 'Needs MCP',
};

export function ConnectorsPanel({ tripId }: { tripId: string }) {
  const [connections, setConnections] = useState(() => initialConnections(tripId));
  const [editingId, setEditingId] = useState<ConnectorId | null>(null);
  const [draftServer, setDraftServer] = useState('');
  const [draftWorkspace, setDraftWorkspace] = useState('');

  function startSetup(def: ConnectorDef) {
    const connection = connections[def.id];
    setEditingId(def.id);
    setDraftServer(connection.mcpServer || def.defaultServer);
    setDraftWorkspace(connection.workspace);
  }

  function connect(def: ConnectorDef) {
    if (connections[def.id].state === 'needs_setup') {
      startSetup(def);
      return;
    }

    setConnections((current) => ({
      ...current,
      [def.id]: {
        ...current[def.id],
        state: 'connected',
        lastSync: 'Just now',
      },
    }));
  }

  function disconnect(def: ConnectorDef) {
    setConnections((current) => ({
      ...current,
      [def.id]: {
        ...current[def.id],
        state: def.setupRequired ? 'needs_setup' : 'ready',
        lastSync: undefined,
      },
    }));
  }

  function saveSetup(def: ConnectorDef) {
    const server = draftServer.trim();
    if (!server) return;

    setConnections((current) => ({
      ...current,
      [def.id]: {
        ...current[def.id],
        state: 'connected',
        mcpServer: server,
        workspace: draftWorkspace.trim() || current[def.id].workspace,
        lastSync: 'Just now',
      },
    }));
    setEditingId(null);
  }

  return (
    <div className="surface divide-y divide-border">
      {CONNECTORS.map((connector) => {
        const Icon = connector.icon;
        const connection = connections[connector.id];
        const isConnected = connection.state === 'connected';
        const isEditing = editingId === connector.id;

        return (
          <div key={connector.id} className="p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div className="flex gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
                  style={{ backgroundColor: `${connector.accent}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color: connector.accent }} strokeWidth={1.75} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-ink">{connector.label}</span>
                    <span className={`inline-flex items-center gap-1 text-2xs font-medium px-1.5 py-0.5 rounded ${STATUS_STYLES[connection.state]}`}>
                      {isConnected ? (
                        <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2} />
                      ) : connection.state === 'needs_setup' ? (
                        <Server className="w-2.5 h-2.5" strokeWidth={2} />
                      ) : (
                        <Plug2 className="w-2.5 h-2.5" strokeWidth={2} />
                      )}
                      {STATUS_LABELS[connection.state]}
                    </span>
                    {connection.lastSync && (
                      <span className="inline-flex items-center gap-1 text-2xs text-muted">
                        <Clock3 className="w-2.5 h-2.5" strokeWidth={1.75} />
                        {connection.lastSync}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-muted mt-0.5">{connector.description}</div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {connector.capabilities.map((capability) => (
                      <span key={capability} className="chip">
                        {capability}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Server className="w-2.5 h-2.5" strokeWidth={1.75} />
                      {connection.mcpServer}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <KeyRound className="w-2.5 h-2.5" strokeWidth={1.75} />
                      {connection.workspace}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex md:justify-end gap-2">
                {isConnected ? (
                  <>
                    <button onClick={() => startSetup(connector)} className="btn btn-outline h-8 text-xs px-2.5">
                      <Server className="w-3.5 h-3.5" strokeWidth={1.75} />
                      MCP
                    </button>
                    <button onClick={() => disconnect(connector)} className="btn btn-outline h-8 text-xs px-2.5">
                      <Unplug className="w-3.5 h-3.5" strokeWidth={1.75} />
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button onClick={() => connect(connector)} className="btn btn-outline h-8 text-xs px-2.5">
                    {connection.state === 'needs_setup' ? (
                      <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
                    ) : (
                      <Plug2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                    )}
                    {connection.state === 'needs_setup' ? 'Add MCP' : 'Connect'}
                  </button>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                <label className="block">
                  <span className="text-2xs font-medium text-muted">MCP server</span>
                  <input
                    value={draftServer}
                    onChange={(event) => setDraftServer(event.target.value)}
                    className="mt-1 w-full h-8 px-2.5 rounded border border-border bg-panel text-xs text-ink outline-none focus:ring-1 focus:ring-accent/40"
                    placeholder={connector.defaultServer}
                  />
                </label>
                <label className="block">
                  <span className="text-2xs font-medium text-muted">Workspace</span>
                  <input
                    value={draftWorkspace}
                    onChange={(event) => setDraftWorkspace(event.target.value)}
                    className="mt-1 w-full h-8 px-2.5 rounded border border-border bg-panel text-xs text-ink outline-none focus:ring-1 focus:ring-accent/40"
                    placeholder={connection.workspace}
                  />
                </label>
                <div className="flex items-end gap-2">
                  <button onClick={() => saveSetup(connector)} className="btn btn-primary h-8 text-xs px-3">
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn btn-outline h-8 text-xs px-3">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
