'use client';

import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import type { ItineraryDay } from '@/lib/types';

interface Props {
  days: ItineraryDay[];
  startDate: string;
  onChange: (days: ItineraryDay[]) => void;
}

const INPUT = 'w-full px-2.5 py-1.5 rounded border border-border bg-panel text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/50';

export function ItineraryEditor({ days, startDate, onChange }: Props) {
  function addDay() {
    const n = days.length + 1;
    const date = startDate
      ? offsetDate(startDate, days.length)
      : '';
    onChange([
      ...days,
      { day: n, date, location: '', activities: [''], transit: '', lodging: '' },
    ]);
  }

  function removeDay(i: number) {
    const next = days.filter((_, idx) => idx !== i).map((d, idx) => ({ ...d, day: idx + 1 }));
    onChange(next);
  }

  function moveUp(i: number) {
    if (i === 0) return;
    const next = [...days];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next.map((d, idx) => ({ ...d, day: idx + 1 })));
  }

  function moveDown(i: number) {
    if (i === days.length - 1) return;
    const next = [...days];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next.map((d, idx) => ({ ...d, day: idx + 1 })));
  }

  function updateDay(i: number, patch: Partial<ItineraryDay>) {
    onChange(days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }

  function updateActivity(dayIdx: number, actIdx: number, val: string) {
    const acts = [...days[dayIdx].activities];
    acts[actIdx] = val;
    updateDay(dayIdx, { activities: acts });
  }

  function addActivity(dayIdx: number) {
    updateDay(dayIdx, { activities: [...days[dayIdx].activities, ''] });
  }

  function removeActivity(dayIdx: number, actIdx: number) {
    const acts = days[dayIdx].activities.filter((_, i) => i !== actIdx);
    updateDay(dayIdx, { activities: acts.length ? acts : [''] });
  }

  return (
    <div className="space-y-3">
      {days.length === 0 && (
        <div className="text-sm text-muted text-center py-6 border border-dashed border-border rounded-lg">
          No days yet — add your first day below.
        </div>
      )}

      {days.map((day, i) => (
        <div key={i} className="rounded-lg border border-border bg-panel/60 overflow-hidden">
          {/* Day header */}
          <div className="flex items-center gap-2 px-3 py-2 bg-hover/60 border-b border-border">
            <span className="text-xs font-mono font-semibold text-accent shrink-0">Day {day.day}</span>
            <input
              className={`${INPUT} flex-1`}
              placeholder="Location / destination"
              value={day.location}
              onChange={(e) => updateDay(i, { location: e.target.value })}
            />
            <input
              type="date"
              className={`${INPUT} w-36`}
              value={day.date}
              onChange={(e) => updateDay(i, { date: e.target.value })}
            />
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => moveUp(i)} disabled={i === 0} className="w-6 h-6 grid place-items-center rounded hover:bg-border disabled:opacity-30">
                <ChevronUp className="w-3 h-3" />
              </button>
              <button onClick={() => moveDown(i)} disabled={i === days.length - 1} className="w-6 h-6 grid place-items-center rounded hover:bg-border disabled:opacity-30">
                <ChevronDown className="w-3 h-3" />
              </button>
              <button onClick={() => removeDay(i)} className="w-6 h-6 grid place-items-center rounded hover:bg-red-50 text-red-400 hover:text-red-600">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Day body */}
          <div className="p-3 space-y-3">
            {/* Activities */}
            <div>
              <div className="text-xs font-medium text-ink2 mb-1.5">Activities</div>
              <div className="space-y-1.5">
                {day.activities.map((act, ai) => (
                  <div key={ai} className="flex items-center gap-1.5">
                    <span className="text-muted text-xs w-4 text-right shrink-0">{ai + 1}.</span>
                    <input
                      className={`${INPUT} flex-1`}
                      placeholder="Activity description"
                      value={act}
                      onChange={(e) => updateActivity(i, ai, e.target.value)}
                    />
                    <button
                      onClick={() => removeActivity(i, ai)}
                      disabled={day.activities.length === 1}
                      className="w-6 h-6 grid place-items-center rounded hover:bg-red-50 text-muted hover:text-red-500 disabled:opacity-20"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addActivity(i)}
                  className="flex items-center gap-1 text-xs text-accent hover:underline mt-0.5 ml-5"
                >
                  <Plus className="w-3 h-3" /> Add activity
                </button>
              </div>
            </div>

            {/* Transit + Lodging */}
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-ink2">Transit</span>
                <input
                  className={INPUT}
                  placeholder="e.g. Trek 6 h"
                  value={day.transit}
                  onChange={(e) => updateDay(i, { transit: e.target.value })}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-ink2">Lodging</span>
                <input
                  className={INPUT}
                  placeholder="e.g. Mountain Tea House"
                  value={day.lodging}
                  onChange={(e) => updateDay(i, { lodging: e.target.value })}
                />
              </label>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addDay}
        className="flex items-center gap-1.5 text-sm text-accent hover:underline"
      >
        <Plus className="w-4 h-4" /> Add day
      </button>
    </div>
  );
}

function offsetDate(base: string, offsetDays: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
