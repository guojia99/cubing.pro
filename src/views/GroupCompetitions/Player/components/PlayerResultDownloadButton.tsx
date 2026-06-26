import { eventRouteM } from '@/components/Data/cube_result/event_route';
import { Result, resultString, resultTimeString } from '@/components/Data/types/result';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { Tooltip } from 'antd';
import { saveAs } from 'file-saver';
import React, { useEffect, useState } from 'react';
import { AiOutlineDownload } from 'react-icons/ai';
import * as XLSX from 'xlsx';

interface DownloadExcelButtonProps {
  player?: PlayersAPI.Player;
  results: Result[];
}

const DownloadExcelButton: React.FC<DownloadExcelButtonProps> = ({ player, results }) => {
  const [data, setData] = useState<any[]>();

  useEffect(() => {
    const da = results.sort((a: Result, b: Result) => {
      if (a.CompetitionID !== b.CompetitionID) {
        return a.CompetitionID - b.CompetitionID;
      }
      if (a.RoundNumber !== b.RoundNumber) {
        return a.RoundNumber - b.RoundNumber;
      }
      return a.EventID.localeCompare(b.EventID);
    });

    const d = [];
    for (let i = 0; i < da.length; i++) {
      const m = eventRouteM(da[i].EventRoute);

      const resultStrs = resultString(da[i].Result, da[i].EventRoute);

      d.push({
        比赛名称: da[i].CompetitionName,
        项目: da[i].EventID,
        轮次: da[i].Round,
        单次: resultTimeString(da[i].Best, m.integer),
        平均: resultTimeString(da[i].Average),
        ...resultStrs.reduce((acc, val, idx) => {
          acc[`成绩${idx + 1}`] = val;
          return acc;
        }, {} as Record<string, string>),
      });
    }
    setData(d);
  }, [results]);

  const handleDownload = () => {
    if (!data || !player) {
      return;
    }

    // 将 JSON 转为 worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    worksheet['!cols'] = [{ wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];

    // 创建 workbook 并添加 worksheet
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, '个人成绩');

    // 写入到 ArrayBuffer
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // 使用 file-saver 下载
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, player.Name + '.xlsx');
  };

  return (
    <Tooltip title="点击下载成绩列表">
      <AiOutlineDownload
        onClick={handleDownload}
        style={{ marginRight: 8, fontSize: 28, cursor: 'pointer' }}
      />
    </Tooltip>
  );
};

export default DownloadExcelButton;
