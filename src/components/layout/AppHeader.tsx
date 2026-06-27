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
import { NAV_FONT_SIZE, navMenuContentProps, navMenuItemProps } from "@/components/layout/navStyles";
import { LanguageSelect } from "@/components/i18n/LanguageSelect";
import { ColorModeButton } from "@/components/ui/color-mode";
import { useI18n } from "@/contexts/I18nProvider";
import { buildMainNav, isNavGroupActive, isNavLinkActive, type NavGroupDef, type NavLinkDef } from "@/lib/navigation";

/** 顶栏选中态：与 segment 一致，避免 solid + 缺失 brand.contrast 导致深底深蓝字 */
function navItemButtonProps(active: boolean) {
  if (!active) {
    return { variant: "ghost" as const, colorPalette: "brand" as const };
  }
  return {
    variant: "solid" as const,
    colorPalette: "brand" as const,
    bg: "segment.indicator",
    color: "segment.fg.selected",
    _hover: { bg: "segment.indicator", color: "segment.fg.selected" },
    _expanded: { bg: "segment.indicator", color: "segment.fg.selected" },
    _open: { bg: "segment.indicator", color: "segment.fg.selected" },
  };
}

function NavDropdownItems({ items }: { items: NavLinkDef[] }) {
  const { t } = useI18n();

  return items.map((item, index) => {
    if (item.children?.length) {
      const showDivider = index > 0;

      return (
        <Box key={item.labelKey} pt={showDivider ? "2" : undefined}>
          {showDivider ? <Menu.Separator mb="2" /> : null}
          <Box
            mx="1"
            mb="1"
            borderColor="border"
            borderRadius="md"
            overflow="hidden"
            bg="bg.muted"
          >
            <Menu.ItemGroup>
              <Menu.ItemGroupLabel
                px="3"
                py="2"
                fontSize={NAV_FONT_SIZE}
                fontWeight="bold"
                color="fg.muted"
                letterSpacing="0.06em"
                textTransform="uppercase"
                borderBottomWidth="1px"
                borderColor="border"
                bg="bg.subtle"
              >
                {t(item.labelKey)}
              </Menu.ItemGroupLabel>
              {item.children.map((child) =>
                child.href ? (
                  <Menu.Item
                    key={child.href}
                    value={child.href}
                    asChild
                    bg="transparent"
                    _hover={{ bg: "bg.subtle" }}
                    {...navMenuItemProps}
                  >
                    <NextLink href={child.href}>{t(child.labelKey)}</NextLink>
                  </Menu.Item>
                ) : null,
              )}
            </Menu.ItemGroup>
          </Box>
        </Box>
      );
    }

    if (!item.href) return null;

    return (
      <Menu.Item key={item.href} value={item.href} asChild {...navMenuItemProps}>
        <NextLink href={item.href}>{t(item.labelKey)}</NextLink>
      </Menu.Item>
    );
  });
}

function MobileNavLinks({
  items,
  pathname,
  onClose,
  nested = false,
}: {
  items: NavLinkDef[];
  pathname: string;
  onClose: () => void;
  nested?: boolean;
}) {
  const { t } = useI18n();

  return items.map((item, index) => {
    if (item.children?.length) {
      const showDivider = !nested && index > 0;

      return (
        <Box
          key={item.labelKey}
          mt={showDivider ? "3" : nested ? "2" : undefined}
          pt={showDivider ? "3" : undefined}
          borderTopWidth={showDivider ? "1px" : undefined}
          borderColor="border"
          pl={nested ? "2" : undefined}
        >
          <Box
            borderWidth={nested ? undefined : "1px"}
            borderColor="border"
            borderRadius="md"
            bg="bg.muted"
            px="2"
            py="2"
          >
            <Text
              fontSize={NAV_FONT_SIZE}
              fontWeight="bold"
              color="fg.muted"
              mb="2"
              px="1"
              letterSpacing="0.06em"
              textTransform="uppercase"
              borderBottomWidth="1px"
              borderColor="border"
              pb="2"
            >
              {t(item.labelKey)}
            </Text>
            <MobileNavLinks
              items={item.children}
              pathname={pathname}
              onClose={onClose}
              nested
            />
          </Box>
        </Box>
      );
    }

    if (!item.href) return null;

    const active = isNavLinkActive(pathname, item);

    return (
      <Button
        key={item.href}
        asChild
        w="full"
        justifyContent="flex-start"
        size="sm"
        fontSize={NAV_FONT_SIZE}
        mb="1"
        {...navItemButtonProps(active)}
        pl={nested ? "2" : undefined}
        onClick={onClose}
      >
        <NextLink href={item.href}>{t(item.labelKey)}</NextLink>
      </Button>
    );
  });
}

