import { Link } from 'react-router';
import { EmptyState } from '@/components/states';
import { Button } from '@/components/ui/button';
import { t } from '@/i18n';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <EmptyState title={t('notFound.title')} description={t('notFound.description')} />
      <Button variant="outline" asChild>
        <Link to="/">{t('notFound.home')}</Link>
      </Button>
    </div>
  );
}
