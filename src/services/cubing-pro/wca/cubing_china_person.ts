import { Request } from '@/services/cubing-pro/request';

/** 与后端 `internel/crawler/cubing/person_page.go` PersonPageCode 一致 */
export type CubingPersonPageCode =
  | 'OK'
  | 'INVALID_WCA_ID'
  | 'NOT_FOUND'
  | 'WCA_ID_MISMATCH'
  | 'UPSTREAM_HTTP_ERROR'
  | 'UPSTREAM_READ_ERROR'
  | 'PARSE_ERROR'
  | 'RECOVERED_PANIC';

export type CubingPersonFields = {
  wca_id: string;
  name: string;
  avatar_url?: string;
  details?: Record<string, string>;
};

export type CubingPersonPageResult = {
  code: CubingPersonPageCode;
  message?: string;
  requested_wca_id: string;
  person?: CubingPersonFields;
};

type ApiEnvelope<T> = {
  code: string;
  data: T;
  msg: string;
};

/**
 * GET /wca/cubing-china/person/:wcaID（后端代理粗饼选手页）
 * WCA ID 非法时后端返回 400；合法时 HTTP 200，data.code 区分 OK / NOT_FOUND 等。
 */
export async function apiGetCubingChinaPerson(wcaId: string): Promise<CubingPersonPageResult> {
  const id = wcaId.trim();
  if (id.length !== 10) {
    throw new Error('WCA ID 长度应为 10');
  }
  const res = await Request.get<ApiEnvelope<CubingPersonPageResult>>(`/wca/cubing-china/person/${encodeURIComponent(id)}`);
  return res.data.data;
}
