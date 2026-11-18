import { useCallback } from 'react';
import { useI18n } from '@/contexts/I18nProvider';
import type { Locale } from '@/i18n/locales';
import { formatMessage } from '@/i18n/formatMessage';
import { formatRoundName } from '@/i18n/messages/domain';
import {
  competitionPublicZhCN, competitionPublicEnUS, competitionPublicJa,
  competitionPublicYue, competitionPublicKo, competitionPublicFr, competitionPublicEs,
} from '@/i18n/messages/competition-public';

type PublicKey = keyof typeof competitionPublicZhCN;
const catalogs: Record<Locale, Record<PublicKey, string>> = {
  'zh-CN': competitionPublicZhCN, 'en-US': competitionPublicEnUS,
  ja: competitionPublicJa, 'yue-Hant-HK': competitionPublicYue,
  ko: competitionPublicKo, fr: competitionPublicFr, es: competitionPublicEs,
};

export function competitionPublicMessage(locale: Locale, key: PublicKey, params?: Record<string, string | number>): string {
  return formatMessage(locale, key, catalogs[locale][key], params);
}

const roundKeys: Record<string, PublicKey> = {
  初赛: 'competitionPublic.firstRound', 初賽: 'competitionPublic.firstRound',
  复赛: 'competitionPublic.secondRound', 複賽: 'competitionPublic.secondRound', 復賽: 'competitionPublic.secondRound',
  半决赛: 'competitionPublic.semifinal', 半決賽: 'competitionPublic.semifinal', 準決賽: 'competitionPublic.semifinal',
  四分之一决赛: 'competitionPublic.quarterfinal', '1/4决赛': 'competitionPublic.quarterfinal',
  决赛: 'competitionPublic.final', 決賽: 'competitionPublic.final',
  联合决赛: 'competitionPublic.combinedFinal', 聯合決賽: 'competitionPublic.combinedFinal',
  资格赛: 'competitionPublic.qualification', 資格賽: 'competitionPublic.qualification',
};

export function useCompetitionPublicI18n() {
  const intl = useI18n();
  const { locale, tf } = intl;
  const p = useCallback((key: PublicKey, params?: Record<string, string | number>) => competitionPublicMessage(locale, key, params), [locale]);
  const round = useCallback((name: string, number?: number) => {
    const key = roundKeys[name.trim()];
    if (key) return p(key);
    const intermediate = name.trim().match(/^(?:复赛|複賽|復賽)第\s*(\d+)\s*[轮輪]$/);
    if (intermediate) return p('competitionPublic.intermediateRound', { count: Number(intermediate[1]) });
    const numeric = name.trim().match(/^(?:第\s*)?([0-9一二三四五六七八九十]+)\s*(?:轮|輪|回合)$/);
    if (numeric) {
      const value = Number(numeric[1]) || ({ 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 } as Record<string, number>)[numeric[1]] || number;
      if (value) return tf('competitionAdmin.roundNumber', { count: value });
    }
    // Organizer-defined round titles are content, not translation keys.
    return name ? formatRoundName(name, locale) : (number ? tf('competitionAdmin.roundNumber', { count: number }) : '');
  }, [p, tf, locale]);
  return { ...intl, p, round };
}
