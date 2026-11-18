"use client";

import { Box, Image, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { FiArrowUpRight } from "react-icons/fi";

import { SectionHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { HomeIllustration } from "./HomeIllustration";

type Entry = { title: string; desc: string; href: string; external?: boolean };

function DirectoryGroup({ title, desc, items, image, footer }: {
  title: string; desc: string; items: Entry[]; image: ReactNode; footer?: ReactNode;
}) {
  return (
    <Surface as="section" className="welcome-directory-group" p={{ base: "4", md: "5" }}>
      <div className="welcome-group-heading">
        <SectionHeader title={title} description={desc} />
        <div className="welcome-group-image">{image}</div>
      </div>
      <div className="welcome-feature-grid">
        {items.map((item) => (
          <Link asChild key={item.href} className="welcome-directory-link" target={item.external ? "_blank" : undefined} rel={item.external ? "noopener noreferrer" : undefined}>
            <NextLink href={item.href}>
              <Box minW="0"><Text className="welcome-entry-title" fontWeight="semibold" fontSize="sm">{item.title}</Text><Text className="welcome-entry-description" fontSize="xs" color="fg.muted" mt="1" lineHeight="1.7">{item.desc}</Text></Box>
              <FiArrowUpRight aria-hidden="true" />
            </NextLink>
          </Link>
        ))}
      </div>
      <div className="welcome-group-footer">{footer}</div>
    </Surface>
  );
}

export function WelcomeView() {
  const { t, locale } = useI18n();
  const sc = getSiteContent(locale);
  return (
    <div className="welcome-directory">
      <DirectoryGroup title={t("nav.groupCompetitions")} desc={sc("siteContent.competitionDirectory")} image={<HomeIllustration variant="competition" />} items={[
        { title: sc("siteContent.competitions"), desc: sc("siteContent.competitionsDesc"), href: "/group-competitions/competitions" },
        { title: sc("siteContent.rankings"), desc: sc("siteContent.rankingsDesc"), href: "/group-competitions/static" },
        { title: sc("siteContent.records"), desc: sc("siteContent.recordsDesc"), href: "/group-competitions/records" },
        { title: sc("siteContent.players"), desc: sc("siteContent.playersDesc"), href: "/group-competitions/players" },
      ]} />
      <DirectoryGroup title={t("home.welcome.wca.title")} desc={sc("siteContent.wcaDirectory")} image={<Image src="/images/wca.svg" alt="WCA" w="full" h="full" objectFit="contain" />} items={[
        { title: sc("siteContent.competitions"), desc: sc("siteContent.wcaCompetitionsDesc"), href: "/wca/wca-comps" },
        { title: sc("siteContent.players"), desc: sc("siteContent.wcaPlayersDesc"), href: "/wca/players" },
        { title: sc("siteContent.statistics"), desc: sc("siteContent.statisticsDesc"), href: "/wca/statistics" },
        { title: sc("siteContent.proportion"), desc: sc("siteContent.proportionDesc"), href: "/wca/proportion-estimation" },
      ]} />
      <DirectoryGroup title={t("home.welcome.algs.title")} desc={sc("siteContent.algsDirectory")} image={<HomeIllustration variant="cube" />} footer={<Link asChild fontSize="xs" color="accent"><NextLink href="/algs">{sc("siteContent.allAlgs")}<FiArrowUpRight /></NextLink></Link>} items={[
        { title: "CLL", desc: sc("siteContent.cllDesc"), href: "/algs/222/CLL" },
        { title: "EG-1", desc: sc("siteContent.egDesc"), href: "/algs/222/EG1" },
        { title: "OLL", desc: sc("siteContent.ollDesc"), href: "/algs/333/OLL" },
        { title: "PLL", desc: sc("siteContent.pllDesc"), href: "/algs/333/PLL" },
      ]} />
      <DirectoryGroup title={t("home.welcome.draw.title")} desc={sc("siteContent.drawDirectory")} image={<HomeIllustration variant="draw" />} footer={<>
        <Link asChild fontSize="xs" color="accent"><NextLink href="/draw-tools/py-d">Pyraminx<FiArrowUpRight /></NextLink></Link>
        <Link asChild fontSize="xs" color="accent"><NextLink href="/draw-tools/fto-d">FTO<FiArrowUpRight /></NextLink></Link>
      </>} items={[
        { title: sc("siteContent.standardCubes"), desc: sc("siteContent.standardCubesDesc"), href: "https://visualcubeplus.com/", external: true },
        { title: "SQ-1", desc: sc("siteContent.sqDesc"), href: "/draw-tools/sq1-d" },
        { title: "Megaminx", desc: sc("siteContent.minxDesc"), href: "/draw-tools/minx-d" },
        { title: "Skewb", desc: sc("siteContent.skewbDesc"), href: "/draw-tools/sk-d" },
      ]} />
    </div>
  );
}
