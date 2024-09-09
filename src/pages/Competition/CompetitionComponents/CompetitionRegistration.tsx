import React from "react";
import {CompAPI} from "@/services/cubing-pro/comps/typings";

// 定义组件的属性类型
interface CompetitionRegistrationProps {
  comp?: CompAPI.CompResp;
}

const CompetitionRegistration: React.FC<CompetitionRegistrationProps> = ({ comp }) => {
  return (
    <>
      {comp ? (
        <div>{"注册选手界面， 未开发"}</div>
      ) : (
        <p>没有找到比赛信息。</p>
      )}
    </>
  );
}

export default CompetitionRegistration;
