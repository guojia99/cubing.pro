"use client";

import { Flex, Link, Text } from "@chakra-ui/react";
import { FiMail } from "react-icons/fi";
import { Surface } from "@/components/ui/page";

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
      p={{ base: "4", md: "6" }}
      bg="accent.soft"
      color="fg"
    >
      <Flex fontSize="3xl" mb="4" color="accent" aria-hidden="true"><FiMail /></Flex>
      <Text fontSize="lg" mb="2" fontWeight="medium">
        {t("advertisement.contactTitle")}
      </Text>
      <Link href="mailto:guojia09900@gmail.com" color="accent" fontSize={{ base: "sm", md: "md" }} fontWeight="medium" overflowWrap="anywhere">
        guojia09900@gmail.com
      </Link>
    </Flex>
  );
}

export function ContactAdFullContent() {
  return <Surface p="0" minH="260px" overflow="hidden"><ContactAdThumbnail /></Surface>;
}
