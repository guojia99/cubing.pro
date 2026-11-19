"use client";

import { Box, Button, CloseButton, Dialog, Flex, Heading, Portal, SimpleGrid, Stack, Text, chakra } from "@chakra-ui/react";
import NextLink from "next/link";
import { useState } from "react";
import { LuArrowUpRight, LuExpand } from "react-icons/lu";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent, type SiteContentKey } from "@/i18n/messages/site-content";

import { SectionHeader, Surface } from "@/components/ui/page";
import contentData from "@/views/Advertisement/ads/cuberwenjun.json";

const items = contentData as {
  src: string;
  captionKey: SiteContentKey;
  href?: string;
}[];
const THUMBNAIL_IMG = items[0].src;
const products = items.filter((item) => item.href);
const showcase = items.slice(6);

function AdImage({ item, caption, onPreview, height }: {
  item: (typeof items)[number];
  caption: string;
  onPreview: (item: (typeof items)[number]) => void;
  height: string | { base: string; md: string };
}) {
  return (
    <chakra.button
      type="button"
      onClick={() => onPreview(item)}
      aria-label={caption}
      aria-haspopup="dialog"
      display="block"
      position="relative"
      w="full"
      h={height}
      p="3"
      bg="bg.muted"
      cursor="zoom-in"
      overflow="hidden"
      borderRadius="lg"
      _hover={{ bg: "accent.soft" }}
      _focusVisible={{ outline: "2px solid", outlineColor: "accent", outlineOffset: "3px" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.src} alt={caption} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
      <Box position="absolute" bottom="3" right="3" bg="bg.elevated" color="fg" p="2" borderRadius="md" boxShadow="sm" aria-hidden="true">
        <LuExpand size={16} />
      </Box>
    </chakra.button>
  );
}

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
  const [preview, setPreview] = useState<(typeof items)[number] | null>(null);
  return (
    <>
      <Stack gap={{ base: "6", md: "8" }}>
        <Surface>
          <SectionHeader title={sc("siteContent.modificationService")} description={sc("siteContent.adPreviewHint")} />
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: "5", md: "8" }} alignItems="stretch">
            <Stack gap="3" minW="0">
              <AdImage item={items[0]} caption={sc(items[0].captionKey)} onPreview={setPreview} height={{ base: "340px", md: "420px" }} />
              <Text fontSize="sm" color="fg.muted">{sc(items[0].captionKey)}</Text>
            </Stack>
            <Stack gap="4" align="center" justify="center" bg="accent.soft" borderRadius="lg" p={{ base: "4", md: "6" }} minW="0">
              <Heading as="h3" fontSize="lg">{sc("siteContent.cuberwenjun")}</Heading>
              <Text fontSize="sm" color="fg.muted" textAlign="center">{sc("siteContent.adContact")}</Text>
              <Box w="full" maxW="260px">
                <AdImage item={items[1]} caption={sc(items[1].captionKey)} onPreview={setPreview} height="280px" />
              </Box>
              <Text fontSize="sm" color="fg.muted" textAlign="center">{sc(items[1].captionKey)}</Text>
            </Stack>
          </SimpleGrid>
        </Surface>

        <Box as="section">
          <SectionHeader title={sc("siteContent.adProducts")} />
          <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap="4" autoRows="1fr">
            {products.map((item) => (
              <Surface key={item.src} as="article" className="cuberwenjun-product" p="3" display="flex" flexDirection="column" gap="4" h="full">
                <AdImage item={item} caption={sc(item.captionKey)} onPreview={setPreview} height={{ base: "260px", md: "280px" }} />
                <Stack gap="4" px="1" pb="1" flex="1">
                  <Heading as="h3" fontSize="sm" lineHeight="1.7" flex="1">{sc(item.captionKey)}</Heading>
                  <Button asChild size="sm" variant="outline" w="full" borderColor="accent" color="accent" _hover={{ bg: "accent.soft" }}>
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      {sc("siteContent.adTaobao")}<LuArrowUpRight aria-hidden="true" />
                    </a>
                  </Button>
                </Stack>
              </Surface>
            ))}
          </SimpleGrid>
        </Box>

        <Surface as="section">
          <SectionHeader title={sc("siteContent.adShowcase")} />
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="5">
            {showcase.map((item) => (
              <Stack key={item.src} gap="3" minW="0">
                <AdImage item={item} caption={sc(item.captionKey)} onPreview={setPreview} height="240px" />
                <Text fontSize="sm" color="fg.muted">{sc(item.captionKey)}</Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Surface>
      </Stack>

      <Dialog.Root open={preview !== null} onOpenChange={(event) => !event.open && setPreview(null)} size="xl" scrollBehavior="inside" lazyMount unmountOnExit>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner p={{ base: "2", md: "6" }} alignItems="center">
            <Dialog.Content my="0" maxH="calc(100dvh - 48px)" borderRadius="var(--radius-card)">
              <Dialog.Header pr="14">
                <Dialog.Title fontSize="md" lineHeight="1.6">{preview ? sc(preview.captionKey) : ""}</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" aria-label={sc("siteContent.close")} position="absolute" top="3" right="3" />
              </Dialog.CloseTrigger>
              <Dialog.Body p={{ base: "2", md: "4" }}>
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview.src} alt={sc(preview.captionKey)} style={{ width: "100%", height: "auto", display: "block", borderRadius: 8 }} />
                ) : null}
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
