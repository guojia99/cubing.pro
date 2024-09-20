import { Result } from '@/utils/cube_result/result';

export type resultsToMapOut = {
  withEvent: Map<string, Result[]>;
  withPlayer: Map<string, Result[]>;
};

export const resultsToMap = (results: Result[]): resultsToMapOut => {
  let withEvent = new Map<string, Result[]>();
  let withPlayer = new Map<string, Result[]>();

  for (const result of results) {
    if (withEvent.get(result.EventID) === undefined) {
      withEvent.set(result.EventID, []);
    }
    let list = withEvent.get(result.EventID) as Result[];
    list.push(result);
    withEvent.set(result.EventID, list);

    if (withPlayer.get(result.PersonName) === undefined) {
      withPlayer.set(result.PersonName, []);
    }
    let list2 = withPlayer.get(result.PersonName) as Result[];
    list2.push(result);
    withPlayer.set(result.PersonName, list2);
  }


  return {
    withEvent: withEvent,
    withPlayer: withPlayer,
  };
};
