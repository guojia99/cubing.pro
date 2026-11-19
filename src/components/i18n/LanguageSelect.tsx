"use client";

import { Menu, IconButton, Portal } from "@chakra-ui/react";
import { useRef, useState } from "react";
import { RiTranslateAi } from "react-icons/ri";

import { useI18n } from "@/contexts/I18nProvider";
import { SUPPORTED_LOCALES, isLocale } from "@/i18n";

export function LanguageSelect() {
  const { locale, setLocale, t } = useI18n();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  return (
    <Menu.Root
      id="app-header-language"
      open={open}
      onOpenChange={({ open }) => setOpen(open)}
      positioning={{ placement: "bottom-end", gutter: 8, strategy: "fixed" }}
      onSelect={() => requestAnimationFrame(() => triggerRef.current?.focus())}
    >
      <Menu.Trigger asChild>
        <IconButton
          ref={triggerRef}
          variant="ghost"
          aria-label={t("lang.label")}
          size="sm"
          css={{
            _icon: {
              width: "5",
              height: "5",
            },
          }}
        >
          <RiTranslateAi />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner zIndex="popover">
          <Menu.Content
            aria-label={t("lang.label")}
            onKeyDownCapture={(event) => {
              if (event.key !== "Tab") return;
              // Resume native tab order from the trigger instead of trapping Tab in the portal.
              event.stopPropagation();
              setOpen(false);
              triggerRef.current?.focus();
            }}
            minW="10rem"
            maxW="calc(100vw - 1rem)"
            maxH="var(--available-height)"
            overflowY="auto"
            overscrollBehavior="contain"
          >
            <Menu.RadioItemGroup
              value={locale}
              onValueChange={({ value }) => { if (isLocale(value)) setLocale(value); }}
            >
              {SUPPORTED_LOCALES.map(({ key, label }) => (
                <Menu.RadioItem key={key} value={key} lang={key} minH="11" fontWeight={locale === key ? "bold" : undefined}>
                  <Menu.ItemText>{label}</Menu.ItemText>
                  <Menu.ItemIndicator />
                </Menu.RadioItem>
              ))}
            </Menu.RadioItemGroup>
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
