/**
 * Resolves the set of parsha name keys from a single Hebcal event description.
 *
 * For simple parshiot ("Parashat Bereishit") returns ["Bereishit"].
 * For combined parshiot ("Parashat Vayakhel-Pekudei") returns
 *   ["Vayakhel-Pekudei", "Vayakhel", "Pekudei"] — but only when both halves
 *   are confirmed parsha names, preventing "Lech-Lecha" from splitting into
 *   the non-existent "Lech" and "Lecha" entries.
 */
export function parshaKeysFromDesc(desc: string, known: Set<string>): string[] {
  const name = desc.replace(/^Parashat /, '');
  const names = [name];
  if (name.includes('-')) {
    const parts = name.split('-').map(p => p.trim());
    if (parts.every(p => known.has(p))) names.push(...parts);
  }
  return names;
}
