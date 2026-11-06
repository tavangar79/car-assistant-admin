import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { t } from '@/i18n';
import {
  createIntervalSchema,
  type Interval,
  type IntervalFields,
  intervalFieldsSchema,
  KM_MAX,
  KM_MIN,
  MONTHS_MAX,
  MONTHS_MIN,
  type Scope,
  useSaveInterval,
  type VehicleCatalog,
} from './api';
import { changedValues, invalidFields } from './diff';
import { FormField, SaveError, ScopeExplainer } from './form-parts';

/** Same modes as the item dialog: create at `scope`, override an inherited row, or edit. */
export type IntervalDialogState =
  | { mode: 'create' }
  | { mode: 'override'; source: Interval }
  | { mode: 'edit'; row: Interval; replaces: Interval | null };

type Form = {
  intervalId: string;
  title: string;
  description: string;
  icon: string;
  coversItemIds: string[];
  km: string;
  months: string;
  sortOrder: string;
  disabled: boolean;
};

function initialForm(state: IntervalDialogState): Form {
  const from = state.mode === 'edit' ? state.row : state.mode === 'override' ? state.source : null;
  return {
    intervalId: from?.intervalId ?? '',
    title: from?.title ?? '',
    description: from?.description ?? '',
    icon: from?.icon ?? '',
    coversItemIds: from?.coversItemIds ?? [],
    km: from ? String(from.km) : '',
    months: from ? String(from.months) : '',
    sortOrder: from ? String(from.sortOrder) : '0',
    disabled: from?.disabled ?? false,
  };
}

const toInt = (value: string) => (value.trim() === '' ? Number.NaN : Number(value));

