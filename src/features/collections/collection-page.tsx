import { useParams } from 'react-router';
import { PageHeader } from '@/components/page-header';
import { t } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useCollections } from './api';
import { CollectionBrowser } from './collection-browser';

export function CollectionPage() {
  const { name = '' } = useParams();
  const collections = useCollections();
  const count = collections.data?.find((collection) => collection.name === name)?.count;

  return (
    <>
      <PageHeader
        title={<span className="font-mono">{name}</span>}
        description={
          count === undefined
            ? t('collections.readOnly')
            : `${t('collections.documents', { count: formatNumber(count) })} · ${t('collections.readOnly')}`
        }
      />
      <CollectionBrowser key={name} name={name} />
    </>
  );
}
