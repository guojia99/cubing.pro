"use client";

import { Box, Flex, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent, type SiteContentKey } from "@/i18n/messages/site-content";

import { SectionHeader, Surface } from "@/components/ui/page";
import contentData from "@/views/Advertisement/ads/cuberwenjun.json";

const THUMBNAIL_IMG =
  (contentData as { src: string; caption: string }[])[0]?.src ||
  "/advertisement/cuberwenjun/价目表.jpg";

export function CuberwenjunThumbnail() {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  return (
    <Box
      asChild
      h="full"
      borderRadius="md"
      overflow="hidden"
      bg="bg.subtle"
    >
      <NextLink href="/advertisement?key=cuberwenjun">
        <Flex h="full" direction={{ base: "column", sm: "row" }}>
          <Box flex="1" minW="0" minH="0" bg="bg.muted" position="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={THUMBNAIL_IMG}
              alt={sc("siteContent.cuberwenjun")}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </Box>
          <Flex
            flex={{ base: "0 0 auto", sm: "1" }}
            minW="0"
            direction="column"
            justify="center"
            align="center"
            bg="accent.soft"
            p={{ base: "3", sm: "4" }}
            borderColor="border"
            borderLeftWidth={{ base: "0", sm: "1px" }}
            borderTopWidth={{ base: "1px", sm: "0" }}
          >
            <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="semibold" color="fg" mb="1">
              {sc("siteContent.cuberwenjun")}
            </Text>
            <Text fontSize="sm" color="fg.muted" mb="2">
              {sc("siteContent.modification")}
            </Text>
            <Box
              fontSize="sm"
              color="accent"
              px="3"
              py="1"
              borderRadius="md"
              bg="bg"
              borderWidth="1px"
              borderColor="border"
              textAlign="center"
              overflowWrap="anywhere"
            >
              {sc("siteContent.adContact")}
            </Box>
          </Flex>
        </Flex>
      </NextLink>
    </Box>
  );
}

export function CuberwenjunFullContent() {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const captions: SiteContentKey[] = ["siteContent.adPrice", "siteContent.adTuning", "siteContent.adStock", "siteContent.adThree", "siteContent.adFour", "siteContent.adShowcase"];
  const items = contentData as { src: string; caption: string }[];

  return (
    <Surface p={{ base: "4", md: "6" }}>
      <Flex direction="column" gap="6" align="center">
        <SectionHeader title={sc("siteContent.modificationService")} />
        <Box
          fontSize="md"
          color="fg.muted"
          textAlign="center"
          px="5"
          py="3"
          borderRadius="md"
          bg="accent.soft"
          borderWidth="1px"
          borderColor="border"
        >
          {sc("siteContent.adContact")}
        </Box>
        {items.map((item, index) => (
          <Flex key={index} direction="column" align="center" w="full" maxW="600px">
            <Link href={item.src} target="_blank" rel="noopener noreferrer" aria-label={sc(captions[index])} display="block" w="full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={sc(captions[index])}
              loading="lazy"
              style={{ width: "100%", maxWidth: 600, borderRadius: "var(--radius-card)", display: "block" }}
            />
            </Link>
            <Text mt="2" fontSize="sm" color="fg.muted" textAlign="center">
              {sc(captions[index])}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Surface>
  );
}
