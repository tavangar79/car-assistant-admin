import { Info, Plus } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { t } from '@/i18n';
import { formatNumber } from '@/lib/format';
import {
  CATEGORY_IDS,
  GLOBAL_SCOPE,
  type Interval,
  KM_MAX,
  KM_MIN,
  MONTHS_MAX,
  MONTHS_MIN,
  type Scope,
  type ServiceItem,
  useDeleteInterval,
  useDeleteItem,
  useIntervals,
  useItems,
  useSaveInterval,
  useSaveItem,
  useVehicleCatalog,
  type VehicleCatalog,
} from './api';
import { IntervalFormDialog } from './interval-form-dialog';
import { ItemFormDialog } from './item-form-dialog';
import { RowActions } from './row-actions';
import { sameScope } from './scope';
import { ScopeLabel } from './scope-label';
import { ScopePicker } from './scope-picker';

function CatalogRules() {
  return (
    <Alert>
      <Info />
      <AlertTitle>{t('catalog.rulesTitle')}</AlertTitle>
      <AlertDescription>
        <ul className="list-disc ps-4">
          <li>{t('catalog.ruleResolution')}</li>
          <li>{t('catalog.ruleGlobal')}</li>
          <li>{t('catalog.ruleImmutable')}</li>
          <li>
            {t('catalog.ruleLimits', {
              kmMin: formatNumber(KM_MIN),
              kmMax: formatNumber(KM_MAX),
              monthsMin: MONTHS_MIN,
              monthsMax: MONTHS_MAX,
            })}
          </li>
        </ul>
      </AlertDescription>
    </Alert>
  );
}

const filterRows = <R extends { scope: Scope }>(rows: R[], scope: Scope | null) =>
  scope === null ? rows : rows.filter((row) => sameScope(row.scope, scope));

function StatusBadge({ disabled }: { disabled: boolean }) {
  return disabled ? (
    <Badge variant="outline">{t('catalog.statusDisabled')}</Badge>
  ) : (
    <Badge variant="secondary">{t('catalog.statusActive')}</Badge>
  );
}

const categoryLabel = (id: string) =>
  (CATEGORY_IDS as readonly string[]).includes(id)
    ? t(`category.${id as (typeof CATEGORY_IDS)[number]}`)
    : id;

