import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { Provider } from "@/components/ui/provider";

export default function NotFound() {
  return (
    <Provider>
      <AppShell>
        <Box textAlign="center" py={{ base: 12, md: 20 }}>
          <Stack gap="4" align="center">
            <Heading size="2xl">404</Heading>
            <Text color="fg.muted">页面不存在或尚未开放</Text>
            <Button asChild colorPalette="brand">
              <NextLink href="/welcome">返回首页</NextLink>
            </Button>
          </Stack>
        </Box>
      </AppShell>
    </Provider>
  );
}
