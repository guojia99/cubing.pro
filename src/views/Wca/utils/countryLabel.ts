import type { Locale } from '@/i18n/locales';
import type { Country } from '@/services/cubing-pro/wca/types';
import { resolveWcaCountryRecord } from '@/services/cubing-pro/wca/country';
import { countryIso2ToChinese, getCountryDisplayName } from '../PlayerComponents/region/all_contiry';

const regionAliases: Record<string, string> = {
  'Czech Rep.': 'CZ', 'Dem. Rep. Congo': 'CD', Congo: 'CG', Korea: 'KR', 'Dem. Rep. Korea': 'KP',
  Russia: 'RU', Taiwan: 'TW', 'Hong Kong': 'HK', Macau: 'MO', 'United States': 'US',
};
let englishRegionCodes: Map<string, string> | undefined;

export function getLocalizedCountryLabel(raw: string | null | undefined, countries: Country[] | undefined, locale: Locale): string {
  if (!raw?.trim()) return '';
  const entry = resolveWcaCountryRecord(raw, countries);
  const name = raw.trim();
  let iso2: string | undefined = entry?.iso2 || (/^[A-Za-z]{2}$/.test(name) ? name : regionAliases[name]);
  if (!iso2 && typeof Intl.DisplayNames !== 'undefined') {
    if (!englishRegionCodes) {
      const names = new Intl.DisplayNames(['en'], { type: 'region' });
      englishRegionCodes = new Map(Object.keys(countryIso2ToChinese).map(code => [(names.of(code) || code).toLowerCase(), code]));
    }
    iso2 = englishRegionCodes.get(name.toLowerCase());
  }
  return getCountryDisplayName(iso2, entry?.name || raw, locale);
}
