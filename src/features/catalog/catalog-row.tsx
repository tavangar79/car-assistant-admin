import { CornerLeftUp, GitBranchPlus, Layers, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import type { Scope, VehicleCatalog } from './api';
import { isGlobal, scopePath } from './scope';
import type { ResolvedRow } from './tree';

/** "Inherited from …", "Override" or "Added here": where the row that applies here comes from. */
export function OriginTag<R extends { scope: Scope }>({
  resolved,
  catalog,
}: {
  resolved: ResolvedRow<R>;
  catalog: VehicleCatalog | undefined;
}) {
  if (resolved.origin === 'inherited') {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <CornerLeftUp data-icon="inline-start" className="rtl:-scale-x-100" />
        {t('catalog.tag.inherited', { from: scopePath(resolved.row.scope, catalog) })}
      </Badge>
    );
  }
  if (resolved.replaces) {
    return (
      <Badge
        variant="accent"
        title={t('catalog.tag.replaces', { from: scopePath(resolved.replaces.scope, catalog) })}
      >
        <Layers data-icon="inline-start" />
        {t('catalog.tag.override')}
      </Badge>
    );
  }
  if (isGlobal(resolved.row.scope)) return null;
  return (
    <Badge variant="success">
      <Sparkles data-icon="inline-start" />
      {t('catalog.tag.added')}
    </Badge>
  );
}

/** One catalog row in the panel list. Inherited rows are dimmed and offer "Override here". */
export function CatalogRow({
  inherited,
  disabled,
  title,
  subtitle,
  slug,
  meta,
  tag,
  actions,
}: {
  inherited: boolean;
  disabled: boolean;
  title: string;
  subtitle: string;
  slug: string;
  meta: ReactNode;
  tag: ReactNode;
  actions: ReactNode;
}) {
  return (
    <li
      className={cn(
        'flex flex-col gap-3 px-4 py-3.5 transition-colors sm:flex-row sm:items-center sm:gap-4',
        inherited ? 'bg-muted/40' : 'hover:bg-muted/30',
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn('font-medium', (inherited || disabled) && 'text-muted-foreground')}
            dir="auto"
          >
            {title}
          </span>
          {disabled && <Badge variant="warning">{t('catalog.statusDisabled')}</Badge>}
          {tag}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <code className="font-mono" dir="ltr">
            {slug}
          </code>
          {subtitle && (
            <span dir="auto" className="line-clamp-1">
              {subtitle}
            </span>
          )}
          {meta}
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-end gap-1">{actions}</div>
    </li>
  );
}

export function OverrideButton({ slug, onClick }: { slug: string; onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      aria-label={t('catalog.overrideRow', { slug })}
    >
      <GitBranchPlus data-icon="inline-start" />
      {t('catalog.overrideHere')}
    </Button>
  );
}
