"use client";

import { Box, Button, Dialog, Heading, Portal, Text, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";

import {
  acknowledgeCocktailSafety,
  hasAcknowledgedCocktailSafety,
} from "../utils/cocktailSafetyAck";

export function CocktailFirstVisitModal() {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasAcknowledgedCocktailSafety()) setOpen(true);
  }, []);

  const handleOk = () => {
    acknowledgeCocktailSafety();
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={() => {}} closeOnInteractOutside={false} closeOnEscape={false} size="md">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content mx="4" maxH="calc(100dvh - 32px)" overflowY="auto" borderRadius="var(--radius-card)" boxShadow="var(--shadow-float)">
            <Dialog.Header>
              <Dialog.Title>{sc("siteContent.safetyTitle")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap="4">
                <Box>
                  <Heading size="sm" mb="2">
                    {sc("siteContent.safetyAgeTitle")}
                  </Heading>
                  <Text fontSize="14px">
                    {sc("siteContent.safetyAge")}
                  </Text>
                </Box>
                <Box>
                  <Heading size="sm" mb="2">
                    {sc("siteContent.safetyDisclaimerTitle")}
                  </Heading>
                  <Text fontSize="14px">
                    {sc("siteContent.safetyDisclaimer")}
                  </Text>
                </Box>
                <Box>
                  <Heading size="sm" mb="2">
                    {sc("siteContent.safetyStorageTitle")}
                  </Heading>
                  <Text fontSize="14px">
                    {sc("siteContent.safetyStorage")}
                  </Text>
                </Box>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button colorPalette="brand" width="full" size="lg" onClick={handleOk}>
                {sc("siteContent.safetyAccept")}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
