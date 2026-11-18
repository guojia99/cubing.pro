"use client";

import { ChakraProvider } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { AuthProvider } from "@/contexts/AuthProvider";
import { I18nProvider } from "@/contexts/I18nProvider";
import { StaticExportRouteSync } from "@/components/routing/StaticExportRouteSync";
import { system } from "@/theme";
import { ColorModeButton, ColorModeProvider } from "./color-mode";
import { AppToaster } from "./toaster";
import { AntThemeProvider } from "./AntThemeProvider";
import { LocalizedMetadata } from "@/components/layout/LocalizedMetadata";
import "@/styles/tokens.css";
import "@/styles/app-chrome.css";
import "@/styles/design-system.css";

export function Provider({ children }: { children: ReactNode }) {
  return (
    <ColorModeProvider defaultTheme="light" enableSystem>
      <ChakraProvider value={system}>
        <I18nProvider>
          <LocalizedMetadata />
          <AntThemeProvider>
          <AuthProvider>
            <StaticExportRouteSync />
            <AppToaster />
            {children}
          </AuthProvider>
          </AntThemeProvider>
        </I18nProvider>
      </ChakraProvider>
    </ColorModeProvider>
  );
}

export { ColorModeButton };
