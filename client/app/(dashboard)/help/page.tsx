'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import {
  ChevronDown,
  ChevronRight,
  Bot,
  Mail,
  Send,
  CheckCircle2,
  BookOpen,
  Zap,
  Shield,
  Users,
  MessageSquare,
} from 'lucide-react';

const FAQS = [
  {
    q: 'How do the AI agents work?',
    a: 'Noma\'s agents are powered by Claude (Anthropic\'s AI). Each agent has a specific role: Concierge takes customer intake, Matchmaker finds operators, Negotiator requests and compares quotes, Booker handles direct reservations, Itinerary builds day-by-day plans, and Social groups compatible travelers. Agents can call real tools (WhatsApp, email, bookings) and stream their reasoning live.',
  },
  {
    q: 'Is payment information stored securely?',
    a: 'In this MVP, Stripe is intentionally disabled — all bookings are held without payment processing. In production, payments would be handled entirely by Stripe and Noma would never store raw card data. All data is encrypted at rest via Supabase.',
  },
  {
    q: 'How do I add a new customer or influencer?',
    a: 'Right now, the platform uses mock data. In the live version, you\'ll be able to invite influencers via email and they\'ll get a creator dashboard to manage their own trips. Customers join through influencer-specific landing pages or portal links.',
  },
  {
    q: 'Can I connect my own WhatsApp number?',
    a: 'Yes — in production, the Negotiator agent dispatches WhatsApp messages via Twilio. You\'d configure your Twilio number in settings and all outbound messages would come from your dedicated number. Replies route back to the inbox.',
  },
  {
    q: 'What happens when an operator doesn\'t respond?',
    a: 'The Negotiator agent tracks response deadlines and can send follow-up messages automatically. You can also set a deadline in the trip pipeline and the agent will flag overdue quotes. Backup operators can be queued via the Matchmaker.',
  },
  {
    q: 'How does the itinerary agent generate day plans?',
    a: 'The Itinerary agent calls get_trip to load your brief, then checks weather, travel advisories, and current news for the destination. It uses that context alongside the trip style and must-haves to draft a logical day-by-day programme. You can review and save it, which immediately makes it visible on the trip detail and proposal pages.',
  },
  {
    q: 'Can customers see the proposal without logging in?',
    a: 'Yes — the proposal page (/proposals/<trip-id>) is a public, no-auth page. You can share the link with your customer directly. They can view the full itinerary, pricing, and inclusions, and accept or request changes from the page.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'Not yet. The web app is mobile-responsive so it works on phones and tablets. A native mobile app for influencers and customers is on the roadmap.',
  },
];

