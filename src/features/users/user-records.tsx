import { Car } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/states';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { t, type TranslationKey } from '@/i18n';
import type { UserVehicle } from './api';
import { RecordBrowser } from './record-browser';
import { vehicleLabel } from './vehicle-label';

/** Collections that hang off one of the user's vehicles (`vehicleId`) or the user (`userId`). */
const VEHICLE_COLLECTIONS: { name: string; label: TranslationKey }[] = [
  { name: 'service_visits', label: 'stats.serviceVisits' },
  { name: 'fuel_logs', label: 'stats.fuelLogs' },
  { name: 'expenses', label: 'stats.expenses' },
  { name: 'odometer_readings', label: 'stats.odometerReadings' },
  { name: 'vehicle_documents', label: 'stats.documents' },
];
const USER_COLLECTIONS: { name: string; label: TranslationKey }[] = [
  { name: 'notifications', label: 'userDetail.notifications' },
];

/** Paged, read-only record lists. Never calls anything that writes. */
export function UserRecords({ userId, vehicles }: { userId: string; vehicles: UserVehicle[] }) {
  const [vehicleId, setVehicleId] = useState<string | undefined>(vehicles[0]?.id);
  const [tab, setTab] = useState<string>('service_visits');
  const vehicleTab = VEHICLE_COLLECTIONS.some((c) => c.name === tab);

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="h-auto flex-wrap">
          {[...VEHICLE_COLLECTIONS, ...USER_COLLECTIONS].map(({ name, label }) => (
            <TabsTrigger key={name} value={name}>
              {t(label)}
            </TabsTrigger>
          ))}
        </TabsList>
        {vehicleTab && vehicles.length > 0 && (
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger className="w-full sm:w-60" aria-label={t('userDetail.pickVehicle')}>
              <Car aria-hidden />
              <SelectValue placeholder={t('userDetail.pickVehicle')} />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  <span dir="auto">{vehicleLabel(vehicle)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      {VEHICLE_COLLECTIONS.map(({ name }) => (
        <TabsContent key={name} value={name}>
          {vehicleId ? (
            <RecordBrowser name={name} filter={{ vehicleId }} />
          ) : (
            <EmptyState icon={Car} title={t('userDetail.noVehicles')} />
          )}
        </TabsContent>
      ))}
      {USER_COLLECTIONS.map(({ name }) => (
        <TabsContent key={name} value={name}>
          <RecordBrowser name={name} filter={{ userId }} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
