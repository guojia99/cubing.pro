// 定义API响应数据的TypeScript接口
interface WCAUser {
  id: number;
  created_at: string;
  updated_at: string;
  name: string;
  wca_id: string;
  gender: string;
  country_iso2: string;
  url: string;
  country: {
    id: string;
    name: string;
    continent_id: string;
    iso2: string;
  };
  email: string;
  class: string;
  avatar: {
    id: number;
    status: string;
    thumbnail_crop_x: number;
    thumbnail_crop_y: number;
    thumbnail_crop_w: number;
    thumbnail_crop_h: number;
    url: string;
    thumb_url: string;
    is_default: boolean;
    can_edit_thumbnail: boolean;
  };
}

interface WCAUserGroupMetadata {
  id: number;
  email?: string;
  friendly_id?: string;
  locale?: string;
  created_at: string;
  updated_at: string;
}

interface WCAUserGroup {
  id: number;
  name: string;
  group_type: string;
  parent_group_id: number | null;
  is_active: boolean;
  is_hidden: boolean;
  metadata_id: number;
  metadata_type: string;
  created_at: string;
  updated_at: string;
  metadata: WCAUserGroupMetadata;
}

interface WCAUserRoleMetadata {
  id: number;
  status: string;
  location?: string;
  first_delegated?: string;
  last_delegated?: string;
  total_delegated?: number;
  created_at: string;
  updated_at: string;
}

export interface WCAUserRole {
  id: number;
  start_date: string;
  end_date: string | null;
  user: WCAUser;
  group: WCAUserGroup;
  metadata?: WCAUserRoleMetadata;
  class: string;
}

// API响应结构
interface WCAUserRoleResponse {
  data: WCAUserRole[];
}

// 请求函数
export async function fetchUserRoles(userId: number): Promise<WCAUserRole[]> {
  const apiUrl = `https://www.worldcubeassociation.org/api/v0/user_roles?sort=lead%2CeligibleVoter%2CgroupTypeRank%2Cstatus%3Adesc%2CgroupName&isActive=true&isGroupHidden=false&userId=${userId}&per_page=100`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: WCAUserRoleResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching user roles:', error);
    throw error;
  }
}
