import type { ItineraryDay } from '@/lib/types';
import { Train, Bed, Cloud, Star, Sun, Sunset, Moon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  days: ItineraryDay[];
  /** Compact mode for the proposals page — slightly smaller padding */
  compact?: boolean;
}

export function ItineraryTimeline({ days, compact }: Props) {
  return (
    <div className="relative">
      {/* Vertical spine */}
      <div
        className="absolute left-[19px] top-10 bottom-10 w-px"
        style={{ background: 'hsl(var(--border))' }}
      />

      <div className="space-y-3">
        {days.map((day, idx) => {
          const isEdge = idx === 0 || idx === days.length - 1;
          const isBuffer = day.activities.some(
            (a) => /buffer|rest day/i.test(a),
          );
          const hasPremium = day.morning || day.afternoon || day.evening;

          return (
            <div key={day.day} className="flex gap-3 items-start">
              {/* Timeline node */}
              <div
                className={[
                  'relative z-10 w-10 h-10 rounded-full shrink-0 grid place-items-center text-xs font-mono font-semibold border-2',
                  isEdge
                    ? 'bg-accent text-white border-accent'
                    : isBuffer
                      ? 'border-border text-muted'
                      : 'border-accent/40 text-accent',
                ].join(' ')}
                style={
                  !isEdge && !isBuffer
                    ? { background: 'hsl(var(--panel))' }
                    : isBuffer
                      ? { background: 'hsl(var(--hover))' }
                      : undefined
                }
              >
                {day.day}
              </div>

              {/* Card */}
              <div className="flex-1 surface overflow-hidden min-w-0">
                {/* Header */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5 border-b"
                  style={{ borderColor: 'hsl(var(--border))' }}
                >
                  <span className="text-sm font-semibold text-ink truncate">
                    {day.location}
                  </span>
                  {day.featured_activity && (
                    <span className="inline-flex items-center gap-1 text-2xs font-medium text-accent bg-accent-soft px-1.5 py-0.5 rounded-full shrink-0">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {day.featured_activity}
                    </span>
                  )}
                  <span className="ml-auto text-2xs font-mono text-muted shrink-0">
                    {day.date}
                  </span>
                </div>

                <div className={compact ? 'px-4 py-2.5 space-y-2' : 'px-4 py-3 space-y-2.5'}>
                  {/* Weather note */}
                  {day.weather_note && (
                    <div
                      className="flex items-start gap-1.5 text-xs text-ink2 rounded px-2 py-1.5"
                      style={{ background: 'hsl(var(--accent-soft))' }}
                    >
                      <Cloud className="w-3.5 h-3.5 shrink-0 mt-0.5 text-accent" strokeWidth={1.75} />
                      {day.weather_note}
                    </div>
                  )}

                  {/* Premium: morning / afternoon / evening */}
                  {hasPremium ? (
                    <div className="space-y-1.5">
                      {day.morning && (
                        <TimeBlock Icon={Sun} label="Morning" text={day.morning} />
                      )}
                      {day.afternoon && (
                        <TimeBlock Icon={Sunset} label="Afternoon" text={day.afternoon} />
                      )}
                      {day.evening && (
                        <TimeBlock Icon={Moon} label="Evening" text={day.evening} />
                      )}
                    </div>
                  ) : (
                    /* Standard: activities list */
                    <ul className="space-y-1">
                      {day.activities.map((a) => (
                        <li key={a} className="flex items-start gap-2 text-sm text-ink2">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                            style={{ background: 'hsl(var(--accent) / 0.5)' }}
                          />
                          {a}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Footer: transit + lodging pills */}
                  {(day.transit && day.transit !== 'None') ||
                  (day.lodging && !/^Departure/i.test(day.lodging)) ? (
                    <div
                      className="flex flex-wrap gap-1.5 pt-2 border-t"
                      style={{ borderColor: 'hsl(var(--border))' }}
                    >
                      {day.transit && day.transit !== 'None' && (
                        <Pill icon={Train} label={day.transit} />
                      )}
                      {day.lodging && !/^Departure/i.test(day.lodging) && (
                        <Pill icon={Bed} label={day.lodging} />
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeBlock({
  Icon,
  label,
  text,
}: {
  Icon: LucideIcon;
  label: string;
  text: string;
}) {
  return (
    <div className="flex gap-2.5 text-xs">
      <div className="flex items-center gap-1 text-muted shrink-0 w-[72px] pt-px">
        <Icon className="w-3 h-3" strokeWidth={1.75} />
        {label}
      </div>
      <div className="text-ink2 leading-relaxed">{text}</div>
    </div>
  );
}

function Pill({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-2xs text-muted px-2 py-0.5 rounded-full"
      style={{ background: 'hsl(var(--hover))' }}
    >
      <Icon className="w-3 h-3" strokeWidth={1.5} />
      {label}
    </span>
  );
}
