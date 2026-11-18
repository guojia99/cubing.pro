"use client";

import { Box, Button, Flex, Image, Link, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { FiBookOpen, FiGrid, FiActivity, FiAward, FiArrowUpRight } from "react-icons/fi";

import { FeatureLink, PageHeader, SectionHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";

import { AdvertisementCarousel } from "@/views/Welcome/AdvertisementCarousel";
import { BuyCoffeeQuickJump } from "@/views/Welcome/BuyCoffeeQuickJump";
import { WelcomeView as WelcomeInfoCards } from "@/views/Welcome/WelcomeInfoCards";
import { ThanksSection } from "@/views/Welcome/ThanksSection";
import { ExternalLinksHomeSection } from "@/views/ExternalLinks/ExternalLinksHomeSection";
import { HomeFoodSection } from "./HomeFoodSection";
import "./welcome.css";

export function WelcomePageView() {
  const { t, locale } = useI18n();
  const sc = getSiteContent(locale);
  const shortcuts = [
    { href: "/algs", title: t("home.welcome.algs.title"), description: sc("siteContent.algsShortcut"), icon: <FiBookOpen /> },
    { href: "/tools/solver/222", title: t("home.welcome.practiceTools.twoSolver.title"), description: sc("siteContent.twoShortcut"), icon: <FiGrid /> },
    { href: "/tools/floppy-reduction", title: t("home.welcome.practiceTools.fr.title"), description: sc("siteContent.frShortcut"), icon: <FiActivity /> },
  ];
  return (
    <Stack className="welcome-page" gap={{ base: "6", md: "8" }} maxW="var(--page-max)" mx="auto" w="full">
      <Surface className="welcome-hero" p={{ base: "5", md: "7" }}>
        <Flex gap={{ base: "4", md: "8" }} align="center" justify="space-between">
          <Box minW="0" flex="1">
            <PageHeader
              eyebrow="CUBING PRO"
              title={sc("siteContent.heroTitle")}
              description={sc("siteContent.heroIntro")}
            >
              <Flex gap="2" wrap="wrap">
                <Button asChild colorPalette="brand" size="sm"><NextLink href="/algs"><FiBookOpen />{t("nav.algs")}</NextLink></Button>
                <Button asChild variant="outline" size="sm"><NextLink href="/group-competitions/competitions"><FiAward />{t("nav.groupCompetitions")}</NextLink></Button>
              </Flex>
            </PageHeader>
          </Box>
          <Box className="welcome-hero-mark" flexShrink="0" aria-hidden="true">
            <Image src="/CubingProLogo.png" alt="" w="full" h="full" objectFit="contain" />
          </Box>
        </Flex>
      </Surface>
      <Box as="section">
        <SectionHeader title={t("home.welcome.practiceTools.title")} />
        <SimpleGrid className="welcome-shortcuts" columns={{ base: 1, md: 3 }} gap="3" mt="3">
          {shortcuts.map((item) => <FeatureLink key={item.href} {...item} />)}
        </SimpleGrid>
      </Box>
      <ThanksSection />
      <WelcomeInfoCards />
      <Surface as="section" p="4">
        <Flex className="welcome-event-tools" align="center" justify="space-between" gap="3" wrap="wrap">
          <Text as="h2" fontWeight="semibold" fontSize="sm">{sc("siteContent.eventTools")}</Text>
          <Flex gap="4" wrap="wrap">
            <Link asChild fontSize="sm" color="accent"><NextLink href="/tools/team-match">{t("nav.tools.teamMatch")}<FiArrowUpRight /></NextLink></Link>
            <Link asChild fontSize="sm" color="accent"><NextLink href="/group-competitions/events">{sc("siteContent.events")}<FiArrowUpRight /></NextLink></Link>
            <Link asChild fontSize="sm" color="accent"><NextLink href="/group-competitions/pktimer">{t("nav.gc.pktimer")}<FiArrowUpRight /></NextLink></Link>
          </Flex>
        </Flex>
      </Surface>
      <HomeFoodSection />
      <ExternalLinksHomeSection />
      <BuyCoffeeQuickJump />
      <AdvertisementCarousel />
    </Stack>
  );
}
