/** 顶栏及归属导航区域（含下拉、用户菜单）统一字号 */
export const NAV_FONT_SIZE = "14px";

/** 导航下拉面板 Menu.Content */
export function navMenuContentProps(minW: string) {
  return {
    minW,
    maxW: "calc(100vw - 2rem)",
    maxH: "min(36rem, var(--available-height, calc(100dvh - 6rem)))",
    overflowY: "auto" as const,
    overscrollBehavior: "contain" as const,
    p: "2",
    bg: "bg.elevated",
    color: "fg",
    borderWidth: "1px",
    borderColor: "border",
    borderRadius: "var(--radius-card, 1rem)",
    boxShadow: "var(--shadow-float, 0 12px 40px rgb(12 58 77 / 10%))",
    fontFamily: "var(--font-body, inherit)",
    fontSize: NAV_FONT_SIZE,
    css: {
      "@media (prefers-reduced-motion: reduce)": { animation: "none", transition: "none" },
      "& [data-scope=menu][data-part=item]": { fontSize: NAV_FONT_SIZE },
      "& [data-scope=menu][data-part=item-group-label]": { fontSize: NAV_FONT_SIZE },
      "& a": { fontSize: NAV_FONT_SIZE },
    },
  };
}

/** 导航下拉项 Menu.Item */
export const navMenuItemProps = {
  fontSize: NAV_FONT_SIZE,
  minH: "10",
  px: "3",
  gap: "3",
  borderRadius: "lg",
  cursor: "pointer",
  _highlighted: { bg: "accent.soft", color: "fg" },
  _focusVisible: { outline: "2px solid", outlineColor: "accent", outlineOffset: "-2px" },
} as const;
