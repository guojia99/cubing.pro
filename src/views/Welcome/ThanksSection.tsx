"use client";

import {
  Avatar,
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
import { useEffect, useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { getAcknowledgments } from "@/services/cubing-pro/public/orgs";
import type { Thank } from "@/services/cubing-pro/public/types";
import { apiGetWCAPersonProfile } from "@/services/cubing-pro/wca/wca_api";

const DEFAULT_AVATAR =
  "https://assets.worldcubeassociation.org/assets/062b138/assets/missing_avatar_thumb-d77f478a307a91a9d4a083ad197012a391d5410f6dd26cb0b0e3118a5de71438.png";

const MAX_VISIBLE = 12;

type ThanksPerson = {
  wcaID: string;
  nickname: string;
  amount: number;
  avatar?: string;
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

  const hasMore = thanksList.length > MAX_VISIBLE;
  const displayList = expanded ? thanksList : thanksList.slice(0, MAX_VISIBLE);

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

  if (loading || thanksList.length === 0) return null;

  return (
    <Card.Root mb="6" borderRadius="xl">
      <Card.Body>
        <Heading size="lg" mb="1">
          {t("home.thanks.title")}
        </Heading>
        <Text fontSize="xs" color="fg.muted" mb="4">
          {t("home.thanks.sponsorNote")}
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap="4">
          {displayList.map((person, index) => (
            <Card.Root
              key={hasValidWcaId(person.wcaID) ? person.wcaID : `anon-${index}`}
              variant="outline"
              borderRadius="lg"
            >
              <Card.Body display="flex" flexDirection="column" alignItems="center" gap="2" py="4">
                <Avatar.Root size="xl">
                  <Avatar.Image src={getAvatarUrl(person, avatarCache)} alt={person.nickname} />
                  <Avatar.Fallback name={person.nickname} />
                </Avatar.Root>
                <VStack gap="0" textAlign="center">
                  {hasValidWcaId(person.wcaID) ? (
                    <Link asChild color="accent" fontWeight="medium" fontSize="sm">
                      <NextLink href={`/wca/player/${person.wcaID}`}>{person.nickname}</NextLink>
                    </Link>
                  ) : (
                    <Text fontSize="sm" fontWeight="medium">
                      {person.nickname}
                    </Text>
                  )}
                  {hasValidWcaId(person.wcaID) && (
                    <Text fontSize="2xs" color="fg.muted">
                      {person.wcaID}
                    </Text>
                  )}
                  <Text fontSize="xs" color="fg.muted">
                    ¥{person.amount}
                  </Text>
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
        {hasMore && (
          <Grid placeItems="center" mt="4">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
              {expanded
                ? t("home.thanks.collapse")
                : tf("home.thanks.expand", { count: thanksList.length - MAX_VISIBLE })}
            </Button>
          </Grid>
        )}
      </Card.Body>
    </Card.Root>
  );
}
