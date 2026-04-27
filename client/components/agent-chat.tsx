'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Wrench, Bot, User as UserIcon, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

export interface AgentClientConfig {
  name: string;
  displayName: string;
  description: string;
  emoji: string;
  starters: string[];
  toolCount: number;
  initialMessage?: string;
}

type Block =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool'; name: string; input: any; result?: unknown };

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AgentChat({ config }: { config: AgentClientConfig }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [input, setInput] = useState('');
  const [running, setRunning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<ChatMessage[]>([]);
  const didAutoSend = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [blocks]);

  useEffect(() => {
    if (config.initialMessage && !didAutoSend.current) {
      didAutoSend.current = true;
      send(config.initialMessage);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(prompt: string) {
    if (!prompt.trim() || running) return;
    const userMsg: ChatMessage = { role: 'user', content: prompt };
    historyRef.current = [...historyRef.current, userMsg];
    setBlocks((b) => [...b, { kind: 'user', text: prompt }, { kind: 'assistant', text: '' }]);
    setInput('');
    setRunning(true);

    try {
      const res = await fetch(`/api/agents/${config.name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyRef.current }),
      });
      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => 'request failed');
        setBlocks((b) => [
          ...b.slice(0, -1),
          { kind: 'assistant', text: `Error: ${err}` },
        ]);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assembledAssistant = '';
      let turnText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, idx).trim();
          buffer = buffer.slice(idx + 2);
          if (!chunk.startsWith('data:')) continue;
          const json = chunk.replace(/^data:\s*/, '');
          let evt: any;
          try {
            evt = JSON.parse(json);
          } catch {
            continue;
          }

          if (evt.type === 'text') {
            assembledAssistant += evt.text;
            turnText += evt.text;
            setBlocks((b) => {
              const next = b.slice();
              for (let i = next.length - 1; i >= 0; i--) {
                if (next[i].kind === 'assistant') {
                  next[i] = { kind: 'assistant', text: assembledAssistant };
                  break;
                }
                if (next[i].kind === 'tool') break;
              }
              return next;
            });
          } else if (evt.type === 'tool_use') {
            assembledAssistant = '';
            turnText += '\n';
            setBlocks((b) => [
              ...b,
              { kind: 'tool', name: evt.name, input: evt.input },
              { kind: 'assistant', text: '' },
            ]);
          } else if (evt.type === 'tool_result') {
            setBlocks((b) => {
              const next = b.slice();
              for (let i = next.length - 1; i >= 0; i--) {
                if (next[i].kind === 'tool' && (next[i] as any).name === evt.name && (next[i] as any).result === undefined) {
                  next[i] = { ...(next[i] as any), result: evt.result };
                  break;
                }
              }
              return next;
            });
          } else if (evt.type === 'error') {
            setBlocks((b) => [...b, { kind: 'assistant', text: `Error: ${evt.message}` }]);
          }
        }
      }

      // Persist final assistant message in history.
      historyRef.current = [
        ...historyRef.current,
        { role: 'assistant', content: turnText.trim() || '(no text)' },
      ];
    } catch (e: any) {
      setBlocks((b) => [...b, { kind: 'assistant', text: `Error: ${e?.message ?? 'failed'}` }]);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] max-w-3xl mx-auto">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-1 py-2 space-y-4">
        {blocks.length === 0 && (
          <div className="text-center mt-12">
            <div className="text-5xl mb-3">{config.emoji}</div>
            <h2 className="text-xl font-medium text-ink">{config.displayName}</h2>
            <p className="text-sm text-ink2 mt-2 max-w-md mx-auto leading-relaxed">
              {config.description}
            </p>
            <div className="mt-8 grid sm:grid-cols-1 gap-2 max-w-md mx-auto">
              {config.starters.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left px-3 py-2 rounded border bg-panel text-sm text-ink2 hover:bg-hover hover:text-ink flex items-start gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 mt-0.5 text-accent shrink-0" strokeWidth={1.75} />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {blocks.map((b, i) => {
          if (b.kind === 'user') {
            return (
              <div key={i} className="flex gap-3 justify-end">
                <div className="bg-ink text-bg rounded-lg px-3 py-2 text-sm max-w-md whitespace-pre-wrap">
                  {b.text}
                </div>
                <div className="w-7 h-7 rounded-full bg-hover grid place-items-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4 text-ink2" strokeWidth={1.75} />
                </div>
              </div>
            );
          }
          if (b.kind === 'assistant') {
            if (!b.text) return null;
            return (
              <div key={i} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-accent-soft text-accent grid place-items-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" strokeWidth={2} />
                </div>
                <div className="flex-1 text-sm text-ink leading-relaxed prose prose-sm prose-neutral max-w-none
                  prose-p:my-1 prose-headings:font-semibold prose-headings:text-ink prose-headings:mt-3 prose-headings:mb-1
                  prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5
                  prose-strong:text-ink prose-strong:font-semibold
                  prose-hr:border-border prose-hr:my-3
                  prose-code:bg-hover prose-code:px-1 prose-code:rounded prose-code:text-xs prose-code:font-mono prose-code:text-ink
                  prose-blockquote:border-l-2 prose-blockquote:border-accent prose-blockquote:pl-3 prose-blockquote:text-ink2 prose-blockquote:italic
                  prose-table:text-xs prose-th:font-semibold prose-td:py-1">
                  <ReactMarkdown>{b.text}</ReactMarkdown>
                </div>
              </div>
            );
          }
          // tool block
          return (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-hover text-ink2 grid place-items-center shrink-0 mt-0.5">
                <Wrench className="w-3.5 h-3.5" strokeWidth={1.75} />
              </div>
              <div className="flex-1">
                <div className="text-2xs uppercase tracking-wide text-muted font-medium">
                  Tool · {b.name}
                </div>
                <details className="mt-1 surface text-xs">
                  <summary className="px-3 py-2 cursor-pointer text-ink2 hover:text-ink">
                    {b.result === undefined ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Calling {b.name}…
                      </span>
                    ) : (
                      <span>{b.name} → result</span>
                    )}
                  </summary>
                  <div className="px-3 pb-3 space-y-2">
                    <div>
                      <div className="text-2xs text-muted mb-1">Input</div>
                      <pre className="bg-bg p-2 rounded text-2xs overflow-x-auto font-mono">
                        {JSON.stringify(b.input, null, 2)}
                      </pre>
                    </div>
                    {b.result !== undefined && (
                      <div>
                        <div className="text-2xs text-muted mb-1">Result</div>
                        <pre className="bg-bg p-2 rounded text-2xs overflow-x-auto font-mono max-h-64">
                          {JSON.stringify(b.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            </div>
          );
        })}

        {running && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-accent-soft text-accent grid place-items-center shrink-0">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="text-sm text-muted italic">working…</div>
          </div>
        )}
      </div>

      <div className="border-t border-border bg-bg px-1 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className={cn(
            'flex items-end gap-2 surface px-3 py-2 transition-colors',
            running && 'opacity-70'
          )}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            disabled={running}
            placeholder={`Talk to ${config.displayName}…`}
            rows={1}
            className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted text-ink py-1 max-h-32"
          />
          <button
            type="submit"
            disabled={running || !input.trim()}
            className="w-7 h-7 grid place-items-center rounded bg-ink text-bg disabled:opacity-40"
          >
            {running ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" strokeWidth={2} />
            )}
          </button>
        </form>
        <div className="text-2xs text-muted mt-2 px-1">
          {config.displayName} can use {config.toolCount} tools · responses stream live
        </div>
      </div>
    </div>
  );
}
