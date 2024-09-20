import { eventRouteM, RouteMaps } from '@/utils/cube_result/event_route';

export const DNF = -10000;

export type Result = {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  CompetitionID: number;
  Round: string;
  RoundNumber: number;
  PersonName: string;
  UserID: number;
  Best: number;
  Average: number;
  BestRepeatedlyReduction: number;
  BestRepeatedlyTry: number;
  BestRepeatedlyTime: number;
  ResultJSON: string;
  Result: number[];
  PenaltyJSON: string;
  Penalty: any | null;
  EventID: string;
  EventName: string;
  EventRoute: number;
  Ban: boolean;
  Rank: number;
};

export const DBest = (r: Result): boolean => {
  return r.Best <= DNF;
};

export const DAvg = (r: Result): boolean => {
  return r.Average <= DNF;
};

// Todo  TodoTodoTodoTodoTodoTodoTodoTodoTodoTodoTodoTodoTodoTodoTodoTodo
// Todo 需要考虑3轮以上的多轮项目的计算

const IsBestResult = (r: Result, other: Result): boolean => {
  if (DBest(r) || DBest(other)) {
    return !DBest(r);
  }

  if (RouteMaps.get(r.EventRoute)?.repeatedly) {
    if (r.BestRepeatedlyTime <= DNF || other.BestRepeatedlyTime <= DNF) {
      return !(r.BestRepeatedlyTime <= DNF);
    }
  }

  if (r.Best === other.Best) {
    if (RouteMaps.get(r.EventRoute)?.repeatedly) {
      return r.BestRepeatedlyTime <= other.BestRepeatedlyTime;
    }
    return r.Average <= other.Average;
  }
  if (RouteMaps.get(r.EventRoute)?.repeatedly) {
    return r.Best >= other.Best;
  }
  return r.Best <= other.Best;
};

const IsBestAvgResult = (r: Result, other: Result): boolean => {
  if (RouteMaps.get(r.EventRoute)?.repeatedly) {
    return true;
  }
  if (DAvg(r) || DAvg(other)) {
    return !DAvg(r);
  }
  if (DAvg(r) && DAvg(other)) {
    return IsBestResult(r, other);
  }
  if (r.Average === other.Average) {
    return IsBestResult(r, other);
  }
  return r.Average <= other.Average;
};

export const sortResults = (dst: Result[]) => {
  if (dst.length <= 1) {
    return dst;
  }
  const rom = RouteMaps.get(dst[0].EventRoute);

  dst.sort((a: Result, b: Result) => {
    if (rom?.withBest) {
      return IsBestResult(a, b) ? -1 : 1;
    }
    return IsBestAvgResult(a, b) ? -1 : 1;
  });

  dst[0].Rank = 0;
  let prev = dst[0];
  for (let i = 1; i < dst.length; i++) {
    if (rom?.repeatedly) {
    }

    if (rom?.withBest) {
      if (dst[i].Best === prev.Best) {
        dst[i].Rank = prev.Rank;
        continue;
      }
      dst[i].Rank = i;
      prev = dst[i];
      continue;
    }

    if (dst[i].Average === prev.Average && dst[i].Best === prev.Best) {
      dst[i].Rank = prev.Rank;
      continue;
    }
    dst[i].Rank = i;
    prev = dst[i];
  }
  return dst;
};

export const resultTimeString = (result: number, inter: boolean | undefined = false, omitMilliseconds: boolean = false) => {
  if (isNaN(result)) {
    return 'DNF';
  }

  if (result === -10001) {
    return 'DNS';
  }
  if (result === -10000) {
    return 'DNF';
  }

  if (inter) {
    return '' + Math.floor(result);
  }

  if (result < 60) {
    return omitMilliseconds ? '' + Math.floor(result) : '' + result.toFixed(2);
  }

  const minutes = Math.floor(result / 60);
  const seconds = omitMilliseconds
    ? Math.floor(result % 60).toString().padStart(2, '0')
    : (result % 60).toFixed(2).padStart(5, '0');

  return `${minutes}:${seconds}`;
};

export const resultString = (results: number[], eventRoute: number) => {
  let out: string[] = [];
  const m = eventRouteM(eventRoute);

  const inter = m.integer ? m.integer : false;

  if (m.repeatedly && results.length >= 3) {
    out = [
      [
        resultTimeString(results[0], true),
        '/',
        resultTimeString(results[1], true),
        resultTimeString(results[2], false, true),
      ].join(' '),
    ];
    console.log(results);
    return out;
  }

  for (let i = 0; i < results.length; i++) {
    out.push(resultTimeString(results[i], inter));
  }

  return out;
};

export const resultStringPro = (results: number[], eventRoute: number): string[] => {
  const m = eventRouteM(eventRoute);
  let outs = resultString(results, eventRoute);
  if (m.repeatedly) {
    return outs;
  }

  // todo 目前只考虑一个去头尾
  let bestIndex = 0,
    lastIndex = 0;
  let max_len = 0;
  if (m.headToTailNum && m.headToTailNum >= 1 && results.length === m.rounds) {
    for (let i = 0; i < results.length; i++) {
      if (outs[i].length > max_len) {
        max_len = outs[i].length;
      }
      if (results[i] < results[bestIndex]) {
        bestIndex = i;
      }
      if (results[i] <= DNF || results[i] > results[lastIndex]) {
        lastIndex = i;
      }
    }

    outs[bestIndex] = '(' + outs[bestIndex] + ')';
    outs[lastIndex] = '(' + outs[lastIndex] + ')';
  }

  return outs;
};



export const resultToBest = (result: Result): string => {
  const m = eventRouteM(result.EventRoute)
  if (m.repeatedly){
    return result.BestRepeatedlyReduction + "/" + result.BestRepeatedlyTry + "  " + resultTimeString(result.BestRepeatedlyTime, false, true)
  }

  if (m.withBest){
    return resultTimeString(result.Best)
  }
  return resultTimeString(result.Average)
}
