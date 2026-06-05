"use client";

import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { useColorModeValue } from "@/components/ui/color-mode";
import contentData from "@/views/Advertisement/ads/cuberwenjun.json";

const THUMBNAIL_IMG =
  (contentData as { src: string; caption: string }[])[0]?.src ||
  "/advertisement/cuberwenjun/价目表.jpg";

const ORANGE_LIGHT = {
  bgLight: "#fff8f3",
  bgMid: "#ffefe6",
  bgAccent: "#ffdfd0",
  border: "rgba(255, 152, 99, 0.35)",
  text: "#8b5a2b",
  textLight: "#b87333",
};

const ORANGE_DARK = {
  bgLight: "#2a1810",
  bgMid: "#3d2218",
  bgAccent: "#4a2a1a",
  border: "rgba(255, 152, 99, 0.28)",
  text: "#ffd4b8",
  textLight: "#e8a878",
};

function useOrangePalette() {
  return useColorModeValue(ORANGE_LIGHT, ORANGE_DARK);
}

export function CuberwenjunThumbnail() {
  const orange = useOrangePalette();

  return (
    <Box
      asChild
      h="full"
      borderRadius="md"
      overflow="hidden"
      bg={orange.bgLight}
    >
      <NextLink href="/advertisement?key=cuberwenjun">
        <Flex h="full">
          <Box flex="1" minW="0" bg={orange.bgMid} position="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={THUMBNAIL_IMG}
              alt="俊改魔方"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </Box>
          <Flex
            flex="1"
            minW="0"
            direction="column"
            justify="center"
            align="center"
            bg={`linear-gradient(180deg, ${orange.bgLight} 0%, ${orange.bgMid} 100%)`}
            borderLeftWidth="1px"
            borderLeftColor={orange.border}
          >
            <Text fontSize="xl" fontWeight="semibold" color={orange.text} mb="2">
              俊改魔方
            </Text>
            <Text fontSize="sm" color={orange.textLight} mb="4">
              专业魔方改装
            </Text>
            <Box
              fontSize="sm"
              color={orange.text}
              px="4"
              py="2"
              borderRadius="md"
              bg={orange.bgAccent}
              borderWidth="1px"
              borderColor={orange.border}
            >
              微信 / 闲鱼：Cuberwenjun
            </Box>
          </Flex>
        </Flex>
      </NextLink>
    </Box>
  );
}

export function CuberwenjunFullContent() {
  const orange = useOrangePalette();
  const items = contentData as { src: string; caption: string }[];

  return (
    <Box
      borderRadius="xl"
      p="6"
      bg={orange.bgLight}
      borderWidth="1px"
      borderColor={orange.border}
    >
      <Flex direction="column" gap="6" align="center">
        <Heading size="xl" color={orange.text} textAlign="center">
          俊改魔方 - 专业魔方改装服务
        </Heading>
        <Box
          fontSize="md"
          color={orange.textLight}
          textAlign="center"
          px="5"
          py="3"
          borderRadius="md"
          bg={orange.bgAccent}
          borderWidth="1px"
          borderColor={orange.border}
        >
          微信 / 闲鱼：<Text as="strong" color={orange.text}>Cuberwenjun</Text>
        </Box>
        {items.map((item, index) => (
          <Flex key={index} direction="column" align="center" w="full" maxW="600px">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={item.caption}
              style={{ width: "100%", maxWidth: 600, borderRadius: 8, display: "block" }}
            />
            <Text mt="2" fontSize="sm" color={orange.textLight} textAlign="center">
              {item.caption}
            </Text>
          </Flex>
        ))}
      </Flex>
    </Box>
  );
}
