import { readStoredLocale, type Locale } from '@/i18n/locales';
import { domainZhCN, translateDomain, type DomainMessageKey } from '@/i18n/messages/domain';

/** Historical name retained for existing consumers. Unknown API event IDs pass through. */
export const CubesCn = (c: string, locale: Locale = readStoredLocale()): string => {
  const original = String(c);
  const aliases: Record<string, string> = {
    'sq-1': 'sq1', o333bf: '333bf', '333mbf-unlimited': '333mbf_unlimited',
    '2-7relay': '2_7relay', 'alien-relay': 'alien_relay',
  };
  const id = aliases[original.toLowerCase()] ?? original.toLowerCase();
  const key = `domain.event.${id}` as DomainMessageKey;
  if (Object.prototype.hasOwnProperty.call(domainZhCN, key)) return translateDomain(locale, key);

  const oldBlind = /^([345])(?:bf|mbf)\d*$/.exec(id);
  if (oldBlind) return CubesCn(id.includes('mbf') ? '333mbf' : oldBlind[1].repeat(3) + 'bf', locale);
  const cube = /^(\d)\1\1$/.exec(id) ?? /^(\d+)level$/.exec(id);
  if (cube) return translateDomain(locale, 'domain.event.cube', { size: cube[1] });
  if (/^\d{3}$/.test(id)) return translateDomain(locale, 'domain.event.cuboid', { size: id.split('').join('×') });
  const sliding = /^(8|15|24|35|48|63|80)puzzle$/.exec(id);
  if (sliding) return translateDomain(locale, 'domain.event.sliding', { count: sliding[1] });
  const multiple = /^(.*?)(?:_)?multiple(\d+)$/.exec(id);
  if (multiple) {
    const event = CubesCn(multiple[1], locale);
    if (event !== multiple[1]) return translateDomain(locale, 'domain.event.multiple', { event, count: multiple[2] });
  }
  // Compound custom events use the same translated base names and modifiers.
  const modifier = /^(.*?)(?:_)?(bf|oh|fm)$/.exec(id);
  if (modifier) {
    const base = modifier[1];
    const event = CubesCn(base, locale);
    if (event !== base) return translateDomain(locale, modifier[2] === 'bf' ? 'domain.event.blind' : modifier[2] === 'oh' ? 'domain.event.oneHanded' : 'domain.event.fewestMoves', { event });
  }
  const relay = /^(2345|345)(oh)?_?relay$/.exec(id);
  if (relay) {
    let event = relay[1].split('').map(size => `${size}×${size}×${size}`).join(' + ');
    if (relay[2]) event = translateDomain(locale, 'domain.event.oneHanded', { event });
    return translateDomain(locale, 'domain.event.relay', { event });
  }
  const ohRelay = /^(2_7|alien|27alien)_?oh_relay$/.exec(id);
  if (ohRelay) return translateDomain(locale, 'domain.event.oneHanded', { event: CubesCn(`${ohRelay[1]}${ohRelay[1] === '2_7' ? '' : '_'}relay`, locale) });
  return original;
};
