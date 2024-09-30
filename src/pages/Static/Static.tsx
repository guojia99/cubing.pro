import React from "react";
import Kinsor from "@/pages/Static/Kinsor";
import {Card} from "antd";
import {NavTabs} from "@/components/Tabs/nav_tabs";
import {OrderedListOutlined} from "@ant-design/icons";

const Static: React.FC = () => {

  const items = [
    {
      key: "kinch_sor",
      label: "Sor",
      children: (<Kinsor/>),
      icon: <OrderedListOutlined />
    }
  ]



  return (
    <>
      <Card>
        <NavTabs
          type="line"
          items={items}
          tabsKey="static_tabs"
          indicator={{ size: (origin: number) => origin - 20, align: 'center' }}
        />
      </Card>
    </>
  )
}

export default Static;
