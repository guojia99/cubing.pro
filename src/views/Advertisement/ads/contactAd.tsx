"use client";

import { Flex, Link, Text } from "@chakra-ui/react";

import { useI18n } from "@/contexts/I18nProvider";

export function ContactAdThumbnail() {
  const { t } = useI18n();
  return (
    <Flex
      direction="column"
      align="center"
      justify="center"
      h="full"
      w="full"
      bg="welcome.ad.contactBg"
      color="fg"
    >
      <Text fontSize="5xl" mb="4" aria-hidden>
        ✉️
      </Text>
      <Text fontSize="lg" mb="2" fontWeight="medium">
        {t("advertisement.contactTitle")}
      </Text>
      <Link href="mailto:guojia09900@gmail.com" color="accent" fontSize="md" fontWeight="medium">
        guojia09900@gmail.com
      </Link>
    </Flex>
  );
}

export function ContactAdFullContent() {
  return <ContactAdThumbnail />;
}
