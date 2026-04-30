'use client';

import { useState } from 'react';
import { CheckCircle2, Loader2, Plane, X, XCircle } from 'lucide-react';

type WorkflowEvent = {
  type: string;
  step?: string;
  status?: string;
  message?: string;
  data?: any;
  run_id?: string;
};

type TripWorkflowPayload = {
  trip_id: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: number;
  traveler_email?: string;
  origin: string;
  travelers: number;
  style: string[];
  must_haves: string[];
};

export function ItineraryWorkflowActions({ payload }: { payload: TripWorkflowPayload }) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<WorkflowEvent[]>([]);

  async function runBasic() {
    if (running) return;
    setOpen(true);
    setRunning(true);
    setEvents([]);

    try {
      const res = await fetch('/api/workflows/itinerary-basic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => 'request failed');
        setEvents([{ type: 'error', message: text }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);
          if (!chunk.startsWith('data:')) continue;
          try {
            const evt = JSON.parse(chunk.replace(/^data:\s*/, '')) as WorkflowEvent;
            setEvents((current) => [...current, evt]);
            if (evt.type === 'done' || evt.type === 'error') {
              setRunning(false);
            }
          } catch {
            continue;
          }
        }
      }
    } catch (error: any) {
      setEvents([{ type: 'error', message: error?.message ?? 'Workflow failed' }]);
    } finally {
      setRunning(false);
    }
  }

  const finalEvent = [...events].reverse().find((event) => event.type === 'done' || event.type === 'error');
  const response = events.find((event) => event.step === 'respond' && event.status === 'success')?.data;

  return (
    <>
      <button onClick={runBasic} disabled={running} className="btn btn-primary h-8 text-xs px-3">
        {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plane className="w-3.5 h-3.5" strokeWidth={1.75} />}
        Basic itinerary
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close workflow drawer"
            className="absolute inset-0 bg-ink/20"
            onClick={() => !running && setOpen(false)}
          />
          <aside className="absolute right-0 top-0 h-full w-full max-w-md bg-panel border-l border-border shadow-xl flex flex-col">
            <div className="h-14 px-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-ink">Itinerary workflow</div>
                <div className="text-2xs text-muted">{payload.destination}</div>
              </div>
              <button
                aria-label="Close"
                onClick={() => setOpen(false)}
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
                  Starting
                </div>
              )}
              {events.filter((event) => event.type === 'step').map((event, index) => (
                <div key={`${event.step}-${event.status}-${index}`} className="surface p-3 flex items-start gap-3">
                  <div className="mt-0.5">
                    {event.status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
                    {event.status === 'success' && <CheckCircle2 className="w-4 h-4 text-success" strokeWidth={1.75} />}
                    {event.status === 'error' && <XCircle className="w-4 h-4 text-danger" strokeWidth={1.75} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{formatStep(event.step)}</div>
                    <div className="text-2xs text-muted capitalize">{event.status}</div>
                  </div>
                </div>
              ))}

              {finalEvent?.type === 'error' && (
                <div className="surface p-3 text-sm text-danger">
                  {finalEvent.message ?? 'Workflow failed'}
                </div>
              )}

              {response?.itinerary_url && (
                <a
                  href={response.itinerary_url}
                  target="_blank"
                  className="btn btn-outline w-full h-9 text-xs mt-3"
                >
                  Open itinerary
                </a>
              )}
            </div>

            <div className="border-t border-border p-4 text-xs text-muted">
              {running ? 'Running' : response?.email_sent ? 'Email sent' : finalEvent?.type === 'done' ? 'Finished' : 'Idle'}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function formatStep(step?: string) {
  if (!step) return 'Workflow';
  return step.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