function IntervalForm({
  state,
  scope,
  catalog,
  itemIds,
  onDone,
}: {
  state: IntervalDialogState;
  scope: Scope;
  catalog: VehicleCatalog | undefined;
  itemIds: string[];
  onDone: () => void;
}) {
  const [form, setForm] = useState<Form>(() => initialForm(state));
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const save = useSaveInterval();
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm({ ...form, [key]: value });
  // Keep ids the row already covers even if no item row has them any more.
  const choices = [...new Set([...itemIds, ...form.coversItemIds])].sort();
  const rowScope = state.mode === 'edit' ? state.row.scope : scope;
  const replaces =
    state.mode === 'edit'
      ? (state.replaces?.scope ?? null)
      : state.mode === 'override'
        ? state.source.scope
        : null;

  function submit(event: FormEvent) {
    event.preventDefault();
    const fields = {
      title: form.title.trim(),
      description: form.description.trim(),
      icon: form.icon.trim(),
      coversItemIds: form.coversItemIds,
      km: toInt(form.km),
      months: toInt(form.months),
      sortOrder: toInt(form.sortOrder),
      disabled: form.disabled,
    };
    const onSuccess = () => {
      toast.success(t('catalog.saved'));
      onDone();
    };

    if (state.mode === 'edit') {
      const { row } = state;
      const parsed = intervalFieldsSchema.safeParse(fields);
      if (!parsed.success) return setInvalid(invalidFields(parsed.error.issues));
      setInvalid(new Set());
      const original: IntervalFields = {
        title: row.title,
        description: row.description,
        icon: row.icon,
        coversItemIds: row.coversItemIds,
        km: row.km,
        months: row.months,
        sortOrder: row.sortOrder,
        disabled: row.disabled,
      };
      const patch = changedValues(original, parsed.data);
      if (Object.keys(patch).length === 0) return onDone();
      save.mutate({ id: row.id, patch }, { onSuccess });
      return;
    }

    const parsed = createIntervalSchema.safeParse({
      ...fields,
      intervalId: form.intervalId.trim(),
      scope,
    });
    if (!parsed.success) return setInvalid(invalidFields(parsed.error.issues));
    setInvalid(new Set());
    save.mutate(parsed.data, { onSuccess });
  }

  const error = (field: string) =>
    invalid.has(field) ? t(`catalog.rule.${field}` as 'catalog.rule.title') : undefined;

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <ScopeExplainer scope={rowScope} replaces={replaces} catalog={catalog} />
      <FormField
        id="interval-intervalId"
        label={t('catalog.field.intervalId')}
        hint={state.mode === 'create' ? t('catalog.hint.slug') : t('catalog.immutableInterval')}
        error={error('intervalId')}
      >
        <Input
          id="interval-intervalId"
          dir="ltr"
          className="font-mono read-only:bg-muted read-only:text-muted-foreground"
          readOnly={state.mode !== 'create'}
          value={form.intervalId}
          onChange={(e) => set('intervalId', e.target.value)}
        />
      </FormField>
      <FormField id="interval-title" label={t('catalog.field.title')} error={error('title')}>
        <Input
          id="interval-title"
          dir="auto"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </FormField>
      <FormField
        id="interval-description"
        label={t('catalog.field.description')}
        error={error('description')}
      >
        <Textarea
          id="interval-description"
          dir="auto"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="interval-km"
          label={t('catalog.field.km')}
          hint={t('catalog.hint.km', { min: KM_MIN, max: KM_MAX })}
          error={error('km')}
        >
          <Input
            id="interval-km"
            type="number"
            step={1}
            min={KM_MIN}
            max={KM_MAX}
            value={form.km}
            onChange={(e) => set('km', e.target.value)}
          />
        </FormField>
        <FormField
          id="interval-months"
          label={t('catalog.field.months')}
          hint={t('catalog.hint.months', { min: MONTHS_MIN, max: MONTHS_MAX })}
          error={error('months')}
        >
          <Input
            id="interval-months"
            type="number"
            step={1}
            min={MONTHS_MIN}
            max={MONTHS_MAX}
            value={form.months}
            onChange={(e) => set('months', e.target.value)}
          />
        </FormField>
        <FormField
          id="interval-icon"
          label={t('catalog.field.icon')}
          hint={t('catalog.hint.icon')}
          error={error('icon')}
        >
          <Input
            id="interval-icon"
            dir="ltr"
            className="font-mono"
            value={form.icon}
            onChange={(e) => set('icon', e.target.value)}
          />
        </FormField>
        <FormField
          id="interval-sortOrder"
          label={t('catalog.field.sortOrder')}
          error={error('sortOrder')}
        >
          <Input
            id="interval-sortOrder"
            type="number"
            step={1}
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
          />
        </FormField>
      </div>
      <FormField
        id="interval-covers"
        label={t('catalog.field.coversItemIds')}
        hint={t('catalog.hint.covers')}
        error={error('coversItemIds')}
      >
        <ToggleGroup
          id="interval-covers"
          type="multiple"
          variant="outline"
          size="sm"
          spacing={1}
          className="flex-wrap justify-start"
          value={form.coversItemIds}
          onValueChange={(value) => set('coversItemIds', value)}
        >
          {choices.map((id) => (
            <ToggleGroupItem key={id} value={id} className="font-mono text-xs">
              {id}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FormField>
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <Switch
          id="interval-disabled"
          checked={form.disabled}
          onCheckedChange={(value) => set('disabled', value)}
        />
        <label htmlFor="interval-disabled" className="text-sm">
          {t('catalog.field.disabled')}
        </label>
      </div>
      <SaveError error={save.error} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? t('common.saving') : t('common.save')}
        </Button>
      </DialogFooter>
    </form>
  );
}

const TITLE = {
  create: 'catalog.addInterval',
  override: 'catalog.overrideInterval',
  edit: 'catalog.editInterval',
} as const;

/** Add, override or edit an interval default row. `scope` is the selected tree node. */
export function IntervalFormDialog({
  state,
  onClose,
  scope,
  catalog,
  itemIds,
}: {
  state: IntervalDialogState | null;
  onClose: () => void;
  scope: Scope;
  catalog: VehicleCatalog | undefined;
  itemIds: string[];
}) {
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(TITLE[state?.mode ?? 'create'])}</DialogTitle>
          <DialogDescription>{t('catalog.intervalDialogHint')}</DialogDescription>
        </DialogHeader>
        {state && (
          <IntervalForm
            state={state}
            scope={scope}
            catalog={catalog}
            itemIds={itemIds}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
