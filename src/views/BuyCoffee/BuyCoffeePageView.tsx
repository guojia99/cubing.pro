"use client";

import {
  Box,
  Button,
  Dialog,
  Flex,
  Heading,
  Link,
  Portal,
  Separator,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { FiX } from "react-icons/fi";
import { PageHeader, SectionHeader, Surface } from "@/components/ui/page";

import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { ThanksSection } from "@/views/Welcome/ThanksSection";

function QrImage({ sources, alt }: { sources: string[]; alt: string }) {
  const [imgSrc, setImgSrc] = useState(sources[0]);
  const nextIdxRef = useRef(1);
  const { t } = useI18n();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={`${alt}: ${t("home.buyCoffee.enlarge")}`}
        onClick={() => setPreviewOpen(true)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={alt}
          width={200}
          height={200}
          style={{ objectFit: "contain", maxWidth: "100%", width: 200, height: 200, margin: "auto", background: "#fff", borderRadius: 8 }}
          onError={() => {
            if (nextIdxRef.current < sources.length) {
              setImgSrc(sources[nextIdxRef.current++]);
            }
          }}
        />
      </button>
      <Dialog.Root open={previewOpen} onOpenChange={(e) => setPreviewOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>{alt}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body textAlign="center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt={alt} width={280} height={280} style={{ objectFit: "contain", maxWidth: "100%", width: 280, height: 280, margin: "auto", background: "#fff", borderRadius: 8 }} />
                <Text mt="3" fontSize="sm" color="fg.muted">
                  {t("home.buyCoffee.remarkTip")}
                </Text>
              </Dialog.Body>
              <Dialog.CloseTrigger asChild><Button variant="ghost" size="sm" position="absolute" top="2" right="2" aria-label={t("algs.modal.close")}><FiX /></Button></Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}

export function BuyCoffeePageView() {
  const { t, locale } = useI18n();

  return (
    <VStack align="stretch" gap="6" maxW="var(--page-max)" mx="auto" w="full">
      <PageHeader eyebrow={getSiteContent(locale)("siteContent.support")} title={t("home.buyCoffee.title")} description={t("home.buyCoffee.subTitle")} />

      <Surface p={{ base: "4", md: "6" }}>
          <SectionHeader title={t("home.buyCoffee.desc")} description={t("home.buyCoffee.remarkTip")} />

          <SimpleGrid columns={{ base: 1, md: 2 }} gap="4" mt="5" maxW="760px" mx="auto">
            <Box bg="bg.subtle" borderWidth="1px" borderColor="border" borderRadius="var(--radius-card)" textAlign="center" p={{ base: "4", md: "5" }} minW="0">
                <Flex
                  p="3"
                  mb="4"
                  borderRadius="xl"
                  bg="welcome.coffee.wechatQr"
                  justify="center"
                  align="center"
                >
                  <QrImage
                    sources={["/qrcode/wechat.jpg", "/qrcode/wechat.png", "/qrcode/wechat.svg"]}
                    alt={t("home.buyCoffee.wechat")}
                  />
                </Flex>
                <Heading as="h3" size="md" mb="2">
                  {t("home.buyCoffee.wechat")}
                </Heading>
                <Text fontSize="sm" color="fg.muted">
                  {t("home.buyCoffee.wechat.desc")}
                </Text>
            </Box>

            <Box bg="bg.subtle" borderWidth="1px" borderColor="border" borderRadius="var(--radius-card)" textAlign="center" p={{ base: "4", md: "5" }} minW="0">
                <Flex
                  p="3"
                  mb="4"
                  borderRadius="xl"
                  bg="welcome.coffee.alipayQr"
                  justify="center"
                  align="center"
                >
                  <QrImage
                    sources={["/qrcode/alipay.jpg", "/qrcode/alipay.png", "/qrcode/alipay.svg"]}
                    alt={t("home.buyCoffee.alipay")}
                  />
                </Flex>
                <Heading as="h3" size="md" mb="2">
                  {t("home.buyCoffee.alipay")}
                </Heading>
                <Text fontSize="sm" color="fg.muted">
                  {t("home.buyCoffee.alipay.desc")}
                </Text>
            </Box>
          </SimpleGrid>

          <Separator my="6" />
          <Text textAlign="center" fontSize="sm" color="fg.muted">
            {t("home.buyCoffee.contact")}{" "}
            <Link href="mailto:guojia09900@gmail.com" color="accent" overflowWrap="anywhere">
              guojia09900@gmail.com
            </Link>
          </Text>
          <Text textAlign="center" fontSize="xs" color="fg.muted" mt="2">
            {t("home.buyCoffee.feedback")}
          </Text>
      </Surface>

      <ThanksSection />
    </VStack>
  );
}
