import React from 'react';
import { useLocation } from 'react-router-dom';
import { Tabs } from "antd";
import { useNavigate } from "react-router";
export const NavTabs = (props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const handleTabChange = (key) => {
        // 更新 URL 上的 query 参数，比如 cube_comps=events
        const searchParams = new URLSearchParams(location.search);
        searchParams.set(props.tabsKey, key);
        navigate(`${location.pathname}?${searchParams.toString()}`);
    };
    // 获取 URL 中的对应 tabKey 的 query 参数，如果没有则默认为第一个 Tab key
    const defaultTabKey = new URLSearchParams(location.search).get(props.tabsKey) || props.items[0]?.key || "";
    // alert(defaultTabKey + "|" + props.tabsKey)
    return (<Tabs tabPosition={props.tabPosition} centered={props.centered} defaultActiveKey={defaultTabKey} activeKey={defaultTabKey} type={props.type} items={props.items} style={props.style} onChange={handleTabChange}/>);
};
//# sourceMappingURL=nav_tabs.jsx.map