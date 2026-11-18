export interface ChangelogItem {
  id?: string;
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
      continue;
    }

    if (/^\s+- /.test(line) && currentEntry?.items.length) {
      currentEntry.items[currentEntry.items.length - 1].text += `\n${line}`;
    }
  }

  return entries;
}

export const changelogLocales = ["en-US", "ja", "yue-Hant-HK", "ko", "fr", "es"] as const;

export function getChangelogLocale(locale: string): string | null {
  if (locale === "zh-CN") return null;
  const supported = changelogLocales.find((supported) => supported === locale);
  if (!supported) throw new Error(`Unsupported changelog locale: ${locale}`);
  return supported;
}

export function getChangelogLoadError(locale: string): string {
  const messages: Record<string, string> = {
    "zh-CN": "更新日志加载失败，请刷新重试。",
    "en-US": "The changelog could not be loaded. Please refresh to try again.",
    ja: "更新履歴を読み込めませんでした。ページを再読み込みしてください。",
    "yue-Hant-HK": "載入更新日誌失敗，請重新整理再試。",
    ko: "변경 기록을 불러오지 못했습니다. 새로고침하여 다시 시도해 주세요.",
    fr: "Impossible de charger le journal des modifications. Actualisez la page pour réessayer.",
    es: "No se pudo cargar el historial de cambios. Actualiza la página para volver a intentarlo.",
  };
  return messages[locale] ?? messages["en-US"];
}

export async function loadChangelog(locale: string, signal: AbortSignal): Promise<ChangelogEntry[]> {
  const contentLocale = getChangelogLocale(locale);
  const request = async (url: string) => {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Changelog request failed: ${response.status}`);
    return response;
  };
  if (!contentLocale) return parseChangelog(await (await request("/CHANGELOG.md")).text());
  const [manifest, messages] = await Promise.all([
    request("/i18n/changelog/manifest.json").then((response) => response.json()),
    request(`/i18n/changelog/${contentLocale}.json`).then((response) => response.json()),
  ]);
  return parseLocalizedChangelog(manifest, messages);
}

/** The manifest owns identities and order; translations contain no parseable headings. */
export function parseLocalizedChangelog(manifest: unknown, messages: unknown): ChangelogEntry[] {
  if (!manifest || typeof manifest !== "object" || !("version" in manifest) ||
      manifest.version !== 1 || !("itemCount" in manifest) ||
      !Number.isInteger(manifest.itemCount) || Number(manifest.itemCount) <= 0 ||
      !("groups" in manifest) || !Array.isArray(manifest.groups) ||
      !messages || typeof messages !== "object" || Array.isArray(messages)) {
    throw new Error("Invalid changelog resource");
  }
  const translations = messages as Record<string, unknown>;
  const entries: ChangelogEntry[] = [];
  const identities = new Set<string>();
  const messageKeys = new Set<string>();
  for (const group of manifest.groups) {
    if (!Array.isArray(group) || group.length !== 3) throw new Error("Invalid changelog group");
    const [date, scope, items] = group;
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        (scope !== "frontend" && scope !== "backend") || !Array.isArray(items) || !items.length ||
        (entries.length > 0 && date > entries[entries.length - 1].date)) {
      throw new Error("Invalid changelog identity");
    }
    let entry = entries[entries.length - 1];
    if (!entry || entry.date !== date) {
      entry = { date, items: [] };
      entries.push(entry);
    }
    for (const item of items) {
      if (typeof item !== "string" || !/^\d{3}$/.test(item)) throw new Error("Invalid changelog item");
      const id = `${date}/${scope}/${item}`;
      const text = translations[item];
      if (identities.has(id) || !Object.hasOwn(translations, item) || typeof text !== "string" || !text.trim()) {
        throw new Error(`Missing or duplicate changelog item: ${id}`);
      }
      identities.add(id);
      messageKeys.add(item);
      entry.items.push({ id, scope, text });
    }
  }
  if (identities.size !== manifest.itemCount || Object.keys(translations).length !== messageKeys.size) {
    throw new Error("Changelog resource item count mismatch");
  }
  return entries;
}

export function formatChangelogDate(dateStr: string, locale = "zh-CN"): string {
  return new Intl.DateTimeFormat(locale === "yue-Hant-HK" ? "zh-Hant-HK" : locale, {
    month: "long", day: "numeric", weekday: "short", timeZone: "UTC",
  }).format(new Date(`${dateStr}T00:00:00Z`));
}
