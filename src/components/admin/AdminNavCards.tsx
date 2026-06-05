"use client";

import { Card, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import type { ReactNode } from "react";

export type AdminNavGroup = {
  title: string;
  children: {
    title: string;
    description: string;
    to: string;
    avatar: ReactNode;
  }[];
};

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
                <NextLink key={item.to + item.title} href={item.to} style={{ textDecoration: "none" }}>
                  <Card.Root variant="outline" borderRadius="lg" h="full" _hover={{ shadow: "md" }}>
                    <Card.Body display="flex" gap="3" alignItems="flex-start">
                      <div style={{ fontSize: 40, lineHeight: 1 }}>{item.avatar}</div>
                      <Stack gap="1" flex="1">
                        <Text fontWeight="semibold" color="fg">
                          {item.title}
                        </Text>
                        <Text fontSize="sm" color="fg.muted">
                          {item.description}
                        </Text>
                      </Stack>
                    </Card.Body>
                  </Card.Root>
                </NextLink>
              ))}
            </SimpleGrid>
          </Card.Body>
        </Card.Root>
      ))}
    </Stack>
  );
}
