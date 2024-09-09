import React from "react";
import {CompAPI} from "@/services/cubing-pro/comps/typings";

// 定义组件的属性类型
interface CompetitionCompetitorsProps {
  comp?: CompAPI.CompResp;
}

const CompetitionCompetitors :React.FC<CompetitionCompetitorsProps> = ({ comp }) => {
  return (
    <>
      {comp ? (
        <div>
          <h2>{comp.data.Name}</h2>
          <p>{comp.data.EventMin}</p>
          {/* 根据 comp 的内容进行更多渲染 */}
        </div>
      ) : (
        <p>没有找到比赛信息。</p>
      )}
    </>
  );
}

export default CompetitionCompetitors;
