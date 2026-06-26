"use client";

import { Tabs } from "antd";
import type { TabsProps } from "antd";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export type NavTabsProps = {
  type?: TabsProps["type"];
  items: NonNullable<TabsProps["items"]>;
  tabsKey: string;
  style?: React.CSSProperties;
  indicator?: TabsProps["indicator"];
  centered?: boolean;
  tabPlacement?: TabsProps["tabPlacement"];
};

function readTabFromLocation(tabsKey: string, fallback: string): string {
  if (typeof window === "undefined") {
    return fallback;
  }
  return new URLSearchParams(window.location.search).get(tabsKey) ?? fallback;
}

function writeTabToLocation(pathname: string, tabsKey: string, key: string) {
  const params = new URLSearchParams(window.location.search);
  params.set(tabsKey, key);
  const qs = params.toString();
  const base = pathname || window.location.pathname;
  const url = qs ? `${base}?${qs}` : base;
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(
    new CustomEvent("navtabs-change", { detail: { tabsKey, key } }),
  );
}

export function NavTabs(props: NavTabsProps) {
  const pathname = usePathname() ?? "/";
  const fallbackKey = props.items[0]?.key?.toString() ?? "";

  const [activeKey, setActiveKey] = useState(fallbackKey);

  useEffect(() => {
    setActiveKey(readTabFromLocation(props.tabsKey, fallbackKey));
  }, [props.tabsKey, fallbackKey]);

  useEffect(() => {
    const onPopState = () => {
      setActiveKey(readTabFromLocation(props.tabsKey, fallbackKey));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [props.tabsKey, fallbackKey]);

  const handleTabChange = useCallback(
    (key: string) => {
      setActiveKey(key);
      writeTabToLocation(pathname, props.tabsKey, key);
    },
    [pathname, props.tabsKey],
  );

  return (
    <Tabs
      tabPlacement={props.tabPlacement}
      centered={props.centered}
      activeKey={activeKey}
      type={props.type}
      items={props.items}
      style={props.style}
      onChange={handleTabChange}
      indicator={props.indicator}
      destroyOnHidden={false}
    />
  );
}
