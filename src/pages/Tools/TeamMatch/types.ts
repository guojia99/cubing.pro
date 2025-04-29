
// 类型定义
export type Player = {
  id?: string;
  name: string;
  seeded: boolean;
  man: string[];

  // step2使用的
  seed?: number;

  groupName: string;
};

export type Group = {
  name: string;
  players: Player[];
};

export type TableData = Group[];

export type Context = {
  Name: string;
  ShowFullScreen: boolean;
  Step1TableData: TableData;
}
