/** The keys of `next` whose values differ from `original` (deep, via JSON). For partial PATCH bodies. */
export function changedValues<T extends object>(original: T, next: T): Partial<T> {
  const patch: Partial<T> = {};
  for (const key of Object.keys(next) as (keyof T)[]) {
    if (JSON.stringify(original[key]) !== JSON.stringify(next[key])) patch[key] = next[key];
  }
  return patch;
}

/** Maps zod issues to the first path segment, so each form field can show one rule. */
export function invalidFields(issues: { path: PropertyKey[] }[]): Set<string> {
  return new Set(issues.map((issue) => String(issue.path[0])));
}
