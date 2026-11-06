import type { AdminUser, UserDetail } from '@/features/users/api';
import type { Interval, ServiceItem, VehicleCatalog } from '@/features/catalog/api';
import type { Stats } from '@/features/dashboard/api';

/** Contract-shaped sample data (API-ADMIN.md, API-PHASE7.md) for MSW handlers. */

export const USER_ID = '65f1a2b3c4d5e6f7a8b9c0d1';
export const VEHICLE_ID = '65f1a2b3c4d5e6f7a8b9c0e2';

export const adminUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: USER_ID,
  phone: '09120000000',
  firstName: 'Sara',
  lastName: 'Ahmadi',
  birthDate: '1990-04-12',
  blockedAt: null,
  blockReason: null,
  createdAt: '2026-10-01T08:30:00.000Z',
  vehicleCount: 1,
  ...overrides,
});

export const userDetail = (user: AdminUser = adminUser()): UserDetail => ({
  user,
  vehicles: [
    {
      id: VEHICLE_ID,
      userId: user.id,
      nickname: 'ماشین من',
      makeId: 'iran-khodro',
      modelId: 'tara',
      trimId: null,
      yearJalali: 1402,
      mileageKm: 42000,
      createdAt: '2026-10-02T10:00:00.000Z',
      counts: { serviceVisits: 3, fuelLogs: 12, expenses: 4, odometerReadings: 7, documents: 1 },
    },
  ],
  transfers: [],
  notificationCount: 2,
});

export const vehicleCatalog: VehicleCatalog = {
  makes: [
    {
      id: 'iran-khodro',
      name: 'Iran Khodro',
      models: [
        {
          id: 'tara',
          name: 'Tara',
          trims: [
            { id: 'tara-v1-mt', name: 'V1 MT' },
            { id: 'tara-v4-at', name: 'V4 AT' },
          ],
        },
      ],
    },
  ],
};

const TIMES = { createdAt: '2026-10-01T00:00:00.000Z', updatedAt: '2026-10-01T00:00:00.000Z' };

export const serviceItems: ServiceItem[] = [
  {
    id: '65f1a2b3c4d5e6f7a8b9c101',
    itemId: 'engine_oil',
    scope: { makeId: null, modelId: null, trimId: null },
    categoryId: 'fluids',
    title: 'Engine oil',
    subtitle: 'Oil and filter',
    icon: 'oil_barrel',
    sortOrder: 1,
    disabled: false,
    ...TIMES,
  },
  {
    id: '65f1a2b3c4d5e6f7a8b9c102',
    itemId: 'engine_oil',
    scope: { makeId: 'iran-khodro', modelId: 'tara', trimId: null },
    categoryId: 'fluids',
    title: 'Tara engine oil',
    subtitle: '5W-30',
    icon: 'oil_barrel',
    sortOrder: 1,
    disabled: true,
    ...TIMES,
  },
];

export const intervals: Interval[] = [
  {
    id: '65f1a2b3c4d5e6f7a8b9c201',
    intervalId: 'oil_change',
    scope: { makeId: null, modelId: null, trimId: null },
    title: 'Oil change',
    description: 'Engine oil and filter',
    icon: 'oil_barrel',
    coversItemIds: ['engine_oil'],
    km: 5000,
    months: 6,
    sortOrder: 1,
    disabled: false,
    ...TIMES,
  },
];

const zeroBucket = (bucketStart: string) => ({
  bucketStart,
  users: 0,
  vehicles: 0,
  serviceVisits: 0,
  fuelLogs: 0,
  expenses: 0,
  odometerReadings: 0,
  documents: 0,
});

export const stats = (from: string, to: string, bucket: Stats['range']['bucket']): Stats => ({
  range: { from, to, bucket },
  totals: {
    users: 1234,
    blockedUsers: 3,
    vehicles: 1500,
    serviceVisits: 820,
    fuelLogs: 4100,
    expenses: 640,
    odometerReadings: 2200,
    documents: 95,
  },
  series: [{ ...zeroBucket(from), users: 4, vehicles: 2, fuelLogs: 9 }, zeroBucket(to)],
});
