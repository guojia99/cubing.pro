/** 旧版「附近国家」列表（亚太及周边） */
export const NEARBY_COUNTRY_ISO2 = [
  'CN',
  'HK',
  'TW',
  'KR',
  'MY',
  'SG',
  'VN',
  'TH',
  'JP',
  'ID',
  'PH',
  'NP',
  'AU',
] as const;

export type NearbyCountryIso2 = (typeof NEARBY_COUNTRY_ISO2)[number];

export const DEFAULT_COUNTRY_ISO2 = 'CN';
