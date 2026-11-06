import { Info, PanelLeftOpen } from 'lucide-react';
import { Fragment, useState } from 'react';
import { useSearchParams } from 'react-router';
import { PageHeader } from '@/components/page-header';
import { ErrorState } from '@/components/states';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { t } from '@/i18n';
import { formatNumber } from '@/lib/format';
import {
  KM_MAX,
  KM_MIN,
  MONTHS_MAX,
  MONTHS_MIN,
  type Scope,
  useIntervals,
  useItems,
  useVehicleCatalog,
  type VehicleCatalog,
} from './api';
import { IntervalsPanel, ItemsPanel } from './catalog-panels';
import { ancestorScopes, scopeFromParams, scopeKey, scopeNames, scopeToParams } from './scope';
import { ScopeTree } from './scope-tree';
import { buildTree, countByScope, LEVEL_LABEL, type ScopeLevel } from './tree';

const LEVEL_HINT = {
  global: 'catalog.levelHint.global',
  make: 'catalog.levelHint.make',
  model: 'catalog.levelHint.model',
  trim: 'catalog.levelHint.trim',
} as const;

const levelOf = (scope: Scope): ScopeLevel =>
  scope.trimId ? 'trim' : scope.modelId ? 'model' : scope.makeId ? 'make' : 'global';

function CatalogRules() {
  return (
    <details className="group rounded-xl border bg-card text-sm shadow-card">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3 font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <Info className="size-4 text-primary" aria-hidden />
        {t('catalog.rulesTitle')}
      </summary>
      <ul className="flex list-disc flex-col gap-1.5 border-t px-4 py-3 ps-8 text-muted-foreground">
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
    </details>
  );
}

function ScopeBreadcrumbs({
  scope,
  catalog,
  onSelect,
}: {
  scope: Scope;
  catalog: VehicleCatalog | undefined;
  onSelect: (scope: Scope) => void;
}) {
  const chain = ancestorScopes(scope);
  const label = (s: Scope) => scopeNames(s, catalog).at(-1) ?? t('scope.global');
  return (
    <Breadcrumb aria-label={t('catalog.breadcrumbs')}>
      <BreadcrumbList>
        {chain.map((s, index) => (
          <Fragment key={scopeKey(s)}>
            {index > 0 && <BreadcrumbSeparator className="rtl:rotate-180" />}
            <BreadcrumbItem>
              {index === chain.length - 1 ? (
                <BreadcrumbPage dir="auto">{label(s)}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <button
                    type="button"
                    dir="auto"
                    className="rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    onClick={() => onSelect(s)}
                  >
                    {label(s)}
                  </button>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function TreePane({ scope, onSelect }: { scope: Scope; onSelect: (scope: Scope) => void }) {
  const vehicleCatalog = useVehicleCatalog();
  const items = useItems();
  const intervals = useIntervals();
  const counts = countByScope([...(items.data ?? []), ...(intervals.data ?? [])]);

  if (vehicleCatalog.isPending) {
    return (
      <div className="flex flex-col gap-2" role="status" aria-label={t('common.loading')}>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-8 w-full" />
        ))}
      </div>
    );
  }
  if (vehicleCatalog.isError) {
    return (
      <ErrorState error={vehicleCatalog.error} onRetry={() => void vehicleCatalog.refetch()} />
    );
  }
  return (
    <ScopeTree
      root={buildTree(vehicleCatalog.data)}
      selected={scope}
      onSelect={onSelect}
      counts={counts}
    />
  );
}

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const vehicleCatalog = useVehicleCatalog();
  const catalog = vehicleCatalog.data;
  const scope = scopeFromParams(params);
  const level = levelOf(scope);
  const name = scopeNames(scope, catalog).at(-1) ?? t('scope.global');

  function select(next: Scope) {
    setParams(scopeToParams(next));
    setDrawerOpen(false);
  }

  return (
    <>
      <PageHeader title={t('catalog.title')} description={t('catalog.description')} />
      <div className="grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <Card className="sticky top-22 hidden max-h-[calc(100svh-7rem)] gap-3 overflow-y-auto lg:flex">
          <CardContent className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {t('catalog.tree.title')}
            </h2>
            <TreePane scope={scope} onSelect={select} />
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ScopeBreadcrumbs scope={scope} catalog={catalog} onSelect={select} />
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <PanelLeftOpen data-icon="inline-start" className="rtl:-scale-x-100" />
                  {t('catalog.tree.open')}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 max-w-[85vw] gap-0">
                <SheetHeader>
                  <SheetTitle>{t('catalog.tree.title')}</SheetTitle>
                  <SheetDescription>{t('catalog.tree.drawerHint')}</SheetDescription>
                </SheetHeader>
                <div className="overflow-y-auto px-4 pb-4">
                  <TreePane scope={scope} onSelect={select} />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight" dir="auto">
                {name}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {t(LEVEL_LABEL[level])}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{t(LEVEL_HINT[level], { name })}</p>
          </div>

          <CatalogRules />

          <Tabs defaultValue="items" className="gap-4">
            <TabsList>
              <TabsTrigger value="items">{t('catalog.items')}</TabsTrigger>
              <TabsTrigger value="intervals">{t('catalog.intervals')}</TabsTrigger>
            </TabsList>
            <TabsContent value="items">
              <ItemsPanel key={scopeKey(scope)} scope={scope} catalog={catalog} />
            </TabsContent>
            <TabsContent value="intervals">
              <IntervalsPanel key={scopeKey(scope)} scope={scope} catalog={catalog} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
