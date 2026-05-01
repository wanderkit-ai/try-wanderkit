'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Loader2,
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  CloudLightning,
  CloudFog,
  MapPin,
  Calendar,
  Users,
  Star,
  ShieldAlert,
  ShieldCheck,
  Shield,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToolBlockProps {
  name: string;
  input: any;
  result: unknown;
}

/** Names whose results are rendered in the side panel — we only show a
 *  one-line confirmation pill in chat to avoid duplicate UI. */
const SIDE_PANEL_TOOLS = new Set([
  'preview_itinerary',
  'save_itinerary',
  'build_itinerary',
  'search_operators',
  'web_search_operators',
  'firecrawl_scrape',
  'add_operator',
]);

export function ToolBlock(props: ToolBlockProps) {
  const { name, result } = props;

  if (result === undefined) {
    return <ToolPending name={name} />;
  }

  const data = parseResult(result);

  if (SIDE_PANEL_TOOLS.has(name)) {
    return <SidePanelPill name={name} result={data} />;
  }

  switch (name) {
    case 'get_weather':
    case 'openmeteo_forecast':
      return <WeatherStrip data={data} />;
    case 'list_trips':
      return <TripsList data={data} />;
    case 'get_trip':
      return <TripBriefCard data={data} />;
    case 'get_travel_advisory':
      return <AdvisoryBanner data={data} />;
    default:
      return <DefaultToolResult name={name} input={props.input} result={data} />;
  }
}

function ToolPending({ name }: { name: string }) {
  return (
    <div className="text-xs text-muted inline-flex items-center gap-1.5 px-2 py-1 rounded bg-hover">
      <Loader2 className="w-3 h-3 animate-spin" />
      Calling <span className="font-mono text-ink2">{name}</span>…
    </div>
  );
}

function SidePanelPill({ name, result }: { name: string; result: any }) {
  const summary = (() => {
    if (name === 'preview_itinerary' || name === 'build_itinerary') {
      const days = Array.isArray(result?.itinerary) ? result.itinerary.length : null;
      return days ? `Updated draft · ${days} days` : 'Updated draft itinerary';
    }
    if (name === 'save_itinerary') {
      const days = Array.isArray(result?.itinerary) ? result.itinerary.length : null;
      return days ? `Saved itinerary · ${days} days` : 'Saved itinerary';
    }
    if (name === 'search_operators') {
      const count = Array.isArray(result) ? result.length : 0;
      return `${count} Noma operator${count === 1 ? '' : 's'} matched`;
    }
    if (name === 'web_search_operators') {
      return 'Web search done · researching results…';
    }
    if (name === 'firecrawl_scrape') {
      const url: string = result?.metadata?.url ?? result?.metadata?.sourceURL ?? '';
      const host = url ? (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })() : 'page';
      return `Scraped ${host}`;
    }
    if (name === 'add_operator') {
      return result?.added ? `Added ${result.company ?? 'operator'} to Noma` : 'add_operator';
    }
    return name;
  })();

  return (
    <div className="text-xs text-ink2 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-accent-soft">
      <Layers className="w-3 h-3 text-accent" strokeWidth={1.75} />
      <span>{summary}</span>
      <span className="text-muted">· in side panel</span>
    </div>
  );
}

// ── Weather ──────────────────────────────────────────────────────────────

function weatherIcon(code: number | undefined): { Icon: LucideIcon; label: string } {
  if (code === undefined || code === null) return { Icon: Cloud, label: '—' };
  if (code === 0) return { Icon: Sun, label: 'clear' };
  if (code <= 3) return { Icon: Cloud, label: 'cloudy' };
  if (code <= 48) return { Icon: CloudFog, label: 'fog' };
  if (code <= 67) return { Icon: CloudRain, label: 'rain' };
  if (code <= 77) return { Icon: CloudSnow, label: 'snow' };
  if (code <= 82) return { Icon: CloudRain, label: 'showers' };
  if (code <= 86) return { Icon: CloudSnow, label: 'snow showers' };
  return { Icon: CloudLightning, label: 'storm' };
}

