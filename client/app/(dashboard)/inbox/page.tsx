import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/avatar';
import {
  messages,
  operators,
  customers,
  trips,
  findById,
} from '@/lib/mock-data';
import { formatRelative } from '@/lib/utils';
import { Bot, MessageCircle, Mail, Globe } from 'lucide-react';

const ICON: Record<string, any> = {
  whatsapp: MessageCircle,
  email: Mail,
  portal: Globe,
  sms: MessageCircle,
};

export default function InboxPage() {
  const sorted = [...messages].sort((a, b) => b.sentAt.localeCompare(a.sentAt));
  return (
    <>
      <PageHeader
        icon="📥"
        title="Inbox"
        description="Every conversation across WhatsApp, email, and customer portals — managed by the AI."
      />
      <div className="px-12 pb-12">
        <div className="surface divide-y divide-border">
          {sorted.map((m) => {
            const op = findById(operators, m.operatorId ?? '');
            const cu = findById(customers, m.customerId ?? '');
            const tr = findById(trips, m.tripId ?? '');
            const Icon = ICON[m.channel];
            return (
              <div key={m.id} className="px-4 py-3 hover:bg-hover/60 cursor-pointer">
                <div className="flex items-start gap-3">
                  {m.fromAgent ? (
                    <div className="w-8 h-8 rounded-full bg-accent-soft text-accent grid place-items-center shrink-0">
                      <Bot className="w-4 h-4" strokeWidth={2} />
                    </div>
                  ) : op ? (
                    <Avatar name={op.contactName} color="#999" size={32} />
                  ) : cu ? (
                    <Avatar name={cu.name} color={cu.avatarColor} size={32} />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-hover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-ink">
                        {op?.contactName ?? cu?.name ?? 'Unknown'}
                      </span>
                      {op && <span className="text-muted text-xs">· {op.company}</span>}
                      <span className="ml-auto text-2xs text-muted flex items-center gap-1">
                        <Icon className="w-2.5 h-2.5" strokeWidth={2} />
                        {m.channel}
                        <span>·</span>
                        {formatRelative(m.sentAt)}
                      </span>
                    </div>
                    <div className="text-sm text-ink2 mt-0.5 truncate">{m.body}</div>
                    {tr && (
                      <div className="text-2xs text-muted mt-1">
                        {m.fromAgent && <span className="capitalize">{m.fromAgent} → </span>}
                        re: {tr.title}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
