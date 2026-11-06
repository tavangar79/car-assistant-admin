import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppProviders } from '@/app/providers';
import { createQueryClient } from '@/app/query-client';
import { routes } from '@/app/routes';
import { connectSession } from '@/features/auth/session';
import './index.css';

const queryClient = createQueryClient();
const router = createBrowserRouter(routes);
connectSession(router, queryClient);

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
