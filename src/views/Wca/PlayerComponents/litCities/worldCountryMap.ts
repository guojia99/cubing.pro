/** WCA profile countryId → ECharts world.json feature.properties.name */

const WCA_TO_WORLD: Record<string, string> = {
  'Czech Republic': 'Czech Rep.',
  "Côte d'Ivoire": "Côte d'Ivoire",
  'Democratic Republic of the Congo': 'Dem. Rep. Congo',
  'Republic of the Congo': 'Congo',
  'United States': 'United States',
  'United Kingdom': 'United Kingdom',
  'South Korea': 'Korea',
  Korea: 'Korea',
  'North Korea': 'Dem. Rep. Korea',
  Russia: 'Russia',
  Vietnam: 'Vietnam',
  'Hong Kong': 'Hong Kong',
  Macau: 'Macau',
  Taiwan: 'Taiwan',
};

export function wcaCountryIdToWorldMapName(countryId: string): string {
  return WCA_TO_WORLD[countryId] || countryId;
}
