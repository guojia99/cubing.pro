import type { ContentLocalization } from "../../../lib/localizedContent";

/** Optional localization properties are proposals, absent from the current Go DTO. */
export interface Thank extends ContentLocalization<"other"> {
  /** Proposed immutable row ID; nickname, wcaID and list position are not row identities. */
  contentId?: string;
  wcaID: string;
  nickname: string;
  amount: number;
  avatar: string;
  other: string;
  pinned?: boolean;
}

/** Proposed group translations use stable groupIds values as field keys, not labels. */
export interface OtherLinks extends ContentLocalization<string> {
  /** Original label -> immutable group ID. Does not replace groups or group_map. */
  groupIds?: Record<string, string>;
  tops: string[];
  groups: string[];
  group_map: Record<string, string[]>;
  links: OtherLink[];
}

export interface OtherLink extends ContentLocalization<"name" | "desc"> {
  key: string;
  name: string;
  desc: string;
  url: string;
  icon: string;
  icon_url: string;
}
