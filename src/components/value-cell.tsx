import { Badge } from '@/components/ui/badge';
import { t } from '@/i18n';
import { describeCell } from '@/lib/format';
import { CopyId } from './copy-id';

/** One value from the collection browser: ids get a copy button, user text gets `dir="auto"`. */
export function ValueCell({ value }: { value: unknown }) {
  const cell = describeCell(value);
  switch (cell.kind) {
    case 'empty':
      return <span className="text-muted-foreground">{t('common.none')}</span>;
    case 'id':
      return <CopyId id={cell.id} />;
    case 'boolean':
      return (
        <Badge variant={cell.value ? 'secondary' : 'outline'}>
          {cell.value ? t('common.yes') : t('common.no')}
        </Badge>
      );
    case 'number':
      return <span className="tabular-nums">{cell.text}</span>;
    case 'date':
      return (
        <time dateTime={cell.raw} className="whitespace-nowrap tabular-nums">
          {cell.text}
        </time>
      );
    case 'json':
      return (
        <code className="font-mono text-xs text-muted-foreground" dir="ltr" title={cell.full}>
          {cell.text}
        </code>
      );
    case 'text':
      return (
        <span dir="auto" className="line-clamp-2 max-w-xs">
          {cell.text}
        </span>
      );
  }
}
