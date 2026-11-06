import type { RouteObject } from 'react-router';
import { AuthGuard } from '@/features/auth/auth-guard';
import { LoginPage } from '@/features/auth/login-page';
import { CatalogPage } from '@/features/catalog/catalog-page';
import { CollectionPage } from '@/features/collections/collection-page';
import { CollectionsPage } from '@/features/collections/collections-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { UserDetailPage } from '@/features/users/user-detail-page';
import { UsersPage } from '@/features/users/users-page';
import { AppLayout } from './app-layout';
import { NotFoundPage } from './not-found-page';

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'users/:id', element: <UserDetailPage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'data', element: <CollectionsPage /> },
      { path: 'data/:name', element: <CollectionPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
