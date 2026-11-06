import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render-app';
import { api, server } from '@/test/server';
import { CollectionTable } from './collection-table';

const ID = '65f1a2b3c4d5e6f7a8b9c0d1';
const VEHICLE = '65f1a2b3c4d5e6f7a8b9c0e2';

describe('CollectionTable', () => {
  it('draws columns from fields and formats each value', () => {
    render(
      <CollectionTable
        fields={['id', 'vehicleId', 'liters', 'fueledAt', 'note', 'plate', 'full', 'missing']}
        documents={[
          {
            id: ID,
            vehicleId: VEHICLE,
            liters: 1234.5,
            fueledAt: '2026-01-01T21:00:00.000Z',
            note: 'پر کردن باک',
            plate: { letters: 'ب', number: '12' },
            full: true,
            missing: null,
          },
        ]}
      />,
    );

    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent);
    expect(headers).toEqual([
      'id',
      'vehicleId',
      'liters',
      'fueledAt',
      'note',
      'plate',
      'full',
      'missing',
    ]);

    const row = screen.getAllByRole('row')[1]!;
    const cells = within(row).getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('65f1…c0d1');
    expect(within(cells[0]!).getByRole('button', { name: `Copy id ${ID}` })).toBeInTheDocument();
    expect(cells[2]).toHaveTextContent('1,234.5');
    expect(cells[3]).toHaveTextContent('Jan 2, 2026, 00:30');
    expect(within(cells[4]!).getByText('پر کردن باک')).toHaveAttribute('dir', 'auto');
    expect(cells[5]).toHaveTextContent('{"letters":"ب","number":"12"}');
    expect(cells[6]).toHaveTextContent('Yes');
    expect(cells[7]).toHaveTextContent('—');
  });
});

describe('data browser', () => {
  it('lists collections with counts and pages through a collection', async () => {
    const page = (id: string, nextCursor: string | null) => ({
      name: 'fuel_logs',
      fields: ['id', 'liters'],
      documents: [{ id, liters: 40 }],
      nextCursor,
    });
    const cursors: (string | null)[] = [];
    server.use(
      http.get(api('/collections/fuel_logs'), ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor');
        cursors.push(cursor);
        return HttpResponse.json(cursor ? page(VEHICLE, null) : page(ID, ID));
      }),
    );
    const { user } = renderApp('/data/fuel_logs');

    expect(await screen.findByText('65f1…c0d1')).toBeInTheDocument();
    expect(screen.getByText('12 documents · Read-only')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByText('65f1…c0e2')).toBeInTheDocument();
    expect(cursors).toEqual([null, ID]);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('shows the empty state', async () => {
    renderApp('/data/vehicles');
    expect(await screen.findByText('No documents.')).toBeInTheDocument();
  });

  it('shows "not found" for an unknown collection', async () => {
    server.use(
      http.get(api('/collections/admins'), () =>
        HttpResponse.json({ error: { message: 'Not found' } }, { status: 404 }),
      ),
    );
    renderApp('/data/admins');
    expect(await screen.findByText('Not found. It may have been deleted.')).toBeInTheDocument();
  });
});
