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
