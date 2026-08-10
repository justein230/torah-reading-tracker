export function buildGroupedOptions<T>(
  groups: string[],
  getGroupLabel: (group: string) => string,
  getGroupItems: (group: string) => T[],
  getItemOption: (item: T) => { value: string; label: string },
): { value: string; label: string; disabled?: boolean }[] {
  return groups.flatMap(group => {
    const items = getGroupItems(group);
    if (!items.length) return [];
    return [
      { value: `__group__${group}`, label: `── ${getGroupLabel(group)} ──`, disabled: true as const },
      ...items.map(getItemOption),
    ];
  });
}
