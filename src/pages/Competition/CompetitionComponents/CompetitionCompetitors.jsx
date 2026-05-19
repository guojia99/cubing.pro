import React from "react";
const CompetitionCompetitors = ({ comp }) => {
    return (<>
      {comp ? (<div>
          <h2>{comp.data.Name}</h2>
          <p>{comp.data.EventMin}</p>
          {/* 根据 comp 的内容进行更多渲染 */}
        </div>) : (<p>没有找到比赛信息。</p>)}
    </>);
};
export default CompetitionCompetitors;
//# sourceMappingURL=CompetitionCompetitors.jsx.map