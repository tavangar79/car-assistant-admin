import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { stats } from '@/test/fixtures';
import { renderApp } from '@/test/render-app';
import { api, errorBody, server } from '@/test/server';
import { presetRange, todayInTehran } from './range';

describe('dashboard', () => {
  it('shows totals and asks for the last 30 days by day', async () => {
    const queries: URLSearchParams[] = [];
    server.use(
      http.get(api('/stats'), ({ request }) => {
        const params = new URL(request.url).searchParams;
        queries.push(params);
        return HttpResponse.json(
          stats(params.get('from')!, params.get('to')!, params.get('bucket') as 'day'),
        );
      }),
    );
    renderApp('/');

    await waitFor(() => expect(screen.getByTestId('total-users')).toHaveTextContent('1,234'));
    expect(screen.getByTestId('total-blockedUsers')).toHaveTextContent('3');
    expect(screen.getByTestId('total-documents')).toHaveTextContent('95');
    expect(screen.getByText('New users')).toBeInTheDocument();
    expect(screen.getByText('Records by type')).toBeInTheDocument();

    const expected = presetRange('30d', todayInTehran());
    expect(Object.fromEntries(queries[0]!)).toEqual({ ...expected, bucket: 'day' });
  });

  it('switches range preset and bucket', async () => {
    const queries: Record<string, string>[] = [];
    server.use(
      http.get(api('/stats'), ({ request }) => {
        const params = new URL(request.url).searchParams;
        queries.push(Object.fromEntries(params));
        return HttpResponse.json(
          stats(params.get('from')!, params.get('to')!, params.get('bucket') as 'day'),
        );
      }),
    );
    const { user } = renderApp('/');
    await screen.findByText('1,234');

    await user.click(screen.getByRole('radio', { name: '12 months' }));
    await waitFor(() =>
      expect(queries.at(-1)).toEqual({ ...presetRange('12m', todayInTehran()), bucket: 'month' }),
    );

    await user.click(screen.getByRole('radio', { name: 'Week' }));
    await waitFor(() => expect(queries.at(-1)?.bucket).toBe('week'));
  });

  it('shows an empty state when a range has no activity', async () => {
    server.use(
      http.get(api('/stats'), ({ request }) => {
        const params = new URL(request.url).searchParams;
        const body = stats(params.get('from')!, params.get('to')!, 'day');
        body.series = body.series.map((row) => ({ ...row, users: 0, vehicles: 0, fuelLogs: 0 }));
        return HttpResponse.json(body);
      }),
    );
    renderApp('/');
    expect(await screen.findAllByText('No activity in this range.')).toHaveLength(3);
  });

  it('shows an error state with retry', async () => {
    server.use(
      http.get(api('/stats'), () => HttpResponse.json(errorBody('Boom'), { status: 500 })),
    );
    renderApp('/');
    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
