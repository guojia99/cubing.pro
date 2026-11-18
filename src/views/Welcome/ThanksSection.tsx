"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Grid,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { SectionHeader, Surface } from "@/components/ui/page";
import { getAcknowledgments } from "@/services/cubing-pro/public/orgs";
import type { Thank } from "@/services/cubing-pro/public/types";
import { apiGetWCAPersonProfile } from "@/services/cubing-pro/wca/wca_api";
import "./thanks.css";

const VISIBLE_ROWS = 3;
const MAX_COLUMNS = 5;
const MIN_CARD_WIDTH = 150;
const GRID_GAP = 12;

function columnsForWidth(width: number): number {
  return Math.min(MAX_COLUMNS, Math.max(1, Math.floor((width + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP))));
}

type ThanksPerson = {
  wcaID: string;
  nickname: string;
  amount: number;
  avatar?: string;
  pinned?: boolean;
};

function hasValidWcaId(wcaID: string): boolean {
  return !!wcaID && wcaID !== "-" && wcaID.length === 10;
}

function thankToThanksPerson(t: Thank): ThanksPerson {
  return {
    wcaID: t.wcaID ?? "",
    nickname: t.nickname ?? "",
    amount: t.amount ?? 0,
    avatar: t.avatar || undefined,
    pinned: !!t.pinned,
  };
}

function getAvatarUrl(person: ThanksPerson, avatarCache: Record<string, string>): string | undefined {
  if (person.avatar) return person.avatar;
  if (avatarCache[person.wcaID]) return avatarCache[person.wcaID];
  return undefined;
}

export function ThanksSection({ data }: { data?: Thank[] }) {
  const { t, tf, locale } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [avatarCache, setAvatarCache] = useState<Record<string, string>>({});
  const [thanksList, setThanksList] = useState<ThanksPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      if (width > 0) setColumns(columnsForWidth(width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, thanksList.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const list = data ?? (await getAcknowledgments());
        setThanksList(list.map(thankToThanksPerson));
      } catch {
        setThanksList([]);
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [data]);

  useEffect(() => {
    const toFetch = thanksList.filter((p) => !p.avatar && p.wcaID?.length === 10);
    for (const person of toFetch) {
      void apiGetWCAPersonProfile(person.wcaID)
        .then((res) => {
          const url = res.person?.avatar?.thumb_url;
          if (url) {
            setAvatarCache((prev) => ({ ...prev, [person.wcaID]: url }));
          }
        })
        .catch(() => {});
    }
  }, [thanksList]);

  const sortedList = useMemo(() => {
    const pinned = thanksList.filter((p) => p.pinned);
    const normal = thanksList.filter((p) => !p.pinned);
    return [...pinned, ...normal];
  }, [thanksList]);

  const maxVisible = columns * VISIBLE_ROWS;
  const hasMore = sortedList.length > maxVisible;
  const displayList = expanded ? sortedList : sortedList.slice(0, maxVisible);

  if (loading || sortedList.length === 0) return null;

  return (
    <Surface as="section" p={{ base: "4", md: "5" }}>
        <SectionHeader eyebrow={getSiteContent(locale)("siteContent.withThanks")} title={t("home.thanks.title")} description={t("home.thanks.sponsorNote")} actions={<Text fontSize="xs" color="fg.muted">{tf("home.thanks.count", { count: sortedList.length })}</Text>} />
        <Box ref={gridRef} mt="4">
          <SimpleGrid templateColumns={`repeat(${columns}, minmax(0, 1fr))`} gap="3">
          {displayList.map((person, index) => (
            <Box
              key={hasValidWcaId(person.wcaID) ? person.wcaID : `anon-${person.nickname}-${index}`}
              className="thanks-person"
              borderWidth="1px"
              borderColor="border"
              borderRadius="xl"
              minW="0"
            >
              <Box display="flex" alignItems="center" gap="2.5" p="3">
                <Avatar.Root size="sm" className="thanks-person-avatar">
                  {getAvatarUrl(person, avatarCache) ? <Avatar.Image src={getAvatarUrl(person, avatarCache)} alt={person.nickname} /> : null}
                  <Avatar.Fallback name={person.nickname} />
                </Avatar.Root>
                <VStack gap="0" align="start" minW="0" flex="1">
                  {hasValidWcaId(person.wcaID) ? (
                    <Link asChild color="accent" fontWeight="medium" fontSize="sm" truncate maxW="100%">
                      <NextLink href={`/wca/player/${person.wcaID}`}>{person.nickname}</NextLink>
                    </Link>
                  ) : (
                    <Text fontSize="sm" fontWeight="medium" truncate maxW="100%">
                      {person.nickname}
                    </Text>
                  )}
                  {person.pinned && (
                    <Badge colorPalette="brand" variant="subtle" borderRadius="full" mt="1">
                      {t("home.thanks.pinned")}
                    </Badge>
                  )}
                  {hasValidWcaId(person.wcaID) && (
                    <Link
                      asChild
                      fontSize="2xs"
                       fontFamily="mono"
                       maxW="100%"
                       overflowWrap="anywhere"
                      color="fg.muted"
                      _hover={{ color: "accent" }}
                    >
                      <NextLink href={`/wca/player/${person.wcaID}`}>{person.wcaID}</NextLink>
                    </Link>
                  )}
                  {person.amount > 0 && (
                    <Text fontSize="2xs" color="fg.muted">
                      ¥{person.amount}
                    </Text>
                  )}
                </VStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
        </Box>
        {hasMore && (
          <Grid placeItems="center" mt="4">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded
                ? t("home.thanks.collapse")
                : tf("home.thanks.expand", { count: sortedList.length - maxVisible })}
            </Button>
          </Grid>
        )}
    </Surface>
  );
}
