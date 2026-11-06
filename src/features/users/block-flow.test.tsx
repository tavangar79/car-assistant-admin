import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { adminUser, USER_ID, userDetail } from '@/test/fixtures';
import { renderApp } from '@/test/render-app';
import { api, errorBody, server } from '@/test/server';

describe('user block flow', () => {
  it('blocks a user after a confirm dialog that names them, with a reason', async () => {
    let body: unknown;
    server.use(
      http.post(api(`/users/${USER_ID}/block`), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          user: adminUser({ blockedAt: '2026-11-06T09:00:00.000Z', blockReason: 'Spam' }),
        });
      }),
    );
    const { user } = renderApp(`/users/${USER_ID}`);

    await user.click(await screen.findByRole('button', { name: 'Block user' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Block Sara Ahmadi?')).toBeInTheDocument();
    expect(within(dialog).getByText(/signed out at once/)).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Reason (optional)'), '  Spam ');
    await user.click(within(dialog).getByRole('button', { name: 'Block' }));

    expect(await screen.findByText(/Blocked since/)).toBeInTheDocument();
    expect(body).toEqual({ reason: 'Spam' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getAllByText('Blocked').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Unblock user' })).toBeInTheDocument();
  });

  it('sends an empty body when no reason is given', async () => {
    let body: unknown;
    server.use(
      http.post(api(`/users/${USER_ID}/block`), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ user: adminUser({ blockedAt: '2026-11-06T09:00:00.000Z' }) });
      }),
    );
    const { user } = renderApp(`/users/${USER_ID}`);
    await user.click(await screen.findByRole('button', { name: 'Block user' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Block' }),
    );

    expect(await screen.findByText('No reason given')).toBeInTheDocument();
    expect(body).toEqual({});
  });

  it('unblocks a blocked user', async () => {
    const blocked = adminUser({ blockedAt: '2026-11-01T09:00:00.000Z', blockReason: 'Spam' });
    server.use(
      http.get(api(`/users/${USER_ID}`), () => HttpResponse.json(userDetail(blocked))),
      http.post(api(`/users/${USER_ID}/unblock`), () => HttpResponse.json({ user: adminUser() })),
    );
    const { user } = renderApp(`/users/${USER_ID}`);

    expect(await screen.findByText('Spam')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Unblock user' }));
    const dialog = await screen.findByRole('alertdialog');
    expect(within(dialog).getByText('Unblock Sara Ahmadi?')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Unblock' }));

    expect(await screen.findByRole('button', { name: 'Block user' })).toBeInTheDocument();
    expect(screen.queryByText(/Blocked since/)).not.toBeInTheDocument();
  });

  it('keeps the dialog open and shows the error when blocking fails', async () => {
    server.use(
      http.post(api(`/users/${USER_ID}/block`), () =>
        HttpResponse.json(errorBody('Not found'), { status: 404 }),
      ),
    );
    const { user } = renderApp(`/users/${USER_ID}`);
    await user.click(await screen.findByRole('button', { name: 'Block user' }));
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Block' }));

    expect(
      await within(dialog).findByText('Not found. It may have been deleted.'),
    ).toBeInTheDocument();
  });

  it('shows "not found" for an unknown user', async () => {
    server.use(
      http.get(api(`/users/${USER_ID}`), () =>
        HttpResponse.json(errorBody('Not found'), { status: 404 }),
      ),
    );
    renderApp(`/users/${USER_ID}`);
    expect(await screen.findByText('Not found. It may have been deleted.')).toBeInTheDocument();
  });
});