function ItemsTab({
  catalog,
  scope,
}: {
  catalog: VehicleCatalog | undefined;
  scope: Scope | null;
}) {
  const items = useItems();
  const save = useSaveItem();
  const remove = useDeleteItem();
  const [dialog, setDialog] = useState<{ row: ServiceItem | null } | null>(null);

  const add = (
    <Button onClick={() => setDialog({ row: null })}>
      <Plus data-icon="inline-start" />
      {t('catalog.addItem')}
    </Button>
  );

  let body;
  if (items.isPending) body = <LoadingState rows={8} />;
  else if (items.isError)
    body = <ErrorState error={items.error} onRetry={() => void items.refetch()} />;
  else {
    const rows = filterRows(items.data, scope);
    body =
      rows.length === 0 ? (
        <EmptyState title={t('catalog.noItems')} description={t('catalog.noRowsHint')} />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('catalog.field.itemId')}</TableHead>
                <TableHead>{t('catalog.field.title')}</TableHead>
                <TableHead>{t('catalog.field.category')}</TableHead>
                <TableHead>{t('catalog.field.scope')}</TableHead>
                <TableHead className="text-end">{t('catalog.field.sortOrder')}</TableHead>
                <TableHead>{t('catalog.status')}</TableHead>
                <TableHead className="text-end">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={row.disabled ? 'text-muted-foreground' : undefined}
                >
                  <TableCell className="font-mono text-xs">{row.itemId}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span dir="auto">{row.title}</span>
                      <span dir="auto" className="text-xs text-muted-foreground">
                        {row.subtitle}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{categoryLabel(row.categoryId)}</TableCell>
                  <TableCell>
                    <ScopeLabel scope={row.scope} catalog={catalog} />
                  </TableCell>
                  <TableCell className="text-end tabular-nums">{row.sortOrder}</TableCell>
                  <TableCell>
                    <StatusBadge disabled={row.disabled} />
                  </TableCell>
                  <TableCell>
                    <RowActions
                      slug={row.itemId}
                      scope={row.scope}
                      disabled={row.disabled}
                      busy={save.isPending || remove.isPending}
                      onEdit={() => setDialog({ row })}
                      onToggle={() =>
                        save.mutateAsync({ id: row.id, patch: { disabled: !row.disabled } })
                      }
                      onDelete={() => remove.mutateAsync(row.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">{add}</div>
      {body}
      <ItemFormDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        row={dialog?.row ?? null}
        defaultScope={scope ?? GLOBAL_SCOPE}
        catalog={catalog}
      />
    </div>
  );
}

function IntervalsTab({
  catalog,
  scope,
}: {
  catalog: VehicleCatalog | undefined;
  scope: Scope | null;
}) {
  const intervals = useIntervals();
  const items = useItems();
  const save = useSaveInterval();
  const remove = useDeleteInterval();
  const [dialog, setDialog] = useState<{ row: Interval | null } | null>(null);
  const itemIds = [...new Set((items.data ?? []).map((item) => item.itemId))];

  let body;
  if (intervals.isPending) body = <LoadingState rows={8} />;
  else if (intervals.isError)
    body = <ErrorState error={intervals.error} onRetry={() => void intervals.refetch()} />;
  else {
    const rows = filterRows(intervals.data, scope);
    body =
      rows.length === 0 ? (
        <EmptyState title={t('catalog.noIntervals')} description={t('catalog.noRowsHint')} />
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('catalog.field.intervalId')}</TableHead>
                <TableHead>{t('catalog.field.title')}</TableHead>
                <TableHead className="text-end">{t('catalog.field.km')}</TableHead>
                <TableHead className="text-end">{t('catalog.field.months')}</TableHead>
                <TableHead>{t('catalog.field.coversItemIds')}</TableHead>
                <TableHead>{t('catalog.field.scope')}</TableHead>
                <TableHead>{t('catalog.status')}</TableHead>
                <TableHead className="text-end">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={row.disabled ? 'text-muted-foreground' : undefined}
                >
                  <TableCell className="font-mono text-xs">{row.intervalId}</TableCell>
                  <TableCell>
                    <span dir="auto">{row.title}</span>
                  </TableCell>
                  <TableCell className="text-end tabular-nums">{formatNumber(row.km)}</TableCell>
                  <TableCell className="text-end tabular-nums">
                    {formatNumber(row.months)}
                  </TableCell>
                  <TableCell className="max-w-48">
                    <span
                      className="line-clamp-2 font-mono text-xs"
                      title={row.coversItemIds.join(', ')}
                    >
                      {row.coversItemIds.join(', ')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ScopeLabel scope={row.scope} catalog={catalog} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge disabled={row.disabled} />
                  </TableCell>
                  <TableCell>
                    <RowActions
                      slug={row.intervalId}
                      scope={row.scope}
                      disabled={row.disabled}
                      busy={save.isPending || remove.isPending}
                      onEdit={() => setDialog({ row })}
                      onToggle={() =>
                        save.mutateAsync({ id: row.id, patch: { disabled: !row.disabled } })
                      }
                      onDelete={() => remove.mutateAsync(row.id)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Button onClick={() => setDialog({ row: null })}>
          <Plus data-icon="inline-start" />
          {t('catalog.addInterval')}
        </Button>
      </div>
      {body}
      <IntervalFormDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        row={dialog?.row ?? null}
        defaultScope={scope ?? GLOBAL_SCOPE}
        catalog={catalog}
        itemIds={itemIds}
      />
    </div>
  );
}

export function CatalogPage() {
  const vehicleCatalog = useVehicleCatalog();
  const [scope, setScope] = useState<Scope | null>(null);

  return (
    <>
      <PageHeader title={t('catalog.title')} description={t('catalog.description')} />
      <CatalogRules />
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">{t('catalog.scopeFilter')}</span>
        <ScopePicker
          idPrefix="filter-scope"
          allowAll
          catalog={vehicleCatalog.data}
          value={scope}
          onChange={setScope}
        />
        {vehicleCatalog.isError && (
          <Button variant="link" size="sm" onClick={() => void vehicleCatalog.refetch()}>
            {t('catalog.vehicleCatalogError')}
          </Button>
        )}
      </div>
      <Tabs defaultValue="items" className="gap-4">
        <TabsList>
          <TabsTrigger value="items">{t('catalog.items')}</TabsTrigger>
          <TabsTrigger value="intervals">{t('catalog.intervals')}</TabsTrigger>
        </TabsList>
        <TabsContent value="items">
          <ItemsTab catalog={vehicleCatalog.data} scope={scope} />
        </TabsContent>
        <TabsContent value="intervals">
          <IntervalsTab catalog={vehicleCatalog.data} scope={scope} />
        </TabsContent>
      </Tabs>
    </>
  );
}
