"use client";

import { Button, Flex, NativeSelect, Text, type ButtonProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

export const DRAW_BUTTON_SIZE = "xs" as const;

export const drawSelectFieldProps = {
  fontSize: "xs",
  h: "28px",
  minH: "28px",
  px: "2",
  w: "full",
} as const;

interface DrawSelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  w?: ButtonProps["w"];
}

/** 绘图工具下拉框：移动端占满宽度，避免 flex 内漂移 */
export function DrawSelect({ value, onChange, children, w }: DrawSelectProps) {
  return (
    <NativeSelect.Root
      size="xs"
      w={w ?? { base: "full", sm: "132px" }}
      maxW="100%"
      minW="0"
      flexShrink={0}
      position="relative"
    >
      <NativeSelect.Field
        {...drawSelectFieldProps}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </NativeSelect.Field>
    </NativeSelect.Root>
  );
}

interface DrawControlFieldProps {
  label: string;
  children: ReactNode;
}

/** 标签 + 控件行：小屏纵向排列，避免下拉框与文字错位 */
export function DrawControlField({ label, children }: DrawControlFieldProps) {
  return (
    <Flex
      direction={{ base: "column", sm: "row" }}
      align={{ base: "stretch", sm: "center" }}
      gap="1"
      w={{ base: "full", sm: "auto" }}
      minW="0"
      flex={{ base: "1 1 100%", sm: "0 1 auto" }}
    >
      <Text fontSize="xs" fontWeight="medium" color="fg.muted" whiteSpace="nowrap" flexShrink={0}>
        {label}
      </Text>
      {children}
    </Flex>
  );
}

type DrawButtonProps = ButtonProps;

export function DrawActionButton(props: DrawButtonProps) {
  return (
    <Button
      size={DRAW_BUTTON_SIZE}
      variant="outline"
      colorPalette="brand"
      fontSize="xs"
      px="2.5"
      {...props}
    />
  );
}

export function DrawMutedButton(props: DrawButtonProps) {
  return (
    <Button
      size={DRAW_BUTTON_SIZE}
      variant="outline"
      colorPalette="gray"
      fontSize="xs"
      px="2.5"
      {...props}
    />
  );
}

export function DrawToggleButton({
  selected,
  ...props
}: DrawButtonProps & { selected?: boolean }) {
  return (
    <Button
      size={DRAW_BUTTON_SIZE}
      variant={selected ? "solid" : "outline"}
      colorPalette={selected ? "brand" : "gray"}
      fontSize="xs"
      px="2"
      minH="28px"
      h="auto"
      py="1"
      whiteSpace="normal"
      lineHeight="short"
      {...props}
    />
  );
}
