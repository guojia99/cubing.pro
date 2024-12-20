// @ts-ignore
/* eslint-disable */

import { CompAPI } from '@/services/cubing-pro/comps/typings';
import { Player } from '@/services/cubing-pro/players/typings';

declare namespace AuthAPI {
  type captchaCodeResp = {
    id: string;
    image: string;
    ext: string;
  };

  type Token = {
    token: string;
    expire: string;
    status: string;
  };

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
  };

  type GetEmailCodeResponse = {
    email: string;
    timeout: string;
    lastSendTime: string;
  };

  type CurrentUserData = {
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
  };

  type CurrentUser = {
    data: CurrentUserData;
  };

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
    QQ: string;
  };

  type UpdateAvatarRequest = {
    URL: string;
    Data: string;
    ImageName: string;
  };

  type UpdateDetailRequest = {
    Name: string;
    EnName: string;
    WcaID: string;
    QQ: string;
    Sex: number;
    Birthdate: string;
    Sign: string;
  };
}

export type OrganizersStatus =
  | 'NotUse'
  | 'Expired' // 过期
  | 'Using' // 使用中
  | 'Applying' // 申请中
  | 'RejectApply' // 驳回申请
  | 'UnderAppeal' // 申诉中
  | 'RejectAppeal' // 驳回申诉
  | 'Disable' // 禁用
  | 'PermanentlyDisabled' // 永久禁用
  | 'Disband'; // 解散 无法使用

export declare namespace OrganizersAPI {
  type organizer = {
    id: number;
    createdAt: string;
    updatedAt: string;

    Name: string; // 名
    Introduction?: string; // 介绍 md
    Email?: string; // 邮箱

    LeaderId?: string; // 组长 cubeID
    Users: Player[]; // 成员列表
    Status: OrganizersStatus; // 状态

    LeaderRemark?: string; // 组长备注
    AdminMessage?: string; // 管理员留言
  };

  export type MeOrganizersResp = {
    data: {
      items: organizer[];
      total: number;
    };
  };

  export type OrganizersResp = {
    data: organizer;
  };

  export type CreateCompReq = {
    Name: string;
    StrId: string;

    Illustrate: string;
    IllustrateHTML: string;
    // Location: string;
    // Country: string;
    // City: string;
    RuleMD: string;
    RuleHTML: string;
    CompJSON: CompAPI.CompJson; // 需要导入相应类型
    Genre: number;
    Count: number;
    CanPreResult: boolean;
    CompStartTime: string;
    CompEndTime: string;
    GroupID: number;
    CanStartedAddEvent: boolean;

    Apply: boolean;
  };

  export type CompetitionGroup = {
    id: number;
    createdAt: string; // 创建时间
    updatedAt: string; // 更新时间
    deletedAt?: string | null; // 删除时间，可选

    name: string; // 比赛组名称
    organizersID?: number; // 主办团队的 ID，可为空

    qqGroups: string; // QQ 群组
    qqGroupUid: string; // QQ 群组的 UID
    wechatGroups: string; // 微信群组
  };

  export type GetGroupsResp = {
    data: {
      items: CompetitionGroup[];
      total: number;
    };
  };
}
