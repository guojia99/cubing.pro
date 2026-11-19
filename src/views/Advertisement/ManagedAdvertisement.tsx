"use client";

import { Box, Button, CloseButton, Dialog, Flex, Heading, Portal, SimpleGrid, Stack, Text, chakra } from "@chakra-ui/react";
import NextLink from "next/link";
import { useState, type ComponentProps } from "react";
import { LuArrowUpRight, LuExpand } from "react-icons/lu";
import { SectionHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { getAdvertisementMessages } from "@/i18n/messages/advertisements";
import { resolveAdvertisementImage, type Advertisement, type AdvertisementImage } from "@/services/cubing-pro/advertisements";

function AdLink({ href, ...props }: ComponentProps<"a"> & { href: string }) {
  return href.startsWith("/") ? <NextLink href={href} {...props} /> : <a href={href} target="_blank" rel="noopener noreferrer" {...props} />;
}

function AdPicture({ url, caption, height = "100%" }: { url: string; caption: string; height?: string }) {
  const { locale } = useI18n();
  const m = getAdvertisementMessages(locale);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return url && failedUrl !== url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={resolveAdvertisementImage(url)} alt={caption} loading="lazy" onError={() => setFailedUrl(url)} style={{ width: "100%", height, objectFit: "contain", display: "block" }} />
  ) : <Flex h={height} minH="24" align="center" justify="center" p="4"><Text color="fg.muted" fontSize="sm">{m("advertisements.imageUnavailable")}</Text></Flex>;
}

export function ManagedAdThumbnail({ ad, preview = false }: { ad: Advertisement; preview?: boolean }) {
  const content = <Flex h="full" minH="0" direction={{ base: "column", sm: "row" }}>
    <Box flex="1" minW="0" minH="0" bg="bg.muted"><AdPicture url={ad.imageUrl} caption={ad.title} /></Box>
    <Flex flex={{ base: "0 0 auto", sm: "1" }} minW="0" direction="column" justify="center" align="center" bg="accent.soft" p={{ base: "3", sm: "4" }} borderColor="border" borderLeftWidth={{ base: "0", sm: "1px" }} borderTopWidth={{ base: "1px", sm: "0" }} gap="2">
      <Text fontSize={{ base: "lg", md: "xl" }} fontWeight="semibold" color="fg" lineClamp={2} overflowWrap="anywhere">{ad.title}</Text>
      {ad.description ? <Text fontSize="sm" color="fg.muted" whiteSpace="pre-wrap" lineClamp={3} overflowWrap="anywhere">{ad.description}</Text> : null}
      {ad.contact ? <Text fontSize="sm" color="accent" px="3" py="1" borderRadius="md" bg="bg" borderWidth="1px" borderColor="border" textAlign="center" overflowWrap="anywhere" lineClamp={2}>{ad.contact}</Text> : null}
    </Flex>
  </Flex>;
  return preview ? <Box h="clamp(240px, 32vw, 340px)" borderRadius="md" overflow="hidden">{content}</Box> : <Box asChild h="full" borderRadius="md" overflow="hidden"><AdLink href={ad.targetUrl || `/advertisement?key=${encodeURIComponent(ad.key)}`}>{content}</AdLink></Box>;
}

export function ManagedAdFullContent({ ad }: { ad: Advertisement }) {
  const { locale } = useI18n();
  const m = getAdvertisementMessages(locale);
  const [preview, setPreview] = useState<AdvertisementImage | null>(null);
  const picture = (image: AdvertisementImage, height: string) => <chakra.button type="button" onClick={() => setPreview(image)} aria-label={image.caption || ad.title} aria-haspopup="dialog" display="block" w="full" h={height} p="3" bg="bg.muted" cursor="zoom-in" overflow="hidden" borderRadius="lg" position="relative" _hover={{ bg: "accent.soft" }} _focusVisible={{ outline: "2px solid", outlineColor: "accent", outlineOffset: "3px" }}>
    <AdPicture url={image.imageUrl} caption={image.caption || ad.title} />
    <Box position="absolute" bottom="3" right="3" bg="bg.elevated" p="2" borderRadius="md" boxShadow="sm" aria-hidden="true"><LuExpand size={16} /></Box>
  </chakra.button>;
  return <>
    <Stack gap={{ base: "6", md: "8" }}>
      <Surface><SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: "5", md: "8" }}>
        {picture({ imageUrl: ad.imageUrl, caption: ad.title }, "380px")}
        <Stack gap="4" align="center" justify="center" bg="accent.soft" borderRadius="lg" p={{ base: "4", md: "6" }} minW="0">
          <Heading as="h2" fontSize="xl" overflowWrap="anywhere">{ad.title}</Heading>
          {ad.description ? <Text whiteSpace="pre-wrap" overflowWrap="anywhere" color="fg.muted">{ad.description}</Text> : null}
          {ad.contact ? <Text whiteSpace="pre-wrap" overflowWrap="anywhere" color="accent">{ad.contact}</Text> : null}
          {ad.targetUrl ? <Button asChild variant="outline" size="sm"><AdLink href={ad.targetUrl}>{m("advertisements.visit")}<LuArrowUpRight aria-hidden="true" /></AdLink></Button> : null}
        </Stack>
      </SimpleGrid></Surface>
      {ad.products.length ? <Box as="section"><SectionHeader title={m("advertisements.products")} /><SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap="4" autoRows="1fr">
        {ad.products.map((image, index) => <Surface key={index} p="3" display="flex" flexDirection="column" gap="4">
          {picture(image, "280px")}
          <Text flex="1" whiteSpace="pre-wrap" overflowWrap="anywhere">{image.caption}</Text>
          {image.href ? <Button asChild size="sm" variant="outline" color="accent"><AdLink href={image.href}>{m("advertisements.visit")}<LuArrowUpRight aria-hidden="true" /></AdLink></Button> : null}
        </Surface>)}
      </SimpleGrid></Box> : null}
      {ad.showcase.length ? <Surface as="section"><SectionHeader title={m("advertisements.showcase")} /><SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="5">
        {ad.showcase.map((image, index) => <Stack key={index} gap="3" minW="0">{picture(image, "240px")}<Text fontSize="sm" whiteSpace="pre-wrap" overflowWrap="anywhere" color="fg.muted">{image.caption}</Text></Stack>)}
      </SimpleGrid></Surface> : null}
    </Stack>
    <Dialog.Root open={preview !== null} onOpenChange={event => !event.open && setPreview(null)} size="xl" scrollBehavior="inside" lazyMount unmountOnExit>
      <Portal><Dialog.Backdrop /><Dialog.Positioner p={{ base: "2", md: "6" }} alignItems="center"><Dialog.Content my="0" maxH="calc(100dvh - 48px)">
        <Dialog.Header pr="14"><Dialog.Title>{preview?.caption || ad.title}</Dialog.Title></Dialog.Header>
        <Dialog.CloseTrigger asChild><CloseButton aria-label={m("advertisements.close")} position="absolute" top="3" right="3" /></Dialog.CloseTrigger>
        <Dialog.Body>{preview ? <AdPicture url={preview.imageUrl} caption={preview.caption || ad.title} height="auto" /> : null}</Dialog.Body>
      </Dialog.Content></Dialog.Positioner></Portal>
    </Dialog.Root>
  </>;
}
