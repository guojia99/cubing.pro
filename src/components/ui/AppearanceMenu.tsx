"use client";

import {
  Box,
  Button,
  IconButton,
  Menu,
  Portal,
  Separator,
  Text,
} from "@chakra-ui/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useState } from "react";

import { ColorModeIcon } from "@/components/ui/color-mode";
import { PalettePicker } from "@/components/ui/PalettePicker";
import { useAuth } from "@/contexts/AuthProvider";
import { useI18n } from "@/contexts/I18nProvider";
import {
  persistPalette,
  readPaletteFromStorage,
  readWebsiteUiFromStorage,
  writeWebsiteUiToStorage,
  type Palette,
  type WebsiteUiNavPreference,
} from "@/lib/websiteUiConfig";
import { getToken } from "@/services/cubing-pro/auth/token";
import { USER_KV_KEYS, setUserKv } from "@/services/cubing-pro/user/user_kv";

function colorModeToNavTheme(
  mode: string | undefined,
): WebsiteUiNavPreference {
  if (mode === "dark") return "realDark";
  if (mode === "system") return "system";
  return "light";
}

export function AppearanceMenu() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [palette, setPalette] = useState<Palette>("haitian");

  useEffect(() => {
    setPalette(readPaletteFromStorage());
  }, []);

  const syncConfig = useCallback(
    async (cfg: ReturnType<typeof readWebsiteUiFromStorage>) => {
      writeWebsiteUiToStorage(cfg);
      const tok = getToken();
      if (tok?.token && currentUser?.id) {
        try {
          await setUserKv(
            USER_KV_KEYS.website_ui_config,
            JSON.stringify(cfg),
            3,
          );
        } catch {
          // local-only fallback
        }
      }
    },
    [currentUser?.id],
  );

  const onModeChange = (mode: "light" | "dark" | "system") => {
    setTheme(mode);
    const cfg = {
      ...readWebsiteUiFromStorage(),
      navTheme: colorModeToNavTheme(mode),
    };
    void syncConfig(cfg);
  };

  const onPaletteChange = (next: Palette) => {
    setPalette(next);
    const cfg = persistPalette(next);
    void syncConfig(cfg);
  };

  const currentMode = theme ?? "light";

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton
          variant="ghost"
          aria-label={t("appearance.title")}
          size="sm"
          css={{
            _icon: { width: "5", height: "5" },
          }}
        >
          <ColorModeIcon />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="280px" p="3">
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb="2">
              {t("appearance.mode")}
            </Text>
            <Box display="flex" gap="1" mb="3">
              {(["light", "dark", "system"] as const).map((mode) => (
                <Button
                  key={mode}
                  size="xs"
                  flex="1"
                  variant={currentMode === mode ? "solid" : "outline"}
                  colorPalette="brand"
                  onClick={() => onModeChange(mode)}
                >
                  {mode === "light"
                    ? t("settings.themeLight")
                    : mode === "dark"
                      ? t("settings.themeDark")
                      : t("settings.themeSystem")}
                </Button>
              ))}
            </Box>
            <Separator mb="3" />
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb="2">
              {t("appearance.palette")}
            </Text>
            <PalettePicker
              value={palette}
              onChange={onPaletteChange}
              columns={2}
            />
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
