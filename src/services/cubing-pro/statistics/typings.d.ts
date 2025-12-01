import {Record} from "@/components/Data/types/record";
import { apiDiyRankingSor } from '@/services/cubing-pro/statistics/diy_ranking';

export type KinChSorResultWithEvent = {
  Event: string;
  Result: number;
  IsBest: boolean;
  UseSingle: boolean;
  ResultString: string;
};

export type KinChSorResult = {
  PlayerId: number;
  CubeId: string;
  Rank: number;
  wca_id: string;
  WcaName: string;
  PlayerName: string;
  CountryIso2: string;
  Result: number;
  Results: KinChSorResultWithEvent[];
};

declare namespace StaticAPI {
  type KinchReq = {
    page: number;
    size: number;
    age: number;
    events: string[];
    country: string[];
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

  export type DiyRankKeyValue = {
    id: string,
    Value: string,
    Description: string,
  }


  interface Player {
    wca_id: string;
    WcaName: string;
    PlayerId: number;     // Go 中的 uint 在 JSON 中通常为 number
    CubeId: string;
    PlayerName: string;
  }

  interface SorResultWithEvent {
    Event: string;
    IsBest: boolean;
    ResultString: string;
    Rank: number;
  }

  interface SorResult extends Player {
    Rank: number;
    Sor: number;
    Results: SorResultWithEvent[];
  }

  interface apiDiyRankingSorRequest extends KinchReq{
    withSingle: boolean;
    withAvg: boolean;
  }
}


