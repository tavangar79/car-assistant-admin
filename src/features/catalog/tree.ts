import { t, type TranslationKey } from '@/i18n';
import type { Scope, VehicleCatalog } from './api';
import { ancestorScopes, scopeKey, specificity } from './scope';

export type ScopeLevel = 'global' | 'make' | 'model' | 'trim';

export type TreeNode = {
  key: string;
  scope: Scope;
  /** Display name; empty for the global node (the UI names it). */
  name: string;
  level: ScopeLevel;
  children: TreeNode[];
};

export const LEVEL_LABEL: Record<ScopeLevel, TranslationKey> = {
  global: 'scope.global',
  make: 'scope.make',
  model: 'scope.model',
  trim: 'scope.trim',
};

export const nodeName = (current: TreeNode) => current.name || t('scope.global');

/** The node with this key, if the tree has it. */
export function findNode(root: TreeNode, key: string): TreeNode | undefined {
  if (root.key === key) return root;
  for (const child of root.children) {
    const found = findNode(child, key);
    if (found) return found;
  }
  return undefined;
}

const node = (scope: Scope, name: string, level: ScopeLevel, children: TreeNode[]): TreeNode => ({
  key: scopeKey(scope),
  scope,
  name,
  level,
  children,
});

/** Global, then makes → models → trims, in catalog order. */
export function buildTree(catalog: VehicleCatalog | undefined): TreeNode {
  const makes = (catalog?.makes ?? []).map((make) =>
    node(
      { makeId: make.id, modelId: null, trimId: null },
      make.name,
      'make',
      make.models.map((model) =>
        node(
          { makeId: make.id, modelId: model.id, trimId: null },
          model.name,
          'model',
          model.trims.map((trim) =>
            node({ makeId: make.id, modelId: model.id, trimId: trim.id }, trim.name, 'trim', []),
          ),
        ),
      ),
    ),
  );
  return node({ makeId: null, modelId: null, trimId: null }, '', 'global', makes);
}

/**
 * Keeps the nodes whose name contains `query` (case-insensitive), with their ancestors and all
 * their descendants. The global node always stays. An empty query returns the tree unchanged.
 */
export function filterTree(root: TreeNode, query: string): TreeNode {
  const needle = query.trim().toLocaleLowerCase();
  if (needle === '') return root;

  function prune(current: TreeNode): TreeNode | null {
    if (current.name.toLocaleLowerCase().includes(needle)) return current;
    const children = current.children.map(prune).filter((child) => child !== null);
    return children.length > 0 ? { ...current, children } : null;
  }

  return { ...root, children: root.children.map(prune).filter((child) => child !== null) };
}

/** Every key in the tree, depth first. */
export function allKeys(root: TreeNode): string[] {
  return [root.key, ...root.children.flatMap(allKeys)];
}

/** How many rows are defined at each exact scope, by scope key. */
export function countByScope(rows: { scope: Scope }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = scopeKey(row.scope);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export type ResolvedRow<R> = {
  /** The row that applies to vehicles in the selected scope. */
  row: R;
  /** `own`: defined at the selected scope. `inherited`: comes from a wider scope. */
  origin: 'own' | 'inherited';
  /** For an own row: the next wider row with the same slug, which it replaces. */
  replaces: R | null;
};

/**
 * What applies at `scope`, one entry per slug: the most specific row among the scope and its
 * ancestors wins, as the backend resolves. Rows of narrower scopes are not part of it.
 * Sorted by `sortOrder`, then slug.
 */
export function resolveRows<R extends { scope: Scope; sortOrder: number }>(
  rows: R[],
  scope: Scope,
  slugOf: (row: R) => string,
): ResolvedRow<R>[] {
  const chain = new Set(ancestorScopes(scope).map(scopeKey));
  const ownKey = scopeKey(scope);
  const bySlug = new Map<string, R[]>();
  for (const row of rows) {
    if (!chain.has(scopeKey(row.scope))) continue;
    const slug = slugOf(row);
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), row]);
  }

  const resolved: ResolvedRow<R>[] = [];
  for (const candidates of bySlug.values()) {
    const [winner, next] = [...candidates].sort(
      (a, b) => specificity(b.scope) - specificity(a.scope),
    );
    if (!winner) continue;
    const own = scopeKey(winner.scope) === ownKey;
    resolved.push({
      row: winner,
      origin: own ? 'own' : 'inherited',
      replaces: own ? (next ?? null) : null,
    });
  }
  return resolved.sort(
    (a, b) => a.row.sortOrder - b.row.sortOrder || slugOf(a.row).localeCompare(slugOf(b.row)),
  );
}
