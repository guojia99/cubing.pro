import { eventRouteM } from '@/components/Data/cube_result/event_route';
import type { CompAPI } from '@/services/cubing-pro/comps/typings';
import type { EventsAPI } from '@/services/cubing-pro/events/typings';
import { buildScrambleRowsForGroup } from './buildScrambleRows';
import type { EventContext } from './types';

export function buildEventContexts(
  events: CompAPI.Event[],
  baseEvents: EventsAPI.Event[],
): EventContext[] {
  const out: EventContext[] = [];

  for (const ev of events) {
    if (!ev.IsComp) {
      continue;
    }
    const baseEvent = baseEvents.find((b) => b.id === ev.EventID);
    if (!baseEvent) {
      continue;
    }

    const route = eventRouteM(ev.EventRoute);
    const scheduleRounds: EventContext['scheduleRounds'] = [];

    for (let scheduleIdx = 0; scheduleIdx < ev.Schedule.length; scheduleIdx++) {
      const sc = ev.Schedule[scheduleIdx];
      if (!sc.Scrambles || sc.Scrambles.length === 0) {
        continue;
      }
      const ssc = sc.Scrambles[0];
      const rows = buildScrambleRowsForGroup(ssc, ev, baseEvent);
      if (rows === 'skip') {
        scheduleRounds.push({
          scheduleIdx,
          roundTitle: sc.Round,
          rows: [],
          skipped: true,
        });
        continue;
      }
      scheduleRounds.push({
        scheduleIdx,
        roundTitle: sc.Round,
        rows,
        skipped: false,
      });
    }

    if (scheduleRounds.length === 0) {
      continue;
    }

    out.push({
      event: ev,
      baseEvent,
      route,
      scheduleRounds,
    });
  }

  return out;
}
