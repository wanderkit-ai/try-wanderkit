import { ChevronRight, Star, Share2, MoreHorizontal } from 'lucide-react';

interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({
  icon,
  title,
  crumbs,
  description,
  actions,
}: {
  icon?: string;
  title: string;
  crumbs?: Crumb[];
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="px-12 pt-10 pb-6">
      {crumbs && crumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-muted mb-4">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="w-3 h-3" strokeWidth={2} />}
              <span className="hover:text-ink2 cursor-pointer">{c.label}</span>
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-semibold text-ink tracking-tight flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            {title}
          </h1>
          {description && (
            <p className="text-ink2 mt-2 leading-relaxed max-w-2xl">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button className="btn btn-ghost h-7 px-2 text-xs">
            <Star className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
          <button className="btn btn-ghost h-7 px-2 text-xs">
            <Share2 className="w-3.5 h-3.5" strokeWidth={1.75} />
            Share
          </button>
          <button className="btn btn-ghost h-7 w-7 px-0">
            <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
          </button>
          {actions}
        </div>
      </div>
    </div>
  );
}
