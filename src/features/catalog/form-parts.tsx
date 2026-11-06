import { Layers } from 'lucide-react';
import type { ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { t } from '@/i18n';
import { errorMessageKey, isApiError } from '@/lib/api-client';
import type { Scope, VehicleCatalog } from './api';
import { isGlobal, scopePath } from './scope';

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

/**
 * Where a row applies, and what overriding means there: shown inline in the add/edit forms.
 * `replaces` is the scope of the wider row with the same id, when it is known.
 */
export function ScopeExplainer({
  scope,
  replaces,
  catalog,
}: {
  scope: Scope;
  replaces: Scope | null;
  catalog: VehicleCatalog | undefined;
}) {
  const path = scopePath(scope, catalog);
  let text: string;
  if (isGlobal(scope)) text = t('catalog.explain.global');
  else if (replaces)
    text = t('catalog.explain.override', { path, from: scopePath(replaces, catalog) });
  else text = t('catalog.explain.scoped', { path });

  return (
    <Alert className="border-primary/20 bg-accent/60">
      <Layers className="text-primary" />
      <AlertTitle>
        {t('catalog.explain.appliesTo')}{' '}
        <span className="font-semibold" dir="auto">
          {path}
        </span>
      </AlertTitle>
      <AlertDescription>{text}</AlertDescription>
    </Alert>
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
