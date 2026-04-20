/**
 * Toggle one model key in the selected set.
 *
 * @param selectedKeys - Current selected model key set.
 * @param key - Model key to toggle.
 * @returns Updated selected model key set.
 */
export function toggleSelectedModelKey(selectedKeys: Set<string>, key: string): Set<string> {
  const next = new Set(selectedKeys);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  return next;
}

/**
 * Select all model keys when not fully selected, otherwise clear selection.
 *
 * @param selectedKeys - Current selected model key set.
 * @param allKeys - All visible model keys in the table.
 * @returns Updated selected model key set.
 */
export function toggleSelectAllModelKeys(
  selectedKeys: Set<string>,
  allKeys: string[]
): Set<string> {
  const allSelected = allKeys.length > 0 && allKeys.every((key) => selectedKeys.has(key));
  if (allSelected) {
    return new Set<string>();
  }
  return new Set(allKeys);
}

/**
 * Remove selected model keys that no longer exist in the table.
 *
 * @param selectedKeys - Current selected model key set.
 * @param allKeys - Current model keys in the table.
 * @returns Synced set; returns the original set when no changes are needed.
 */
export function syncSelectedModelKeys(selectedKeys: Set<string>, allKeys: string[]): Set<string> {
  const keySet = new Set(allKeys);
  const filtered = Array.from(selectedKeys).filter((key) => keySet.has(key));

  if (filtered.length === selectedKeys.size) {
    return selectedKeys;
  }

  return new Set(filtered);
}

/**
 * Reorder an array by moving one key to another key's position.
 *
 * @param modelKeys - Ordered model keys.
 * @param activeId - Dragging key.
 * @param overId - Drop target key.
 * @returns Reordered array. Returns original array when ids are invalid.
 */
export function reorderModelKeys(modelKeys: string[], activeId: string, overId: string): string[] {
  const oldIndex = modelKeys.findIndex((key) => key === activeId);
  const newIndex = modelKeys.findIndex((key) => key === overId);

  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return modelKeys;
  }

  const next = [...modelKeys];
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);
  return next;
}
