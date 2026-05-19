import React from "react";
import { ProDescriptions } from "@ant-design/pro-components";
import Markdown from "@/components/Markdown/Markdown";
const CompetitionRegulations = ({ comp }) => {
    let bodys = [];
    bodys.push(<ProDescriptions column={1} title="规则" tooltip="这里是主办编写的其他规则">
      <Markdown md={comp?.data.RuleMD}/>
    </ProDescriptions>);
    return (<>{bodys}</>);
};
export default CompetitionRegulations;
//# sourceMappingURL=CompetitionRegulations.jsx.map