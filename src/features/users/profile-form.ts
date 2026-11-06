import type { AdminUser, ProfilePatch } from './api';

export const PROFILE_FIELDS = ['firstName', 'lastName', 'birthDate'] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];
export type ProfileForm = Record<ProfileField, string>;

export function initialProfileForm(user: AdminUser): ProfileForm {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    birthDate: user.birthDate ?? '',
  };
}

/** Only the fields that changed (trimmed), so the PATCH stays partial. */
export function changedFields(user: AdminUser, form: ProfileForm): ProfilePatch {
  const start = initialProfileForm(user);
  const patch: ProfilePatch = {};
  for (const field of PROFILE_FIELDS) {
    const value = form[field].trim();
    if (value !== start[field]) patch[field] = value;
  }
  return patch;
}
