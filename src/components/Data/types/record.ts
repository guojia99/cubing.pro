export type Record = {
  Index: number;
  id: number;
  createdAt: string;
  updatedAt: string;
  EventId: string;
  EventRoute: number;
  ResultId: number;
  UserId: number;
  CubeId: string;
  UserName: string;
  CompsId: number;
  CompsName: string;
  CompsGenre: number;
  Best: number | null;
  Average: number | null;
  Repeatedly: string | null;
  ThisResults: string;
  Type: string;
};


export type MRecord = Record & {
  MEventId: string;
  BestUserCudaId: string;
  BestUserName: string;
  BestRank: number;

  AvgUserCudaId: string;
  AvgUserName: string;
  AvgRank: number;
}
