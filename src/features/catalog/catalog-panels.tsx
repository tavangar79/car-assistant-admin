import { CalendarClock, ListChecks, Plus } from 'lucide-react';
import { useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { formatNumber } from '@/lib/format';
import {
  CATEGORY_IDS,
  type Scope,
  useDeleteInterval,
  useDeleteItem,
  useIntervals,
  useItems,
  useSaveInterval,
  useSaveItem,
  type VehicleCatalog,
} from './api';
import { CatalogRow, OriginTag, OverrideButton } from './catalog-row';
import { type IntervalDialogState, IntervalFormDialog } from './interval-form-dialog';
import { type ItemDialogState, ItemFormDialog } from './item-form-dialog';
import { RowActions } from './row-actions';
import { type ResolvedRow, resolveRows } from './tree';

const categoryLabel = (id: string) =>
  (CATEGORY_IDS as readonly string[]).includes(id)
    ? t(`category.${id as (typeof CATEGORY_IDS)[number]}`)
    : id;

/** "2 defined here · 5 inherited", above each list. */
function Summary({ rows }: { rows: ResolvedRow<unknown>[] }) {
  const own = rows.filter((row) => row.origin === 'own').length;
  return (
    <p className="text-sm text-muted-foreground">
      {t('catalog.summary', {
        own: formatNumber(own),
        inherited: formatNumber(rows.length - own),
      })}
    </p>
  );
}

function Toolbar({ rows, add }: { rows: ResolvedRow<unknown>[] | null; add: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {rows ? <Summary rows={rows} /> : <span />}
      {add}
    </div>
  );
}

type PanelProps = { scope: Scope; catalog: VehicleCatalog | undefined };

export function ItemsPanel({ scope, catalog }: PanelProps) {
  const items = useItems();
  const save = useSaveItem();
  const remove = useDeleteItem();
  const [dialog, setDialog] = useState<ItemDialogState | null>(null);
  const busy = save.isPending || remove.isPending;

  const add = (
    <Button onClick={() => setDialog({ mode: 'create' })}>
      <Plus data-icon="inline-start" />
      {t('catalog.addItem')}
    </Button>
  );

  let body;
  let rows = null;
  if (items.isPending) body = <LoadingState rows={6} />;
  else if (items.isError)
    body = <ErrorState error={items.error} onRetry={() => void items.refetch()} />;
  else {
    rows = resolveRows(items.data, scope, (row) => row.itemId);
    body =
      rows.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={t('catalog.noItems')}
          description={t('catalog.noRowsHint')}
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-card">
          {rows.map((resolved) => {
            const { row } = resolved;
            const inherited = resolved.origin === 'inherited';
            return (
              <CatalogRow
                key={row.id}
                inherited={inherited}
                disabled={row.disabled}
                title={row.title}
                subtitle={row.subtitle}
                slug={row.itemId}
                meta={<span>{categoryLabel(row.categoryId)}</span>}
                tag={<OriginTag resolved={resolved} catalog={catalog} />}
                actions={
                  inherited ? (
                    <OverrideButton
                      slug={row.itemId}
                      onClick={() => setDialog({ mode: 'override', source: row })}
                    />
                  ) : (
                    <RowActions
                      slug={row.itemId}
                      scope={row.scope}
                      disabled={row.disabled}
                      busy={busy}
                      onEdit={() => setDialog({ mode: 'edit', row, replaces: resolved.replaces })}
                      onToggle={() =>
                        save.mutateAsync({ id: row.id, patch: { disabled: !row.disabled } })
                      }
                      onDelete={() => remove.mutateAsync(row.id)}
                    />
                  )
                }
              />
            );
          })}
        </ul>
      );
  }

  return (
    <div className="flex flex-col gap-3">
      <Toolbar rows={rows} add={add} />
      {body}
      <ItemFormDialog
        state={dialog}
        onClose={() => setDialog(null)}
        scope={scope}
        catalog={catalog}
      />
    </div>
  );
}

export function IntervalsPanel({ scope, catalog }: PanelProps) {
  const intervals = useIntervals();
  const items = useItems();
  const save = useSaveInterval();
  const remove = useDeleteInterval();
  const [dialog, setDialog] = useState<IntervalDialogState | null>(null);
  const busy = save.isPending || remove.isPending;
  const itemIds = [...new Set((items.data ?? []).map((item) => item.itemId))];

  const add = (
    <Button onClick={() => setDialog({ mode: 'create' })}>
      <Plus data-icon="inline-start" />
      {t('catalog.addInterval')}
    </Button>
  );

  let body;
  let rows = null;
  if (intervals.isPending) body = <LoadingState rows={6} />;
  else if (intervals.isError)
    body = <ErrorState error={intervals.error} onRetry={() => void intervals.refetch()} />;
  else {
    rows = resolveRows(intervals.data, scope, (row) => row.intervalId);
    body =
      rows.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={t('catalog.noIntervals')}
          description={t('catalog.noRowsHint')}
        />
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-card">
          {rows.map((resolved) => {
            const { row } = resolved;
            const inherited = resolved.origin === 'inherited';
            return (
              <CatalogRow
                key={row.id}
                inherited={inherited}
                disabled={row.disabled}
                title={row.title}
                subtitle={row.description}
                slug={row.intervalId}
                meta={
                  <>
                    <span className="font-medium text-foreground tabular-nums">
                      {t('catalog.every', {
                        km: formatNumber(row.km),
                        months: formatNumber(row.months),
                      })}
                    </span>
                    <span className="font-mono" dir="ltr" title={row.coversItemIds.join(', ')}>
                      {t('catalog.covers', { ids: row.coversItemIds.join(', ') })}
                    </span>
                  </>
                }
                tag={<OriginTag resolved={resolved} catalog={catalog} />}
                actions={
                  inherited ? (
                    <OverrideButton
                      slug={row.intervalId}
                      onClick={() => setDialog({ mode: 'override', source: row })}
                    />
                  ) : (
                    <RowActions
                      slug={row.intervalId}
                      scope={row.scope}
                      disabled={row.disabled}
                      busy={busy}
                      onEdit={() => setDialog({ mode: 'edit', row, replaces: resolved.replaces })}
                      onToggle={() =>
                        save.mutateAsync({ id: row.id, patch: { disabled: !row.disabled } })
                      }
                      onDelete={() => remove.mutateAsync(row.id)}
                    />
                  )
                }
              />
            );
          })}
        </ul>
      );
  }

  return (
    <div className="flex flex-col gap-3">
      <Toolbar rows={rows} add={add} />
      {body}
      <IntervalFormDialog
        state={dialog}
        onClose={() => setDialog(null)}
        scope={scope}
        catalog={catalog}
        itemIds={itemIds}
      />
    </div>
  );
}
