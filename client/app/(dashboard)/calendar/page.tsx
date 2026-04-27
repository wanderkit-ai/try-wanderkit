'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { calendarEvents } from '@/lib/mock-data';
import type { CalendarEvent } from '@/lib/mock-data';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Plane,
  AlertCircle,
  CheckSquare,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type View = 'month' | 'week' | 'day' | 'year';

const KIND_STYLE: Record<CalendarEvent['kind'], { color: string; bg: string; icon: React.ComponentType<any> }> = {
  meeting:   { color: 'hsl(168 41% 33%)',   bg: 'hsl(168 35% 92%)',  icon: Clock },
  departure: { color: 'hsl(220 70% 50%)',   bg: 'hsl(220 70% 94%)',  icon: Plane },
  return:    { color: 'hsl(145 50% 38%)',   bg: 'hsl(145 40% 92%)',  icon: ArrowLeft },
  deadline:  { color: 'hsl(0 65% 50%)',     bg: 'hsl(0 65% 94%)',    icon: AlertCircle },
  task:      { color: 'hsl(35 90% 45%)',    bg: 'hsl(35 90% 92%)',   icon: CheckSquare },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function eventsForDate(date: string) {
  return calendarEvents.filter((e) => e.date === date);
}

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function CalendarPage() {
  const today = new Date();
  const [view, setView] = useState<View>('month');
  const [current, setCurrent] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = current.getFullYear();
  const month = current.getMonth();

  function navigate(delta: number) {
    const next = new Date(current);
    if (view === 'month') next.setMonth(month + delta);
    else if (view === 'week') next.setDate(next.getDate() + delta * 7);
    else if (view === 'day') next.setDate(next.getDate() + delta);
    else if (view === 'year') next.setFullYear(year + delta);
    setCurrent(next);
  }

  function goToday() {
    setCurrent(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  const headerLabel = useMemo(() => {
    if (view === 'month') return `${MONTH_NAMES[month]} ${year}`;
    if (view === 'year') return `${year}`;
    if (view === 'week') {
      const start = new Date(current);
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()} – ${MONTH_SHORT[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    }
    return current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }, [view, current, month, year]);

  // Build month grid cells
  const monthCells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevDays = new Date(year, month, 0).getDate();
    const cells: { date: string; inMonth: boolean; day: number }[] = [];
    for (let i = 0; i < firstDay; i++) {
      const d = prevDays - firstDay + 1 + i;
      cells.push({ date: isoDate(year, month - 1, d), inMonth: false, day: d });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: isoDate(year, month, d), inMonth: true, day: d });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ date: isoDate(year, month + 1, d), inMonth: false, day: d });
    }
    return cells;
  }, [year, month]);

  // Build week grid
  const weekDays = useMemo(() => {
    const start = new Date(current);
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [current]);

  const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7am-8pm

  const selectedEvents = selectedDate ? eventsForDate(selectedDate) : [];

  return (
    <>
      <PageHeader
        icon="🗓️"
        title="Calendar"
        description="Meetings, trip departures, deadlines, and tasks — all in one place."
        actions={
          <button className="btn btn-primary h-9 px-3 text-sm">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            Add event
          </button>
        }
      />
      <div className="px-12 pb-12">

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={goToday} className="btn btn-outline h-8 px-3 text-xs">Today</button>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="w-7 h-7 grid place-items-center rounded border border-border bg-panel hover:bg-hover">
              <ChevronLeft className="w-4 h-4 text-ink2" strokeWidth={2} />
            </button>
            <button onClick={() => navigate(1)} className="w-7 h-7 grid place-items-center rounded border border-border bg-panel hover:bg-hover">
              <ChevronRight className="w-4 h-4 text-ink2" strokeWidth={2} />
            </button>
          </div>
          <h2 className="text-sm font-semibold text-ink min-w-[200px]">{headerLabel}</h2>
          <div className="ml-auto flex gap-1 p-1 rounded-lg" style={{ background: 'hsl(var(--hover))' }}>
            {(['month', 'week', 'day', 'year'] as View[]).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className="h-7 px-3 rounded text-xs font-medium transition-all capitalize"
                style={{
                  background: view === v ? 'hsl(var(--panel))' : 'transparent',
                  color: view === v ? 'hsl(var(--ink))' : 'hsl(var(--ink-2))',
                  boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          {/* Main calendar */}
          <div className="flex-1 min-w-0">

            {/* ── MONTH VIEW ── */}
            {view === 'month' && (
              <div className="surface overflow-hidden">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-border">
                  {DAY_NAMES.map((d) => (
                    <div key={d} className="py-2 text-center text-xs font-medium text-muted uppercase tracking-wide">
                      {d}
                    </div>
                  ))}
                </div>
                {/* Grid */}
                <div className="grid grid-cols-7 divide-x divide-y divide-border">
                  {monthCells.map((cell) => {
                    const events = eventsForDate(cell.date);
                    const isToday = cell.date === todayStr();
                    const isSelected = cell.date === selectedDate;
                    return (
                      <div
                        key={cell.date}
                        onClick={() => setSelectedDate(cell.date === selectedDate ? null : cell.date)}
                        className="min-h-[100px] p-1.5 cursor-pointer transition-colors hover:bg-hover/50"
                        style={{
                          background: isSelected ? 'hsl(var(--accent-soft))' : undefined,
                          opacity: cell.inMonth ? 1 : 0.4,
                        }}
                      >
                        <div className={cn(
                          'w-6 h-6 grid place-items-center text-xs font-medium rounded-full mb-1',
                          isToday ? 'bg-accent text-white' : 'text-ink'
                        )}>
                          {cell.day}
                        </div>
                        <div className="space-y-0.5">
                          {events.slice(0, 3).map((e) => {
                            const s = KIND_STYLE[e.kind];
                            const Icon = s.icon;
                            return (
                              <div key={e.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-2xs truncate font-medium"
                                style={{ background: s.bg, color: s.color }}>
                                <Icon className="w-2.5 h-2.5 shrink-0" strokeWidth={2} />
                                <span className="truncate">{e.title}</span>
                              </div>
                            );
                          })}
                          {events.length > 3 && (
                            <div className="text-2xs text-muted px-1.5">+{events.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── WEEK VIEW ── */}
            {view === 'week' && (
              <div className="surface overflow-auto">
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
                  <div />
                  {weekDays.map((date) => {
                    const d = new Date(date);
                    const isToday = date === todayStr();
                    return (
                      <div key={date} className="py-2 text-center">
                        <div className="text-2xs text-muted uppercase tracking-wide">{DAY_NAMES[d.getDay()]}</div>
                        <div className={cn(
                          'w-7 h-7 grid place-items-center text-sm font-medium rounded-full mx-auto',
                          isToday ? 'bg-accent text-white' : 'text-ink'
                        )}>
                          {d.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-[60px_repeat(7,1fr)]">
                  {HOURS.map((h) => (
                    <>
                      <div key={`h-${h}`} className="border-t border-border py-2 px-2 text-right text-2xs text-muted">
                        {h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}
                      </div>
                      {weekDays.map((date) => {
                        const events = eventsForDate(date).filter((e) => {
                          if (!e.time) return false;
                          const eH = parseInt(e.time.split(':')[0]);
                          return eH === h;
                        });
                        return (
                          <div key={`${date}-${h}`} className="border-t border-border border-l min-h-[48px] p-0.5">
                            {events.map((e) => {
                              const s = KIND_STYLE[e.kind];
                              const Icon = s.icon;
                              return (
                                <div key={e.id} className="rounded px-1.5 py-1 text-2xs font-medium mb-0.5"
                                  style={{ background: s.bg, color: s.color }}>
                                  <div className="flex items-center gap-1 truncate">
                                    <Icon className="w-2.5 h-2.5 shrink-0" strokeWidth={2} />
                                    <span className="truncate">{e.title}</span>
                                  </div>
                                  {e.time && <div className="text-2xs opacity-70 mt-0.5">{e.time}{e.endTime ? `–${e.endTime}` : ''}</div>}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </>
                  ))}
                </div>
              </div>
            )}

            {/* ── DAY VIEW ── */}
            {view === 'day' && (
              <div className="surface overflow-auto">
                <div className="border-b border-border py-3 px-4">
                  <div className="text-sm font-medium text-ink">
                    {current.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </div>
                </div>
                <div>
                  {HOURS.map((h) => {
                    const dateStr = current.toISOString().slice(0, 10);
                    const events = eventsForDate(dateStr).filter((e) => {
                      if (!e.time) return h === 8;
                      const eH = parseInt(e.time.split(':')[0]);
                      return eH === h;
                    });
                    return (
                      <div key={h} className="flex border-t border-border min-h-[56px]">
                        <div className="w-16 shrink-0 py-2 px-3 text-right text-xs text-muted">
                          {h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`}
                        </div>
                        <div className="flex-1 p-1.5 space-y-1">
                          {events.map((e) => {
                            const s = KIND_STYLE[e.kind];
                            const Icon = s.icon;
                            return (
                              <div key={e.id} className="rounded-md px-3 py-2"
                                style={{ background: s.bg, color: s.color }}>
                                <div className="flex items-center gap-2 font-medium text-sm">
                                  <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
                                  {e.title}
                                </div>
                                {e.time && (
                                  <div className="text-xs mt-0.5 opacity-80">{e.time}{e.endTime ? ` – ${e.endTime}` : ''}</div>
                                )}
                                {e.description && (
                                  <div className="text-xs mt-1 opacity-80 leading-relaxed">{e.description}</div>
                                )}
                                {e.tripId && (
                                  <Link href={`/trips/${e.tripId}`} className="text-xs mt-1 underline underline-offset-2 opacity-80 inline-block">
                                    View trip →
                                  </Link>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── YEAR VIEW ── */}
            {view === 'year' && (
              <div className="grid grid-cols-4 gap-4">
                {MONTH_NAMES.map((mName, mIdx) => {
                  const firstDay = new Date(year, mIdx, 1).getDay();
                  const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
                  const cells: (number | null)[] = Array(firstDay).fill(null);
                  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
                  while (cells.length % 7 !== 0) cells.push(null);

                  const monthHasEvents = calendarEvents.filter((e) => {
                    const [ey, em] = e.date.split('-').map(Number);
                    return ey === year && em === mIdx + 1;
                  });

                  return (
                    <div key={mName} className="surface p-3 cursor-pointer hover:border-ink2/30 transition-colors"
                      onClick={() => { setCurrent(new Date(year, mIdx, 1)); setView('month'); }}>
                      <div className="text-xs font-semibold text-ink mb-2">{mName}</div>
                      <div className="grid grid-cols-7 gap-px mb-1">
                        {['S','M','T','W','T','F','S'].map((d, i) => (
                          <div key={i} className="text-center text-2xs text-muted">{d}</div>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-px">
                        {cells.map((d, i) => {
                          const dateStr = d ? isoDate(year, mIdx, d) : '';
                          const hasEvent = d ? monthHasEvents.some((e) => e.date === dateStr) : false;
                          const isToday = dateStr === todayStr();
                          return (
                            <div key={i} className={cn(
                              'aspect-square grid place-items-center text-2xs rounded-sm',
                              isToday ? 'bg-accent text-white font-bold' : d ? 'text-ink2' : '',
                              hasEvent && !isToday ? 'bg-accent-soft text-accent font-medium' : '',
                            )}>
                              {d}
                            </div>
                          );
                        })}
                      </div>
                      {monthHasEvents.length > 0 && (
                        <div className="mt-2 text-2xs text-muted">{monthHasEvents.length} event{monthHasEvents.length !== 1 ? 's' : ''}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right sidebar: selected day events or upcoming */}
          <div className="w-64 shrink-0 space-y-3">
            {selectedDate ? (
              <>
                <div className="text-xs font-medium text-ink2 uppercase tracking-wide">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                </div>
                {selectedEvents.length === 0 ? (
                  <div className="text-xs text-muted">Nothing scheduled.</div>
                ) : (
                  <div className="space-y-2">
                    {selectedEvents.map((e) => {
                      const s = KIND_STYLE[e.kind];
                      const Icon = s.icon;
                      return (
                        <div key={e.id} className="surface p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-5 h-5 rounded grid place-items-center shrink-0" style={{ background: s.bg, color: s.color }}>
                              <Icon className="w-3 h-3" strokeWidth={2} />
                            </div>
                            <span className="text-xs font-medium text-ink leading-snug">{e.title}</span>
                          </div>
                          {e.time && <div className="text-xs text-muted ml-7">{e.time}{e.endTime ? `–${e.endTime}` : ''}</div>}
                          {e.description && <div className="text-xs text-ink2 mt-1 leading-relaxed">{e.description}</div>}
                          {e.tripId && (
                            <Link href={`/trips/${e.tripId}`} className="text-xs text-accent underline underline-offset-2 mt-1 block">
                              View trip →
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-xs font-medium text-ink2 uppercase tracking-wide">Upcoming</div>
                <div className="space-y-2">
                  {calendarEvents
                    .filter((e) => e.date >= todayStr())
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .slice(0, 8)
                    .map((e) => {
                      const s = KIND_STYLE[e.kind];
                      const Icon = s.icon;
                      return (
                        <div key={e.id} className="surface p-3">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded grid place-items-center shrink-0 mt-0.5" style={{ background: s.bg, color: s.color }}>
                              <Icon className="w-3 h-3" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-ink leading-snug truncate">{e.title}</div>
                              <div className="text-2xs text-muted mt-0.5">
                                {new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {e.time && ` · ${e.time}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
