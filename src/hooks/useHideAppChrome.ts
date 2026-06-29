"use client";

import { useEffect } from "react";

const ATTR = "data-app-chrome-hidden";

let hideCount = 0;

function syncChromeHidden() {
  if (hideCount > 0) {
    document.documentElement.setAttribute(ATTR, "");
  } else {
    document.documentElement.removeAttribute(ATTR);
  }
}

/** 全屏工具页等场景下隐藏站点顶栏与主内容区留白 */
export function useHideAppChrome(hidden: boolean) {
  useEffect(() => {
    if (!hidden) return;
    hideCount += 1;
    syncChromeHidden();
    return () => {
      hideCount = Math.max(0, hideCount - 1);
      syncChromeHidden();
    };
  }, [hidden]);
}
