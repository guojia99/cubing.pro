"use client";

import { Badge, Box, Heading, Stack, Text } from "@chakra-ui/react";

import type { AppRoute } from "@/config/routes";

interface PlaceholderPageProps {
  route: AppRoute;
}

export function PlaceholderPage({ route }: PlaceholderPageProps) {
  return (
    <Box
      borderWidth="1px"
      borderStyle="dashed"
      borderColor="border"
      borderRadius="xl"
      p={{ base: 6, md: 10 }}
      bg="bg.muted"
      textAlign="center"
    >
      <Stack gap="4" align="center">
        <Badge colorPalette="brand" size="lg" variant="subtle">
          预留开发
        </Badge>
        <Heading size="lg">{route.name}</Heading>
        <Text color="fg.muted" maxW="md">
          该页面尚未实现。计划组件：
          <Text as="code" fontSize="sm" ml="1">
            src/pages/{route.pageComponent}
          </Text>
        </Text>
        <Stack direction="row" gap="2" flexWrap="wrap" justify="center">
          <Badge variant="outline">{route.implType}</Badge>
          <Badge variant="outline">{route.renderMode}</Badge>
          <Badge variant="outline">{route.pattern}</Badge>
        </Stack>
      </Stack>
    </Box>
  );
}
