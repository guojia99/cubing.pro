"use client";

import { Box, CloseButton, Dialog, Text, VStack } from "@chakra-ui/react";
import { useI18n } from "@/contexts/I18nProvider";
import { useReleaseOverlayOnUnmount } from "@/lib/overlayCleanup";

export interface UsageInstructionsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function UsageInstructionsModal({
  open,
  onClose,
}: UsageInstructionsModalProps) {
  useReleaseOverlayOnUnmount();
  const { t } = useI18n();

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      size="sm"
      placement="center"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content borderRadius="xl" maxW="420px">
          <Dialog.Header display="flex" justifyContent="space-between" alignItems="center">
            <Dialog.Title fontSize="md" fontWeight="bold">
              {t("algs.usageInstructions.title")}
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body pb={4}>
            <VStack align="stretch" gap={4}>
              <Box>
                <Text fontWeight="semibold" fontSize="sm" mb={1.5}>
                  {t("algs.usageInstructions.clickSwitch")}
                </Text>
                <Text fontSize="sm" color="fg.muted" lineHeight={1.6}>
                  {t("algs.usageInstructions.clickSwitchDesc")}
                </Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" fontSize="sm" mb={1.5}>
                  {t("algs.usageInstructions.randomFunc")}
                </Text>
                <Text fontSize="sm" color="fg.muted" lineHeight={1.6}>
                  {t("algs.usageInstructions.randomFuncDesc")}
                </Text>
              </Box>
              <Box>
                <Text fontWeight="semibold" fontSize="sm" mb={1.5}>
                  {t("algs.usageInstructions.formulaPractice")}
                </Text>
                <Text fontSize="sm" color="fg.muted" lineHeight={1.6}>
                  {t("algs.usageInstructions.formulaPracticeDesc")}
                </Text>
              </Box>
            </VStack>
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
