import {Record} from "@/components/Data/types/record";

export type KinChSorResultWithEvent = {
  Event: string;
  Result: number;
  IsBest: boolean;
};

export type KinChSorResult = {
  PlayerId: number;
  CubeId: string;
  Rank: number;
  PlayerName: string;
  Result: number;
  Results: KinChSorResultWithEvent[];
};

declare namespace StaticAPI {
  type KinchReq = {
    page: number;
    size: number;
    events: string[];
  };
  type KinchResp = {
    data: {
      items: KinChSorResult[];
      total: number;
    }
  }

  type RecordsReq = {
    GroupId: string;
    EventId: string;
  }

  type RecordsResp = {
    data: {
      Records: Record[],
      Best: any, // Map<string, Record[]>,
      Average: any, //Map<string, Record[]>,
    }
  }

  export type DiyRankWCAResult = {
    BestRank: number,
    BestStr: string,
    BestPersonName: string,
    BestPersonWCAID: string
    AvgRank: number,
    AvgStr: string,
    AvgPersonName: string,
    AvgPersonWCAID: string,
  }

  export type DiyRankWCAResultStaticsResponse = {
    data: any, // map[string]DiyRankWCAResult[]
  }
}
