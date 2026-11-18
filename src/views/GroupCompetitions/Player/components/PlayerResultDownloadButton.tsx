import { eventRouteM } from '@/components/Data/cube_result/event_route';
import { Result, resultString, resultTimeString } from '@/components/Data/types/result';
import { PlayersAPI } from '@/services/cubing-pro/players/typings';
import { Button, Tooltip } from 'antd';
import { saveAs } from 'file-saver';
import React, { useEffect, useState } from 'react';
import { AiOutlineDownload } from 'react-icons/ai';
import * as XLSX from 'xlsx';
import { useI18n } from '@/contexts/I18nProvider';
import { formatRoundName } from '@/i18n/messages/domain';

interface DownloadExcelButtonProps {
  player?: PlayersAPI.Player;
  results: Result[];
}

const DownloadExcelButton: React.FC<DownloadExcelButtonProps> = ({ player, results }) => {
  const { t, tf, locale } = useI18n();
  const [data, setData] = useState<any[]>();

  useEffect(() => {
    const da = [...results].sort((a: Result, b: Result) => {
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
        [t('competitionAdmin.competition')]: da[i].CompetitionName,
        [t('competitionAdmin.event')]: da[i].EventID,
        [t('competitionAdmin.round')]: formatRoundName(da[i].Round, locale),
        [t('competitionAdmin.single')]: resultTimeString(da[i].Best, m.integer),
        [t('competitionAdmin.average')]: resultTimeString(da[i].Average),
        ...resultStrs.reduce((acc, val, idx) => {
          acc[tf('competitionAdmin.attempt', { count: idx + 1 })] = val;
          return acc;
        }, {} as Record<string, string>),
      });
    }
    setData(d);
  }, [results, t, tf, locale]);

  const handleDownload = () => {
    if (!data || !player) {
      return;
    }

    // 将 JSON 转为 worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    worksheet['!cols'] = [{ wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }];

    // 创建 workbook 并添加 worksheet
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, t('competitionAdmin.personalResults'));

    // 写入到 ArrayBuffer
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

    // 使用 file-saver 下载
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, player.Name + '.xlsx');
  };

  return (
    <Tooltip title={t('competitionAdmin.downloadHint')}>
      <Button
        icon={<AiOutlineDownload />}
        onClick={handleDownload}
      >{t('competitionAdmin.download')}</Button>
    </Tooltip>
  );
};

export default DownloadExcelButton;
