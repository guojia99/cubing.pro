
declare namespace PlayersAPI {

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
  }

  type PlayersReq = {
    page: number;
    size: number;
    name: string;
  }

  type PlayersResp = {
    data: {
      items: Player[];
      total: number;
    }
  }

  type PlayerResp = {
    data: Player;
  }
}

