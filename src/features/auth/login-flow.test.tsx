import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { readToken } from '@/lib/token';
import { renderApp } from '@/test/render-app';
import { api, errorBody, server } from '@/test/server';

async function fillAndSubmit(user: ReturnType<typeof renderApp>['user']) {
  await user.type(screen.getByLabelText('Username'), 'operator');
  await user.type(screen.getByLabelText('Password'), 'correct horse battery');
  await user.type(screen.getByLabelText('Authenticator code'), '123456');
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

describe('login flow', () => {
  it('sends a signed-out visitor to login and back to the page they wanted', async () => {
    let body: unknown;
    server.use(
      http.post(api('/auth/login'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          accessToken: 'new-token',
          expiresAt: '2099-01-01T00:00:00.000Z',
          admin: { username: 'operator' },
        });
      }),
    );
    const { router, user } = renderApp('/users', { signedIn: false });

    expect(await screen.findByText('Admin sign in')).toBeInTheDocument();
    expect(router.state.location.search).toBe('?next=%2Fusers');
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();

    await fillAndSubmit(user);

    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/users');
    expect(body).toEqual({
      username: 'operator',
      password: 'correct horse battery',
      totp: '123456',
    });
    expect(readToken()).toBe('new-token');
    expect(screen.getByTestId('admin-username')).toHaveTextContent('operator');
  });

  it('shows one generic message on 401', async () => {
    server.use(
      http.post(api('/auth/login'), () =>
        HttpResponse.json(errorBody('Invalid credentials'), { status: 401 }),
      ),
    );
    const { user } = renderApp('/login', { signedIn: false });
    await fillAndSubmit(user);

    expect(await screen.findByText('Invalid credentials.')).toBeInTheDocument();
    expect(readToken()).toBeNull();
    // The code field is cleared for the next try.
    expect(screen.getByLabelText('Authenticator code')).toHaveValue('');
  });

  it('shows "too many attempts" on 429', async () => {
    server.use(
      http.post(api('/auth/login'), () =>
        HttpResponse.json(errorBody('Too many requests'), { status: 429 }),
      ),
    );
    const { user } = renderApp('/login', { signedIn: false });
    await fillAndSubmit(user);

    expect(
      await screen.findByText('Too many attempts. Wait 15 minutes and try again.'),
    ).toBeInTheDocument();
  });

  it('on a 401 from any call, goes to login with "session expired" and keeps the page', async () => {
    server.use(
      http.get(api('/users'), () => HttpResponse.json(errorBody('Unauthorized'), { status: 401 })),
    );
    const { router } = renderApp('/users?tab=x');

    expect(
      await screen.findByText('Your session has expired. Please sign in again.'),
    ).toBeInTheDocument();
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(new URLSearchParams(router.state.location.search).get('next')).toBe('/users?tab=x');
    expect(readToken()).toBeNull();
  });

  it('logs out', async () => {
    const { router, user } = renderApp('/');
    await user.click(await screen.findByRole('button', { name: 'Log out' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(readToken()).toBeNull();
  });
});
