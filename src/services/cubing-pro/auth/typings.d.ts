// @ts-ignore
/* eslint-disable */


declare namespace AuthAPI {
  type captchaCodeResp = {
    id: string;
    image: string;
    ext: string;
  }

  type Token = {
    token: string,
    expire: string,
    status: string;
  }

  type LoginRequest = {
    loginID: string;
    password: string;
    timestamp: number;
    verifyId: string;
    verifyValue: string;

    type: string; // 预留， 登录类型
  };

  type GetEmailCodeRequest = {
    name: string;
    email: string;
  }

  type GetEmailCodeResponse = {
    email: string;
    timeout: string;
    lastSendTime: string;
  }

  type CurrentUser = {
    id: number;
    createdAt: string; // 可以使用 Date 类型，但需要在处理时进行转换
    updatedAt: string; // 同上
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
    ActivationTime: string; // 同上
    Token: string;
    LoginTime: string; // 同上
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
    Birthdate: string; // 同上
    Address: string;
    DelegateName: string;
  }

  type RegisterRequest = {
    loginID: string;
    userName: string;
    actualName: string;
    enName: string;
    password: string;
    timestamp: number;
    email: string;
    emailCode: string;
    cubeID: string;
    initPassword: string;
  }
}
