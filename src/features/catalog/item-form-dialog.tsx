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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { t } from '@/i18n';
import {
  CATEGORY_IDS,
  createItemSchema,
  type ItemFields,
  itemFieldsSchema,
  type Scope,
  type ServiceItem,
  useSaveItem,
  type VehicleCatalog,
} from './api';
import { changedValues, invalidFields } from './diff';
import { FormField, SaveError, ScopeExplainer } from './form-parts';

/**
 * What the dialog does: `create` a new row at `scope`, `override` an inherited row by creating
 * a copy at `scope`, or `edit` an existing row.
 */
export type ItemDialogState =
  | { mode: 'create' }
  | { mode: 'override'; source: ServiceItem }
  | { mode: 'edit'; row: ServiceItem; replaces: ServiceItem | null };

type Form = {
  itemId: string;
  categoryId: string;
  title: string;
  subtitle: string;
  icon: string;
  sortOrder: string;
  disabled: boolean;
};

function initialForm(state: ItemDialogState): Form {
  const from = state.mode === 'edit' ? state.row : state.mode === 'override' ? state.source : null;
  return {
    itemId: from?.itemId ?? '',
    categoryId: from?.categoryId ?? CATEGORY_IDS[0],
    title: from?.title ?? '',
    subtitle: from?.subtitle ?? '',
    icon: from?.icon ?? '',
    sortOrder: from ? String(from.sortOrder) : '0',
    disabled: from?.disabled ?? false,
  };
}

function ItemForm({
  state,
  scope,
  catalog,
  onDone,
}: {
  state: ItemDialogState;
  scope: Scope;
  catalog: VehicleCatalog | undefined;
  onDone: () => void;
}) {
  const [form, setForm] = useState<Form>(() => initialForm(state));
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const save = useSaveItem();
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm({ ...form, [key]: value });
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
      categoryId: form.categoryId,
      title: form.title.trim(),
      subtitle: form.subtitle.trim(),
      icon: form.icon.trim(),
      sortOrder: form.sortOrder.trim() === '' ? Number.NaN : Number(form.sortOrder),
      disabled: form.disabled,
    };
    const onSuccess = () => {
      toast.success(t('catalog.saved'));
      onDone();
    };

    if (state.mode === 'edit') {
      const { row } = state;
      const parsed = itemFieldsSchema.safeParse(fields);
      if (!parsed.success) return setInvalid(invalidFields(parsed.error.issues));
      setInvalid(new Set());
      const original = {
        categoryId: row.categoryId,
        title: row.title,
        subtitle: row.subtitle,
        icon: row.icon,
        sortOrder: row.sortOrder,
        disabled: row.disabled,
      } as ItemFields;
      const patch = changedValues(original, parsed.data);
      if (Object.keys(patch).length === 0) return onDone();
      save.mutate({ id: row.id, patch }, { onSuccess });
      return;
    }

    const parsed = createItemSchema.safeParse({ ...fields, itemId: form.itemId.trim(), scope });
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
        id="item-itemId"
        label={t('catalog.field.itemId')}
        hint={state.mode === 'create' ? t('catalog.hint.slug') : t('catalog.immutable')}
        error={error('itemId')}
      >
        <Input
          id="item-itemId"
          dir="ltr"
          className="font-mono read-only:bg-muted read-only:text-muted-foreground"
          readOnly={state.mode !== 'create'}
          value={form.itemId}
          onChange={(e) => set('itemId', e.target.value)}
        />
      </FormField>
      <FormField id="item-category" label={t('catalog.field.category')} error={error('categoryId')}>
        <Select value={form.categoryId} onValueChange={(value) => set('categoryId', value)}>
          <SelectTrigger id="item-category" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORY_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {t(`category.${id}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
      <FormField id="item-title" label={t('catalog.field.title')} error={error('title')}>
        <Input
          id="item-title"
          dir="auto"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />
      </FormField>
      <FormField id="item-subtitle" label={t('catalog.field.subtitle')} error={error('subtitle')}>
        <Input
          id="item-subtitle"
          dir="auto"
          value={form.subtitle}
          onChange={(e) => set('subtitle', e.target.value)}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          id="item-icon"
          label={t('catalog.field.icon')}
          hint={t('catalog.hint.icon')}
          error={error('icon')}
        >
          <Input
            id="item-icon"
            dir="ltr"
            className="font-mono"
            value={form.icon}
            onChange={(e) => set('icon', e.target.value)}
          />
        </FormField>
        <FormField
          id="item-sortOrder"
          label={t('catalog.field.sortOrder')}
          error={error('sortOrder')}
        >
          <Input
            id="item-sortOrder"
            type="number"
            step={1}
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
          />
        </FormField>
      </div>
      <div className="flex items-center gap-3 rounded-lg border p-3">
        <Switch
          id="item-disabled"
          checked={form.disabled}
          onCheckedChange={(value) => set('disabled', value)}
        />
        <label htmlFor="item-disabled" className="text-sm">
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
  create: 'catalog.addItem',
  override: 'catalog.overrideItem',
  edit: 'catalog.editItem',
} as const;

/** Add, override or edit a service item row. `scope` is the selected tree node. */
export function ItemFormDialog({
  state,
  onClose,
  scope,
  catalog,
}: {
  state: ItemDialogState | null;
  onClose: () => void;
  scope: Scope;
  catalog: VehicleCatalog | undefined;
}) {
  return (
    <Dialog open={state !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t(TITLE[state?.mode ?? 'create'])}</DialogTitle>
          <DialogDescription>{t('catalog.itemDialogHint')}</DialogDescription>
        </DialogHeader>
        {state && <ItemForm state={state} scope={scope} catalog={catalog} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}
