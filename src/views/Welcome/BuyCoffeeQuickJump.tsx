"use client";

import {
  Card,
  Dialog,
  Flex,
  Heading,
  Link,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";

function QrImage({ sources, alt }: { sources: string[]; alt: string }) {
  const [imgSrc, setImgSrc] = useState(sources[0]);
  const nextIdxRef = { current: 1 };

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      width={120}
      height={120}
      style={{ objectFit: "contain", cursor: "pointer", borderRadius: 12 }}
      onError={() => {
        if (nextIdxRef.current < sources.length) {
          const next = sources[nextIdxRef.current++];
          setImgSrc(next);
        }
      }}
    />
  );
}

export function BuyCoffeeQuickJump() {
  const { t } = useI18n();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <Card.Root mb="6" borderRadius="xl">
        <Card.Body>
          <Flex flexWrap="wrap" gap="6" align="center">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              aria-label={t("home.buyCoffee.title")}
            >
              <QrImage sources={["/coffee-icon.svg"]} alt={t("home.buyCoffee.title")} />
            </button>
            <VStack align="start" flex="1" minW="200px" gap="2">
              <Heading size="lg">☕ {t("home.buyCoffee.title")}</Heading>
              <Text fontSize="sm" color="fg.muted">
                {t("home.buyCoffee.cardDesc")}
              </Text>
              <Link asChild color="accent" fontWeight="medium">
                <NextLink href="/buy-coffee">{t("home.learnMore")} &gt;</NextLink>
              </Link>
            </VStack>
          </Flex>
        </Card.Body>
      </Card.Root>

      <Dialog.Root open={previewOpen} onOpenChange={(e) => setPreviewOpen(e.open)} size="md">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>{t("home.buyCoffee.title")}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body textAlign="center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/coffee-icon.svg" alt="" width={200} height={200} />
                <Text mt="3" fontSize="sm" color="fg.muted">
                  {t("home.buyCoffee.remarkTip")}
                </Text>
              </Dialog.Body>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
