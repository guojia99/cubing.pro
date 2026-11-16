"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Grid,
  Heading,
  Link,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { getAcknowledgments } from "@/services/cubing-pro/public/orgs";
import type { Thank } from "@/services/cubing-pro/public/types";
import { apiGetWCAPersonProfile } from "@/services/cubing-pro/wca/wca_api";

const DEFAULT_AVATAR =
  "https://assets.worldcubeassociation.org/assets/062b138/assets/missing_avatar_thumb-d77f478a307a91a9d4a083ad197012a391d5410f6dd26cb0b0e3118a5de71438.png";

const VISIBLE_ROWS = 3;
const MAX_COLUMNS = 5;
const MIN_CARD_WIDTH = 170;
const GRID_GAP = 16;

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

function getAvatarUrl(person: ThanksPerson, avatarCache: Record<string, string>): string {
  if (person.avatar) return person.avatar;
  if (avatarCache[person.wcaID]) return avatarCache[person.wcaID];
  return DEFAULT_AVATAR;
}

export function ThanksSection({ data }: { data?: Thank[] }) {
  const { t, tf } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [avatarCache, setAvatarCache] = useState<Record<string, string>>({});
  const [thanksList, setThanksList] = useState<ThanksPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState(4);
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
  }, []);

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
    <Card.Root mb="6" borderRadius="xl">
      <Card.Body p="5">
        <Heading size="lg" mb="2">
          {t("home.thanks.title")}
        </Heading>
        <Text fontSize="sm" color="fg.muted" mb="6">
          {t("home.thanks.sponsorNote")}
          {" · "}
          {tf("home.thanks.count", { count: sortedList.length })}
        </Text>
        <Box ref={gridRef}>
          <SimpleGrid columns={columns} gap="4">
          {displayList.map((person, index) => (
            <Card.Root
              key={hasValidWcaId(person.wcaID) ? person.wcaID : `anon-${person.nickname}-${index}`}
              variant="outline"
              borderRadius="lg"
              _hover={{ shadow: "md" }}
            >
              <Card.Body display="flex" flexDirection="column" alignItems="center" gap="2" py="5">
                <Avatar.Root size="lg">
                  <Avatar.Image src={getAvatarUrl(person, avatarCache)} alt={person.nickname} />
                  <Avatar.Fallback name={person.nickname} />
                </Avatar.Root>
                <VStack gap="0" textAlign="center" maxW="100%">
                  {hasValidWcaId(person.wcaID) ? (
                    <Link asChild color="accent" fontWeight="medium" fontSize="sm" truncate>
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
              </Card.Body>
            </Card.Root>
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
      </Card.Body>
    </Card.Root>
  );
}
