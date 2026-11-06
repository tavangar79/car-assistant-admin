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
import { CollectionBrowser } from '@/features/collections/collection-browser';
import { t } from '@/i18n';
import type { UserVehicle } from './api';
import { vehicleLabel } from './vehicle-label';

/** Collections that hang off the user directly (`userId`) or off one of their vehicles (`vehicleId`). */
const USER_COLLECTIONS = ['notifications'] as const;
const VEHICLE_COLLECTIONS = [
  'service_visits',
  'fuel_logs',
  'expenses',
  'odometer_readings',
  'vehicle_documents',
] as const;

/** Paged record lists through the collection browser. Never calls anything that writes. */
export function UserRecords({ userId, vehicles }: { userId: string; vehicles: UserVehicle[] }) {
  const [vehicleId, setVehicleId] = useState<string | undefined>(vehicles[0]?.id);
  const [tab, setTab] = useState<string>(VEHICLE_COLLECTIONS[0]);
  const vehicleTab = (VEHICLE_COLLECTIONS as readonly string[]).includes(tab);

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList className="flex-wrap">
          {VEHICLE_COLLECTIONS.map((name) => (
            <TabsTrigger key={name} value={name} className="font-mono text-xs">
              {name}
            </TabsTrigger>
          ))}
          {USER_COLLECTIONS.map((name) => (
            <TabsTrigger key={name} value={name} className="font-mono text-xs">
              {name}
            </TabsTrigger>
          ))}
        </TabsList>
        {vehicleTab && vehicles.length > 0 && (
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger className="w-56" aria-label={t('userDetail.pickVehicle')}>
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
      {VEHICLE_COLLECTIONS.map((name) => (
        <TabsContent key={name} value={name}>
          {vehicleId ? (
            <CollectionBrowser name={name} filter={{ vehicleId }} />
          ) : (
            <EmptyState title={t('userDetail.noVehicles')} />
          )}
        </TabsContent>
      ))}
      {USER_COLLECTIONS.map((name) => (
        <TabsContent key={name} value={name}>
          <CollectionBrowser name={name} filter={{ userId }} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
