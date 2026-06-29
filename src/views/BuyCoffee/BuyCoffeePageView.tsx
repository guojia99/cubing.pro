"use client";

import {
  Card,
  Dialog,
  Flex,
  Heading,
  Link,
  Portal,
  Separator,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

import { useI18n } from "@/contexts/I18nProvider";
import { ThanksSection } from "@/views/Welcome/ThanksSection";

function QrImage({ sources, alt }: { sources: string[]; alt: string }) {
  const [imgSrc, setImgSrc] = useState(sources[0]);
  const nextIdxRef = { current: 1 };
  const { t } = useI18n();
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={alt}
          width={200}
          height={200}
          style={{ objectFit: "contain" }}
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
                <img src={imgSrc} alt={alt} width={280} height={280} style={{ objectFit: "contain" }} />
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

export function BuyCoffeePageView() {
  const { t } = useI18n();

  return (
    <VStack align="stretch" gap="8">
      <Stack gap="1">
        <Heading size="xl">☕ {t("home.buyCoffee.title")}</Heading>
        <Text color="fg.muted">🙏 {t("home.buyCoffee.subTitle")}</Text>
      </Stack>

      <Card.Root borderRadius="xl" bg="welcome.coffee.pageBg">
        <Card.Body>
          <Text textAlign="center" fontSize="md" color="fg.muted" mb="4">
            ✨ {t("home.buyCoffee.desc")} 💝
          </Text>
          <Text textAlign="center" fontSize="sm" fontWeight="medium" color="fg" mb="8">
            📝 {t("home.buyCoffee.remarkTip")}
          </Text>

          <Flex wrap="wrap" gap="6" justify="center">
            <Card.Root w="280px" borderRadius="xl" textAlign="center" variant="outline">
              <Card.Body py="6">
                <Flex
                  p="5"
                  mb="4"
                  borderRadius="xl"
                  bg="welcome.coffee.wechatQr"
                  justify="center"
                  align="center"
                >
                  <QrImage
                    sources={["/qrcode/wechat.png", "/qrcode/wechat.jpg", "/qrcode/wechat.svg"]}
                    alt={t("home.buyCoffee.wechat")}
                  />
                </Flex>
                <Heading size="md" mb="2">
                  💬 {t("home.buyCoffee.wechat")}
                </Heading>
                <Text fontSize="sm" color="fg.muted">
                  {t("home.buyCoffee.wechat.desc")}
                </Text>
              </Card.Body>
            </Card.Root>

            <Card.Root w="280px" borderRadius="xl" textAlign="center" variant="outline">
              <Card.Body py="6">
                <Flex
                  p="5"
                  mb="4"
                  borderRadius="xl"
                  bg="welcome.coffee.alipayQr"
                  justify="center"
                  align="center"
                >
                  <QrImage
                    sources={["/qrcode/alipay.png", "/qrcode/alipay.jpg", "/qrcode/alipay.svg"]}
                    alt={t("home.buyCoffee.alipay")}
                  />
                </Flex>
                <Heading size="md" mb="2">
                  💙 {t("home.buyCoffee.alipay")}
                </Heading>
                <Text fontSize="sm" color="fg.muted">
                  {t("home.buyCoffee.alipay.desc")}
                </Text>
              </Card.Body>
            </Card.Root>
          </Flex>

          <Separator my="6" />
          <Text textAlign="center" fontSize="sm" color="fg.muted">
            📧 {t("home.buyCoffee.contact")}{" "}
            <Link href="mailto:guojia09900@gmail.com" color="accent">
              guojia09900@gmail.com
            </Link>
          </Text>
          <Text textAlign="center" fontSize="xs" color="fg.muted" mt="2">
            {t("home.buyCoffee.feedback")}
          </Text>
        </Card.Body>
      </Card.Root>

      <ThanksSection />
    </VStack>
  );
}
