import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';
import { shortId } from '@/lib/format';

/** A shortened id with a button that copies the full id. */
export function CopyId({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the full id is still in the title.
    }
  }

  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs" title={id}>
      <span dir="ltr">{shortId(id)}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={(event) => {
          event.stopPropagation();
          void copy();
        }}
        aria-label={copied ? t('common.copied') : t('common.copyId', { id })}
      >
        {copied ? <Check /> : <Copy />}
      </Button>
    </span>
  );
}
