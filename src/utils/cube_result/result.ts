import {eventRouteM, RouteMaps} from "@/utils/cube_result/event_route";

export const DNF = -10000

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
}


export const DBest = (r: Result): boolean => {
  return r.Best <= DNF
}

export const DAvg = (r: Result): boolean => {
  return r.Average <= DNF
}


// Todo  TodoTodoTodoTodoTodoTodoTodoTodoTodoTodoTodoTodoTodoTodoTodoTodo
// Todo 需要考虑3轮以上的多轮项目的计算

const IsBestResult = (r: Result, other: Result): boolean => {
  if (DBest(r) || DBest(other)) {
    return !DBest(r)
  }

  if (r.Best == other.Best) {
    if (RouteMaps.get(r.EventRoute)?.repeatedly) {
      return r.BestRepeatedlyTime <= other.BestRepeatedlyTime
    }
    return r.Average <= other.Average
  }
  if (RouteMaps.get(r.EventRoute)?.repeatedly) {
    return r.Best >= other.Best
  }
  return r.Best <= other.Best
}

const IsBestAvgResult = (r: Result, other: Result): boolean => {
  if (RouteMaps.get(r.EventRoute)?.repeatedly) {
    return true
  }
  if (DAvg(r) || DAvg(other)) {
    return !DAvg(r)
  }
  if (DAvg(r) && DAvg(other)) {
    return IsBestResult(r, other)
  }
  if (r.Average == other.Average) {
    return IsBestResult(r, other)
  }
  return r.Average <= other.Average
}

export const sortResults = (dst: Result[]) => {
  if (dst.length <= 1) {
    return dst
  }
  const rom = RouteMaps.get(dst[0].EventRoute)

  dst.sort((a: Result, b: Result) => {
    if (rom?.withBest) {
      return IsBestResult(a, b) ? -1 : 1;
    }
    return IsBestAvgResult(a, b) ? -1 : 1;
  })

  dst[0].Rank = 0
  let prev = dst[0]
  for (let i = 1; i < dst.length; i++) {
    if (rom?.withBest) {
      if (dst[i].Best == prev.Best) {
        dst[i].Rank = prev.Rank
        continue
      }
      dst[i].Rank = i
      prev = dst[i]
      continue
    }

    if (dst[i].Average == prev.Average && dst[i].Best == prev.Best) {
      dst[i].Rank = prev.Rank
      continue
    }
    dst[i].Rank = i
    prev = dst[i]
  }
  return dst
}


export const resultTimeString = (result: number, inter: boolean | undefined = false) => {
  if (isNaN(result)) {
    return "DNF"
  }

  if (result === -10001) {
    return "DNS"
  }
  if (result === -10000) {
    return "DNF"
  }
  //
  if (inter) {
    return "" + Math.floor(result)
  }
  if (result < 60) {
    return "" + result.toFixed(2);
  }
  const minutes = Math.floor(result / 60);
  const seconds = (result % 60).toFixed(2).padStart(5, '0');
  return `${minutes}:${seconds}`;

}
export const resultString = (results: number[], eventRoute: number) => {
  let out: string[] = []
  const m = eventRouteM(eventRoute)

  const inter = m.integer ? m.integer : false

  if (m.repeatedly && results.length >= 3) {
    out = [
      [resultTimeString(results[0], true),
        "/",
        resultTimeString(results[1], true),
        resultTimeString(results[2]),].join(" ")
    ]
    return out
  }

  for (let i = 0; i < results.length; i++) {
    out.push(resultTimeString(results[i], inter))
  }

  return out
}
