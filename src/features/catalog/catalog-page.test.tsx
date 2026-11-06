import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { serviceItems } from '@/test/fixtures';
import { renderApp } from '@/test/render-app';
import { api, server } from '@/test/server';

const [globalRow, taraRow] = serviceItems as [(typeof serviceItems)[0], (typeof serviceItems)[0]];

describe('catalog', () => {
  it('lists rows per scope and only lets non-global rows be deleted', async () => {
    renderApp('/catalog');

    expect(await screen.findByText('Engine oil')).toBeInTheDocument();
    expect(screen.getByText('Iran Khodro › Tara')).toBeInTheDocument();
    expect(screen.getByText(/Global rows cannot be deleted, because visits/)).toBeInTheDocument();

    const deletes = screen.getAllByRole('button', { name: 'Delete engine_oil' });
    expect(deletes[0]).toBeDisabled();
    expect(deletes[1]).toBeEnabled();
  });

  it('disables a row with a partial PATCH', async () => {
    let patch: unknown;
    server.use(
      http.patch(api(`/service-items/${globalRow.id}`), async ({ request }) => {
        patch = await request.json();
        return HttpResponse.json({ item: { ...globalRow, disabled: true } });
      }),
    );
    const { user } = renderApp('/catalog');
    await screen.findByText('Engine oil');

    await user.click(screen.getByRole('button', { name: 'Disable engine_oil' }));
    await waitFor(() => expect(patch).toEqual({ disabled: true }));
  });

  it('adds an item in the global scope by default', async () => {
    let body: unknown;
    server.use(
      http.post(api('/service-items'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ item: { ...taraRow, itemId: 'coolant' } }, { status: 201 });
      }),
    );
    const { user } = renderApp('/catalog');
    await user.click(await screen.findByRole('button', { name: 'Add item' }));
    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(within(dialog).getByText('Use 2 to 40 characters: a-z, 0-9 and _.')).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText('Item id'), 'coolant');
    await user.type(within(dialog).getByLabelText('Title'), 'Coolant');
    await user.type(within(dialog).getByLabelText('Subtitle'), 'Antifreeze');
    await user.type(within(dialog).getByLabelText('Icon'), 'water_drop');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(body).toEqual({
        itemId: 'coolant',
        scope: { makeId: null, modelId: null, trimId: null },
        categoryId: 'fluids',
        title: 'Coolant',
        subtitle: 'Antifreeze',
        icon: 'water_drop',
        sortOrder: 0,
        disabled: false,
      }),
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('explains a duplicate (409)', async () => {
    server.use(
      http.post(api('/service-items'), () =>
        HttpResponse.json({ error: { message: 'Exists' } }, { status: 409 }),
      ),
    );
    const { user } = renderApp('/catalog');
    await user.click(await screen.findByRole('button', { name: 'Add item' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByLabelText('Item id'), 'engine_oil');
    await user.type(within(dialog).getByLabelText('Title'), 'Oil');
    await user.type(within(dialog).getByLabelText('Subtitle'), 'Oil');
    await user.type(within(dialog).getByLabelText('Icon'), 'oil_barrel');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(
      await within(dialog).findByText('A row with this id already exists in this scope.'),
    ).toBeInTheDocument();
  });
});
