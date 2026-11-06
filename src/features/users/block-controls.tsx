import { Ban, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { t } from '@/i18n';
import { errorMessageKey } from '@/lib/api-client';
import { fullName } from '@/lib/format';
import { type AdminUser, BLOCK_REASON_MAX, useBlockUser, useUnblockUser } from './api';

/** Block (with an optional reason) or unblock, each behind a confirm dialog that names the user. */
export function BlockControls({ user }: { user: AdminUser }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const block = useBlockUser(user.id);
  const unblock = useUnblockUser(user.id);
  const blocked = user.blockedAt !== null;
  const mutation = blocked ? unblock : block;
  const name = fullName(user) ?? user.phone;
  const tooLong = reason.trim().length > BLOCK_REASON_MAX;

  function confirm() {
    const onSuccess = () => {
      toast.success(blocked ? t('block.unblocked', { name }) : t('block.blocked', { name }));
      setOpen(false);
      setReason('');
    };
    if (blocked) unblock.mutate(undefined, { onSuccess });
    else block.mutate(reason, { onSuccess });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) mutation.reset();
      }}
    >
      <AlertDialogTrigger asChild>
        {blocked ? (
          <Button variant="outline" size="sm">
            <ShieldCheck data-icon="inline-start" />
            {t('block.unblockAction')}
          </Button>
        ) : (
          <Button variant="destructive" size="sm">
            <Ban data-icon="inline-start" />
            {t('block.blockAction')}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {blocked ? t('block.unblockTitle', { name }) : t('block.blockTitle', { name })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {blocked ? t('block.unblockEffect') : t('block.blockEffect')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {!blocked && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="block-reason">{t('block.reason')}</Label>
            <Textarea
              id="block-reason"
              dir="auto"
              value={reason}
              aria-invalid={tooLong || undefined}
              onChange={(event) => setReason(event.target.value)}
            />
            <p className={tooLong ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
              {t('block.reasonHint', { max: BLOCK_REASON_MAX })}
            </p>
          </div>
        )}
        {mutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>{t(errorMessageKey(mutation.error))}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          {/* A plain button, so the dialog stays open until the request succeeds. */}
          <Button
            variant={blocked ? 'default' : 'destructive'}
            onClick={confirm}
            disabled={mutation.isPending || tooLong}
          >
            {blocked ? t('block.unblockConfirm') : t('block.blockConfirm')}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
