import type { AlgListItem } from "@/services/cubing-pro/algs/algs";

const LAST_SLOT = ["LS", ...Array.from({ length: 9 }, (_, index) => `LS${index + 1}`), "EGLS1", "EGLS2"];
const EG = ["CLL", "EG1", "EG2", "LEG"];
const normalize = (name: string) => name.trim().toUpperCase();

export function usesTwoByTwo3D(...names: string[]): boolean {
  return names.some((name) => /(?:^|[^A-Z0-9])(?:PBL|LS[1-9]?|EGLS[12]|FAKE[\s_-]*BAR)(?:$|[^A-Z0-9])/i.test(name));
}

/** Frontend presentation only: retain original API names, links and records. */
export function groupTwoByTwoCategories(items: readonly AlgListItem[]) {
  const definitions = [
    { id: "last-slot", label: "LS / EGLS", names: LAST_SLOT },
    { id: "eg", label: "CLL / EG", names: EG },
    { id: "cbl", label: "CBL", names: ["CBL"] },
    { id: "other", label: "", names: [] as string[] },
  ];
  const assigned = new Set([...LAST_SLOT, ...EG, "CBL"]);
  return definitions.map((definition) => {
    const selected = items.filter((item) => definition.id === "other"
      ? !assigned.has(normalize(item.name)) : definition.names.includes(normalize(item.name)));
    if (definition.id !== "other") selected.sort((a, b) => definition.names.indexOf(normalize(a.name)) - definition.names.indexOf(normalize(b.name)));
    return { id: definition.id, label: definition.label, items: selected };
  }).filter((group) => group.items.length > 0);
}
