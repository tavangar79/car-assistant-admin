import type { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { t } from '@/i18n';
import { errorMessageKey, isApiError } from '@/lib/api-client';

export function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/** A save error: 409 and 400 field details get their own text, the rest map by status. */
export function SaveError({ error }: { error: unknown }) {
  if (!error) return null;
  const fieldErrors = isApiError(error, 400) ? Object.entries(error.fieldErrors) : [];
  return (
    <Alert variant="destructive">
      <AlertDescription>
        <p>{isApiError(error, 409) ? t('catalog.duplicate') : t(errorMessageKey(error))}</p>
        {fieldErrors.length > 0 && (
          <ul className="mt-1 list-disc ps-4">
            {fieldErrors.map(([field, messages]) => (
              <li key={field}>
                <span className="font-mono">{field}</span>: {messages.join(' ')}
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
