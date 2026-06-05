"use client";

import { Flex, Link, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import type { ReactNode } from "react";

import { foodTextProps } from "./foodTokens";

interface FoodMetaRowProps {
  children: ReactNode;
}

export function FoodMetaRow({ children }: FoodMetaRowProps) {
  return (
    <Flex className="food-meta-row" {...foodTextProps} color="fg.muted" gap="4" mb="4" flexWrap="wrap" align="center">
      {children}
    </Flex>
  );
}

export function FoodMetaLink({
  href,
  external,
  children,
  ml,
}: {
  href: string;
  external?: boolean;
  children: ReactNode;
  ml?: string;
}) {
  if (external) {
    return (
      <Link href={href} target="_blank" rel="noreferrer" color="accent" fontSize="14px" ml={ml}>
        {children}
      </Link>
    );
  }
  return (
    <Link asChild color="accent" fontSize="14px">
      <NextLink href={href}>{children}</NextLink>
    </Link>
  );
}

export function FoodMetaText({ children }: { children: ReactNode }) {
  return (
    <Text as="span" fontSize="14px" color="fg.muted">
      {children}
    </Text>
  );
}
