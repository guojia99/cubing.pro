import React, {useEffect, useState} from 'react';
import {useLocation} from 'react-router-dom';
import {Tabs} from "antd";
import {useNavigate} from "react-router";
import {TabsType} from "antd/es/tabs";

export type NavTabsProps = {
  type: TabsType;
  items: any[];
  tabsKey: string;  // 将 "key" 改名为 "tabsKey" 以避免与保留字冲突
  style?: React.CSSProperties;
  indicator?: any;
  centered?: boolean;
}

export const NavTabs = (props: NavTabsProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabChange = (key: string) => {
    // 更新 URL 上的 query 参数，比如 cube_comps=events
    const searchParams = new URLSearchParams(location.search);
    searchParams.set(props.tabsKey, key);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  // 获取 URL 中的对应 tabKey 的 query 参数，如果没有则默认为第一个 Tab key
  const defaultTabKey = new URLSearchParams(location.search).get(props.tabsKey) || props.items[0]?.key || "";
  // alert(defaultTabKey + "|" + props.tabsKey)


  return (
    <Tabs
      centered={props.centered}
      defaultActiveKey={defaultTabKey}
      activeKey={defaultTabKey}
      type={props.type}
      items={props.items}
      style={props.style}
      onChange={handleTabChange}
    />
  );
}
