export type CaptchaCodeResp = {
  id: string;
  image: string;
  ext: string;
};

export type Token = {
  token: string;
  expire: string;
  status: string;
};

export type CurrentUserData = {
  id: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  Auth: number;
  Name: string;
  EnName: string;
  LoginID: string;
  CubeID: string;
  Avatar: string;
  WcaID: string;
  Email: string;
  QQ: string;
  QQUniID: string;
  Sex: number;
  Birthdate: string;
  Sign: string;
  Level: number;
  Experience: number;
  DelegateName: string;
  [key: string]: unknown;
};

export type CurrentUser = {
  data: CurrentUserData;
};

export type UpdateAvatarRequest = {
  URL: string;
  Data: string;
  ImageName: string;
};

export type UpdateDetailRequest = {
  Name: string;
  EnName: string;
  WcaID: string;
  QQ: string;
  Sex: number;
  Birthdate: string;
  Sign: string;
};
