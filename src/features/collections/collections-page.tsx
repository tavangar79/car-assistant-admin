import { Database } from 'lucide-react';
import { Link } from 'react-router';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { t } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useCollections } from './api';

export function CollectionsPage() {
  const collections = useCollections();

  return (
    <>
      <PageHeader title={t('collections.title')} description={t('collections.description')} />
      {collections.isPending && <LoadingState />}
      {collections.isError && (
        <ErrorState error={collections.error} onRetry={() => void collections.refetch()} />
      )}
      {collections.isSuccess && collections.data.length === 0 && (
        <EmptyState title={t('collections.none')} />
      )}
      {collections.isSuccess && collections.data.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {collections.data.map((collection) => (
            <Link key={collection.name} to={`/data/${collection.name}`} className="group">
              <Card className="transition-colors group-hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-mono text-sm">
                    <Database className="size-4 text-muted-foreground" aria-hidden />
                    {collection.name}
                  </CardTitle>
                  <CardDescription>
                    {t('collections.documents', { count: formatNumber(collection.count) })}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
