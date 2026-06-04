import { useEffect } from "react";

/** 释放 Chakra Dialog/Drawer 卸载时可能遗留的 body 滚动锁 */
export function releaseBodyScrollLock() {
  if (typeof document === "undefined") return;

  const { body, documentElement } = document;
  body.removeAttribute("data-scroll-lock");
  body.removeAttribute("inert");
  body.removeAttribute("aria-hidden");
  documentElement.removeAttribute("inert");
  body.style.overflow = "";
  body.style.paddingRight = "";
  body.style.paddingLeft = "";
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  documentElement.style.removeProperty("--scrollbar-width");
}

/** 弹窗组件卸载时兜底清理，避免页面卡死无法点击 */
export function useReleaseOverlayOnUnmount() {
  useEffect(() => () => releaseBodyScrollLock(), []);
}
