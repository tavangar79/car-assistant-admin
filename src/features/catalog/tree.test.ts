import { describe, expect, it } from 'vitest';
import { intervals, serviceItems, vehicleCatalog } from '@/test/fixtures';
import { GLOBAL_SCOPE, type ServiceItem } from './api';
import { ancestorScopes, scopeFromParams, scopeKey, scopeToParams } from './scope';
import { allKeys, buildTree, countByScope, filterTree, resolveRows } from './tree';

const make = { makeId: 'iran-khodro', modelId: null, trimId: null };
const tara = { makeId: 'iran-khodro', modelId: 'tara', trimId: null };
const v4 = { ...tara, trimId: 'tara-v4-at' };

describe('scope keys and params', () => {
  it('keys a scope by its ids', () => {
    expect(scopeKey(GLOBAL_SCOPE)).toBe('global');
    expect(scopeKey(tara)).toBe('iran-khodro/tara');
    expect(scopeKey(v4)).toBe('iran-khodro/tara/tara-v4-at');
  });

  it('lists ancestors from global down to the scope', () => {
    expect(ancestorScopes(v4)).toEqual([GLOBAL_SCOPE, make, tara, v4]);
    expect(ancestorScopes(GLOBAL_SCOPE)).toEqual([GLOBAL_SCOPE]);
  });

  it('round-trips through URL params and drops orphan levels', () => {
    expect(scopeFromParams(new URLSearchParams(scopeToParams(v4)))).toEqual(v4);
    expect(scopeFromParams(new URLSearchParams('model=tara&trim=x'))).toEqual(GLOBAL_SCOPE);
  });
});

describe('tree', () => {
  const root = buildTree(vehicleCatalog);

  it('builds global → make → model → trim', () => {
    expect(allKeys(root)).toEqual([
      'global',
      'iran-khodro',
      'iran-khodro/tara',
      'iran-khodro/tara/tara-v1-mt',
      'iran-khodro/tara/tara-v4-at',
    ]);
  });

  it('filters by name, keeping ancestors and the matched subtree', () => {
    expect(allKeys(filterTree(root, 'v4'))).toEqual([
      'global',
      'iran-khodro',
      'iran-khodro/tara',
      'iran-khodro/tara/tara-v4-at',
    ]);
    expect(allKeys(filterTree(root, 'TARA'))).toHaveLength(5);
    expect(allKeys(filterTree(root, 'nothing'))).toEqual(['global']);
  });

  it('counts rows per exact scope', () => {
    const counts = countByScope([...serviceItems, ...intervals]);
    expect(counts.get('global')).toBe(3);
    expect(counts.get('iran-khodro/tara')).toBe(1);
    expect(counts.get('iran-khodro')).toBeUndefined();
  });
});

describe('resolveRows', () => {
  const slug = (row: ServiceItem) => row.itemId;

  it('at global, shows only global rows as own', () => {
    const rows = resolveRows(serviceItems, GLOBAL_SCOPE, slug);
    expect(rows.map((r) => [r.row.itemId, r.origin, r.row.scope.modelId])).toEqual([
      ['engine_oil', 'own', null],
      ['brake_pads', 'own', null],
    ]);
  });

  it('at a model, the model row overrides global and the rest is inherited', () => {
    const rows = resolveRows(serviceItems, tara, slug);
    const oil = rows.find((r) => r.row.itemId === 'engine_oil')!;
    expect(oil.origin).toBe('own');
    expect(oil.row.title).toBe('Tara engine oil');
    expect(oil.replaces?.scope).toEqual(GLOBAL_SCOPE);
    expect(rows.find((r) => r.row.itemId === 'brake_pads')?.origin).toBe('inherited');
  });

  it('at a trim, inherits the most specific ancestor row', () => {
    const oil = resolveRows(serviceItems, v4, slug).find((r) => r.row.itemId === 'engine_oil')!;
    expect(oil.origin).toBe('inherited');
    expect(oil.row.scope).toEqual(tara);
  });
});
