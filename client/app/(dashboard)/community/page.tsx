'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { forumPosts } from '@/lib/mock-data';
import { formatRelative } from '@/lib/utils';
import {
  MessageSquare,
  Eye,
  Pin,
  Plus,
  ChevronRight,
  Tag,
  TrendingUp,
} from 'lucide-react';

type Category = 'all' | 'announcements' | 'destinations' | 'planning' | 'gear' | 'operators' | 'general';

const CATEGORIES: { id: Category; label: string; emoji: string; description: string }[] = [
  { id: 'all', label: 'All posts', emoji: '📋', description: 'Everything' },
  { id: 'announcements', label: 'Announcements', emoji: '📢', description: 'Platform updates' },
  { id: 'destinations', label: 'Destinations', emoji: '🗺️', description: 'Trip intel & destination reports' },
  { id: 'planning', label: 'Trip Planning', emoji: '📝', description: 'Visas, packing, logistics' },
  { id: 'gear', label: 'Gear & Tips', emoji: '🎒', description: 'What to bring and how to prep' },
  { id: 'operators', label: 'Operators', emoji: '🤝', description: 'Reviews and recommendations' },
  { id: 'general', label: 'General', emoji: '💬', description: 'Everything else' },
];

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  influencer: { label: 'Creator', color: 'hsl(var(--accent))' },
  team: { label: 'Noma', color: 'hsl(var(--ink))' },
  customer: { label: 'Traveler', color: 'hsl(168 35% 45%)' },
  operator: { label: 'Operator', color: 'hsl(35 90% 45%)' },
};

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);

  const filtered = forumPosts.filter((p) => activeCategory === 'all' || p.category === activeCategory);
  const post = selectedPost ? forumPosts.find((p) => p.id === selectedPost) : null;

  if (post) {
    return (
      <>
        <PageHeader icon="💬" title="Community" crumbs={[{ label: 'Community', href: '/community' }, { label: post.title }]} />
        <div className="px-12 pb-12 max-w-3xl">
          <button onClick={() => setSelectedPost(null)} className="flex items-center gap-1 text-xs text-muted hover:text-ink mb-6">
            ← Back to community
          </button>

          <div className="surface p-6 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-accent-soft text-accent grid place-items-center font-semibold text-sm shrink-0">
                {post.authorName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink text-sm">{post.authorName}</span>
                  <span className="text-2xs px-1.5 py-0.5 rounded font-medium text-white"
                    style={{ background: ROLE_BADGE[post.authorRole]?.color ?? 'hsl(var(--muted))' }}>
                    {ROLE_BADGE[post.authorRole]?.label}
                  </span>
                </div>
                <div className="text-xs text-muted mt-0.5">{formatRelative(post.createdAt)}</div>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-ink mb-3">{post.title}</h2>
            <p className="text-sm text-ink2 leading-relaxed">{post.body}</p>
            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-1.5 mt-4 flex-wrap">
                {post.tags.map((t) => (
                  <span key={t} className="chip chip-accent text-xs">
                    <Tag className="w-2.5 h-2.5" />
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs font-medium text-muted uppercase tracking-wide mb-3">{post.replies} replies</div>

          {/* Mock replies */}
          <div className="space-y-3">
            {[
              { name: 'Noma Team', role: 'team', body: 'Thanks for sharing this! We\'ve pinned it for visibility. Anyone with additional intel on this destination, please reply below.', time: '2 days ago' },
              { name: 'Yuki Tanaka', role: 'customer', body: 'Super helpful — I was just wondering about this exact thing for my upcoming trip. The permit info especially.', time: '1 day ago' },
              { name: 'Marcus Reilly', role: 'customer', body: 'Agreed. One thing I\'d add — book your accommodation in the key towns at least 3 weeks ahead during peak season.', time: '18 hours ago' },
            ].map((r, i) => (
              <div key={i} className="surface p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-hover text-ink2 grid place-items-center font-medium text-xs">{r.name[0]}</div>
                  <span className="text-sm font-medium text-ink">{r.name}</span>
                  <span className="text-2xs px-1.5 py-0.5 rounded font-medium text-white"
                    style={{ background: ROLE_BADGE[r.role]?.color ?? 'hsl(var(--muted))' }}>
                    {ROLE_BADGE[r.role]?.label}
                  </span>
                  <span className="text-xs text-muted ml-auto">{r.time}</span>
                </div>
                <p className="text-sm text-ink2">{r.body}</p>
              </div>
            ))}
          </div>

          {/* Reply box */}
          <div className="surface p-4 mt-4">
            <textarea
              placeholder="Write a reply…"
              rows={3}
              className="w-full bg-transparent text-sm resize-none outline-none placeholder:text-muted text-ink"
            />
            <div className="flex justify-end mt-2">
              <button className="btn btn-primary h-8 px-4 text-xs">Post reply</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        icon="👥"
        title="Community"
        description="Share trip intel, ask questions, and connect with creators, travelers, and operators."
        actions={
          <button className="btn btn-primary h-9 px-3 text-sm">
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
            New post
          </button>
        }
      />
      <div className="px-12 pb-12">
        <div className="flex gap-6">
          {/* Left: categories */}
          <div className="w-52 shrink-0">
            <div className="text-2xs uppercase tracking-wide text-muted font-medium mb-2">Categories</div>
            <div className="space-y-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="w-full flex items-center gap-2.5 h-8 px-2 rounded text-sm text-left transition-colors"
                  style={{
                    background: activeCategory === cat.id ? 'hsl(var(--hover))' : 'transparent',
                    color: activeCategory === cat.id ? 'hsl(var(--ink))' : 'hsl(var(--ink-2))',
                    fontWeight: activeCategory === cat.id ? '500' : '400',
                  }}
                >
                  <span className="text-base leading-none">{cat.emoji}</span>
                  <span className="truncate">{cat.label}</span>
                  <span className="ml-auto text-2xs text-muted">
                    {cat.id === 'all' ? forumPosts.length : forumPosts.filter((p) => p.category === cat.id).length}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-6">
              <div className="text-2xs uppercase tracking-wide text-muted font-medium mb-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Trending tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['nepal', 'safari', 'hiking', 'operators', 'planning', 'surf', 'morocco'].map((tag) => (
                  <span key={tag} className="chip text-2xs cursor-pointer hover:bg-accent-soft hover:text-accent transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: posts */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted">{filtered.length} posts</span>
            </div>

            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPost(p.id)}
                className="w-full text-left surface p-4 hover:border-ink2/30 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent-soft text-accent grid place-items-center font-semibold text-sm shrink-0 mt-0.5">
                    {p.authorName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      {p.pinned && <Pin className="w-3 h-3 text-accent mt-0.5 shrink-0" strokeWidth={2} />}
                      <h3 className="font-medium text-ink text-sm leading-snug group-hover:text-accent transition-colors">
                        {p.title}
                      </h3>
                    </div>
                    <p className="text-xs text-ink2 line-clamp-2 mb-2">{p.body}</p>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1 font-medium"
                        style={{ color: ROLE_BADGE[p.authorRole]?.color }}>
                        {p.authorName}
                      </span>
                      <span>·</span>
                      <span>{formatRelative(p.createdAt)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" strokeWidth={1.75} />
                        {p.replies}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" strokeWidth={1.75} />
                        {p.views}
                      </span>
                      {p.tags && p.tags.slice(0, 2).map((t) => (
                        <span key={t} className="chip text-2xs">{t}</span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" strokeWidth={1.75} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
