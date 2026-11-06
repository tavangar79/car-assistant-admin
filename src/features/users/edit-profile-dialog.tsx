import { Pencil } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { todayInTehran } from '@/features/dashboard/range';
import { t, type TranslationKey } from '@/i18n';
import { errorMessageKey, isApiError } from '@/lib/api-client';
import { type AdminUser, createProfileFormSchema, type ProfilePatch, useUpdateUser } from './api';
import {
  changedFields,
  initialProfileForm,
  PROFILE_FIELDS,
  type ProfileField,
  type ProfileForm,
} from './profile-form';

const FIELD_RULES: Record<ProfileField, TranslationKey> = {
  firstName: 'profile.nameRule',
  lastName: 'profile.nameRule',
  birthDate: 'profile.birthDateRule',
};

function EditProfileForm({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const [form, setForm] = useState<ProfileForm>(() => initialProfileForm(user));
  const [invalid, setInvalid] = useState<Partial<Record<ProfileField, true>>>({});
  const mutation = useUpdateUser(user.id);
  const patch: ProfilePatch = changedFields(user, form);
  const hasChanges = Object.keys(patch).length > 0;

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = createProfileFormSchema(todayInTehran()).partial().safeParse(patch);
    if (!parsed.success) {
      const fields: Partial<Record<ProfileField, true>> = {};
      for (const issue of parsed.error.issues) fields[issue.path[0] as ProfileField] = true;
      setInvalid(fields);
      return;
    }
    setInvalid({});
    mutation.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(t('profile.saved'));
        onDone();
      },
    });
  }

  const serverErrors = isApiError(mutation.error, 400) ? mutation.error.fieldErrors : {};

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      {PROFILE_FIELDS.map((field) => {
        const hasError = invalid[field] === true || field in serverErrors;
        return (
          <div key={field} className="flex flex-col gap-2">
            <Label htmlFor={`profile-${field}`}>{t(`profile.${field}`)}</Label>
            <Input
              id={`profile-${field}`}
              type={field === 'birthDate' ? 'date' : 'text'}
              dir={field === 'birthDate' ? undefined : 'auto'}
              value={form[field]}
              aria-invalid={hasError || undefined}
              onChange={(event) => setForm({ ...form, [field]: event.target.value })}
            />
            {hasError && (
              <p className="text-xs text-destructive">
                {serverErrors[field]?.join(' ') ?? t(FIELD_RULES[field])}
              </p>
            )}
          </div>
        );
      })}
      {mutation.isError && !isApiError(mutation.error, 400) && (
        <Alert variant="destructive">
          <AlertDescription>{t(errorMessageKey(mutation.error))}</AlertDescription>
        </Alert>
      )}
      {isApiError(mutation.error, 400) && Object.keys(serverErrors).length === 0 && (
        <Alert variant="destructive">
          <AlertDescription>{t('errors.validation')}</AlertDescription>
        </Alert>
      )}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={!hasChanges || mutation.isPending}>
          {mutation.isPending ? t('common.saving') : t('common.save')}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EditProfileDialog({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil data-icon="inline-start" />
          {t('profile.edit')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('profile.editTitle')}</DialogTitle>
          <DialogDescription>{t('profile.editDescription')}</DialogDescription>
        </DialogHeader>
        {open && <EditProfileForm user={user} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}
