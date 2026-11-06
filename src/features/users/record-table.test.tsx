import { render, screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { USER_ID, VEHICLE_ID } from '@/test/fixtures';
import { renderApp } from '@/test/render-app';
import { api, server } from '@/test/server';
import { RecordTable } from './record-table';

const ID = '65f1a2b3c4d5e6f7a8b9c0d1';
const OTHER = '65f1a2b3c4d5e6f7a8b9c0e3';
const VISIT = '65f1a2b3c4d5e6f7a8b9c0f4';

describe('RecordTable', () => {
  it('draws columns from fields and formats each value', () => {
    render(
      <RecordTable
        fields={['id', 'vehicleId', 'liters', 'fueledAt', 'note', 'plate', 'full', 'missing']}
        documents={[
          {
            id: ID,
            vehicleId: VEHICLE_ID,
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

describe('user record tabs', () => {
  it('pages through a vehicle collection filtered by the vehicle', async () => {
    const page = (id: string, cursor: string | null) => ({
      name: 'service_visits',
      fields: ['id', 'km'],
      documents: [{ id, km: 40 }],
      nextCursor: cursor,
    });
    const calls: URLSearchParams[] = [];
    server.use(
      http.get(api('/collections/service_visits'), ({ request }) => {
        const params = new URL(request.url).searchParams;
        calls.push(params);
        return HttpResponse.json(params.get('cursor') ? page(OTHER, null) : page(VISIT, VISIT));
      }),
    );
    const { user } = renderApp(`/users/${USER_ID}`);

    expect(await screen.findByText('65f1…c0f4')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Load more' }));
    expect(await screen.findByText('65f1…c0e3')).toBeInTheDocument();

    expect(calls.map((params) => params.get('vehicleId'))).toEqual([VEHICLE_ID, VEHICLE_ID]);
    expect(calls.map((params) => params.get('cursor'))).toEqual([null, VISIT]);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('filters user collections by the user and shows the empty state', async () => {
    let userId: string | null = null;
    server.use(
      http.get(api('/collections/notifications'), ({ request }) => {
        userId = new URL(request.url).searchParams.get('userId');
        return HttpResponse.json({
          name: 'notifications',
          fields: ['id'],
          documents: [],
          nextCursor: null,
        });
      }),
    );
    const { user } = renderApp(`/users/${USER_ID}`);
    await user.click(await screen.findByRole('tab', { name: 'Notifications' }));

    expect(await screen.findByText('No records yet.')).toBeInTheDocument();
    expect(userId).toBe(USER_ID);
  });
});
