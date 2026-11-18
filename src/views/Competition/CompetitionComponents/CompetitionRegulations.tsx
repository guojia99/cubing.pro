import React from "react";
import { Descriptions } from "antd";
import Markdown from "@/components/Markdown/Markdown";
import { CompAPI } from "@/services/cubing-pro/comps/typings";
import { useI18n } from "@/contexts/I18nProvider";

interface CompetitionRegulationsProps {
  comp?: CompAPI.CompResp;
}

const CompetitionRegulations: React.FC<CompetitionRegulationsProps> = ({ comp }) => {
  const { t } = useI18n();
  return (
    <Descriptions className="competition-regulations" column={1} title={t('competitionAdmin.rules')}>
      <Markdown md={comp?.data.RuleMD} />
    </Descriptions>
  );
};

export default CompetitionRegulations;
