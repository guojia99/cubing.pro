import { Box, Container } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { AppHeader } from "./AppHeader";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Box minH="100dvh" minW="0" display="flex" flexDirection="column" fontFamily="var(--font-body, inherit)">
      <AppHeader />
      <Box as="main" id="app-main" tabIndex={-1} flex="1" minW="0" py={{ base: 5, md: 8 }} data-app-main>
        <Container w="full" maxW="var(--page-max, 1440px)" px={{ base: 4, md: 6, xl: 8 }} mx="auto" minW="0" data-app-container>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
