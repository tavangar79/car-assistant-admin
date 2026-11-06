import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest, apiSend } from '@/lib/api-client';
import { isoDateTime, objectId } from '@/lib/schemas';

// --- Vehicle catalog (scope picker) -------------------------------------------------------------

const catalogRef = z.object({ id: z.string(), name: z.string() });
export const vehicleCatalogSchema = z.object({
  makes: z.array(
    catalogRef.extend({
      models: z.array(catalogRef.extend({ trims: z.array(catalogRef) })),
    }),
  ),
});
export type VehicleCatalog = z.infer<typeof vehicleCatalogSchema>;

// --- Rows (API-PHASE7.md, T7.3) -----------------------------------------------------------------

/** All null = global. `modelId` needs `makeId`, `trimId` needs `modelId`. */
export const scopeSchema = z.object({
  makeId: z.string().nullable(),
  modelId: z.string().nullable(),
  trimId: z.string().nullable(),
});
export type Scope = z.infer<typeof scopeSchema>;
export const GLOBAL_SCOPE: Scope = { makeId: null, modelId: null, trimId: null };

/** The 6 static categories from DOMAIN.md, in display order. */
export const CATEGORY_IDS = [
  'fluids',
  'brakes',
  'suspension',
  'electrical',
  'drivetrain',
  'periodic',
] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export const serviceItemSchema = z.object({
  id: objectId,
  itemId: z.string(),
  scope: scopeSchema,
  categoryId: z.string(),
  title: z.string(),
  subtitle: z.string(),
  icon: z.string(),
  sortOrder: z.number().int(),
  disabled: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export const intervalSchema = z.object({
  id: objectId,
  intervalId: z.string(),
  scope: scopeSchema,
  title: z.string(),
  description: z.string(),
  icon: z.string(),
  coversItemIds: z.array(z.string()),
  km: z.number().int(),
  months: z.number().int(),
  sortOrder: z.number().int(),
  disabled: z.boolean(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
});

export type ServiceItem = z.infer<typeof serviceItemSchema>;
export type Interval = z.infer<typeof intervalSchema>;

// --- Form rules (mirror the backend's zod rules) ------------------------------------------------

export const SLUG = /^[a-z0-9_]{2,40}$/;
export const ICON = /^[a-z0-9_]+$/;
export const KM_MIN = 500;
export const KM_MAX = 200_000;
export const MONTHS_MIN = 1;
export const MONTHS_MAX = 120;

const text = z.string().trim().min(1);
const icon = z.string().regex(ICON);
const sortOrder = z.number().int();

export const itemFieldsSchema = z.object({
  categoryId: z.enum(CATEGORY_IDS),
  title: text,
  subtitle: text,
  icon,
  sortOrder,
  disabled: z.boolean(),
});
export const createItemSchema = itemFieldsSchema.extend({
  itemId: z.string().regex(SLUG),
  scope: scopeSchema,
});

export const intervalFieldsSchema = z.object({
  title: text,
  description: text,
  icon,
  coversItemIds: z.array(z.string().min(1)).min(1),
  km: z.number().int().min(KM_MIN).max(KM_MAX),
  months: z.number().int().min(MONTHS_MIN).max(MONTHS_MAX),
  sortOrder,
  disabled: z.boolean(),
});
export const createIntervalSchema = intervalFieldsSchema.extend({
  intervalId: z.string().regex(SLUG),
  scope: scopeSchema,
});

export type ItemFields = z.infer<typeof itemFieldsSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type IntervalFields = z.infer<typeof intervalFieldsSchema>;
export type CreateIntervalInput = z.infer<typeof createIntervalSchema>;

// --- Calls --------------------------------------------------------------------------------------

const itemsResponse = z.object({ items: z.array(serviceItemSchema) });
const itemResponse = z.object({ item: serviceItemSchema });
const intervalsResponse = z.object({ intervals: z.array(intervalSchema) });
const intervalResponse = z.object({ interval: intervalSchema });

export const fetchVehicleCatalog = () => apiRequest('/vehicle-catalog', vehicleCatalogSchema);
export const fetchItems = () => apiRequest('/service-items', itemsResponse).then((b) => b.items);
export const fetchIntervals = () =>
  apiRequest('/intervals', intervalsResponse).then((b) => b.intervals);

export const createItem = (body: CreateItemInput) =>
  apiRequest('/service-items', itemResponse, { method: 'POST', body }).then((b) => b.item);
export const updateItem = (id: string, body: Partial<ItemFields>) =>
  apiRequest(`/service-items/${id}`, itemResponse, { method: 'PATCH', body }).then((b) => b.item);
export const deleteItem = (id: string) => apiSend(`/service-items/${id}`, { method: 'DELETE' });

export const createInterval = (body: CreateIntervalInput) =>
  apiRequest('/intervals', intervalResponse, { method: 'POST', body }).then((b) => b.interval);
export const updateInterval = (id: string, body: Partial<IntervalFields>) =>
  apiRequest(`/intervals/${id}`, intervalResponse, { method: 'PATCH', body }).then(
    (b) => b.interval,
  );
export const deleteInterval = (id: string) => apiSend(`/intervals/${id}`, { method: 'DELETE' });

// --- Hooks --------------------------------------------------------------------------------------

const ITEMS_KEY = ['catalog', 'items'] as const;
const INTERVALS_KEY = ['catalog', 'intervals'] as const;

export function useVehicleCatalog() {
  return useQuery({
    queryKey: ['catalog', 'vehicles'],
    queryFn: fetchVehicleCatalog,
    staleTime: Infinity,
  });
}

export const useItems = () => useQuery({ queryKey: ITEMS_KEY, queryFn: fetchItems });
export const useIntervals = () => useQuery({ queryKey: INTERVALS_KEY, queryFn: fetchIntervals });

function useCatalogMutation<Args, Result>(
  key: readonly string[],
  run: (args: Args) => Promise<Result>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export const useSaveItem = () =>
  useCatalogMutation(
    ITEMS_KEY,
    (args: { id: string; patch: Partial<ItemFields> } | CreateItemInput) =>
      'patch' in args ? updateItem(args.id, args.patch) : createItem(args),
  );
export const useDeleteItem = () => useCatalogMutation(ITEMS_KEY, deleteItem);

export const useSaveInterval = () =>
  useCatalogMutation(
    INTERVALS_KEY,
    (args: { id: string; patch: Partial<IntervalFields> } | CreateIntervalInput) =>
      'patch' in args ? updateInterval(args.id, args.patch) : createInterval(args),
  );
export const useDeleteInterval = () => useCatalogMutation(INTERVALS_KEY, deleteInterval);
