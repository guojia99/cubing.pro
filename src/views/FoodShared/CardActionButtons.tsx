"use client";

import { IconButton } from "@chakra-ui/react";
import { LuHeart, LuShoppingCart } from "react-icons/lu";

interface CardActionButtonsProps {
  isFavorite: boolean;
  isInTonight: boolean;
  inTonightMode?: boolean;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onTonightClick: (e: React.MouseEvent) => void;
  tonightTitle?: string;
}

const actionBtnProps = {
  position: "absolute" as const,
  top: "12px",
  zIndex: 2,
  width: "36px",
  height: "36px",
  minW: "36px",
  borderRadius: "full",
  bg: "color-mix(in srgb, var(--card) 92%, transparent)",
  boxShadow: "sm",
  variant: "ghost" as const,
  size: "sm" as const,
};

export function CardActionButtons({
  isFavorite,
  isInTonight,
  inTonightMode,
  onFavoriteClick,
  onTonightClick,
  tonightTitle,
}: CardActionButtonsProps) {
  const tonightLabel = inTonightMode
    ? "从清单移除"
    : isInTonight
      ? tonightTitle?.replace("添加", "从") ?? "从清单移除"
      : tonightTitle ?? "添加到清单";

  return (
    <>
      <IconButton
        aria-label={tonightLabel}
        title={tonightLabel}
        onClick={onTonightClick}
        {...actionBtnProps}
        right="54px"
        color={isInTonight ? "accent" : "fg.muted"}
      >
        <LuShoppingCart size={18} />
      </IconButton>
      <IconButton
        aria-label={isFavorite ? "取消收藏" : "收藏"}
        title={isFavorite ? "取消收藏" : "收藏"}
        onClick={onFavoriteClick}
        {...actionBtnProps}
        right="12px"
        color={isFavorite ? "signal.destructive" : "fg.muted"}
      >
        <LuHeart size={18} fill={isFavorite ? "var(--destructive)" : "none"} />
      </IconButton>
    </>
  );
}