const QUICK_LINKS = [
  { icon: BookOpen, label: 'Platform guide', desc: 'How everything connects' },
  { icon: Zap, label: 'Agent quick-start', desc: 'Run your first agent workflow' },
  { icon: Shield, label: 'Data & privacy', desc: 'What we store and how' },
  { icon: Users, label: 'Invite your team', desc: 'Add operators and influencers' },
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [aiRunning, setAiRunning] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });

  async function sendToAI() {
    if (!aiInput.trim() || aiRunning) return;
    const question = aiInput.trim();
    setAiInput('');
    setAiMessages((m) => [...m, { role: 'user', text: question }]);
    setAiRunning(true);

    try {
      const res = await fetch('/api/agents/concierge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `You are the Noma Help assistant. Answer this question about the Noma platform concisely and helpfully. Keep responses under 3 short paragraphs. Question: ${question}`,
            },
          ],
        }),
      });

      if (!res.ok || !res.body) {
        setAiMessages((m) => [...m, { role: 'assistant', text: 'Sorry, I couldn\'t connect right now. Try again or email support@noma.co.' }]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assembled = '';

      setAiMessages((m) => [...m, { role: 'assistant', text: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);
          if (!chunk.startsWith('data:')) continue;
          let evt: any;
          try { evt = JSON.parse(chunk.replace(/^data:\s*/, '')); } catch { continue; }
          if (evt.type === 'text') {
            assembled += evt.text;
            setAiMessages((m) => {
              const next = [...m];
              next[next.length - 1] = { role: 'assistant', text: assembled };
              return next;
            });
          }
        }
      }
    } catch {
      setAiMessages((m) => [...m, { role: 'assistant', text: 'Something went wrong. Please email support@noma.co.' }]);
    } finally {
      setAiRunning(false);
    }
  }

  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    setContactSent(true);
  }

  return (
    <>
      <PageHeader
        icon="❓"
        title="Help"
        description="Answers, AI support, and a direct line to the Noma team."
      />
      <div className="px-12 pb-12 space-y-10 max-w-4xl">

        {/* Quick links */}
        <div className="grid grid-cols-4 gap-3">
          {QUICK_LINKS.map((l) => (
            <button key={l.label} className="surface p-4 text-left hover:border-ink2/30 transition-colors group">
              <l.icon className="w-5 h-5 text-accent mb-2" strokeWidth={1.75} />
              <div className="text-sm font-medium text-ink group-hover:text-accent transition-colors">{l.label}</div>
              <div className="text-xs text-muted mt-0.5">{l.desc}</div>
            </button>
          ))}
        </div>

        {/* Ask AI */}
        <div>
          <h2 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
            <Bot className="w-4 h-4 text-accent" strokeWidth={2} />
            Ask AI
          </h2>
          <p className="text-xs text-muted mb-3">Ask anything about Noma — how agents work, how to set up a trip, or what to do next.</p>

          <div className="surface overflow-hidden">
            <div className="p-4 space-y-3 min-h-[80px] max-h-64 overflow-y-auto">
              {aiMessages.length === 0 && (
                <div className="text-xs text-muted">Try: &ldquo;How do I create a trip brief?&rdquo; or &ldquo;What does the Negotiator agent do?&rdquo;</div>
              )}
              {aiMessages.map((m, i) => (
                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-ink text-bg' : 'bg-hover text-ink'
                  }`}>
                    {m.text || <span className="text-muted italic">typing…</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border flex items-center gap-2 px-3 py-2">
              <input
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendToAI()}
                placeholder="Ask a question about Noma…"
                disabled={aiRunning}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted text-ink"
              />
              <button onClick={sendToAI} disabled={aiRunning || !aiInput.trim()}
                className="w-7 h-7 grid place-items-center rounded bg-ink text-bg disabled:opacity-40">
                <Send className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" strokeWidth={2} />
            Frequently asked questions
          </h2>
          <div className="surface divide-y divide-border">
            {FAQS.map((faq, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-hover/60 transition-colors"
                >
                  <span className="text-sm font-medium text-ink">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronDown className="w-4 h-4 text-muted shrink-0" strokeWidth={1.75} />
                    : <ChevronRight className="w-4 h-4 text-muted shrink-0" strokeWidth={1.75} />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-ink2 leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div>
          <h2 className="text-sm font-semibold text-ink mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4 text-accent" strokeWidth={2} />
            Get in touch with Noma
          </h2>
          <p className="text-xs text-muted mb-3">Have a question we haven&apos;t covered? We typically respond within one business day.</p>

          {contactSent ? (
            <div className="surface p-6 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" strokeWidth={2} />
              <div>
                <div className="text-sm font-medium text-ink">Message sent!</div>
                <div className="text-xs text-muted mt-0.5">We&apos;ll get back to {contactForm.email || 'you'} within 1 business day.</div>
              </div>
            </div>
          ) : (
            <form onSubmit={submitContact} className="surface p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Name</label>
                  <input required value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent"
                    placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Email</label>
                  <input required type="email" value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent"
                    placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Subject</label>
                <input value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  className="w-full h-9 px-3 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent"
                  placeholder="What's this about?" />
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Message</label>
                <textarea required rows={4} value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full px-3 py-2 rounded border text-sm bg-bg border-border text-ink outline-none focus:border-accent resize-none"
                  placeholder="Tell us what you need…" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">support@noma.co · usually replies within 24h</span>
                <button type="submit" className="btn btn-primary h-9 px-4 text-sm">
                  <Send className="w-3.5 h-3.5" strokeWidth={2} />
                  Send message
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
