import { Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { t } from '@/i18n';

export function BlockedBadge() {
  return (
    <Badge variant="destructive">
      <Ban data-icon="inline-start" />
      {t('users.blocked')}
    </Badge>
  );
}
