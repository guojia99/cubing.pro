export interface Thank {
  wcaID: string;
  nickname: string;
  amount: number;
  avatar: string;
  other: string;
}

export interface OtherLinks {
  tops: string[];
  groups: string[];
  group_map: Record<string, string[]>;
  links: OtherLink[];
}

export interface OtherLink {
  key: string;
  name: string;
  desc: string;
  url: string;
  icon: string;
  icon_url: string;
}
