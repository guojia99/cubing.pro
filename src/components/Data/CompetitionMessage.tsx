"use client";

import { useI18n } from "@/contexts/I18nProvider";
import type { competitionAdminZhCN } from "@/i18n/messages/competition-admin";
import { CubesCn } from '@/components/CubeIcon/cube';
import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { formatRoundName, translateDomain, type DomainMessageKey } from '@/i18n/messages/domain';
import type { CSSProperties } from 'react';

export function CompetitionMessage({ name, params }: {
  name: keyof typeof competitionAdminZhCN;
  params?: Record<string, string | number>;
}) {
  const { t, tf } = useI18n();
  return params ? tf(name, params) : t(name);
}

export function DomainMessage({ name }: { name: DomainMessageKey }) {
  const { locale } = useI18n();
  return translateDomain(locale, name);
}

export function CompetitionEvent({ event, iconOnly = false, style = {} }: {
  event: string; iconOnly?: boolean; style?: CSSProperties;
}) {
  const { locale } = useI18n();
  return <>{CubeIcon(event, event, style, locale)}{iconOnly ? null : <> {CubesCn(event, locale)}</>}</>;
}

export function CompetitionRound({ value }: { value: string }) {
  const { locale } = useI18n();
  return formatRoundName(value, locale);
}
