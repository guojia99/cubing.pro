"use client";

import { ChakraProvider } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { AuthProvider } from "@/contexts/AuthProvider";
import { I18nProvider } from "@/contexts/I18nProvider";
import { system } from "@/theme";
import { ColorModeButton, ColorModeProvider } from "./color-mode";
import { AppToaster } from "./toaster";

export function Provider({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider defaultTheme="light" enableSystem={false}>
        <I18nProvider>
          <AuthProvider>
            <AppToaster />
            {children}
          </AuthProvider>
        </I18nProvider>
      </ColorModeProvider>
    </ChakraProvider>
  );
}

export { ColorModeButton };
