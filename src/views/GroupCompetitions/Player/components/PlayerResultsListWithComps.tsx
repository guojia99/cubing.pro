import { ResultsTable } from '@/components/Data/cube_result/result_tables';
import { SectionHeader } from '@/components/ui/page';
import { Comp } from '@/components/Data/types/comps';
import { Record } from '@/components/Data/types/record';
import { Result } from '@/components/Data/types/result';
import { CompetitionLink } from '@/components/Link/GcLinks';
import { EventsAPI } from '@/services/cubing-pro/events/typings';
import React from 'react';
import { useI18n } from '@/contexts/I18nProvider';
import { formatRoundName } from '@/i18n/messages/domain';

interface PlayerResultsListWithCompsProps {
  events: EventsAPI.Event[];
  results: Result[];
  records: Record[];
  comps: Comp[];
}

const PlayerResultsListWithComps: React.FC<PlayerResultsListWithCompsProps> = ({
  events,
  results,
  records,
  comps,
}) => {
  const { locale } = useI18n();
  const resultMap = new Map<number, Result[]>();

  // 按CompsId进行分组
  results.forEach((result) => {
    const compId = result.CompetitionID;
    if (!resultMap.has(compId)) {
      resultMap.set(compId, []);
    }
    resultMap.get(compId)!.push({ ...result, Round: formatRoundName(result.Round, locale) });
  });
  const eventOrderMap = new Map<string, number>();
  events.forEach((event, index) => {
    eventOrderMap.set(event.id, index);
  });
  resultMap.forEach((resultList, compId) => {
    resultMap.set(
      compId,
      resultList.sort((a, b) => {
        const ev =  (eventOrderMap.get(a.EventID) || 0) - (eventOrderMap.get(b.EventID) || 0);
        return ev === 0 ? a.RoundNumber - b.RoundNumber :ev
      }),
    );
  });

  const bodys: React.ReactNode[] = [];
  for (let i = 0; i < comps.length; i++) {
    const comp = comps[i];
    const results = resultMap.get(comp.id);
    if (results === undefined || results.length === 0) {
      continue;
    }

    bodys.push(
      <section key={comp.id} style={{ marginTop: 24, minWidth: 0 }}>
        <SectionHeader title={CompetitionLink(comp.id, comp.Name)} />
        {ResultsTable(
          results,
          ['EventNameOnlyOne', 'Round', 'Best', 'Average', 'Result'],
          records,
          undefined,
          false,
        )}
      </section>,
    );
  }

  return <div style={{ minWidth: 0, maxWidth: '100%' }}>{bodys}</div>;
};

export default PlayerResultsListWithComps;
