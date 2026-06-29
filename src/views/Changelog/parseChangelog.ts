export interface ChangelogItem {
  scope: "frontend" | "backend";
  text: string;
}

export interface ChangelogEntry {
  date: string;
  isYear?: boolean;
  items: ChangelogItem[];
}

export function parseChangelog(md: string): ChangelogEntry[] {
  const lines = md.split("\n");
  const entries: ChangelogEntry[] = [];
  let currentEntry: ChangelogEntry | null = null;
  let currentScope: "frontend" | "backend" | null = null;

  for (const line of lines) {
    const yearMatch = line.match(/^## (\d{4})/);
    if (yearMatch) {
      currentEntry = { date: yearMatch[1], isYear: true, items: [] };
      entries.push(currentEntry);
      currentScope = null;
      continue;
    }

    const dateMatch = line.match(/^### (\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      currentEntry = { date: dateMatch[1], items: [] };
      entries.push(currentEntry);
      currentScope = null;
      continue;
    }

    const scopeMatch = line.match(/^\*\*(前端|后端|全栈)\*\*$/);
    if (scopeMatch && currentEntry) {
      currentScope = scopeMatch[1] === "前端" ? "frontend" : "backend";
      continue;
    }

    const itemMatch = line.match(/^- (.+)/);
    if (itemMatch && currentEntry && currentScope) {
      currentEntry.items.push({ scope: currentScope, text: itemMatch[1] });
    }
  }

  return entries;
}

export function formatChangelogDate(dateStr: string): string {
  const d = new Date(dateStr);
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdays[d.getDay()]}`;
}
