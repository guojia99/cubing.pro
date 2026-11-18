"use client";

import { NativeSelect } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";

import { foodControlProps } from "./foodTokens";

interface FoodFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  minW?: string;
  w?: string;
  className?: string;
  label?: string;
}

export function FoodFilterSelect({ value, onChange, children, minW, w, className, label }: FoodFilterSelectProps) {
  const { locale } = useI18n();
  return (
    <NativeSelect.Root
      size="sm"
      className={`food-filter-select ${className ?? ""}`}
      w={w}
      minW={minW}
      flexShrink={0}
    >
      <NativeSelect.Field
        {...foodControlProps}
        aria-label={label ?? getSiteContent(locale)("siteContent.categoryFilter")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}
