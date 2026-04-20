import { describe, expect, it } from "@jest/globals";
import {
  reorderModelKeys,
  syncSelectedModelKeys,
  toggleSelectedModelKey,
  toggleSelectAllModelKeys,
} from "@/settings/v2/components/modelTableUtils";

describe("ModelTable selection and reorder behavior", () => {
  it("selects and unselects an individual model key", () => {
    let selected = new Set<string>();

    selected = toggleSelectedModelKey(selected, "a|p");
    expect(Array.from(selected)).toEqual(["a|p"]);

    selected = toggleSelectedModelKey(selected, "a|p");
    expect(Array.from(selected)).toEqual([]);
  });

  it("toggles select-all for all visible model keys", () => {
    const allKeys = ["a|p", "b|p", "c|p"];
    let selected = new Set<string>();

    selected = toggleSelectAllModelKeys(selected, allKeys);
    expect(Array.from(selected).sort()).toEqual(allKeys);

    selected = toggleSelectAllModelKeys(selected, allKeys);
    expect(Array.from(selected)).toEqual([]);
  });

  it("prunes stale selected keys when model list changes", () => {
    const selected = new Set<string>(["a|p", "z|p"]);
    const allKeys = ["a|p", "b|p"];

    const synced = syncSelectedModelKeys(selected, allKeys);
    expect(Array.from(synced)).toEqual(["a|p"]);
  });

  it("reorders any models including previously fixed core entries", () => {
    const keys = ["core-1|x", "core-2|x", "custom-1|x", "custom-2|x"];
    const reordered = reorderModelKeys(keys, "core-2|x", "custom-2|x");

    expect(reordered).toEqual(["core-1|x", "custom-1|x", "custom-2|x", "core-2|x"]);
  });

  it("returns unchanged order when drag indexes are invalid", () => {
    const keys = ["a|p", "b|p"];
    expect(reorderModelKeys(keys, "missing|p", "b|p")).toEqual(keys);
    expect(reorderModelKeys(keys, "a|p", "missing|p")).toEqual(keys);
    expect(reorderModelKeys(keys, "a|p", "a|p")).toEqual(keys);
  });
});
