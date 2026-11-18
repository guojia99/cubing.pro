"use client";

import {
  Button,
  Box,
  Field,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";

import { PalettePicker } from "@/components/ui/PalettePicker";
import { PageHeader, SectionHeader, Surface } from "@/components/ui/page";
import { useColorMode } from "@/components/ui/color-mode";
import { toaster } from "@/components/ui/toaster";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";
import { defaultSettings } from "@/config/defaultSettings";
import {
  applyPaletteToDocument,
  applyWebsiteUiToDocument,
  readPaletteFromStorage,
  readWebsiteUiFromStorage,
  writeWebsiteUiToStorage,
  type Palette,
  type WebsiteUiConfig,
  type WebsiteUiNavPreference,
} from "@/lib/websiteUiConfig";
import { getToken } from "@/services/cubing-pro/auth/token";
import { USER_KV_KEYS, setUserKv } from "@/services/cubing-pro/user/user_kv";

export function SettingsPage() {
  const { t, locale } = useI18n();
  const { currentUser } = useAuth();
  const { setColorMode } = useColorMode();
  const { setTheme } = useTheme();

  const initial = useMemo(() => {
    const local = readWebsiteUiFromStorage();
    return {
      navTheme: (local.navTheme ??
        defaultSettings.navTheme) as WebsiteUiNavPreference,
      fontSizeBase: local.fontSizeBase ?? 14,
      palette: local.palette ?? readPaletteFromStorage(),
    };
  }, []);

  const [navTheme, setNavTheme] = useState<WebsiteUiNavPreference>(
    initial.navTheme,
  );
  const [fontSizeBase, setFontSizeBase] = useState(initial.fontSizeBase);
  const [palette, setPalette] = useState<Palette>(initial.palette);
  const [saving, setSaving] = useState(false);

  const onPalettePreview = (next: Palette) => {
    setPalette(next);
    applyPaletteToDocument(next);
  };

  const onSave = async () => {
    const cfg: WebsiteUiConfig = { navTheme, fontSizeBase, palette };
    writeWebsiteUiToStorage(cfg);
    applyWebsiteUiToDocument(cfg);
    if (navTheme === "system") {
      setTheme("system");
    } else {
      setColorMode(navTheme === "realDark" ? "dark" : "light");
    }

    const tok = getToken();
    if (tok?.token && currentUser?.id) {
      setSaving(true);
      try {
        await setUserKv(
          USER_KV_KEYS.website_ui_config,
          JSON.stringify(cfg),
          3,
        );
        toaster.create({ title: t("settings.saveOkCloud"), type: "success" });
      } catch {
        toaster.create({ title: t("settings.saveLocalOnly"), type: "warning" });
      } finally {
        setSaving(false);
      }
    } else {
      toaster.create({ title: t("settings.saveOkLocal"), type: "success" });
    }
  };

  return (
    <VStack align="stretch" gap="6" maxW="var(--page-max)" w="full" mx="auto">
      <PageHeader eyebrow={getSiteContent(locale)("siteContent.preferences")} title={t("settings.title")} />
      <Surface p={{ base: "4", md: "6" }}>
          <Stack gap="6" align="stretch">
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={{ base: "5", md: "8" }}>
            <Field.Root>
              <Field.Label>{t("settings.theme")}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={navTheme}
                  onChange={(e) =>
                    setNavTheme(e.target.value as WebsiteUiNavPreference)
                  }
                >
                  <option value="light">{t("settings.themeLight")}</option>
                  <option value="realDark">{t("settings.themeDark")}</option>
                  <option value="system">{t("settings.themeSystem")}</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t("settings.fontSize")}</Field.Label>
              <Input
                type="number"
                min={12}
                max={22}
                value={fontSizeBase}
                onChange={(e) => setFontSizeBase(Number(e.target.value))}
              />
              <Field.HelperText>{t("settings.fontSizeHint")}</Field.HelperText>
            </Field.Root>
            </SimpleGrid>
            <Box borderTopWidth="1px" borderColor="border" pt="5">
              <SectionHeader title={t("settings.palette")} description={t("settings.paletteHint")} />
              <Box mt="4" maxW="3xl" css={{ "& > div": { gridTemplateColumns: { base: "repeat(2, minmax(0, 1fr))", md: "repeat(4, minmax(0, 1fr))" } } }}><PalettePicker value={palette} onChange={onPalettePreview} columns={4} /></Box>
            </Box>
            <Box borderTopWidth="1px" borderColor="border" pt="5">
            <Button
              colorPalette="brand"
              alignSelf="flex-start"
              loading={saving}
              onClick={() => void onSave()}
            >
              {t("settings.save")}
            </Button>
            </Box>
          </Stack>
      </Surface>
    </VStack>
  );
}
