import { Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LoadMore } from '@/components/load-more';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { t } from '@/i18n';
import { formatDateTime, formatNumber, fullName } from '@/lib/format';
import { useUsers } from './api';
import { BlockedBadge } from './blocked-badge';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search);
  const users = useUsers(debounced);
  const navigate = useNavigate();
  const rows = users.data?.pages.flatMap((page) => page.users) ?? [];

  return (
    <>
      <PageHeader title={t('users.title')} description={t('users.description')} />
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          className="ps-8"
          placeholder={t('users.searchPlaceholder')}
          aria-label={t('users.search')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {users.isPending && <LoadingState rows={8} />}
      {users.isError && <ErrorState error={users.error} onRetry={() => void users.refetch()} />}
      {users.isSuccess && rows.length === 0 && (
        <EmptyState
          title={debounced.trim() ? t('users.noMatches') : t('users.none')}
          description={debounced.trim() ? t('users.noMatchesHint') : undefined}
        />
      )}
      {users.isSuccess && rows.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.name')}</TableHead>
                  <TableHead>{t('users.phone')}</TableHead>
                  <TableHead className="text-end">{t('users.vehicles')}</TableHead>
                  <TableHead>{t('users.joined')}</TableHead>
                  <TableHead>{t('users.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((user) => (
                  <TableRow
                    key={user.id}
                    className="cursor-pointer"
                    onClick={() => void navigate(`/users/${user.id}`)}
                  >
                    <TableCell>
                      <Link
                        to={`/users/${user.id}`}
                        className="font-medium hover:underline"
                        dir="auto"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {fullName(user) ?? t('users.noName')}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs" dir="ltr">
                      {user.phone}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatNumber(user.vehicleCount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateTime(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      {user.blockedAt ? (
                        <BlockedBadge />
                      ) : (
                        <span className="text-sm text-muted-foreground">{t('users.active')}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <LoadMore
            hasMore={users.hasNextPage}
            loading={users.isFetchingNextPage}
            onLoadMore={() => void users.fetchNextPage()}
          />
        </div>
      )}
    </>
  );
}
