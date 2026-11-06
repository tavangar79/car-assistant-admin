import { Search, SearchX, UserRound, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LoadMore } from '@/components/load-more';
import { PageHeader } from '@/components/page-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Badge } from '@/components/ui/badge';
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
      <div className="relative w-full sm:max-w-sm">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          className="h-10 bg-card ps-9"
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
          icon={debounced.trim() ? SearchX : Users}
          title={debounced.trim() ? t('users.noMatches') : t('users.none')}
          description={debounced.trim() ? t('users.noMatchesHint') : undefined}
        />
      )}
      {users.isSuccess && rows.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-xl border bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('users.name')}</TableHead>
                  <TableHead>{t('users.phone')}</TableHead>
                  <TableHead className="text-end">{t('users.vehicles')}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('users.joined')}</TableHead>
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
                      <div className="flex items-center gap-3">
                        <span
                          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground"
                          aria-hidden
                        >
                          {fullName(user)?.slice(0, 1).toUpperCase() ?? (
                            <UserRound className="size-4" />
                          )}
                        </span>
                        <Link
                          to={`/users/${user.id}`}
                          className="rounded-sm font-medium hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          dir="auto"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {fullName(user) ?? t('users.noName')}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs" dir="ltr">
                      {user.phone}
                    </TableCell>
                    <TableCell className="text-end tabular-nums">
                      {formatNumber(user.vehicleCount)}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap text-muted-foreground tabular-nums md:table-cell">
                      {formatDateTime(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      {user.blockedAt ? (
                        <BlockedBadge />
                      ) : (
                        <Badge variant="success">{t('users.active')}</Badge>
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
