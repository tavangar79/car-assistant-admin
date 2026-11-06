import { Building2, CarFront, ChevronRight, Globe, Search, Tag } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import type { Scope } from './api';
import { ancestorScopes, scopeKey } from './scope';
import { allKeys, filterTree, nodeName, type TreeNode } from './tree';

const LEVEL_ICON = { global: Globe, make: Building2, model: CarFront, trim: Tag } as const;

function TreeItem({
  node,
  depth,
  selectedKey,
  expanded,
  onToggle,
  onSelect,
  counts,
}: {
  node: TreeNode;
  depth: number;
  selectedKey: string;
  expanded: Set<string>;
  onToggle: (key: string) => void;
  onSelect: (scope: Scope) => void;
  counts: Map<string, number>;
}) {
  const Icon = LEVEL_ICON[node.level];
  const open = expanded.has(node.key);
  const selected = node.key === selectedKey;
  const count = node.level === 'global' ? 0 : (counts.get(node.key) ?? 0);
  const name = nodeName(node);

  return (
    <li>
      <div
        className={cn(
          'group flex h-9 items-center gap-1 rounded-md pe-2 text-sm transition-colors',
          selected ? 'bg-accent text-accent-foreground' : 'hover:bg-muted',
        )}
        style={{ paddingInlineStart: `${depth * 14 + 4}px` }}
      >
        {node.children.length > 0 ? (
          <button
            type="button"
            className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            aria-expanded={open}
            aria-label={t(open ? 'catalog.tree.collapse' : 'catalog.tree.expand', { name })}
            onClick={() => onToggle(node.key)}
          >
            <ChevronRight
              className={cn('size-4 transition-transform rtl:rotate-180', open && 'rotate-90')}
              aria-hidden
            />
          </button>
        ) : (
          <span className="size-6 shrink-0" />
        )}
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 self-stretch rounded text-start focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-current={selected ? 'true' : undefined}
          onClick={() => onSelect(node.scope)}
        >
          <Icon
            className={cn('size-4 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')}
            aria-hidden
          />
          <span className={cn('truncate', selected && 'font-semibold')} dir="auto">
            {name}
          </span>
          {count > 0 && (
            <span
              className="ms-auto rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary tabular-nums"
              aria-label={t('catalog.tree.overrideCount', { count })}
              title={t('catalog.tree.overrideCount', { count })}
            >
              {count}
            </span>
          )}
        </button>
      </div>
      {open && node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <TreeItem
              key={child.key}
              node={child}
              depth={depth + 1}
              selectedKey={selectedKey}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              counts={counts}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Global → make → model → trim, with search and a count of rows defined at each node. */
export function ScopeTree({
  root,
  selected,
  onSelect,
  counts,
}: {
  root: TreeNode;
  selected: Scope;
  onSelect: (scope: Scope) => void;
  counts: Map<string, number>;
}) {
  const [query, setQuery] = useState('');
  // Start with the path to the selection open, so a deep link shows where it is.
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(ancestorScopes(selected).map(scopeKey)),
  );
  const searching = query.trim() !== '';
  const visible = filterTree(root, query);
  const open = searching ? new Set(allKeys(visible)) : expanded;

  function toggle(key: string) {
    const next = new Set(expanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpanded(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          className="ps-8"
          placeholder={t('catalog.tree.searchPlaceholder')}
          aria-label={t('catalog.tree.search')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <nav aria-label={t('catalog.tree.label')}>
        <ul className="flex flex-col gap-0.5">
          <TreeItem
            node={visible}
            depth={0}
            selectedKey={scopeKey(selected)}
            expanded={open}
            onToggle={toggle}
            onSelect={onSelect}
            counts={counts}
          />
        </ul>
        {searching && visible.children.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">{t('catalog.tree.noMatches')}</p>
        )}
      </nav>
    </div>
  );
}
