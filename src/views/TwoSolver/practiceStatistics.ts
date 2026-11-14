import { adjustedTime, formatTime, type PracticeRecord } from "./uiPractice";
import { tDetail, type DetailLocale } from "../../i18n/messages/two-solver-detail";

/** Milliseconds; null means an incomplete window, Infinity means DNF. */
export type PracticeStatistic = number | null;

export function meanOf(times: readonly number[]): PracticeStatistic {
  if (!times.length) return null;
  if (times.some((time) => !Number.isFinite(time))) return Infinity;
  return times.reduce((sum, time) => sum + time, 0) / times.length;
}

export function averageOf(times: readonly number[], windowSize: number): PracticeStatistic {
  if (times.length < windowSize) return null;
  const sorted = times.slice(-windowSize).sort((a, b) => a - b);
  const trim = Math.ceil(windowSize * 0.05);
  return meanOf(sorted.slice(trim, windowSize - trim));
}

export function formatStatistic(value: PracticeStatistic, precision: number): string {
  return value === null ? "—" : formatTime(value, precision);
}

/** Input is saved history, newest first. Compute before truncating the plot. */
export function buildPracticeStats(records: readonly PracticeRecord[], windowSize = 50) {
  const chronological = [...records].reverse();
  const times = chronological.map(adjustedTime);
  const points = chronological.map((record, index) => {
    const window = times.slice(0, index + 1);
    return {
      record,
      number: index + 1,
      single: Number.isFinite(times[index]) ? times[index] : null,
      ao5: averageOf(window, 5),
      ao12: averageOf(window, 12),
    };
  });
  const limit = Number.isFinite(windowSize) ? Math.max(1, Math.min(200, Math.floor(windowSize))) : 50;
  const finite = times.filter(Number.isFinite);
  return {
    total: records.length,
    dnfCount: times.length - finite.length,
    latest: times.at(-1) ?? null,
    best: times.length ? Math.min(...times) : null,
    mean: meanOf(times),
    mo3: times.length < 3 ? null : meanOf(times.slice(-3)),
    ao5: points.at(-1)?.ao5 ?? null,
    ao12: points.at(-1)?.ao12 ?? null,
    points: points.slice(-limit),
  };
}

/** Plain text only: the chart must use ECharts' richText tooltip renderer. */
export function formatPracticeTooltip(point: ReturnType<typeof buildPracticeStats>["points"][number], precision: number, locale: DetailLocale = "zh-CN"): string {
  const { record } = point;
  // Avoid user text becoming rich-text tokens or additional tooltip lines.
  const text = (value: string) => value.replace(/\{/g, "（").replace(/\}/g, "）").replace(/[\r\n\t]/g, " ");
  return [
    `${tDetail(locale, "two.detail.attempt", { number: point.number })} · ${formatTime(adjustedTime(record), precision)}${record.penalty === "+2" ? " (+2)" : ""}`,
    tDetail(locale, "two.detail.rawTime", { time: formatTime(record.elapsedMs, precision) }),
    tDetail(locale, "two.detail.averages", { ao5: formatStatistic(point.ao5, precision), ao12: formatStatistic(point.ao12, precision) }),
    tDetail(locale, "two.detail.date", { date: text(formatPracticeDate(record.date, locale)) }),
    tDetail(locale, "two.detail.scramble", { scramble: text(record.scramble) }),
    tDetail(locale, "two.detail.reviewHint"),
  ].join("\n");
}

export function formatPracticeDate(value: string, locale: DetailLocale = "zh-CN"): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "medium" }).format(date);
}
