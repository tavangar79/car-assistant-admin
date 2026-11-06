import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { serviceItems } from '@/test/fixtures';
import { renderApp } from '@/test/render-app';
import { api, server } from '@/test/server';

const [globalOil, taraOil] = serviceItems as [(typeof serviceItems)[0], (typeof serviceItems)[0]];
const TARA = '/catalog?make=iran-khodro&model=tara';
const V4 = `${TARA}&trim=tara-v4-at`;

/** The list entry that holds `title`. */
const rowOf = async (title: string) => (await screen.findByText(title)).closest('li')!;

describe('catalog tree', () => {
  it('starts at Global, where rows are the base and cannot be deleted', async () => {
    renderApp('/catalog');

    const oil = await rowOf('Engine oil');
    expect(screen.getByText('Brake pads')).toBeInTheDocument();
    expect(screen.queryByText(/Inherited from/)).not.toBeInTheDocument();
    expect(within(oil).getByRole('button', { name: 'Delete engine_oil' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Global' })).toHaveAttribute('aria-current', 'true');
  });

  it('selecting a model shows its override and the rows it inherits', async () => {
    const { user, router } = renderApp('/catalog');
    await screen.findByText('Engine oil');

    await user.click(screen.getByRole('button', { name: 'Expand Iran Khodro' }));
    await user.click(screen.getByRole('button', { name: /^Tara/ }));

    const oil = await rowOf('Tara engine oil');
    expect(within(oil).getByText('Override')).toBeInTheDocument();
    expect(within(oil).getByText('Disabled')).toBeInTheDocument();
    expect(within(oil).getByRole('button', { name: 'Delete engine_oil' })).toBeEnabled();
    expect(screen.queryByText('Engine oil')).not.toBeInTheDocument();

    const brakes = await rowOf('Brake pads');
    expect(within(brakes).getByText('Inherited from Global')).toBeInTheDocument();
    expect(within(brakes).getByRole('button', { name: 'Override brake_pads here' })).toBeEnabled();
    expect(screen.getByText('1 defined here · 1 inherited')).toBeInTheDocument();

    expect(router.state.location.search).toBe('?make=iran-khodro&model=tara');
    const breadcrumbs = screen.getByRole('navigation', { name: 'Current scope' });
    expect(within(breadcrumbs).getByText('Tara')).toHaveAttribute('aria-current', 'page');
    expect(within(breadcrumbs).getByRole('button', { name: 'Iran Khodro' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Interval defaults' }));
    const oilChange = await rowOf('Oil change');
    expect(within(oilChange).getByText('Inherited from Global')).toBeInTheDocument();
  });

  it('a trim inherits the most specific wider row', async () => {
    renderApp(V4);
    const oil = await rowOf('Tara engine oil');
    expect(within(oil).getByText('Inherited from Iran Khodro / Tara')).toBeInTheDocument();
  });

  it('shows how many rows each node defines', async () => {
    renderApp(TARA);
    expect(await screen.findByLabelText('Rows defined at this scope: 1')).toBeInTheDocument();
  });

  it('searches makes, models and trims', async () => {
    const { user } = renderApp('/catalog');
    await screen.findByText('Engine oil');

    await user.type(screen.getByLabelText('Search makes, models and trims'), 'v4');
    expect(screen.getByRole('button', { name: 'V4 AT' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'V1 MT' })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search makes, models and trims'));
    await user.type(screen.getByLabelText('Search makes, models and trims'), 'peugeot');
    expect(screen.getByText('No make, model or trim matches.')).toBeInTheDocument();
  });
});

describe('catalog actions', () => {
  it('adds an item at the selected scope, explaining overrides inline', async () => {
    let body: unknown;
    server.use(
      http.post(api('/service-items'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ item: { ...taraOil, itemId: 'coolant' } }, { status: 201 });
      }),
    );
    const { user } = renderApp(V4);
    await user.click(await screen.findByRole('button', { name: 'Add item' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Iran Khodro / Tara / V4 AT')).toBeInTheDocument();
    expect(within(dialog).getByText(/fully replaces it for these vehicles/)).toBeInTheDocument();

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
        scope: { makeId: 'iran-khodro', modelId: 'tara', trimId: 'tara-v4-at' },
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

  it('overrides an inherited row with a prefilled copy at this scope', async () => {
    let body: unknown;
    server.use(
      http.post(api('/service-items'), async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ item: taraOil }, { status: 201 });
      }),
    );
    const { user } = renderApp(TARA);
    await user.click(await screen.findByRole('button', { name: 'Override brake_pads here' }));
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/fully replaces the Global row for Iran Khodro \/ Tara/),
    ).toBeInTheDocument();
    expect(within(dialog).getByLabelText('Item id')).toHaveAttribute('readonly');

    await user.clear(within(dialog).getByLabelText('Subtitle'));
    await user.type(within(dialog).getByLabelText('Subtitle'), 'Front only');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(body).toEqual({
        itemId: 'brake_pads',
        scope: { makeId: 'iran-khodro', modelId: 'tara', trimId: null },
        categoryId: 'brakes',
        title: 'Brake pads',
        subtitle: 'Front only',
        icon: 'tire_repair',
        sortOrder: 2,
        disabled: false,
      }),
    );
  });

  it('enables an override with a partial PATCH', async () => {
    let patch: unknown;
    server.use(
      http.patch(api(`/service-items/${taraOil.id}`), async ({ request }) => {
        patch = await request.json();
        return HttpResponse.json({ item: { ...taraOil, disabled: false } });
      }),
    );
    const { user } = renderApp(TARA);
    await screen.findByText('Tara engine oil');

    await user.click(screen.getByRole('button', { name: 'Enable engine_oil' }));
    await waitFor(() => expect(patch).toEqual({ disabled: false }));
  });

  it('disables a global row with a partial PATCH', async () => {
    let patch: unknown;
    server.use(
      http.patch(api(`/service-items/${globalOil.id}`), async ({ request }) => {
        patch = await request.json();
        return HttpResponse.json({ item: { ...globalOil, disabled: true } });
      }),
    );
    const { user } = renderApp('/catalog');
    const oil = await rowOf('Engine oil');

    await user.click(within(oil).getByRole('button', { name: 'Disable engine_oil' }));
    await waitFor(() => expect(patch).toEqual({ disabled: true }));
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
