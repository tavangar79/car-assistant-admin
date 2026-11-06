import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState } from '@/components/states';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { LOCALE, t, type TranslationKey } from '@/i18n';
import { formatDate, formatNumber } from '@/lib/format';
import { type StatsBucket, type StatsTotals, useStats } from './api';
import {
  BUCKETS,
  type Bucket,
  DEFAULT_BUCKET,
  RANGE_PRESETS,
  type RangePreset,
  presetRange,
  todayInTehran,
} from './range';

const TOTALS: { key: keyof StatsTotals; label: TranslationKey }[] = [
  { key: 'users', label: 'stats.users' },
  { key: 'blockedUsers', label: 'stats.blockedUsers' },
  { key: 'vehicles', label: 'stats.vehicles' },
  { key: 'serviceVisits', label: 'stats.serviceVisits' },
  { key: 'fuelLogs', label: 'stats.fuelLogs' },
  { key: 'expenses', label: 'stats.expenses' },
  { key: 'odometerReadings', label: 'stats.odometerReadings' },
  { key: 'documents', label: 'stats.documents' },
];

const RECORD_KEYS = [
  'serviceVisits',
  'fuelLogs',
  'expenses',
  'odometerReadings',
  'documents',
] as const;
type SeriesKey = Exclude<keyof StatsBucket, 'bucketStart'>;

const chartConfig = {
  users: { label: t('stats.newUsers'), color: 'var(--chart-1)' },
  vehicles: { label: t('stats.newVehicles'), color: 'var(--chart-2)' },
  serviceVisits: { label: t('stats.serviceVisits'), color: 'var(--chart-1)' },
  fuelLogs: { label: t('stats.fuelLogs'), color: 'var(--chart-2)' },
  expenses: { label: t('stats.expenses'), color: 'var(--chart-3)' },
  odometerReadings: { label: t('stats.odometerReadings'), color: 'var(--chart-4)' },
  documents: { label: t('stats.documents'), color: 'var(--chart-5)' },
} satisfies ChartConfig;

const monthFormat = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const dayFormat = new Intl.DateTimeFormat(LOCALE, {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
});

function bucketLabel(bucketStart: string, bucket: Bucket): string {
  const date = new Date(`${bucketStart}T00:00:00Z`);
  return bucket === 'month' ? monthFormat.format(date) : dayFormat.format(date);
}

function hasActivity(series: StatsBucket[], keys: readonly SeriesKey[]): boolean {
  return series.some((row) => keys.some((key) => row[key] > 0));
}

function SeriesChart({
  title,
  description,
  series,
  keys,
  bucket,
}: {
  title: string;
  description?: string;
  series: StatsBucket[];
  keys: readonly SeriesKey[];
  bucket: Bucket;
}) {
  const stacked = keys.length > 1;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {hasActivity(series, keys) ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <BarChart data={series} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="bucketStart"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={(value: string) => bucketLabel(value, bucket)}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => bucketLabel(String(value), bucket)}
                  />
                }
              />
              {stacked && <ChartLegend content={<ChartLegendContent />} />}
              {keys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId={stacked ? 'records' : undefined}
                  fill={`var(--color-${key})`}
                  radius={!stacked || index === keys.length - 1 ? [4, 4, 0, 0] : 0}
                />
              ))}
            </BarChart>
          </ChartContainer>
        ) : (
          <EmptyState title={t('dashboard.noActivity')} />
        )}
      </CardContent>
    </Card>
  );
}

function TotalCards({ totals }: { totals: StatsTotals | undefined }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {TOTALS.map(({ key, label }) => (
        <Card key={key} className="gap-1 py-4">
          <CardHeader className="px-4">
            <CardDescription>{t(label)}</CardDescription>
            <CardTitle className="text-2xl tabular-nums" data-testid={`total-${key}`}>
              {totals ? formatNumber(totals[key]) : <Skeleton className="h-7 w-16" />}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [bucket, setBucket] = useState<Bucket>(DEFAULT_BUCKET['30d']);
  const range = presetRange(preset, todayInTehran());
  const stats = useStats({ ...range, bucket });

  function pickPreset(value: string) {
    if (!value) return;
    const next = value as RangePreset;
    setPreset(next);
    setBucket(DEFAULT_BUCKET[next]);
  }

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.range', {
          from: formatDate(range.from),
          to: formatDate(range.to),
        })}
        actions={
          <>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={preset}
              onValueChange={pickPreset}
              aria-label={t('dashboard.rangeLabel')}
            >
              {RANGE_PRESETS.map((value) => (
                <ToggleGroupItem key={value} value={value}>
                  {t(`dashboard.preset.${value}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={bucket}
              onValueChange={(value) => value && setBucket(value as Bucket)}
              aria-label={t('dashboard.bucketLabel')}
            >
              {BUCKETS.map((value) => (
                <ToggleGroupItem key={value} value={value}>
                  {t(`dashboard.bucket.${value}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </>
        }
      />
      {stats.isError ? (
        <ErrorState error={stats.error} onRetry={() => void stats.refetch()} />
      ) : (
        <>
          <TotalCards totals={stats.data?.totals} />
          <p className="-mt-3 text-xs text-muted-foreground">{t('dashboard.totalsNote')}</p>
          {stats.data ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <SeriesChart
                title={t('stats.newUsers')}
                series={stats.data.series}
                keys={['users']}
                bucket={stats.data.range.bucket}
              />
              <SeriesChart
                title={t('stats.newVehicles')}
                series={stats.data.series}
                keys={['vehicles']}
                bucket={stats.data.range.bucket}
              />
              <div className="lg:col-span-2">
                <SeriesChart
                  title={t('dashboard.recordsByType')}
                  description={t('dashboard.recordsNote')}
                  series={stats.data.series}
                  keys={RECORD_KEYS}
                  bucket={stats.data.range.bucket}
                />
              </div>
            </div>
          ) : (
            <div
              className="grid gap-4 lg:grid-cols-2"
              role="status"
              aria-label={t('common.loading')}
            >
              <Skeleton className="h-80" />
              <Skeleton className="h-80" />
            </div>
          )}
        </>
      )}
    </>
  );
}
