import {
  Car,
  FileText,
  Fuel,
  Gauge,
  type LucideIcon,
  Receipt,
  UserX,
  Users,
  Wrench,
  BarChart3,
} from 'lucide-react';
import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
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

const TOTALS: { key: keyof StatsTotals; label: TranslationKey; icon: LucideIcon }[] = [
  { key: 'users', label: 'stats.users', icon: Users },
  { key: 'blockedUsers', label: 'stats.blockedUsers', icon: UserX },
  { key: 'vehicles', label: 'stats.vehicles', icon: Car },
  { key: 'serviceVisits', label: 'stats.serviceVisits', icon: Wrench },
  { key: 'fuelLogs', label: 'stats.fuelLogs', icon: Fuel },
  { key: 'expenses', label: 'stats.expenses', icon: Receipt },
  { key: 'odometerReadings', label: 'stats.odometerReadings', icon: Gauge },
  { key: 'documents', label: 'stats.documents', icon: FileText },
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
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {hasActivity(series, keys) ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            {stacked ? (
              <BarChart data={series} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                <ChartLegend
                  content={<ChartLegendContent className="flex-wrap gap-x-4 gap-y-1" />}
                />
                {keys.map((key, index) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="records"
                    fill={`var(--color-${key})`}
                    radius={index === keys.length - 1 ? [4, 4, 0, 0] : 0}
                  />
                ))}
              </BarChart>
            ) : (
              <AreaChart data={series} accessibilityLayer margin={{ top: 8 }}>
                <defs>
                  {keys.map((key) => (
                    <linearGradient key={key} id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                {keys.map((key) => (
                  <Area
                    key={key}
                    dataKey={key}
                    type="monotone"
                    stroke={`var(--color-${key})`}
                    strokeWidth={2}
                    fill={`url(#fill-${key})`}
                  />
                ))}
              </AreaChart>
            )}
          </ChartContainer>
        ) : (
          <EmptyState icon={BarChart3} title={t('dashboard.noActivity')} />
        )}
      </CardContent>
    </Card>
  );
}

function TotalCards({ totals }: { totals: StatsTotals | undefined }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {TOTALS.map(({ key, label, icon: Icon }) => (
        <Card key={key} className="gap-3">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardDescription className="leading-tight font-medium">{t(label)}</CardDescription>
            <span
              className={
                key === 'blockedUsers'
                  ? 'flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive'
                  : 'flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground'
              }
            >
              <Icon className="size-4" aria-hidden />
            </span>
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl"
              data-testid={`total-${key}`}
            >
              {totals ? formatNumber(totals[key]) : <Skeleton className="h-9 w-20" />}
            </div>
          </CardContent>
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
          <p className="-mt-2 text-xs text-muted-foreground">{t('dashboard.totalsNote')}</p>
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
              <Skeleton className="h-80 rounded-xl" />
              <Skeleton className="h-80 rounded-xl" />
            </div>
          )}
        </>
      )}
    </>
  );
}
