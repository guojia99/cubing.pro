import React, { useEffect, useState } from "react";
import { apiEvents } from "@/services/cubing-pro/events/events";
import { Divider, Table } from "antd";
import { eventRouteM } from "@/components/Data/cube_result/event_route";
import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import { CubesCn } from "@/components/CubeIcon/cube";
const columns = [
    {
        title: 'Icon',
        dataIndex: 'icon',
        key: 'icon',
        render: (value, events) => {
            return CubeIcon(events.name, events.name, {});
        },
    },
    {
        title: '名',
        dataIndex: 'id',
        key: 'id',
        render: (value, events) => {
            return CubesCn(value);
        }
    },
    {
        title: '项目类型',
        dataIndex: 'base_route_typ',
        key: 'base_route_typ',
        render: (value, events) => {
            const m = eventRouteM(value);
            return m.name;
        }
    },
    {
        title: '别名',
        dataIndex: 'otherNames',
        key: 'otherNames',
        render: (value, events) => {
            const data = value.split(";");
            let body = [];
            data.map((value) => {
                body.push(<div style={{ display: "inline-block", minWidth: "100px", width: "100px" }}>{value}</div>);
            });
            return <>{body}</>;
        }
    },
    {
        title: "打乱",
        dataIndex: 'scrambleValue',
        key: 'scrambleValue',
        render: (value, events) => {
            if (!events.scrambleValue && !events.autoScrambleKey) {
                return events.id;
            }
            if (events.autoScrambleKey) {
                return events.autoScrambleKey;
            }
            const data = value.split(",");
            let body = [];
            data.map((value) => {
                body.push(<div style={{ display: "inline-block", minWidth: "100px", width: "100px" }}>{value}</div>);
            });
            return <>{body}</>;
        }
    }
];
const Events = () => {
    const [events, setEvents] = useState([]);
    const fetchComp = () => {
        apiEvents().then((value) => {
            let data = value.data.Events;
            data = data.filter((value) => {
                return value.isComp;
            });
            setEvents(data);
        });
    };
    useEffect(() => {
        fetchComp();
    }, []);
    let notWCA = events.filter((value) => {
        return !value.isWCA;
    });
    let wca = events.filter((value) => {
        return value.isWCA;
    });
    return (<>
      <Divider orientation="left"><h4><strong>WCA项目</strong></h4></Divider>
      <Table dataSource={wca} columns={columns} pagination={false}/>
      <Divider orientation="left"><h4><strong>趣味项目</strong></h4></Divider>
      <Table dataSource={notWCA} columns={columns} pagination={false}/>

    </>);
};
export default Events;
//# sourceMappingURL=Events.jsx.map