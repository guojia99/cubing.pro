"use client";

import { NativeSelect } from "@chakra-ui/react";
import type { ReactNode } from "react";

import { foodControlProps } from "./foodTokens";

interface FoodFilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  minW?: string;
  w?: string;
  className?: string;
}

export function FoodFilterSelect({ value, onChange, children, minW, w, className }: FoodFilterSelectProps) {
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </NativeSelect.Field>
    </NativeSelect.Root>
  );
}
