"use client";

import { Button, HStack, Spacer, Textarea, VStack } from "@chakra-ui/react";

import { useI18n } from "@/contexts/I18nProvider";

export const FR_EXAMPLE_SCRAMBLE =
  "R' U' F U2 B2 D R2 U' B2 L2 R2 F2 R2 B' L' R B2 R' U F U R' U2 R' U' F";

export const FR_TUTORIAL_URL =
  "https://www.bilibili.com/opus/1009758579532496920";

export interface ScrambleInputProps {
  value: string;
  onChange: (v: string) => void;
  onAnalyze: () => void;
  onRandom: () => void;
  onExample: () => void;
  onHelp: () => void;
}

export function ScrambleInput({
  value,
  onChange,
  onAnalyze,
  onRandom,
  onExample,
  onHelp,
}: ScrambleInputProps) {
  const { t } = useI18n();

  return (
    <VStack align="stretch" gap="3">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t("fr.input.placeholder")}
        rows={3}
        fontFamily="mono"
        resize="vertical"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onAnalyze();
        }}
      />
      <HStack gap="2" flexWrap="wrap">
        <Button colorPalette="purple" onClick={onAnalyze}>
          {t("fr.btn.analyze")}
        </Button>
        <Button variant="outline" onClick={onRandom}>
          {t("fr.btn.random")}
        </Button>
        <Button variant="ghost" onClick={onExample}>
          {t("fr.btn.example")}
        </Button>
        <Spacer />
        <Button variant="outline" onClick={onHelp}>
          {t("fr.btn.help")}
        </Button>
        <Button
          variant="ghost"
          colorPalette="blue"
          onClick={() =>
            window.open(FR_TUTORIAL_URL, "_blank", "noopener,noreferrer")
          }
        >
          {t("fr.btn.tutorial")}
        </Button>
      </HStack>
    </VStack>
  );
}
