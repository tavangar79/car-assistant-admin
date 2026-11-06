import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router';
import { CopyId } from '@/components/copy-id';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { ValueCell } from '@/components/value-cell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CollectionTable } from '@/features/collections/collection-table';
import { t, type TranslationKey } from '@/i18n';
import { formatDate, formatDateTime, formatNumber, fullName } from '@/lib/format';
import {
  type AdminUser,
  type RecordCounts,
  type UserDetail,
  type UserVehicle,
  useUser,
} from './api';
import { BlockControls } from './block-controls';
import { BlockedBadge } from './blocked-badge';
import { EditProfileDialog } from './edit-profile-dialog';
import { UserRecords } from './user-records';
import { vehicleLabel } from './vehicle-label';

const COUNT_LABELS: Record<keyof RecordCounts, TranslationKey> = {
  serviceVisits: 'stats.serviceVisits',
  fuelLogs: 'stats.fuelLogs',
  expenses: 'stats.expenses',
  odometerReadings: 'stats.odometerReadings',
  documents: 'stats.documents',
};

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function ProfileCard({ user, notificationCount }: { user: AdminUser; notificationCount: number }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-base">{t('userDetail.profile')}</CardTitle>
          <CardDescription>{t('userDetail.profileHint')}</CardDescription>
        </div>
        <EditProfileDialog user={user} />
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label={t('profile.firstName')}>
            <span dir="auto">{user.firstName ?? t('common.none')}</span>
          </Detail>
          <Detail label={t('profile.lastName')}>
            <span dir="auto">{user.lastName ?? t('common.none')}</span>
          </Detail>
          <Detail label={t('profile.birthDate')}>
            {user.birthDate ? formatDate(user.birthDate) : t('common.none')}
          </Detail>
          <Detail label={t('users.phone')}>
            <span className="font-mono" dir="ltr">
              {user.phone}
            </span>
          </Detail>
          <Detail label={t('users.joined')}>{formatDateTime(user.createdAt)}</Detail>
          <Detail label={t('userDetail.notifications')}>{formatNumber(notificationCount)}</Detail>
        </dl>
      </CardContent>
    </Card>
  );
}

function BlockNotice({ user }: { user: AdminUser }) {
  if (!user.blockedAt) return null;
  return (
    <div
      role="status"
      className="flex flex-col gap-1 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
    >
      <p className="font-medium text-destructive">
        {t('userDetail.blockedSince', { date: formatDateTime(user.blockedAt) })}
      </p>
      <p className="text-muted-foreground">
        {t('userDetail.blockReason')}{' '}
        <span dir="auto" className="text-foreground">
          {user.blockReason ?? t('userDetail.noReason')}
        </span>
      </p>
    </div>
  );
}

/** Primitive fields of a vehicle (as the `vehicles` collection shows it), without the counts. */
function vehicleFields(vehicle: UserVehicle): [string, unknown][] {
  return Object.entries(vehicle).filter(
    ([key, value]) =>
      key !== 'counts' && key !== 'id' && (value === null || typeof value !== 'object'),
  );
}

function VehiclesCard({ vehicles }: { vehicles: UserVehicle[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t('userDetail.vehicles', { count: formatNumber(vehicles.length) })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {vehicles.length === 0 ? (
          <EmptyState title={t('userDetail.noVehicles')} />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {vehicles.map((vehicle) => (
              <li key={vehicle.id} className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium" dir="auto">
                    {vehicleLabel(vehicle)}
                  </span>
                  <CopyId id={vehicle.id} />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(COUNT_LABELS) as (keyof RecordCounts)[]).map((key) => (
                    <Badge key={key} variant="secondary" className="tabular-nums">
                      {t(COUNT_LABELS[key])}: {formatNumber(vehicle.counts[key])}
                    </Badge>
                  ))}
                </div>
                <dl className="grid grid-cols-2 gap-2">
                  {vehicleFields(vehicle).map(([key, value]) => (
                    <div key={key} className="flex flex-col gap-0.5">
                      <dt className="font-mono text-xs text-muted-foreground">{key}</dt>
                      <dd className="text-sm">
                        <ValueCell value={value} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TransfersCard({ transfers }: { transfers: UserDetail['transfers'] }) {
  const fields = [...new Set(transfers.flatMap((transfer) => Object.keys(transfer)))];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t('userDetail.transfers')}</CardTitle>
        <CardDescription>{t('userDetail.transfersHint')}</CardDescription>
      </CardHeader>
      <CardContent>
        {transfers.length === 0 ? (
          <EmptyState title={t('userDetail.noTransfers')} />
        ) : (
          <CollectionTable fields={fields} documents={transfers} />
        )}
      </CardContent>
    </Card>
  );
}

export function UserDetailPage() {
  const { id = '' } = useParams();
  const query = useUser(id);

  const back = (
    <Button variant="ghost" size="sm" asChild className="-ms-2 self-start">
      <Link to="/users">
        <ArrowLeft data-icon="inline-start" className="rtl:rotate-180" />
        {t('userDetail.back')}
      </Link>
    </Button>
  );

  if (query.isPending) {
    return (
      <>
        {back}
        <LoadingState rows={6} />
      </>
    );
  }
  if (query.isError) {
    return (
      <>
        {back}
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </>
    );
  }

  const { user, vehicles, transfers, notificationCount } = query.data;
  const name = fullName(user);

  return (
    <>
      {back}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight" dir="auto">
              {name ?? t('users.noName')}
            </h1>
            {user.blockedAt && <BlockedBadge />}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono" dir="ltr">
              {user.phone}
            </span>
            <CopyId id={user.id} />
          </div>
        </div>
        <BlockControls user={user} />
      </div>
      <BlockNotice user={user} />
      <ProfileCard user={user} notificationCount={notificationCount} />
      <VehiclesCard vehicles={vehicles} />
      <TransfersCard transfers={transfers} />
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">{t('userDetail.records')}</h2>
        <UserRecords userId={user.id} vehicles={vehicles} />
      </section>
    </>
  );
}
