import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { t } from '@/i18n';
import { GLOBAL_SCOPE, type Scope, type VehicleCatalog } from './api';

const ALL = '__all__';
const NONE = '__none__';

/**
 * Make → model → trim. A null id means "any" (global when all three are null).
 * With `allowAll`, the make list also offers "All scopes", reported as `null`.
 */
export function ScopePicker({
  catalog,
  value,
  onChange,
  allowAll = false,
  idPrefix,
}: {
  catalog: VehicleCatalog | undefined;
  value: Scope | null;
  onChange: (scope: Scope | null) => void;
  allowAll?: boolean;
  idPrefix: string;
}) {
  const make = catalog?.makes.find((m) => m.id === value?.makeId);
  const model = make?.models.find((m) => m.id === value?.modelId);

  function pickMake(id: string) {
    if (id === ALL) onChange(null);
    else if (id === NONE) onChange(GLOBAL_SCOPE);
    else onChange({ makeId: id, modelId: null, trimId: null });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Select value={value === null ? ALL : (value.makeId ?? NONE)} onValueChange={pickMake}>
        <SelectTrigger id={`${idPrefix}-make`} className="w-48" aria-label={t('scope.make')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowAll && <SelectItem value={ALL}>{t('scope.all')}</SelectItem>}
          <SelectItem value={NONE}>{t('scope.global')}</SelectItem>
          <SelectSeparator />
          {catalog?.makes.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              <span dir="auto">{m.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value && make && (
        <Select
          value={value.modelId ?? NONE}
          onValueChange={(id) =>
            onChange({ makeId: make.id, modelId: id === NONE ? null : id, trimId: null })
          }
        >
          <SelectTrigger className="w-48" aria-label={t('scope.model')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t('scope.anyModel')}</SelectItem>
            <SelectSeparator />
            {make.models.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span dir="auto">{m.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {value && make && model && model.trims.length > 0 && (
        <Select
          value={value.trimId ?? NONE}
          onValueChange={(id) =>
            onChange({ makeId: make.id, modelId: model.id, trimId: id === NONE ? null : id })
          }
        >
          <SelectTrigger className="w-48" aria-label={t('scope.trim')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>{t('scope.anyTrim')}</SelectItem>
            <SelectSeparator />
            {model.trims.map((trim) => (
              <SelectItem key={trim.id} value={trim.id}>
                <span dir="auto">{trim.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
