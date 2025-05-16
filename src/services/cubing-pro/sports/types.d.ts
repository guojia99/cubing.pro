export type SportEvent = {
  id: string;
  name: string;
  icon?: string;
  iconBase64?: string;
};

export type CreateSportEventReq = {
  name: string;
  icon?: string;
  iconBase64?: string;
};

export type SportResult = {
  id: string;
  event_id: string;
  event_name: string;
  user_id: number;
  cube_id: string;
  Result: number;
  date: string;
  ban: boolean;
  rank?: number;
};

export type CreateSportResultReq = {
  event_id: string;
  event_name: string;
  user_id: number;
  cube_id: string;
  result: number;
  date: string;
  ban?: boolean;
};

export type SportResultQuery = {
  page: number;
  page_size: number;

  event_id?: string;
  user_id?: number;
  date?: string; // 格式："YYYY-MM-DD"
};
