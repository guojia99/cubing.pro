"use client";

import {
  Button,
  Card,
  Field,
  Heading,
  Input,
  NativeSelect,
  VStack,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";

import { useColorMode } from "@/components/ui/color-mode";
import { toaster } from "@/components/ui/toaster";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import { defaultSettings } from "@/config/defaultSettings";
import {
  applyWebsiteUiToDocument,
  readWebsiteUiFromStorage,
  resolveEffectiveNavTheme,
  writeWebsiteUiToStorage,
  type WebsiteUiConfig,
  type WebsiteUiNavPreference,
} from "@/lib/websiteUiConfig";
import { getToken } from "@/services/cubing-pro/auth/token";
import { USER_KV_KEYS, setUserKv } from "@/services/cubing-pro/user/user_kv";

export function SettingsPage() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const { setColorMode } = useColorMode();

  const initial = useMemo(() => {
    const local = readWebsiteUiFromStorage();
    return {
      navTheme: (local.navTheme ??
        defaultSettings.navTheme) as WebsiteUiNavPreference,
      fontSizeBase: local.fontSizeBase ?? 14,
    };
  }, []);

  const [navTheme, setNavTheme] = useState<WebsiteUiNavPreference>(
    initial.navTheme,
  );
  const [fontSizeBase, setFontSizeBase] = useState(initial.fontSizeBase);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const cfg: WebsiteUiConfig = { navTheme, fontSizeBase };
    writeWebsiteUiToStorage(cfg);
    applyWebsiteUiToDocument(cfg);
    const effective = resolveEffectiveNavTheme(cfg);
    setColorMode(effective === "realDark" ? "dark" : "light");

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
    <VStack align="stretch" gap="6" maxW="lg">
      <Heading size="xl">{t("settings.title")}</Heading>
      <Card.Root>
        <Card.Body>
          <VStack gap="5" align="stretch">
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
            <Button
              colorPalette="brand"
              alignSelf="flex-start"
              loading={saving}
              onClick={() => void onSave()}
            >
              {t("settings.save")}
            </Button>
          </VStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
