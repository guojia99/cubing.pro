import type { WcaCompetitionIndexItem } from '@/services/cubing-pro/wca/competition_index';

export type RegistrationStatus = 'notStarted' | 'open' | 'closed' | 'unknown';

export function extractVenue(venue: string): { text: string; url?: string } {
  const match = venue.match(/\[(.*?)\]\((.*?)\)/);
  if (match) {
    return { text: match[1], url: match[2] };
  }
  return { text: venue };
}

export function getRegistrationStatus(
  open: string | null | undefined,
  close: string | null | undefined,
): RegistrationStatus {
  if (!open || !close) return 'unknown';
  const now = Date.now();
  const openMs = new Date(open).getTime();
  const closeMs = new Date(close).getTime();
  if (now < openMs) return 'notStarted';
  if (now > closeMs) return 'closed';
  if (now >= openMs && now <= closeMs) return 'open';
  return 'unknown';
}

export function formatCompDateRange(start: string, end: string): string {
  if (start === end) return start;
  return `${start} ~ ${end}`;
}

export function compDurationDays(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
}

export function formatToBeijingTime(utcString: string): string {
  return new Date(utcString).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function wcaCompetitionUrl(id: string): string {
  return `https://www.worldcubeassociation.org/competitions/${id}`;
}

/** 客户端二次过滤：赛事须包含全部所选项目 */
export function filterCompsByEvents(
  comps: WcaCompetitionIndexItem[],
  selectedEvents: string[],
): WcaCompetitionIndexItem[] {
  if (!selectedEvents.length) return comps;
  const required = new Set(selectedEvents);
  return comps.filter((c) => {
    const ids = c.event_ids ?? [];
    for (const e of required) {
      if (!ids.includes(e)) return false;
    }
    return true;
  });
}

export function sortCompsByStartDate(
  comps: WcaCompetitionIndexItem[],
): WcaCompetitionIndexItem[] {
  return [...comps].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
  );
}
