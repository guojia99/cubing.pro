import {Result} from "@/utils/cube_result/result";

declare namespace CompsAPI {
  type Comp = {
    id: number,
    StrId: string,
    Name: string,
    country: string,
    City: string,
    Genre: number,
    CompStartTime: string,
    CompEndTime: string,
    EventMin: string,
    Series: string,
    Status: string,
    logo: string,
  }

  type CompsReq = {
    page: number,
    size: number,
    name: string,

    // like: Map<string, string>, // json
    // search: Map<string, string>, // json
    // start_time: number,  // json
    // end_time: number, // json
  }

  type CompsResp = {
    data: {
      items: Comp[],
      total: number,
    }
  }

}


declare namespace CompAPI {
  type Schedule = {
    Round: string;
    Event: string;
    IsComp: boolean;
    StartTime: string;
    EndTime: string;
    ActualStartTime: string;
    ActualEndTime: string;
    NoRestrictions: boolean;
    RoundNum: number;
    IsRunning: boolean;
    FirstRound: boolean;
    FinalRound: boolean;
    AdvancedToNextRound: string | null;
  }

  type Event = {
    EventName: string;
    EventID: string;
    EventRoute: number;
    IsComp: boolean;
    Schedule: Schedule[];
    Done: boolean;
  }

  type CostDetail = {
    Value: number;
    StartTime: string;
    EndTime: string;
  }

  type Cost = {
    BaseCost: CostDetail;
    Costs: any | null;  // todo
    EventCost: any | null;  // todo
  }

  type CompJson = {
    Events: Event[];
    Cost: Cost;
  }

  type Org = {
    Name: string;
    Introduction: string;
    Email: string;
    QQGroup: string;
  }

  type Data = {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    Status: string;
    Name: string;
    Illustrate: string;
    City: string;
    RuleMD: string;
    comp_json: CompJson;
    EventMin: string;
    logo: string;
    Genre: number;
    Count: number;
    AutomaticReview: boolean;
    CanPreResult: boolean;
    CompStartTime: string;
    CompEndTime: string;
    IsDone: boolean;


    RegistrationStartTime: string;        // 报名开始时间
    RegistrationEndTime: string;    // 报名结束时间
    RegistrationCancelDeadlineTime: string; // 退赛截止时间
    IsRegisterRestart: string;
    RegistrationRestartTime: string;// 报名重开时间

    OrganizersID: number;
    Org: Org;
  }

  type CompResp = {
    code: string;
    data: Data;
    msg: string;
  }
}


declare namespace CompResultAPI {
  type CompResultResp = {
    code: string;
    data: Result[];
    msg: string;
  }
}