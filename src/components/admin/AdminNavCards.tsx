"use client";

import { Card, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import type { ReactNode } from "react";

export type AdminNavItem = {
  title: string;
  description: string;
  avatar: ReactNode;
  to?: string;
  disabled?: boolean;
};

export type AdminNavGroup = {
  title: string;
  children: AdminNavItem[];
};

function NavCard({ item }: { item: AdminNavItem }) {
  const card = (
    <Card.Root
      variant="outline"
      borderRadius="lg"
      h="full"
      opacity={item.disabled ? 0.45 : 1}
      cursor={item.disabled ? "not-allowed" : "pointer"}
      _hover={item.disabled ? undefined : { shadow: "md" }}
      pointerEvents={item.disabled ? "none" : undefined}
    >
      <Card.Body display="flex" gap="3" alignItems="flex-start">
        <div style={{ fontSize: 40, lineHeight: 1, filter: item.disabled ? "grayscale(1)" : undefined }}>
          {item.avatar}
        </div>
        <Stack gap="1" flex="1">
          <Text fontWeight="semibold" color={item.disabled ? "fg.muted" : "fg"}>
            {item.title}
            {item.disabled ? (
              <Text as="span" fontSize="xs" color="fg.subtle" ml="2">
                开发中
              </Text>
            ) : null}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {item.description}
          </Text>
        </Stack>
      </Card.Body>
    </Card.Root>
  );

  if (item.disabled || !item.to) {
    return card;
  }

  return (
    <NextLink href={item.to} style={{ textDecoration: "none" }}>
      {card}
    </NextLink>
  );
}

export function AdminNavCards({ groups }: { groups: AdminNavGroup[] }) {
  return (
    <Stack gap="6">
      {groups.map((group) => (
        <Card.Root key={group.title} borderRadius="xl">
          <Card.Body>
            <Heading size="md" mb="4">
              {group.title}
            </Heading>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="4">
              {group.children.map((item) => (
                <NavCard key={item.title + (item.to ?? "disabled")} item={item} />
              ))}
            </SimpleGrid>
          </Card.Body>
        </Card.Root>
      ))}
    </Stack>
  );
}
