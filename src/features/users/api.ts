import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { apiRequest } from '@/lib/api-client';
import { isoDate, isoDateTime, nextCursor, objectId } from '@/lib/schemas';

export const adminUserSchema = z.object({
  id: objectId,
  phone: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  birthDate: isoDate.nullable(),
  blockedAt: isoDateTime.nullable(),
  blockReason: z.string().nullable(),
  createdAt: isoDateTime,
  vehicleCount: z.number().int().nonnegative(),
});

const recordCountsSchema = z.object({
  serviceVisits: z.number().int().nonnegative(),
  fuelLogs: z.number().int().nonnegative(),
  expenses: z.number().int().nonnegative(),
  odometerReadings: z.number().int().nonnegative(),
  documents: z.number().int().nonnegative(),
});

/** A vehicle as the `vehicles` collection shows it, plus record counts. Other fields pass through. */
const userVehicleSchema = z.looseObject({ id: objectId, counts: recordCountsSchema });

export const usersPageSchema = z.object({ users: z.array(adminUserSchema), nextCursor });
export const userDetailSchema = z.object({
  user: adminUserSchema,
  vehicles: z.array(userVehicleSchema),
  transfers: z.array(z.record(z.string(), z.unknown())),
  notificationCount: z.number().int().nonnegative(),
});
const userResponseSchema = z.object({ user: adminUserSchema });

export type AdminUser = z.infer<typeof adminUserSchema>;
export type UserVehicle = z.infer<typeof userVehicleSchema>;
export type RecordCounts = z.infer<typeof recordCountsSchema>;
export type UserDetail = z.infer<typeof userDetailSchema>;

const nameField = z.string().trim().min(1).max(50);

/** Same field rules as the user profile: names 1-50 chars, birth date from 1900 up to `today` (Tehran). */
export function createProfileFormSchema(today: string) {
  return z.object({
    firstName: nameField,
    lastName: nameField,
    birthDate: isoDate
      .refine((value) => value >= '1900-01-01', { message: 'tooEarly' })
      .refine((value) => value <= today, { message: 'future' }),
  });
}
export type ProfileInput = z.infer<ReturnType<typeof createProfileFormSchema>>;
export type ProfilePatch = Partial<ProfileInput>;

export const BLOCK_REASON_MAX = 500;

const USERS_PAGE_SIZE = 25;

export function fetchUsers(search: string, cursor: string | null) {
  return apiRequest('/users', usersPageSchema, {
    query: { search: search.trim(), cursor, limit: USERS_PAGE_SIZE },
  });
}

export function fetchUser(id: string) {
  return apiRequest(`/users/${encodeURIComponent(id)}`, userDetailSchema);
}

export function updateUser(id: string, patch: ProfilePatch) {
  return apiRequest(`/users/${encodeURIComponent(id)}`, userResponseSchema, {
    method: 'PATCH',
    body: patch,
  }).then((body) => body.user);
}

export function blockUser(id: string, reason: string) {
  const trimmed = reason.trim();
  return apiRequest(`/users/${encodeURIComponent(id)}/block`, userResponseSchema, {
    method: 'POST',
    body: trimmed === '' ? {} : { reason: trimmed },
  }).then((body) => body.user);
}

export function unblockUser(id: string) {
  return apiRequest(`/users/${encodeURIComponent(id)}/unblock`, userResponseSchema, {
    method: 'POST',
  }).then((body) => body.user);
}

export const userQueryKey = (id: string) => ['users', 'detail', id] as const;

export function useUsers(search: string) {
  return useInfiniteQuery({
    queryKey: ['users', 'list', search.trim()],
    queryFn: ({ pageParam }) => fetchUsers(search, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useUser(id: string) {
  return useQuery({ queryKey: userQueryKey(id), queryFn: () => fetchUser(id) });
}

/** Puts the returned user into the detail cache and refreshes the lists. */
function useUserMutation<Args>(id: string, run: (args: Args) => Promise<AdminUser>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: (user) => {
      queryClient.setQueryData<UserDetail>(userQueryKey(id), (detail) =>
        detail ? { ...detail, user } : detail,
      );
      void queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
    },
  });
}

export const useUpdateUser = (id: string) =>
  useUserMutation(id, (patch: ProfilePatch) => updateUser(id, patch));
export const useBlockUser = (id: string) =>
  useUserMutation(id, (reason: string) => blockUser(id, reason));
export const useUnblockUser = (id: string) => useUserMutation(id, () => unblockUser(id));
