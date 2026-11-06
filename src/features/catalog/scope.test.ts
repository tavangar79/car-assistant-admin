import { describe, expect, it } from 'vitest';
import { vehicleCatalog } from '@/test/fixtures';
import { GLOBAL_SCOPE } from './api';
import { changedValues, invalidFields } from './diff';
import { isGlobal, sameScope, scopeNames, specificity } from './scope';

const tara = { makeId: 'iran-khodro', modelId: 'tara', trimId: null };

describe('scope helpers', () => {
  it('detects global and compares scopes', () => {
    expect(isGlobal(GLOBAL_SCOPE)).toBe(true);
    expect(isGlobal(tara)).toBe(false);
    expect(sameScope(tara, { ...tara })).toBe(true);
    expect(sameScope(tara, GLOBAL_SCOPE)).toBe(false);
  });

  it('ranks specificity like the backend', () => {
    expect(specificity(GLOBAL_SCOPE)).toBe(0);
    expect(specificity({ makeId: 'm', modelId: null, trimId: null })).toBe(1);
    expect(specificity(tara)).toBe(2);
    expect(specificity({ ...tara, trimId: 'tara-v4-at' })).toBe(3);
  });

  it('names a scope from the catalog, falling back to ids', () => {
    expect(scopeNames({ ...tara, trimId: 'tara-v4-at' }, vehicleCatalog)).toEqual([
      'Iran Khodro',
      'Tara',
      'V4 AT',
    ]);
    expect(scopeNames({ makeId: 'gone', modelId: null, trimId: null }, vehicleCatalog)).toEqual([
      'gone',
    ]);
  });
});

describe('form helpers', () => {
  it('keeps only changed values', () => {
    expect(changedValues({ a: 1, b: ['x'], c: true }, { a: 1, b: ['x', 'y'], c: false })).toEqual({
      b: ['x', 'y'],
      c: false,
    });
  });

  it('collects the first path segment of each issue', () => {
    expect(invalidFields([{ path: ['km'] }, { path: ['scope', 'makeId'] }])).toEqual(
      new Set(['km', 'scope']),
    );
  });
});