function WeatherStrip({ data }: { data: any }) {
  if (data?.error) {
    return <ErrorLine message={String(data.error)} />;
  }
  const daily = data?.daily ?? {};
  const times: string[] = daily.time ?? [];
  const codes: number[] = daily.weather_code ?? [];
  const maxes: number[] = daily.temperature_2m_max ?? [];
  const mins: number[] = daily.temperature_2m_min ?? [];
  const precip: number[] = daily.precipitation_probability_max ?? [];

  if (!times.length) {
    return <ErrorLine message="No forecast returned" />;
  }

  return (
    <div className="surface p-3">
      <div className="text-2xs uppercase tracking-wide text-muted mb-2 flex items-center gap-1.5">
        <Cloud className="w-3 h-3" strokeWidth={1.75} />
        Forecast {data?.destination ? `· ${data.destination}` : ''}
      </div>
      <div className="grid gap-1.5 grid-cols-7">
        {times.map((time, i) => {
          const { Icon, label } = weatherIcon(codes[i]);
          const dateLabel = formatDayShort(time);
          return (
            <div
              key={time}
              className="flex flex-col items-center gap-0.5 px-1 py-1.5 rounded bg-bg"
              title={`${time} · ${label}`}
            >
              <div className="text-2xs text-muted font-mono">{dateLabel}</div>
              <Icon className="w-4 h-4 text-accent" strokeWidth={1.75} />
              <div className="text-2xs text-ink font-mono">
                {Math.round(maxes[i])}°/{Math.round(mins[i])}°
              </div>
              {typeof precip[i] === 'number' && precip[i] > 20 && (
                <div className="text-2xs text-muted">{precip[i]}%</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDayShort(iso: string): string {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  } catch {
    return iso.slice(5);
  }
}

// ── Trips list ──────────────────────────────────────────────────────────

function TripsList({ data }: { data: any }) {
  if (!Array.isArray(data) || data.length === 0) {
    return <EmptyLine message="No trips found" />;
  }
  return (
    <div className="surface divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
      {data.slice(0, 8).map((t: any) => (
        <Link
          key={t.id}
          href={`/trips/${t.id}`}
          className="flex items-center gap-3 px-3 py-2 hover:bg-hover transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="text-sm text-ink truncate">{t.title || t.destination}</div>
            <div className="text-2xs text-muted truncate flex items-center gap-2">
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" strokeWidth={1.75} />
                {t.destination}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" strokeWidth={1.75} />
                {t.startDate} → {t.endDate}
              </span>
              {typeof t.groupSize === 'number' && (
                <span className="inline-flex items-center gap-1">
                  <Users className="w-3 h-3" strokeWidth={1.75} />
                  {t.groupSize}
                </span>
              )}
            </div>
          </div>
          {t.hasItinerary && (
            <span className="chip chip-accent">itinerary</span>
          )}
          <span className="chip">{t.status}</span>
        </Link>
      ))}
      {data.length > 8 && (
        <div className="px-3 py-1.5 text-2xs text-muted">+ {data.length - 8} more</div>
      )}
    </div>
  );
}

// ── Trip brief card ─────────────────────────────────────────────────────

function TripBriefCard({ data }: { data: any }) {
  if (!data || data?.error) {
    return <ErrorLine message={data?.error ?? 'Trip not found'} />;
  }
  return (
    <div className="surface p-3 space-y-2">
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink truncate">{data.title || data.destination}</div>
          <div className="text-2xs text-muted flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3" strokeWidth={1.75} />
              {data.destination}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" strokeWidth={1.75} />
              {data.startDate} → {data.endDate}
            </span>
            {typeof data.groupSize === 'number' && (
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3" strokeWidth={1.75} />
                {data.groupSize}
              </span>
            )}
          </div>
        </div>
        {data.status && <span className="chip">{data.status}</span>}
      </div>

      {Array.isArray(data.style) && data.style.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {data.style.map((s: string) => (
            <span key={s} className="chip">{s}</span>
          ))}
        </div>
      )}

      {Array.isArray(data.mustHaves) && data.mustHaves.length > 0 && (
        <div>
          <div className="text-2xs uppercase tracking-wide text-muted mb-0.5">Must-haves</div>
          <ul className="text-xs text-ink2 space-y-0.5">
            {data.mustHaves.slice(0, 5).map((m: string) => (
              <li key={m} className="flex items-start gap-1.5">
                <Star className="w-2.5 h-2.5 mt-1 text-accent shrink-0" strokeWidth={2} />
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Travel advisory ─────────────────────────────────────────────────────

function AdvisoryBanner({ data }: { data: any }) {
  if (!data || data?.error) {
    return <ErrorLine message={data?.error ?? 'Advisory unavailable'} />;
  }
  const level = String(data.level || '');
  const severity = level.match(/Level\s+(\d)/i)?.[1];
  const tone = severity === '4' ? 'danger' : severity === '3' ? 'warn' : severity === '2' ? 'warn' : 'success';
  const Icon = tone === 'danger' ? ShieldAlert : tone === 'warn' ? Shield : ShieldCheck;
  const styles = {
    danger: 'bg-danger/10 text-danger border-danger/30',
    warn: 'bg-warn/10 text-warn border-warn/30',
    success: 'bg-success/10 text-success border-success/30',
  } as const;
  return (
    <div className={cn('flex items-start gap-2 px-3 py-2 rounded border text-xs', styles[tone])}>
      <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" strokeWidth={1.75} />
      <div>
        {data.country && <div className="font-semibold">{data.country}</div>}
        <div className="leading-relaxed">{level}</div>
      </div>
    </div>
  );
}

// ── Default fallback ────────────────────────────────────────────────────

function DefaultToolResult({ name, input, result }: { name: string; input: any; result: any }) {
  const [open, setOpen] = useState(false);
  const summary = describeResult(result);
  return (
    <div className="surface text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-1.5 flex items-center gap-1.5 text-left text-ink2 hover:text-ink hover:bg-hover transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRightIcon className="w-3 h-3" />}
        <CheckCircle2 className="w-3 h-3 text-success" strokeWidth={2} />
        <span className="font-mono text-2xs text-muted">{name}</span>
        <span className="text-muted">·</span>
        <span className="truncate">{summary}</span>
      </button>
      {open && (
        <div className="px-3 pb-2 pt-1 space-y-1.5 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <div>
            <div className="text-2xs text-muted mb-0.5">Input</div>
            <pre className="bg-bg p-2 rounded text-2xs overflow-x-auto font-mono">{JSON.stringify(input, null, 2)}</pre>
          </div>
          <div>
            <div className="text-2xs text-muted mb-0.5">Result</div>
            <pre className="bg-bg p-2 rounded text-2xs overflow-x-auto font-mono max-h-64">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

function describeResult(result: any): string {
  if (result === null || result === undefined) return 'no result';
  if (Array.isArray(result)) return `${result.length} item${result.length === 1 ? '' : 's'}`;
  if (typeof result === 'object') {
    const keys = Object.keys(result);
    if (keys.length === 0) return 'empty object';
    if ('error' in result) return `error: ${String(result.error).slice(0, 60)}`;
    return `${keys.length} field${keys.length === 1 ? '' : 's'}`;
  }
  return String(result).slice(0, 80);
}

function ErrorLine({ message }: { message: string }) {
  return (
    <div className="text-xs text-danger inline-flex items-center gap-1.5 px-2 py-1 rounded bg-danger/10">
      <ShieldAlert className="w-3 h-3" strokeWidth={1.75} />
      {message}
    </div>
  );
}

function EmptyLine({ message }: { message: string }) {
  return <div className="text-xs text-muted italic px-1">{message}</div>;
}

function parseResult(result: unknown): any {
  if (typeof result !== 'string') return result;
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
}
