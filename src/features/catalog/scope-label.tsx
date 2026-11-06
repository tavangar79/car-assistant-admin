import { Badge } from '@/components/ui/badge';
import { t } from '@/i18n';
import type { Scope, VehicleCatalog } from './api';
import { isGlobal, scopeNames } from './scope';

export function ScopeLabel({
  scope,
  catalog,
}: {
  scope: Scope;
  catalog: VehicleCatalog | undefined;
}) {
  if (isGlobal(scope)) return <Badge variant="outline">{t('scope.global')}</Badge>;
  return (
    <span className="text-sm" dir="auto">
      {scopeNames(scope, catalog).join(' › ')}
    </span>
  );
}
