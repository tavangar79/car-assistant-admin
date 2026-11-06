import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { t } from '@/i18n';
import { errorMessageKey, isApiError } from '@/lib/api-client';
import type { Scope } from './api';
import { isGlobal } from './scope';

/** Edit, disable/enable and delete for one catalog row. Global rows can only be disabled. */
export function RowActions({
  slug,
  scope,
  disabled,
  onEdit,
  onToggle,
  onDelete,
  busy,
}: {
  slug: string;
  scope: Scope;
  disabled: boolean;
  onEdit: () => void;
  onToggle: () => Promise<unknown>;
  onDelete: () => Promise<unknown>;
  busy: boolean;
}) {
  const global = isGlobal(scope);

  async function run(action: () => Promise<unknown>, done: string) {
    try {
      await action();
      toast.success(done);
    } catch (error) {
      toast.error(
        isApiError(error, 422) ? t('catalog.globalDeleteBlocked') : t(errorMessageKey(error)),
      );
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onEdit}
        aria-label={t('catalog.editRow', { slug })}
      >
        <Pencil />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={busy}
        onClick={() =>
          void run(onToggle, disabled ? t('catalog.enabled') : t('catalog.disabledDone'))
        }
        aria-label={disabled ? t('catalog.enableRow', { slug }) : t('catalog.disableRow', { slug })}
      >
        {disabled ? <Eye /> : <EyeOff />}
      </Button>
      {global ? (
        <Tooltip>
          <TooltipTrigger asChild>
            {/* A span keeps the tooltip working on a disabled button. */}
            <span tabIndex={0}>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled
                aria-label={t('catalog.deleteRow', { slug })}
              >
                <Trash2 />
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>{t('catalog.globalNoDelete')}</TooltipContent>
        </Tooltip>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={busy}
              aria-label={t('catalog.deleteRow', { slug })}
            >
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('catalog.deleteTitle', { slug })}</AlertDialogTitle>
              <AlertDialogDescription>{t('catalog.deleteEffect')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => void run(onDelete, t('catalog.deleted'))}
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
