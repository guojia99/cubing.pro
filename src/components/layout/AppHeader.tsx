"use client";

import {
  Box,
  Button,
  Drawer,
  Flex,
  Grid,
  HStack,
  IconButton,
  Menu,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LuCheck, LuChevronDown, LuMenu, LuX } from "react-icons/lu";

import { LanguageSelect } from "@/components/i18n/LanguageSelect";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { HeaderUserActions } from "@/components/layout/HeaderUserActions";
import { NAV_FONT_SIZE, navMenuContentProps, navMenuItemProps } from "@/components/layout/navStyles";
import { AppearanceMenu } from "@/components/ui/AppearanceMenu";
import { useI18n } from "@/contexts/I18nProvider";
import { buildMainNav, isNavGroupActive, isNavLinkActive, type NavGroupDef, type NavLinkDef } from "@/lib/navigation";

const nav = buildMainNav();
// The singleton header uses stable widget IDs across SSR, hydration and route remounts.

function navButtonProps(active: boolean) {
  return {
    variant: "ghost" as const,
    colorPalette: "brand",
    fontSize: NAV_FONT_SIZE,
    fontWeight: active ? "semibold" : "medium",
    borderRadius: "lg",
    bg: active ? "accent.soft" : "transparent",
    color: active ? "accent" : "fg.muted",
    _hover: { bg: "accent.soft", color: "fg" },
    _open: { bg: "accent.soft", color: "fg" },
    focusVisibleRing: "inside" as const,
    focusRingColor: "accent",
  };
}

function NavDropdownItems({ items, pathname }: { items: NavLinkDef[]; pathname: string }) {
  const { t } = useI18n();

  return items.map((item) => {
    if (item.children?.length) {
      return (
        <Menu.ItemGroup key={item.labelKey}>
          <Menu.ItemGroupLabel px="3" py="2" color="fg.muted" fontSize="xs" fontWeight="semibold">
            {t(item.labelKey)}
          </Menu.ItemGroupLabel>
          <NavDropdownItems items={item.children} pathname={pathname} />
        </Menu.ItemGroup>
      );
    }
    if (!item.href) return null;
    const active = isNavLinkActive(pathname, item);
    return (
      <Menu.Item key={item.href} value={item.href} asChild {...navMenuItemProps} bg={active ? "accent.soft" : undefined}>
        <NextLink href={item.href} aria-current={active ? "page" : undefined}>
          <Text as="span" flex="1">{t(item.labelKey)}</Text>
          {active ? <LuCheck aria-hidden="true" /> : null}
        </NextLink>
      </Menu.Item>
    );
  });
}

