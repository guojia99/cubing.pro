import React, {useEffect, useState} from "react";
import {EventsAPI} from "@/services/cubing-pro/events/typings";
import {apiEvents} from "@/services/cubing-pro/events/events";
import {Divider, Table} from "antd";
import {eventRouteM} from "@/components/Data/cube_result/event_route";
import {CubeIcon} from "@/components/CubeIcon/cube_icon";
import {CubesCn} from "@/components/CubeIcon/cube";

const columns = [
  {
    title: 'Icon',
    dataIndex: 'icon',
    key: 'icon',
    render: (value: string, events: EventsAPI.Event) => {
      return CubeIcon(events.name, events.name, {})
    },
  },
  {
    title: '名',
    dataIndex: 'id',
    key: 'id',
    render: (value: string, events: EventsAPI.Event) => {
      return CubesCn(value)
    }
  },

  {
    title: '项目类型',
    dataIndex: 'base_route_typ',
    key: 'base_route_typ',
    render: (value: number, events: EventsAPI.Event) => {
      const m = eventRouteM(value)
      return m.name
    }
  },
  {
    title: '别名',
    dataIndex: 'otherNames',
    key: 'otherNames',
    render: (value: string, events:EventsAPI.Event) => {
      const data = value.split(";")

      let body : JSX.Element[] = []
      data.map((value: string) => {
        body.push(<div style={{ display: "inline-block", minWidth:"100px", width: "100px"}}>{value}</div>)
      })
      return <>{body}</>
    }
  },
  {
    title: "打乱",
    dataIndex: 'scrambleValue',
    key: 'scrambleValue',
    render: (value: string, events: EventsAPI.Event) => {
      if (!events.scrambleValue && !events.autoScrambleKey) {
        return events.id
      }

      if (events.autoScrambleKey) {
        return events.autoScrambleKey
      }
      const data = value.split(",")
      let body : JSX.Element[] = []
      data.map((value: string) => {
        body.push(<div style={{ display: "inline-block", minWidth:"100px", width: "100px"}}>{value}</div>)
      })
      return <>{body}</>
    }
  }
];

const Events: React.FC = () => {
  const [events, setEvents] = useState<EventsAPI.Event[]>([]);
  const fetchComp = () => {
    apiEvents().then((value) => {
      let data = value.data.Events
      data = data.filter((value: EventsAPI.Event) => {
        return value.isComp
      })
      setEvents(data)
    })
  }
  useEffect(() => {
    fetchComp();
  }, []);

  let notWCA =events.filter((value: EventsAPI.Event) => {
    return !value.isWCA
  })


  let wca = events.filter((value: EventsAPI.Event)=>{
    return value.isWCA
  })

  return (

    <>
      <Divider orientation="left"><h4><strong>WCA项目</strong></h4></Divider>
      <Table
        dataSource={wca}
        columns={columns}
        pagination={false}
      />
      <Divider orientation="left"><h4><strong>趣味项目</strong></h4></Divider>
      <Table
        dataSource={notWCA}
        columns={columns}
        pagination={false}
      />

    </>
  );
}

export default Events;
