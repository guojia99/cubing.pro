import React from "react";
import {CompAPI} from "@/services/cubing-pro/comps/typings";
import { useCompetitionPublicI18n } from '../i18n';

// 定义组件的属性类型
interface CompetitionRegistrationProps {
  comp?: CompAPI.CompResp;
}

const CompetitionRegistration: React.FC<CompetitionRegistrationProps> = ({ comp }) => {
  const { t, p } = useCompetitionPublicI18n();
  return (
    <>
      {comp ? (
        <div>{p('competitionPublic.registrationUnavailable')}</div>
      ) : (
        <p>{t('competitionAdmin.noCompetition')}</p>
      )}
    </>
  );
}

export default CompetitionRegistration;