function NavMenuGroup({ group, pathname, open, onOpenChange }: {
  group: NavGroupDef;
  pathname: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useI18n();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const active = isNavGroupActive(pathname, group);
  if (!group.children?.length) {
    if (!group.href) return null;
    return (
      <Button asChild size="sm" px="2" flexShrink={0} {...navButtonProps(active)}>
        <NextLink href={group.href} aria-current={active ? "page" : undefined}>{t(group.labelKey)}</NextLink>
      </Button>
    );
  }

  const sections = group.children.filter((item) => item.children?.length);
  const links = group.children.filter((item) => !item.children?.length);
  return (
    <Menu.Root
      id={`app-header-nav-${group.id}`}
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      // Restore after the closing panel unmounts, including reduced motion.
      onEscapeKeyDown={() => requestAnimationFrame(() => triggerRef.current?.focus())}
      positioning={{ placement: "bottom-start", gutter: 16 }}
      lazyMount
      unmountOnExit
    >
      <Menu.Trigger asChild>
        <Button ref={triggerRef} size="sm" px="2" gap="1.5" {...navButtonProps(active)} data-active={active ? "true" : undefined}>
          {t(group.labelKey)}
          <Box as="span" display="inline-flex" transform={open ? "rotate(180deg)" : undefined} transition="transform 160ms" _motionReduce={{ transition: "none" }}>
            <LuChevronDown size={13} aria-hidden="true" />
          </Box>
        </Button>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content {...navMenuContentProps(sections.length ? "36rem" : "13rem")} aria-label={t(group.labelKey)}>
            <Grid templateColumns={sections.length ? `repeat(${sections.length + (links.length ? 1 : 0)}, minmax(0, 1fr))` : undefined} gap="2">
              {links.length ? (
                <Menu.ItemGroup>
                  <Menu.ItemGroupLabel px="3" py="2" color="fg.muted" fontSize="xs" fontWeight="semibold">{t(group.labelKey)}</Menu.ItemGroupLabel>
                  <NavDropdownItems items={links} pathname={pathname} />
                </Menu.ItemGroup>
              ) : null}
              <NavDropdownItems items={sections} pathname={pathname} />
            </Grid>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

function MobileNavLinks({ items, pathname, onClose }: {
  items: NavLinkDef[];
  pathname: string;
  onClose: () => void;
}) {
  const { t } = useI18n();
  return items.map((item) => {
    if (item.children?.length) {
      return (
        <Box key={item.labelKey} gridColumn="1 / -1" borderTopWidth="1px" borderColor="border" mt="2" pt="3">
          <Text fontSize="xs" color="fg.muted" fontWeight="semibold" px="3" mb="2">{t(item.labelKey)}</Text>
          <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="1">
            <MobileNavLinks items={item.children} pathname={pathname} onClose={onClose} />
          </Grid>
        </Box>
      );
    }
    if (!item.href) return null;
    const active = isNavLinkActive(pathname, item);
    return (
      <Button key={item.href} asChild minH="11" h="auto" py="2.5" px="3" justifyContent="space-between" whiteSpace="normal" textAlign="start" {...navButtonProps(active)}>
        <NextLink href={item.href} aria-current={active ? "page" : undefined} onClick={onClose}>
          {t(item.labelKey)}
          {active ? <LuCheck aria-hidden="true" /> : null}
        </NextLink>
      </Button>
    );
  });
}

function RouteHeader({ pathname }: { pathname: string }) {
  const [panel, setPanel] = useState<string | null>(null);
  const mobileOpen = panel === "mobile";
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const closePanels = () => setPanel(null);
    media.addEventListener("change", closePanels);
    return () => media.removeEventListener("change", closePanels);
  }, []);

  return (
    <Drawer.Root id="app-header-mobile-nav" open={mobileOpen} onOpenChange={({ open }) => setPanel(open ? "mobile" : null)} placement="end" initialFocusEl={() => closeButtonRef.current} lazyMount unmountOnExit>
      <Box as="header" data-app-header position="sticky" top="0" zIndex="sticky" bg="bg.elevated/85" backdropFilter="blur(20px) saturate(150%)" borderBottomWidth="1px" borderColor="border" fontSize={NAV_FONT_SIZE} fontFamily="var(--font-body, inherit)">
        <Flex
          align="center" justify="space-between" gap={{ base: "2", xl: "5" }}
          h="var(--header-height, 4rem)" w="full" maxW="var(--page-max, 1440px)" mx="auto" px={{ base: "4", md: "6", xl: "8" }}
          display={{ base: "flex", xl: "grid" }} gridTemplateColumns="minmax(0, 1fr) auto minmax(0, 1fr)"
        >
          <Box display="inline-flex" flexShrink={0} gridColumn="2" gridRow="1" justifySelf="center"><BrandLogo /></Box>
          <HStack as="nav" aria-label={t("nav.menu")} display={{ base: "none", xl: "flex" }} gap="1" justify="start" minW="0" gridColumn="1" gridRow="1">
            {nav.map((group) => (
              <NavMenuGroup key={group.id} group={group} pathname={pathname} open={panel === group.id} onOpenChange={(open) => setPanel((current) => open ? group.id : current === group.id ? null : current)} />
            ))}
          </HStack>
          <HStack gap={{ base: "0", md: "1" }} flexShrink={0} gridColumn="3" gridRow="1" justifySelf="end">
            <LanguageSelect />
            <AppearanceMenu />
            <Box h="5" borderLeftWidth="1px" borderColor="border" mx="2" display={{ base: "none", sm: "block" }} />
            <HeaderUserActions />
            <Drawer.Trigger asChild>
              <IconButton aria-label={t("nav.open")} variant="ghost" size="sm" minW="10" display={{ base: "inline-flex", xl: "none" }} borderRadius="lg">
                <LuMenu size={20} />
              </IconButton>
            </Drawer.Trigger>
          </HStack>
        </Flex>
      </Box>
      <Portal>
        <Drawer.Backdrop bg="blackAlpha.400" backdropFilter="blur(4px)" _motionReduce={{ animation: "none" }} />
        <Drawer.Positioner p={{ base: "2", sm: "3" }}>
          <Drawer.Content w="min(100%, 26rem)" maxW="26rem" h="full" maxH="full" bg="bg.elevated" color="fg" borderWidth="1px" borderColor="border" borderRadius="var(--radius-card, 1rem)" boxShadow="var(--shadow-float, 0 12px 40px rgb(12 58 77 / 10%))" fontFamily="var(--font-body, inherit)" _motionReduce={{ animation: "none" }}>
            <Drawer.Header px="5" py="4" borderBottomWidth="1px" borderColor="border" justifyContent="space-between" alignItems="center" flexShrink={0}>
              <Drawer.Title fontFamily="var(--font-heading, inherit)" fontSize="lg" fontWeight="semibold">{t("nav.menu")}</Drawer.Title>
              <Drawer.CloseTrigger asChild position="static">
                <IconButton ref={closeButtonRef} aria-label={t("nav.close")} variant="ghost" size="sm" borderRadius="lg"><LuX size={20} /></IconButton>
              </Drawer.CloseTrigger>
            </Drawer.Header>
            <Drawer.Body p="3" overscrollBehavior="contain">
              <Stack as="nav" aria-label={t("nav.menu")} gap="3">
                <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="1">
                  {nav.filter((group) => group.href).map((group) => (
                    <MobileNavLinks key={group.id} items={[group]} pathname={pathname} onClose={() => setPanel(null)} />
                  ))}
                </Grid>
                {nav.filter((group) => group.children?.length).map((group) => (
                  <Box as="section" key={group.id} aria-labelledby={`mobile-nav-${group.id}`} p="2" bg="bg.subtle" borderWidth="1px" borderColor="border" borderRadius="var(--radius-card, 1rem)">
                    <Text as="h3" id={`mobile-nav-${group.id}`} fontFamily="var(--font-heading, inherit)" fontSize="sm" fontWeight="semibold" color={isNavGroupActive(pathname, group) ? "accent" : "fg"} px="3" pt="2" pb="3">{t(group.labelKey)}</Text>
                    <Grid templateColumns="repeat(2, minmax(0, 1fr))" gap="1">
                      <MobileNavLinks items={group.children ?? []} pathname={pathname} onClose={() => setPanel(null)} />
                    </Grid>
                  </Box>
                ))}
              </Stack>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer.Positioner>
      </Portal>
    </Drawer.Root>
  );
}

export function AppHeader() {
  const pathname = usePathname() ?? "/";
  // A new route starts with closed panels, including browser back/forward.
  return <RouteHeader key={pathname} pathname={pathname} />;
}
