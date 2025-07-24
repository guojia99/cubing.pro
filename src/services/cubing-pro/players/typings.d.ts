import { Record } from '@/components/Data/types/record';
import { Result } from '@/components/Data/types/result';
import { CompsAPI } from '@/services/cubing-pro/comps/typings';
import { KinChSorResult } from '@/services/cubing-pro/statistics/typings';

declare namespace PlayersAPI {
  export type Detail = {
    RestoresNum: number;
    SuccessesNum: number;
    Matches: number;
    PodiumNum: number;
  };

  export type BestResults = {
    Index: number;
    PlayerId: number;
    CubeId: string;
    PlayerName: string;
    Single: any; // Map<string, Result>; // eventId key
    Avgs: any; // Map<string, Result>;
  };

  export type Player = {
    id: number;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
    Auth: number;
    Name: string;
    EnName: string;
    LoginID: string;
    CubeID: string;
    Password: string;
    HistoryPassword: string;
    Hash: string;
    InitPassword: string;
    ActivationTime: string | null;
    Token: string;
    LoginTime: string | null;
    LoginIp: string;
    Online: number;
    Ban: boolean;
    BanReason: string;
    SumPasswordWrong: number;
    PassWordLockTime: string | null;
    LastUpdateNameTime: string | null;
    Sign: string;
    Avatar: string;
    CoverPhoto: string;
    Level: number;
    Experience: number;
    UseExperience: number;
    QQ: string;
    QQUniID: string;
    Wechat: string;
    WechatUnitID: string;
    WcaID: string;
    Phone: string;
    Email: string;
    ActualName: string;
    Sex: number;
    Nationality: string;
    Province: string;
    Birthdate: string | null;
    Address: string;
    DelegateName: string;
    Detail: Detail;
    BestResults: BestResults;
    Index: number;
  };

  type PlayersReq = {
    page: number;
    size: number;
    name: string;
  };

  export type PlayersResp = {
    data: {
      items: Player[];
      total: number;
    };
  };

  export type PlayerResp = {
    data: Player;
  };

  export type PlayerResultResp = {
    data: {
      All: Result[];
    };
  };

  export type PlayerRecordResp = {
    data: Record[];
  };

  export type PlayerNemesisResp = {
    data: BestResults[];
  };

  export type PlayerCompsResp = {
    data: {
      items: CompsAPI.Comp[];
    };
  };

  export type PlayerSorResp = {
    data: KinChSorResult;
  };

  export type CreatePlayerReq = {
    name: string;
    qq: string;
    actualName: string;
    wca_id: string;
  }

  export type UpdatePlayerNameWCAIDReq = {
    new_name: string;
    cube_id: string;
    wca_id: string;
  }


}
