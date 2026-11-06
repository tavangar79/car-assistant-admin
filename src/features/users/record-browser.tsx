import { FileSearch } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { LoadMore } from '@/components/load-more';
import { t } from '@/i18n';
import { type CollectionFilter, useCollectionPages } from './records-api';
import { RecordTable } from './record-table';

/** One record collection for a user or vehicle, paged with "load more". */
export function RecordBrowser({ name, filter }: { name: string; filter: CollectionFilter }) {
  const query = useCollectionPages(name, filter);

  if (query.isPending) return <LoadingState rows={6} />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;

  const documents = query.data.pages.flatMap((page) => page.documents);
  const fields = query.data.pages[0]?.fields ?? [];
  if (documents.length === 0) {
    return <EmptyState icon={FileSearch} title={t('records.empty')} />;
  }
  return (
    <div className="flex flex-col gap-3">
      <RecordTable fields={fields} documents={documents} />
      <LoadMore
        hasMore={query.hasNextPage}
        loading={query.isFetchingNextPage}
        onLoadMore={() => void query.fetchNextPage()}
      />
    </div>
  );
}
