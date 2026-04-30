'use client';

import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  X,
  XCircle,
} from 'lucide-react';

type Lead = {
  id: string;
  company: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  description?: string;
  source_url?: string;
  status: 'new' | 'sent' | string;
  created_at?: string;
  sent_at?: string;
};

type WorkflowEvent = {
  type: string;
  step?: string;
  status?: string;
  message?: string;
  data?: any;
  run_id?: string;
};

const FASTAPI_BASE = process.env.NEXT_PUBLIC_FASTAPI_BASE_URL ?? 'http://127.0.0.1:8000';

export default function LeadsDiscoverPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scrapeOpen, setScrapeOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch(`${FASTAPI_BASE}/api/leads`);
      if (res.ok) setLeads(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLeads(); }, []);

  async function streamWorkflow(name: string, payload: Record<string, unknown>, title: string) {
    if (running) return;
    setDrawerTitle(title);
    setScrapeOpen(true);
    setRunning(true);
    setEvents([]);

    try {
      const res = await fetch(`/api/workflows/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok || !res.body) {
        setEvents([{ type: 'error', message: await res.text().catch(() => 'Request failed') }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);
          if (!chunk.startsWith('data:')) continue;
          try {
            const evt = JSON.parse(chunk.replace(/^data:\s*/, '')) as WorkflowEvent;
            setEvents((prev) => [...prev, evt]);
            if (evt.type === 'done' || evt.type === 'error') setRunning(false);
          } catch { continue; }
        }
      }
    } catch (err: any) {
      setEvents([{ type: 'error', message: err?.message ?? 'Workflow failed' }]);
    } finally {
      setRunning(false);
      fetchLeads();
    }
  }

  function handleScrape() {
    if (!scrapeUrl.trim()) return;
    streamWorkflow('scrape-leads', { target_url: scrapeUrl.trim() }, 'Scraping leads');
    setScrapeUrl('');
  }

  function handleSendEmail(lead: Lead) {
    streamWorkflow('cold-email', { lead_id: lead.id }, `Emailing ${lead.company || lead.email}`);
  }

  const finalEvent = [...events].reverse().find((e) => e.type === 'done' || e.type === 'error');
  const respondData = events.find((e) => e.step === 'respond' && e.status === 'success')?.data;
  const appendData = events.find((e) => e.step === 'append_sheet' && e.status === 'success')?.data;

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">Lead Discovery</h1>
            <p className="text-sm text-muted mt-0.5">Scrape contacts from any URL and send personalized cold emails</p>
          </div>
          <button
            onClick={fetchLeads}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-ink2 hover:text-ink px-3 h-8 rounded border border-border hover:bg-hover"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.75} />
            Refresh
          </button>
        </div>

        {/* Scrape form */}
        <div className="surface p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" strokeWidth={1.75} />
            <input
              type="url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScrape()}
              placeholder="https://example.com/team — paste any URL to scrape contacts"
              className="w-full pl-9 pr-3 h-9 rounded border border-border bg-background text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <button
            onClick={handleScrape}
            disabled={running || !scrapeUrl.trim()}
            className="btn btn-primary h-9 text-xs px-4 flex items-center gap-1.5 disabled:opacity-50"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Scrape new leads
          </button>
        </div>

        {/* Leads table */}
        <div className="surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-panel/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">Company</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading leads…
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted text-sm">
                    No leads yet — paste a URL above to scrape your first batch.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-hover/50">
                    <td className="px-4 py-3 font-medium text-ink">
                      {lead.company || '—'}
                      {lead.website && (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-1.5 text-2xs text-accent hover:underline"
                        >
                          ↗
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink2">{lead.contact_name || '—'}</td>
                    <td className="px-4 py-3 text-ink2">{lead.email || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full font-medium ${
                          lead.status === 'sent'
                            ? 'bg-success/10 text-success'
                            : 'bg-panel text-ink2 border border-border'
                        }`}
                      >
                        {lead.status === 'sent' ? '✓ Sent' : 'New'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs">
                      {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSendEmail(lead)}
                        disabled={running || lead.status === 'sent' || !lead.email}
                        className="flex items-center gap-1.5 text-xs px-3 h-7 rounded border border-border hover:bg-hover disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
                      >
                        <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                        {lead.status === 'sent' ? 'Sent' : 'Compose & send'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Workflow drawer */}
      {scrapeOpen && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close drawer"
            className="absolute inset-0 bg-ink/20"
            onClick={() => !running && setScrapeOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-panel border-l border-border shadow-xl flex flex-col">
            <div className="h-14 px-4 border-b border-border flex items-center justify-between">
              <div className="text-sm font-medium text-ink">{drawerTitle}</div>
              <button
                aria-label="Close"
                onClick={() => setScrapeOpen(false)}
                disabled={running}
                className="w-8 h-8 rounded grid place-items-center text-ink2 hover:bg-hover disabled:opacity-40"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {events.length === 0 && (
                <div className="text-sm text-muted inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting…
                </div>
              )}
              {events.filter((e) => e.type === 'step').map((e, i) => (
                <div key={`${e.step}-${e.status}-${i}`} className="surface p-3 flex items-start gap-3">
                  <div className="mt-0.5">
                    {e.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
                    {e.status === 'success' && <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={1.75} />}
                    {e.status === 'error' && <XCircle className="w-4 h-4 text-danger" strokeWidth={1.75} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{formatStep(e.step)}</div>
                    <div className="text-2xs text-muted capitalize">{e.status}</div>
                    {e.status === 'success' && e.data && (
                      <div className="text-2xs text-muted mt-0.5">
                        {e.step === 'append_sheet' && `${e.data.saved ?? 0} leads saved`}
                        {e.step === 'dedupe' && `${e.data.dupes_skipped ?? 0} duplicates skipped`}
                        {e.step === 'send_email' && (e.data.email_sent ? 'Email sent ✓' : 'Email not sent')}
                        {e.step === 'respond' && e.data.status}
                      </div>
                    )}
                    {e.status === 'error' && e.data?.error && (
                      <div className="text-2xs text-danger mt-0.5">{e.data.error}</div>
                    )}
                  </div>
                </div>
              ))}

              {finalEvent?.type === 'error' && (
                <div className="surface p-3 text-sm text-danger">
                  {finalEvent.message ?? 'Workflow failed'}
                </div>
              )}

              {finalEvent?.type === 'done' && (
                <div className="surface p-3 text-sm text-success">
                  {appendData
                    ? `Done — ${appendData.saved ?? 0} new leads saved`
                    : respondData?.email_sent
                    ? 'Email sent successfully'
                    : 'Workflow complete'}
                </div>
              )}
            </div>

            <div className="border-t border-border p-4 text-xs text-muted">
              {running ? 'Running…' : finalEvent?.type === 'done' ? 'Finished' : 'Idle'}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function formatStep(step?: string) {
  if (!step) return 'Step';
  return step.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
