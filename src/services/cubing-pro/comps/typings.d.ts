import { Comp } from '@/components/Data/types/comps';
import { Result } from '@/components/Data/types/result';

declare namespace CompsAPI {
  type CompsReq = {
    page: number;
    size: number;
    name: string;

    // like: Map<string, string>, // json
    // search: Map<string, string>, // json
    // start_time: number,  // json
    // end_time: number, // json
  };

  type CompsResp = {
    data: {
      items: Comp[];
      total: number;
    };
  };
}

declare namespace CompAPI {
  type Schedule = {
    EventName: string;
    Round: string;
    Stage: string;
    Event: string;
    IsComp: boolean;
    StartTime:  string |  Date | null;
    EndTime: string |  Date | null;
    ActualStartTime:  string |  Date | null;
    ActualEndTime:  string |  Date | null;
    RoundNum: number;
    Format: string;
    IsRunning: boolean;
    FirstRound: boolean;
    FinalRound: boolean;
    AdvancedToNextRound: string | null;
    Cutoff: number;
    CutoffNumber: number;
    Competitors: number;
    TimeLimit: number;
    NoRestrictions: boolean;
  };

  type Event = {
    EventName: string;
    EventID: string;
    EventRoute: number;
    SingleQualify: number;
    AvgQualify: number;
    IsComp: boolean;
    HasResultsQualify: boolean;
    Schedule: Schedule[];
    Done: boolean;
  };

  type CostDetail = {
    Value: number;
    StartTime: string;
    EndTime: string;
  };

  type Cost = {
    BaseCost: CostDetail;
    Costs: any | null; // todo
    EventCost: any | null; // todo
  };

  type CompJson = {
    Events: Event[];
    Cost: Cost;
  };

  type Org = {
    Name: string;
    Introduction: string;
    Email: string;
    QQGroup: string;
  };

  type Group = {
    name: string;
    qq_groups: string;
    qq_group_uid: string;
    wechat_groups: string;
  };

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

    RegistrationStartTime: string; // 报名开始时间
    RegistrationEndTime: string; // 报名结束时间
    RegistrationCancelDeadlineTime: string; // 退赛截止时间
    IsRegisterRestart: string;
    RegistrationRestartTime: string; // 报名重开时间

    OrganizersID: number;
    Org: Org;
    Group: Group;

    RegisterNum: number;
    CompedNum: number;

    EarliestID: number;
    EarliestName: string;

    LatestID: number;
    LatestName: string;
  };

  type CompResp = {
    code: string;
    data: Data;
    msg: string;
  };

  type CreateCompReq = Data
}

declare namespace CompResultAPI {
  type CompResultResp = {
    code: string;
    data: Result[];
    msg: string;
  };
}

declare namespace CompRecordAPI {
  type CompRecordResp = {
    code: string;
    data: Record[];
    msg: string;
  };
}

