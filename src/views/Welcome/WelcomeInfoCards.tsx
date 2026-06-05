"use client";

import { Card, Heading, Link, SimpleGrid, Stack, Text, VStack } from "@chakra-ui/react";
import NextLink from "next/link";

import { useI18n } from "@/contexts/I18nProvider";

type InfoCardItem = {
  title: string;
  desc: string;
  href: string;
  internal?: boolean;
  index: number;
};

function InfoCard({ title, desc, href, internal, index }: InfoCardItem) {
  const inner = (
    <Stack gap="2" h="full">
      <Stack direction="row" align="center" gap="2">
        <Text
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          w="10"
          h="10"
          borderRadius="md"
          bg="segment.indicator"
          color="segment.fg.selected"
          fontWeight="bold"
          fontSize="sm"
        >
          {index}
        </Text>
        <Text fontWeight="semibold">{title}</Text>
      </Stack>
      <Text fontSize="sm" color="fg.muted" flex="1">
        {desc}
      </Text>
      <LearnMoreLink />
    </Stack>
  );

  return (
    <Card.Root variant="outline" borderRadius="lg" h="full" _hover={{ shadow: "md" }}>
      <Card.Body>
        {internal ? (
          <Link asChild display="block" h="full" _hover={{ textDecoration: "none" }}>
            <NextLink href={href}>{inner}</NextLink>
          </Link>
        ) : (
          <Link href={href} target="_blank" rel="noreferrer" display="block" h="full">
            {inner}
          </Link>
        )}
      </Card.Body>
    </Card.Root>
  );
}

function LearnMoreLink() {
  const { t } = useI18n();
  return (
    <Text fontSize="sm" color="brand.fg" fontWeight="medium">
      {t("home.learnMore")} &gt;
    </Text>
  );
}

function GroupInfoCards({
  title,
  desc,
  items,
}: {
  title: string;
  desc: string;
  items: Omit<InfoCardItem, "index">[];
}) {
  return (
    <Card.Root borderRadius="xl" mb="8">
      <Card.Body>
        <Heading size="lg" mb="2">
          {title}
        </Heading>
        <Text color="fg.muted" mb="6" maxW="full">
          {desc}
        </Text>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="4">
          {items.map((item, index) => (
            <InfoCard key={item.href} {...item} index={index + 1} />
          ))}
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}

export function WelcomeView() {
  const { t } = useI18n();

  return (
    <VStack align="stretch" gap="0">
      <GroupInfoCards
        title={t("home.welcome.title")}
        desc={t("home.welcome.desc")}
        items={[
          {
            title: t("home.welcome.competitions.title"),
            desc: t("home.welcome.competitions.desc"),
            href: "/group-competitions/competitions",
            internal: true,
          },
          {
            title: t("home.welcome.static.title"),
            desc: t("home.welcome.static.desc"),
            href: "/group-competitions/static",
            internal: true,
          },
          {
            title: t("home.welcome.players.title"),
            desc: t("home.welcome.players.desc"),
            href: "/group-competitions/players",
            internal: true,
          },
        ]}
      />

      <GroupInfoCards
        title={t("home.welcome.wca.title")}
        desc={t("home.welcome.wca.desc")}
        items={[
          {
            title: t("home.welcome.wca.statistics.title"),
            desc: t("home.welcome.wca.statistics.desc"),
            href: "/wca/statistics",
            internal: true,
          },
          {
            title: t("home.welcome.wca.players.title"),
            desc: t("home.welcome.wca.players.desc"),
            href: "/wca/players",
            internal: true,
          },
          {
            title: t("home.welcome.wca.comps.title"),
            desc: t("home.welcome.wca.comps.desc"),
            href: "/wca/wca-comps",
            internal: true,
          },
        ]}
      />

      <GroupInfoCards
        title={t("home.welcome.algs.title")}
        desc={t("home.welcome.algs.desc")}
        items={[
          {
            title: t("home.welcome.algs.list.title"),
            desc: t("home.welcome.algs.list.desc"),
            href: "/algs",
            internal: true,
          },
          {
            title: t("home.welcome.algs.eg.title"),
            desc: t("home.welcome.algs.eg.desc"),
            href: "/algs/222/EG",
            internal: true,
          },
          {
            title: t("home.welcome.algs.pll.title"),
            desc: t("home.welcome.algs.pll.desc"),
            href: "/algs/333/PLL",
            internal: true,
          },
        ]}
      />

      <GroupInfoCards
        title={t("home.welcome.draw.title")}
        desc={t("home.welcome.draw.desc")}
        items={[
          {
            title: t("home.welcome.draw.cube.title"),
            desc: t("home.welcome.draw.cube.desc"),
            href: "https://visualcubeplus.com/",
          },
          {
            title: t("home.welcome.draw.sq.title"),
            desc: t("home.welcome.draw.sq.desc"),
            href: "/draw-tools/sq1-d",
            internal: true,
          },
          {
            title: t("home.welcome.draw.minx.title"),
            desc: t("home.welcome.draw.minx.desc"),
            href: "/draw-tools/minx-d",
            internal: true,
          },
          {
            title: t("home.welcome.draw.sk.title"),
            desc: t("home.welcome.draw.sk.desc"),
            href: "/draw-tools/sk-d",
            internal: true,
          },
          {
            title: t("home.welcome.draw.py.title"),
            desc: t("home.welcome.draw.py.desc"),
            href: "/draw-tools/py-d",
            internal: true,
          },
        ]}
      />

      <GroupInfoCards
        title={t("home.welcome.recipes.title")}
        desc={t("home.welcome.recipes.desc")}
        items={[
          {
            title: t("home.welcome.recipes.list.title"),
            desc: t("home.welcome.recipes.list.desc"),
            href: "/other/recipes",
            internal: true,
          },
          {
            title: t("home.welcome.recipes.kitchen.title"),
            desc: t("home.welcome.recipes.kitchen.desc"),
            href: "/other/kitchen-skills",
            internal: true,
          },
        ]}
      />
    </VStack>
  );
}
