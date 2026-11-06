import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { AppProviders } from '@/app/providers';
import { createQueryClient } from '@/app/query-client';
import { routes } from '@/app/routes';
import { connectSession } from '@/features/auth/session';
import { saveToken } from '@/lib/token';

/** Renders the whole app at `path`, wired like `main.tsx`. Signed in unless `signedIn: false`. */
export function renderApp(path: string, { signedIn = true } = {}) {
  if (signedIn) saveToken('test-token', '2099-01-01T00:00:00.000Z');
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({
    queries: { ...queryClient.getDefaultOptions().queries, retry: false },
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  connectSession(router, queryClient);
  const user = userEvent.setup();
  const view = render(
    <AppProviders queryClient={queryClient}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { ...view, router, queryClient, user };
}
