"use client";

import { HStack, Menu, Portal, Text } from "@chakra-ui/react";

import { useI18n } from "@/contexts/I18nProvider";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n";

const flagUrl = (code: string) => `https://flagcdn.com/w40/${code}.png`;

export function LanguageSelect() {
  const { locale, setLocale, t } = useI18n();
  const current = SUPPORTED_LOCALES.find((l) => l.key === locale);

  return (
    <Menu.Root positioning={{ placement: "bottom-end" }}>
      <Menu.Trigger
        aria-label={t("lang.label")}
        px="2"
        py="1"
        borderRadius="md"
        _hover={{ bg: "bg.muted" }}
        cursor="pointer"
      >
        <HStack gap="1.5">
          <Text fontSize="sm" aria-hidden>
            🌐
          </Text>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagUrl(current?.flag ?? "cn")}
            alt=""
            width={16}
            height={12}
            style={{ borderRadius: 4, objectFit: "cover" }}
          />
        </HStack>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="40">
            {SUPPORTED_LOCALES.map((lang) => (
              <Menu.Item
                key={lang.key}
                value={lang.key}
                onClick={() => setLocale(lang.key as Locale)}
              >
                <HStack gap="2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={flagUrl(lang.flag)}
                    alt=""
                    width={16}
                    height={12}
                    style={{ borderRadius: 4 }}
                  />
                  <Text flex="1">{t(lang.labelKey)}</Text>
                  {locale === lang.key ? (
                    <Text color="brand.fg" fontSize="xs">
                      ✓
                    </Text>
                  ) : null}
                </HStack>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
