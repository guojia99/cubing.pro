"use client";

import { Box, Flex, Heading, Stack, Text, type BoxProps } from "@chakra-ui/react";
import NextLink from "next/link";
import type { ReactNode } from "react";
import { LuArrowUpRight } from "react-icons/lu";

type HeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({ title, description, eyebrow, actions, children }: HeaderProps) {
  return (
    <Box as="header" className="page-heading" mb={{ base: "6", md: "8" }}>
      <Flex gap="5" align={{ base: "stretch", md: "end" }} justify="space-between" direction={{ base: "column", md: "row" }}>
        <Stack gap="2.5" minW="0">
          {eyebrow ? <Text className="page-eyebrow" fontSize="xs" fontWeight="semibold" letterSpacing=".12em" color="accent">{eyebrow}</Text> : null}
          <Heading as="h1" fontSize={{ base: "1.75rem", md: "2.25rem" }} lineHeight="1.2" letterSpacing="-.035em" overflowWrap="anywhere">{title}</Heading>
          {description ? <Box className="page-description">{description}</Box> : null}
        </Stack>
        {actions ? <Flex gap="2" flexWrap="wrap" flexShrink="0" align="center">{actions}</Flex> : null}
      </Flex>
      {children ? <Box mt="5">{children}</Box> : null}
    </Box>
  );
}

export function Surface({ children, ...props }: BoxProps) {
  return <Box bg="bg.elevated" borderWidth="1px" borderColor="border" borderRadius="var(--radius-card)" boxShadow="var(--shadow-card)" p={{ base: "4", md: "6" }} minW="0" {...props}>{children}</Box>;
}

export function SectionHeader({ title, description, eyebrow, actions, children }: HeaderProps) {
  return (
    <Flex mb="5" gap="4" justify="space-between" align="center" flexWrap="wrap">
      <Stack gap="1.5" minW="0">
        {eyebrow ? <Text fontSize="xs" letterSpacing=".12em" color="accent" fontWeight="semibold">{eyebrow}</Text> : null}
        <Heading as="h2" fontSize={{ base: "lg", md: "xl" }} letterSpacing="-.025em">{title}</Heading>
        {description ? <Box className="section-description">{description}</Box> : null}
        {children}
      </Stack>
      {actions ? <Flex gap="2" align="center" flexWrap="wrap">{actions}</Flex> : null}
    </Flex>
  );
}

export function FeatureLink({ href, title, description, icon, eyebrow }: {
  href: string; title: ReactNode; description?: ReactNode; icon?: ReactNode; eyebrow?: ReactNode;
}) {
  return (
    <Box asChild className="feature-link" display="flex" flexDirection="column" gap="4" bg="bg.elevated" borderWidth="1px" borderColor="border" borderRadius="var(--radius-card)" p={{ base: "5", md: "6" }} minW="0" h="full" boxShadow="var(--shadow-card)" textDecoration="none" color="fg" transition="transform 180ms, border-color 180ms, box-shadow 180ms" _hover={{ transform: "translateY(-3px)", borderColor: "accent", boxShadow: "var(--shadow-float)", textDecoration: "none" }} _focusVisible={{ outline: "2px solid var(--accent)", outlineOffset: "4px" }} _motionReduce={{ transition: "none", _hover: { transform: "none" } }}>
      <NextLink href={href}>
        <Flex justify="space-between" align="center" gap="3">
          {icon ? <Box display="inline-flex" p="2.5" bg="accent.soft" color="accent" borderRadius="xl" fontSize="xl">{icon}</Box> : <Text fontSize="xs" color="accent" letterSpacing=".1em" fontWeight="semibold">{eyebrow}</Text>}
          <LuArrowUpRight aria-hidden="true" size={17} />
        </Flex>
        <Stack gap="2">
          <Heading as="h3" fontSize="lg" lineHeight="1.4">{title}</Heading>
          {description ? <Box fontSize="sm" color="fg.muted" lineHeight="1.8">{description}</Box> : null}
        </Stack>
      </NextLink>
    </Box>
  );
}
