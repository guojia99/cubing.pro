import React from "react";
import { Descriptions } from "antd";
import Markdown from "@/components/Markdown/Markdown";
import { CompAPI } from "@/services/cubing-pro/comps/typings";

interface CompetitionRegulationsProps {
  comp?: CompAPI.CompResp;
}

const CompetitionRegulations: React.FC<CompetitionRegulationsProps> = ({ comp }) => {
  return (
    <Descriptions column={1} title="规则">
      <Markdown md={comp?.data.RuleMD} />
    </Descriptions>
  );
};

export default CompetitionRegulations;
