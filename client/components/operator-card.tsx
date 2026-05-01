'use client';

import { Star, MapPin, Clock, MessageCircle, Mail, Plus, ExternalLink, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NomaOperator {
  id: string;
  company: string;
  contact?: string;
  contactName?: string;
  country?: string;
  region?: string;
  specialties?: string[];
  rating?: number;
  replyTimeHours?: number;
  responseHours?: number;
  priceTier?: '$' | '$$' | '$$$';
  whatsapp?: string;
  email?: string;
  website?: string;
  notes?: string;
}

export interface WebHit {
  title: string;
  snippet?: string;
  link: string;
  added?: boolean;
}

function whatsappHref(num: string) {
  const cleaned = num.replace(/[^\d+]/g, '').replace(/^\+?/, '');
  return `https://wa.me/${cleaned}`;
}

export function OperatorCard({ operator }: { operator: NomaOperator }) {
  const contact = operator.contact ?? operator.contactName;
  const reply = operator.replyTimeHours ?? operator.responseHours;

  return (
    <div className="surface p-3 flex flex-col gap-2 min-w-0">
      <div className="flex items-start gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink truncate">{operator.company}</div>
          {contact && (
            <div className="text-xs text-ink2 truncate">{contact}</div>
          )}
          {(operator.country || operator.region) && (
            <div className="text-2xs text-muted truncate flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" strokeWidth={1.75} />
              {[operator.country, operator.region].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <span className="chip chip-accent shrink-0">In Noma</span>
      </div>

      {operator.specialties && operator.specialties.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {operator.specialties.map((s) => (
            <span key={s} className="chip">{s}</span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-xs text-ink2 pt-1">
        {typeof operator.rating === 'number' && (
          <span className="inline-flex items-center gap-1 font-mono tabular-nums">
            <Star className="w-3 h-3 fill-warn text-warn" strokeWidth={0} />
            {operator.rating.toFixed(1)}
          </span>
        )}
        {operator.priceTier && (
          <span className="font-mono text-muted">{operator.priceTier}</span>
        )}
        {typeof reply === 'number' && (
          <span className="inline-flex items-center gap-1 text-muted">
            <Clock className="w-3 h-3" strokeWidth={1.75} />
            ~{reply}h
          </span>
        )}
      </div>

      {(operator.whatsapp || operator.email || operator.website) && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          {operator.whatsapp && (
            <a
              href={whatsappHref(operator.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-2xs text-ink2 hover:text-ink px-2 py-1 rounded hover:bg-hover transition-colors"
              title={operator.whatsapp}
            >
              <MessageCircle className="w-3 h-3" strokeWidth={1.75} />
              WhatsApp
            </a>
          )}
          {operator.email && (
            <a
              href={`mailto:${operator.email}`}
              className="inline-flex items-center gap-1 text-2xs text-ink2 hover:text-ink px-2 py-1 rounded hover:bg-hover transition-colors"
              title={operator.email}
            >
              <Mail className="w-3 h-3" strokeWidth={1.75} />
              Email
            </a>
          )}
          {operator.website && (
            <a
              href={operator.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-2xs text-ink2 hover:text-ink px-2 py-1 rounded hover:bg-hover transition-colors"
              title={operator.website}
            >
              <ExternalLink className="w-3 h-3" strokeWidth={1.75} />
              Site
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function WebHitCard({ hit, onAdd }: { hit: WebHit; onAdd?: (hit: WebHit) => void }) {
  const cleanedTitle = hit.title.replace(/^\[mock\]\s*/, '');
  const host = (() => {
    try {
      return new URL(hit.link).hostname.replace(/^www\./, '');
    } catch {
      return hit.link;
    }
  })();

  return (
    <div className="surface p-3 flex flex-col gap-2 min-w-0">
      <div className="flex items-start gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-ink truncate">{cleanedTitle}</div>
          <a
            href={hit.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xs text-muted hover:text-ink2 truncate flex items-center gap-1 mt-0.5"
          >
            <ExternalLink className="w-3 h-3 shrink-0" strokeWidth={1.75} />
            {host}
          </a>
        </div>
        <span className="chip shrink-0">Web</span>
      </div>

      {hit.snippet && (
        <p className="text-xs text-ink2 leading-relaxed line-clamp-3">{hit.snippet}</p>
      )}

      {onAdd && (
        <div className="flex pt-1 border-t" style={{ borderColor: 'hsl(var(--border))' }}>
          <button
            onClick={() => onAdd(hit)}
            disabled={hit.added}
            className={cn(
              'inline-flex items-center gap-1 text-2xs px-2 py-1 rounded transition-colors disabled:cursor-default',
              hit.added
                ? 'text-success bg-success/10'
                : 'text-ink2 hover:text-ink hover:bg-hover',
            )}
          >
            {hit.added ? (
              <>
                <Check className="w-3 h-3" strokeWidth={2} />
                Added
              </>
            ) : (
              <>
                <Plus className="w-3 h-3" strokeWidth={2} />
                Add to Noma
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
