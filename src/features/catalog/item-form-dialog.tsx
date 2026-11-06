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
  GLOBAL_SCOPE,
  type ItemFields,
  itemFieldsSchema,
  type Scope,
  type ServiceItem,
  useSaveItem,
  type VehicleCatalog,
} from './api';
import { changedValues, invalidFields } from './diff';
import { FormField, SaveError } from './form-parts';
import { ScopePicker } from './scope-picker';
import { ScopeLabel } from './scope-label';

type Form = {
  itemId: string;
  scope: Scope;
  categoryId: string;
  title: string;
  subtitle: string;
  icon: string;
  sortOrder: string;
  disabled: boolean;
};

function initialForm(row: ServiceItem | null, scope: Scope): Form {
  return {
    itemId: row?.itemId ?? '',
    scope: row?.scope ?? scope,
    categoryId: row?.categoryId ?? CATEGORY_IDS[0],
    title: row?.title ?? '',
    subtitle: row?.subtitle ?? '',
    icon: row?.icon ?? '',
    sortOrder: row ? String(row.sortOrder) : '0',
    disabled: row?.disabled ?? false,
  };
}

function ItemForm({
  row,
  defaultScope,
  catalog,
  onDone,
}: {
  row: ServiceItem | null;
  defaultScope: Scope;
  catalog: VehicleCatalog | undefined;
  onDone: () => void;
}) {
  const [form, setForm] = useState<Form>(() => initialForm(row, defaultScope));
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const save = useSaveItem();
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm({ ...form, [key]: value });

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

    if (row) {
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

    const parsed = createItemSchema.safeParse({
      ...fields,
      itemId: form.itemId.trim(),
      scope: form.scope,
    });
    if (!parsed.success) return setInvalid(invalidFields(parsed.error.issues));
    setInvalid(new Set());
    save.mutate(parsed.data, { onSuccess });
  }

  const error = (field: string) =>
    invalid.has(field) ? t(`catalog.rule.${field}` as 'catalog.rule.title') : undefined;

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      {row ? (
        <div className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3 text-sm">
          <span className="font-mono">{row.itemId}</span>
          <ScopeLabel scope={row.scope} catalog={catalog} />
          <span className="text-xs text-muted-foreground">{t('catalog.immutable')}</span>
        </div>
      ) : (
        <>
          <FormField
            id="item-itemId"
            label={t('catalog.field.itemId')}
            hint={t('catalog.hint.slug')}
            error={error('itemId')}
          >
            <Input
              id="item-itemId"
              dir="ltr"
              className="font-mono"
              value={form.itemId}
              onChange={(e) => set('itemId', e.target.value)}
            />
          </FormField>
          <FormField
            id="item-scope-make"
            label={t('catalog.field.scope')}
            hint={t('catalog.hint.scope')}
            error={error('scope')}
          >
            <ScopePicker
              idPrefix="item-scope"
              catalog={catalog}
              value={form.scope}
              onChange={(scope) => set('scope', scope ?? GLOBAL_SCOPE)}
            />
          </FormField>
        </>
      )}
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
      <div className="grid grid-cols-2 gap-4">
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
      <div className="flex items-center gap-2">
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

/** Add (row = null) or edit a service item row. */
export function ItemFormDialog({
  open,
  onOpenChange,
  row,
  defaultScope,
  catalog,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ServiceItem | null;
  defaultScope: Scope;
  catalog: VehicleCatalog | undefined;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{row ? t('catalog.editItem') : t('catalog.addItem')}</DialogTitle>
          <DialogDescription>{t('catalog.itemDialogHint')}</DialogDescription>
        </DialogHeader>
        {open && (
          <ItemForm
            row={row}
            defaultScope={defaultScope}
            catalog={catalog}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
