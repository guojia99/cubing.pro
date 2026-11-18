"use client";

import { Box, Image, Link, SimpleGrid, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { SectionHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";

export function HomeFoodSection() {
  const { t, locale } = useI18n();
  const sc = getSiteContent(locale);
  const items = [
    { href: "/other/recipes", title: t("home.welcome.recipes.list.title"), desc: sc("siteContent.recipeShortcut"), src: "/HowToCook/dishes/breakfast/苏格兰蛋/egg3.png", alt: sc("siteContent.scotchEggsAlt") },
    { href: "/other/kitchen-skills", title: t("home.welcome.recipes.kitchen.title"), desc: sc("siteContent.kitchenShortcut"), src: "/HowToCook/dishes/breakfast/苏格兰蛋/egg1.png", alt: sc("siteContent.eggsAlt") },
    { href: "/other/cocktails", title: t("nav.other.cocktails"), desc: sc("siteContent.cocktailShortcut"), src: "/iba/images/negroni.webp", alt: sc("siteContent.negroniAlt") },
  ];
  return (
    <Box as="section" className="welcome-food">
      <SectionHeader title={t("home.welcome.recipes.title")} description={sc("siteContent.foodDescription")} />
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="4">
        {items.map(item => <Surface key={item.href} p="0" overflow="hidden">
          <Link asChild className="welcome-food-link" color="fg" textDecoration="none">
            <NextLink href={item.href}>
              <Image src={item.src} alt={item.alt} loading="lazy" className="welcome-food-image" />
              <Box p="4" minW="0"><Text as="h3" fontSize="md" fontWeight="semibold" display="flex" justifyContent="space-between" gap="2">{item.title}<FiArrowUpRight aria-hidden="true" /></Text><Text mt="2" fontSize="sm" color="fg.muted" className="welcome-food-description">{item.desc}</Text></Box>
            </NextLink>
          </Link>
        </Surface>)}
      </SimpleGrid>
    </Box>
  );
}