function NavMenuGroup({ group }: { group: NavGroupDef }) {
  const pathname = usePathname() ?? "";
  const { t } = useI18n();

  if (!group.children?.length) {
    if (!group.href) return null;
    const active = isNavGroupActive(pathname, group);
    return (
      <Button
        asChild
        size="sm"
        fontSize={NAV_FONT_SIZE}
        flexShrink={0}
        whiteSpace="nowrap"
        px="2.5"
        {...navItemButtonProps(active)}
      >
        <NextLink href={group.href}>{t(group.labelKey)}</NextLink>
      </Button>
    );
  }

  const childActive = isNavGroupActive(pathname, group);

  return (
    <Menu.Root positioning={{ placement: "bottom-start" }}>
      <Menu.Trigger asChild>
        <Button
          size="sm"
          fontSize={NAV_FONT_SIZE}
          flexShrink={0}
          whiteSpace="nowrap"
          px="2.5"
          {...navItemButtonProps(childActive)}
        >
          {t(group.labelKey)}
          <Box as="span" ml="1" fontSize="10px" aria-hidden>
            ▾
          </Box>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content {...navMenuContentProps("44")}>
            <NavDropdownItems items={group.children} />
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
          <Text fontWeight="bold" fontSize={NAV_FONT_SIZE}>
            {t("nav.menu")}
          </Text>
          <IconButton
            aria-label={t("nav.close")}
            variant="ghost"
            size="xs"
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
                  size="sm"
                  fontSize={NAV_FONT_SIZE}
                  mb="2"
                  {...navItemButtonProps(isNavGroupActive(pathname, group))}
                  onClick={onClose}
                >
                  <NextLink href={group.href}>{t(group.labelKey)}</NextLink>
                </Button>
              ) : (
                <Text
                  fontSize={NAV_FONT_SIZE}
                  fontWeight="semibold"
                  color="fg.muted"
                  mb="2"
                  textTransform="uppercase"
                >
                  {t(group.labelKey)}
                </Text>
              )}
              {group.children ? (
                <MobileNavLinks
                  items={group.children}
                  pathname={pathname}
                  onClose={onClose}
                />
              ) : null}
            </Box>
          ))}
        </Box>
      </Box>
    </Portal>
  );
}

export function AppHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();

  const nav = useMemo(() => buildMainNav(), []);

  return (
    <>
      <Box
        as="header"
        data-app-header
        position="sticky"
        top="0"
        fontSize={NAV_FONT_SIZE}
        zIndex="sticky"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg/90"
        backdropFilter="blur(12px)"
      >
        <Container maxW="container.xl" py="3">
          <Flex align="center" justify="space-between" gap="2" minW="0">
            <BrandLogo />

            <Box
              as="nav"
              aria-label={t("nav.menu")}
              display={{ base: "none", lg: "block" }}
              flex="1"
              minW="0"
              px="2"
              overflowX="auto"
              css={{
                WebkitOverflowScrolling: "touch",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              <HStack
                gap="0.5"
                flexWrap="nowrap"
                justify="center"
                w="max-content"
                mx="auto"
              >
                {nav.map((group) => (
                  <NavMenuGroup key={group.id} group={group} />
                ))}
              </HStack>
            </Box>

            <HStack gap="2" flexShrink={0}>
              <LanguageSelect />
              <ColorModeButton />
              <HeaderUserActions />
              <IconButton
                aria-label={t("nav.open")}
                variant="outline"
                size="xs"
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
