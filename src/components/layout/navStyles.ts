/** 顶栏及归属导航区域（含下拉、用户菜单）统一字号 */
export const NAV_FONT_SIZE = "14px";

/** 导航下拉面板 Menu.Content */
export function navMenuContentProps(minW: string) {
  return {
    minW,
    fontSize: NAV_FONT_SIZE,
    css: {
      "& [data-scope=menu][data-part=item]": { fontSize: NAV_FONT_SIZE },
      "& [data-scope=menu][data-part=item-group-label]": { fontSize: NAV_FONT_SIZE },
      "& a": { fontSize: NAV_FONT_SIZE },
    },
  };
}

/** 导航下拉项 Menu.Item */
export const navMenuItemProps = { fontSize: NAV_FONT_SIZE } as const;
