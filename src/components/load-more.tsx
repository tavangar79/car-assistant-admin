import { Button } from '@/components/ui/button';
import { t } from '@/i18n';

export function LoadMore({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}) {
  if (!hasMore) return null;
  return (
    <div className="flex justify-center pt-2">
      <Button variant="outline" onClick={onLoadMore} disabled={loading}>
        {loading ? t('common.loading') : t('common.loadMore')}
      </Button>
    </div>
  );
}
