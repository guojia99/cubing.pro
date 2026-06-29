"use client";

import { Box, IconButton, VStack } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { useI18n } from "@/contexts/I18nProvider";

interface Props {
  onScrollTop: () => void;
  onOpenFilter: () => void;
  onOpenPageSettings: () => void;
  onOpenUsageInstructions?: () => void;
  onOpenFormulaPractice?: () => void;
}

function FloatIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <IconButton
      aria-label={label}
      title={label}
      w="36px"
      h="36px"
      minW="36px"
      borderRadius="full"
      variant="outline"
      bg="bg.elevated"
      color="fg"
      borderColor="border"
      boxShadow="md"
      fontSize="md"
      _hover={{ bg: "bg.muted", boxShadow: "lg", transform: "scale(1.08)" }}
      _active={{ transform: "scale(0.95)" }}
      transition="all 0.15s ease"
      onClick={onClick}
    >
      {children}
    </IconButton>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 5v14l11-7L8 5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9.5 9.5a2.5 2.5 0 0 1 4.2 1.8c0 1.8-2.7 1.8-2.7 3.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  );
}

function ArrowUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M5 12l7-7 7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AlgsFloatButtons({
  onScrollTop,
  onOpenFilter,
  onOpenPageSettings,
  onOpenUsageInstructions,
  onOpenFormulaPractice,
}: Props) {
  const { t } = useI18n();

  return (
    <Box
      position="fixed"
      bottom={{ base: "20px", md: "28px" }}
      right={{ base: "12px", md: "20px" }}
      zIndex="overlay"
    >
      <VStack gap={2}>
        <FloatIconButton label={t("algs.config")} onClick={onOpenPageSettings}>
          <SettingsIcon />
        </FloatIconButton>

        <FloatIconButton label={t("algs.detail.filterDrawer")} onClick={onOpenFilter}>
          <FilterIcon />
        </FloatIconButton>

        {onOpenFormulaPractice && (
          <FloatIconButton label={t("algs.practice")} onClick={onOpenFormulaPractice}>
            <PlayIcon />
          </FloatIconButton>
        )}

        {onOpenUsageInstructions && (
          <FloatIconButton label="?" onClick={onOpenUsageInstructions}>
            <HelpIcon />
          </FloatIconButton>
        )}

        <FloatIconButton label="Scroll to top" onClick={onScrollTop}>
          <ArrowUpIcon />
        </FloatIconButton>
      </VStack>
    </Box>
  );
}
