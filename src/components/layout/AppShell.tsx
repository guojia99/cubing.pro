import { Box, Container } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { AppHeader } from "./AppHeader";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Box minH="100dvh" display="flex" flexDirection="column">
      <AppHeader />
      <Box as="main" flex="1" py={{ base: 4, md: 6 }} data-app-main>
        <Container maxW="container.xl" data-app-container>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
