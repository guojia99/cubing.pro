"use client";

import { Button, Field, NativeSelect, type ButtonProps } from "@chakra-ui/react";
import { useId, type ReactNode } from "react";

export const DRAW_BUTTON_SIZE = "sm" as const;

export const drawSelectFieldProps = {
  fontSize: "sm",
  h: "44px",
  minH: "44px",
  borderRadius: "12px",
  px: "3",
  w: "full",
} as const;

interface DrawSelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  w?: ButtonProps["w"];
  id?: string;
}

/** 绘图工具下拉框：移动端占满宽度，避免 flex 内漂移 */
export function DrawSelect({ value, onChange, children, w, id }: DrawSelectProps) {
  return (
    <NativeSelect.Root
      size="sm"
      w={w ?? { base: "full", sm: "132px" }}
      maxW="100%"
      minW="0"
      flexShrink={0}
      position="relative"
    >
      <NativeSelect.Field
        {...drawSelectFieldProps}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}

interface DrawControlFieldProps {
  label: string;
  children: ReactNode;
}

/** 标签 + 控件行：小屏纵向排列，避免下拉框与文字错位 */
export function DrawControlField({ label, children }: DrawControlFieldProps) {
  const id = useId();
  return (
    <Field.Root
      id={id}
      gap="2"
      w={{ base: "full", sm: "auto" }}
      minW="0"
      flex={{ base: "1 1 100%", sm: "0 1 auto" }}
    >
      <Field.Label fontSize="sm" fontWeight="medium" color="fg.muted">
        {label}
      </Field.Label>
      {children}
    </Field.Root>
  );
}

type DrawButtonProps = ButtonProps;

export function DrawActionButton(props: DrawButtonProps) {
  return (
    <Button
      size={DRAW_BUTTON_SIZE}
      variant="outline"
      colorPalette="brand"
      fontSize="sm"
      minH="44px"
      borderRadius="12px"
      px="3"
      {...props}
    />
  );
}

export function DrawMutedButton(props: DrawButtonProps) {
  return (
    <Button
      size={DRAW_BUTTON_SIZE}
      variant="outline"
      colorPalette="brand"
      color="fg.muted"
      fontSize="sm"
      minH="44px"
      borderRadius="12px"
      px="3"
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
      colorPalette="brand"
      aria-pressed={!!selected}
      fontSize="sm"
      borderRadius="12px"
      px="3"
      minH="44px"
      h="auto"
      py="1"
      whiteSpace="normal"
      lineHeight="short"
      {...props}
    />
  );
}
