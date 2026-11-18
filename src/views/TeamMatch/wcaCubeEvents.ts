import { tm, type TeamMatchLocale } from './i18n';

const eventIds = ['222', '333', '333bf', '333fm', '333oh', '444', '444bf', '555', '555bf', '666', '777', 'clock', 'minx', 'pyram', 'skewb', 'sq1'] as const;

/** Labels follow the active locale; event IDs remain API values. */
export function teamMatchEventOptions(locale: TeamMatchLocale): { value: string; label: string }[] {
  return eventIds.map(value => ({ value, label: `${tm(locale, `teamMatch.event${value}`)} ${value}` }));
}
