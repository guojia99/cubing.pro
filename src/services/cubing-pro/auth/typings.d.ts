import type { CompAPI } from "@/services/cubing-pro/comps/typings";
import type { Player } from "@/services/cubing-pro/players/typings";
import type { PreResult } from "@/components/Data/types/result";

export type OrganizersStatus =
  | "NotUse"
  | "Expired"
  | "Using"
  | "Applying"
  | "RejectApply"
  | "UnderAppeal"
  | "RejectAppeal"
  | "Disable"
  | "PermanentlyDisabled"
  | "Disband";

export declare namespace OrganizersAPI {
  type organizer = {
    id: number;
    createdAt: string;
    updatedAt: string;
    Name: string;
    Introduction?: string;
    Email?: string;
    LeaderId?: string;
    Users: Player[];
    Status: OrganizersStatus;
    LeaderRemark?: string;
    AdminMessage?: string;
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
    RuleMD: string;
    RuleHTML: string;
    CompJSON: CompAPI.CompJson;
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
    createdAt: string;
    updatedAt: string;
    deletedAt?: string | null;
    name: string;
    organizersID?: number;
    qqGroups: string;
    qqGroupUid: string;
    wechatGroups: string;
  };

  export type GetGroupsResp = {
    data: {
      items: CompetitionGroup[];
      total: number;
    };
  };

  export type GetPreResultResp = {
    data: {
      items: PreResult[];
      total: number;
    };
  };
}
