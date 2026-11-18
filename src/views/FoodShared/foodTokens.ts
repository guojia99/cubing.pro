/** 生活/菜谱模块：标准正文 14px（标题 h1–h4 除外） */
export const FOOD_FONT_SIZE = "14px";

export const foodControlProps = {
  fontSize: FOOD_FONT_SIZE,
  h: "44px",
  minH: "44px",
  borderRadius: "12px",
} as const;

export const foodTextProps = {
  fontSize: FOOD_FONT_SIZE,
  lineHeight: "1.5",
} as const;
