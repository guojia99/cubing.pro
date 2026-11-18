"use client";

import {
  Box,
  Button,
  Dialog,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";

import { FOOD_FONT_SIZE } from "./foodTokens";

import "@/views/FoodShared/random-pick.css";

const SPIN_DURATION = 2500;
const SPIN_INTERVAL_INITIAL = 50;
const SPIN_INTERVAL_FINAL = 150;

interface RandomPickModalProps<T> {
  open: boolean;
  title: string;
  countLabel: string;
  viewButtonLabel: string;
  items: T[];
  getDisplayName: (item: T) => string;
  onClose: () => void;
  onViewItem: (item: T) => void;
  filterSlot: ReactNode;
  onResult?: (item: T) => void;
}

export function RandomPickModal<T>({
  open,
  title,
  countLabel,
  viewButtonLabel,
  items,
  getDisplayName,
  onClose,
  onViewItem,
  filterSlot,
  onResult,
}: RandomPickModalProps<T>) {
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const [phase, setPhase] = useState<"filter" | "spinning" | "result">("filter");
  const [displayName, setDisplayName] = useState("");
  const [resultItem, setResultItem] = useState<T | null>(null);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startSpin = () => {
    if (items.length === 0) return;
    setPhase("spinning");
    const names = items.map(getDisplayName);
    const resultIdx = Math.floor(Math.random() * items.length);
    const result = items[resultIdx];
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    const startTime = Date.now();
    let tickCount = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SPIN_DURATION, 1);
      const eased = 1 - (1 - progress) ** 3;
      const interval = SPIN_INTERVAL_INITIAL + (SPIN_INTERVAL_FINAL - SPIN_INTERVAL_INITIAL) * eased;
      tickCount += 1;
      setDisplayName(shuffled[tickCount % shuffled.length]);

      if (progress < 1) {
        intervalRef.current = setTimeout(tick, interval);
      } else {
        setDisplayName(getDisplayName(result));
        setResultItem(result);
        setPhase("result");
        onResult?.(result);
      }
    };

    setDisplayName(shuffled[0]);
    intervalRef.current = setTimeout(tick, SPIN_INTERVAL_INITIAL);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      setPhase("filter");
      setDisplayName("");
      setResultItem(null);
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={(e) => !e.open && onClose()} size="md">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content mx="4" borderRadius="var(--radius-card)" boxShadow="var(--shadow-float)" maxH="calc(100dvh - 32px)" overflowY="auto">
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              {phase === "filter" ? (
                <VStack align="stretch" gap="4">
                  {filterSlot}
                  <Text fontSize={FOOD_FONT_SIZE} color="fg.muted">
                    {countLabel.replace("{count}", String(items.length))}
                  </Text>
                  <Button
                    colorPalette="brand"
                    fontSize={FOOD_FONT_SIZE}
                    h="40px"
                    onClick={startSpin}
                    disabled={items.length === 0}
                  >
                    {sc("siteContent.random")}
                  </Button>
                </VStack>
              ) : (
                <Box className="random-pick-result" role="status" aria-live={phase === "result" ? "polite" : "off"}>
                  <Box
                    className={`random-pick-name ${phase === "spinning" ? "spinning" : ""}`}
                    fontSize="2xl"
                    fontWeight="semibold"
                    color="accent"
                    textAlign="center"
                    py="10"
                    minH="120px"
                  >
                    {displayName}
                  </Box>
                  {phase === "result" && resultItem ? (
                    <Box display="flex" gap="3" justifyContent="center" flexWrap="wrap">
                      <Button variant="outline" fontSize={FOOD_FONT_SIZE} onClick={() => setPhase("filter")}>
                        {sc("siteContent.again")}
                      </Button>
                      <Button
                        colorPalette="brand"
                        fontSize={FOOD_FONT_SIZE}
                        onClick={() => {
                          onViewItem(resultItem);
                          onClose();
                        }}
                      >
                        {viewButtonLabel}
                      </Button>
                    </Box>
                  ) : null}
                </Box>
              )}
            </Dialog.Body>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
