import React from "react";
import {ProDescriptions} from "@ant-design/pro-components";
import Markdown from "@/components/Markdown/Markdown";
import {CompAPI} from "@/services/cubing-pro/comps/typings";

// 定义组件的属性类型
interface CompetitionRegulationsProps {
  comp?: CompAPI.CompResp;
}

const CompetitionRegulations: React.FC<CompetitionRegulationsProps> = ({ comp }) => {
  let bodys: React.ReactNode[] = []
  bodys.push(
    <ProDescriptions column={1} title="规则" tooltip="这里是主办编写的其他规则">
      <Markdown md={comp?.data.RuleMD}/>
    </ProDescriptions>
  )
  return (<>{bodys}</>);
}

export default CompetitionRegulations;
