import { t } from '@/i18n';
import type { Scope, VehicleCatalog } from './api';

export const isGlobal = (scope: Scope): boolean =>
  scope.makeId === null && scope.modelId === null && scope.trimId === null;

export const sameScope = (a: Scope, b: Scope): boolean =>
  a.makeId === b.makeId && a.modelId === b.modelId && a.trimId === b.trimId;

/** Trim 3 > model 2 > make 1 > global 0, as the backend resolves rows. */
export function specificity(scope: Scope): number {
  if (scope.trimId !== null) return 3;
  if (scope.modelId !== null) return 2;
  if (scope.makeId !== null) return 1;
  return 0;
}

/** Display names for a scope's ids, most general first. Unknown ids fall back to the id. */
export function scopeNames(scope: Scope, catalog: VehicleCatalog | undefined): string[] {
  const make = catalog?.makes.find((m) => m.id === scope.makeId);
  const model = make?.models.find((m) => m.id === scope.modelId);
  const trim = model?.trims.find((tr) => tr.id === scope.trimId);
  const names: string[] = [];
  if (scope.makeId !== null) names.push(make?.name ?? scope.makeId);
  if (scope.modelId !== null) names.push(model?.name ?? scope.modelId);
  if (scope.trimId !== null) names.push(trim?.name ?? scope.trimId);
  return names;
}

/** "Global", or the scope's names joined like "Iran Khodro / Tara". */
export function scopePath(scope: Scope, catalog: VehicleCatalog | undefined): string {
  return isGlobal(scope) ? t('scope.global') : scopeNames(scope, catalog).join(' / ');
}

/** A stable string id for a scope: `global`, `make`, `make/model` or `make/model/trim`. */
export function scopeKey(scope: Scope): string {
  if (isGlobal(scope)) return 'global';
  return [scope.makeId, scope.modelId, scope.trimId].filter((id) => id !== null).join('/');
}

/** The scope and every wider scope it inherits from, most general (global) first. */
export function ancestorScopes(scope: Scope): Scope[] {
  const { makeId, modelId, trimId } = scope;
  const chain: Scope[] = [{ makeId: null, modelId: null, trimId: null }];
  if (makeId === null) return chain;
  chain.push({ makeId, modelId: null, trimId: null });
  if (modelId === null) return chain;
  chain.push({ makeId, modelId, trimId: null });
  if (trimId === null) return chain;
  chain.push({ makeId, modelId, trimId });
  return chain;
}

/** Reads a scope from `?make=&model=&trim=`. A level without its parent is dropped. */
export function scopeFromParams(params: URLSearchParams): Scope {
  const makeId = params.get('make') || null;
  const modelId = makeId ? params.get('model') || null : null;
  const trimId = modelId ? params.get('trim') || null : null;
  return { makeId, modelId, trimId };
}

export function scopeToParams(scope: Scope): Record<string, string> {
  const params: Record<string, string> = {};
  if (scope.makeId !== null) params.make = scope.makeId;
  if (scope.modelId !== null) params.model = scope.modelId;
  if (scope.trimId !== null) params.trim = scope.trimId;
  return params;
}
