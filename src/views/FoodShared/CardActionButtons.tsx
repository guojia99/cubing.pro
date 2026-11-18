"use client";

import { IconButton } from "@chakra-ui/react";
import { LuHeart, LuShoppingCart } from "react-icons/lu";
import { useI18n } from "@/contexts/I18nProvider";
import { getSiteContent } from "@/i18n/messages/site-content";

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
  width: "44px",
  height: "44px",
  minW: "44px",
  borderRadius: "full",
  bg: "color-mix(in srgb, var(--card) 92%, transparent)",
  boxShadow: "var(--shadow-card)",
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
  const { locale } = useI18n();
  const sc = getSiteContent(locale);
  const tonightLabel = inTonightMode || isInTonight
    ? sc("siteContent.removeList")
    : tonightTitle ?? sc("siteContent.addList");

  return (
    <>
      <IconButton
        aria-label={tonightLabel}
        title={tonightLabel}
        onClick={onTonightClick}
        {...actionBtnProps}
        right="62px"
        aria-pressed={isInTonight}
        color={isInTonight ? "accent" : "fg.muted"}
      >
        <LuShoppingCart size={18} />
      </IconButton>
      <IconButton
        aria-label={sc(isFavorite ? "siteContent.unfavorite" : "siteContent.favorite")}
        title={sc(isFavorite ? "siteContent.unfavorite" : "siteContent.favorite")}
        onClick={onFavoriteClick}
        {...actionBtnProps}
        right="12px"
        aria-pressed={isFavorite}
        color={isFavorite ? "signal.destructive" : "fg.muted"}
      >
        <LuHeart size={18} fill={isFavorite ? "var(--destructive)" : "none"} />
      </IconButton>
    </>
  );
}
