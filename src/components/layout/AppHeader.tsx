"use client";

import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Menu,
  Portal,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { BrandLogo } from "@/components/layout/BrandLogo";
import { HeaderUserActions } from "@/components/layout/HeaderUserActions";
import { LanguageSelect } from "@/components/i18n/LanguageSelect";
import { ColorModeButton } from "@/components/ui/color-mode";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { buildMainNav, type NavGroupDef } from "@/lib/navigation";

function NavMenuGroup({ group }: { group: NavGroupDef }) {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();

  if (!group.children?.length) {
    if (!group.href) return null;
    const active =
      pathname === group.href || pathname.startsWith(`${group.href}/`);
    return (
      <Button
        asChild
        size="sm"
        variant={active ? "solid" : "ghost"}
        colorPalette="brand"
      >
        <NextLink href={group.href}>{t(group.labelKey)}</NextLink>
      </Button>
    );
  }

  const childActive = group.children.some(
    (item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
  );

  return (
    <Menu.Root positioning={{ placement: "bottom-start" }}>
      <Menu.Trigger asChild>
        <Button
          size="sm"
          variant={childActive ? "solid" : "ghost"}
          colorPalette="brand"
        >
          {t(group.labelKey)}
          <Box as="span" ml="1" fontSize="xs" aria-hidden>
            ▾
          </Box>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="44">
            {group.children.map((item) => (
              <Menu.Item key={item.href} value={item.href} asChild>
                <NextLink href={item.href}>{t(item.labelKey)}</NextLink>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

function MobileNav({
  open,
  onClose,
  nav,
}: {
  open: boolean;
  onClose: () => void;
  nav: NavGroupDef[];
}) {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <Portal>
      <Box
        position="fixed"
        inset="0"
        zIndex="overlay"
        bg="blackAlpha.600"
        onClick={onClose}
        aria-hidden
      />
      <Box
        as="nav"
        aria-label={t("nav.menu")}
        position="fixed"
        top="0"
        right="0"
        h="100dvh"
        w="min(88vw, 320px)"
        zIndex="modal"
        bg="bg.elevated"
        borderLeftWidth="1px"
        borderColor="border"
        boxShadow="2xl"
        display="flex"
        flexDirection="column"
      >
        <Flex
          flexShrink={0}
          justify="space-between"
          align="center"
          px="4"
          py="4"
          borderBottomWidth="1px"
          borderColor="border"
        >
          <Text fontWeight="bold" fontSize="lg">
            {t("nav.menu")}
          </Text>
          <IconButton
            aria-label={t("nav.close")}
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            ✕
          </IconButton>
        </Flex>
        <Box flex="1" overflowY="auto" px="4" py="4">
          {nav.map((group) => (
            <Box key={group.id} mb="5">
              {group.href ? (
                <Button
                  asChild
                  w="full"
                  justifyContent="flex-start"
                  variant={
                    pathname === group.href ||
                    pathname.startsWith(`${group.href}/`)
                      ? "solid"
                      : "ghost"
                  }
                  colorPalette="brand"
                  mb="2"
                  onClick={onClose}
                >
                  <NextLink href={group.href}>{t(group.labelKey)}</NextLink>
                </Button>
              ) : (
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  color="fg.muted"
                  mb="2"
                  textTransform="uppercase"
                >
                  {t(group.labelKey)}
                </Text>
              )}
              {group.children?.map((item) => {
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <Button
                    key={item.href}
                    asChild
                    w="full"
                    justifyContent="flex-start"
                    size="sm"
                    variant={active ? "subtle" : "ghost"}
                    colorPalette="brand"
                    mb="1"
                    onClick={onClose}
                  >
                    <NextLink href={item.href}>{t(item.labelKey)}</NextLink>
                  </Button>
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Portal>
  );
}

export function AppHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser } = useAuth();
  const { t } = useI18n();

  const nav = useMemo(
    () => buildMainNav(currentUser),
    [currentUser],
  );

  return (
    <>
      <Box
        as="header"
        position="sticky"
        top="0"
        zIndex="sticky"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg/90"
        backdropFilter="blur(12px)"
      >
        <Container maxW="container.xl" py="3">
          <Flex align="center" justify="space-between" gap="4">
            <BrandLogo />

            <HStack
              gap="1"
              display={{ base: "none", lg: "flex" }}
              flexWrap="wrap"
              justify="center"
              flex="1"
              px="4"
            >
              {nav.map((group) => (
                <NavMenuGroup key={group.id} group={group} />
              ))}
            </HStack>

            <HStack gap="2" flexShrink={0}>
              <LanguageSelect />
              <ColorModeButton />
              <HeaderUserActions />
              <IconButton
                aria-label={t("nav.open")}
                variant="outline"
                size="sm"
                display={{ base: "inline-flex", lg: "none" }}
                onClick={() => setMobileOpen(true)}
              >
                ☰
              </IconButton>
            </HStack>
          </Flex>
        </Container>
      </Box>
      <MobileNav
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        nav={nav}
      />
    </>
  );
}
