import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
/** 与后端 user.MaxKVLength 一致 */
export const USER_KV_MAX_BYTES = 2 * 1024 * 1024;
export const USER_KV_KEYS = {
    algorithm_config: 'algorithm_config',
    /** 网页设置（与后端白名单一致） */
    website_ui_config: 'website_ui_config',
    /** 群赛计时器外观 */
    group_timer_ui_config: 'group_timer_ui_config',
    /** 历史键名，仅用于兼容读取旧数据 */
    websize_ui_config: 'websize_ui_config',
};
export function assertPayloadWithinLimit(raw) {
    if (typeof Blob !== 'undefined') {
        if (new Blob([raw]).size > USER_KV_MAX_BYTES) {
            throw new Error(`数据超过 ${USER_KV_MAX_BYTES} 字节上限，无法上传`);
        }
    }
    else if (raw.length > USER_KV_MAX_BYTES) {
        throw new Error(`数据超过 ${USER_KV_MAX_BYTES} 字节上限，无法上传`);
    }
}
/** GET /user/kv 个人 KV 元数据列表（不含 value） */
export async function listUserKvs() {
    const r = await Request.get(`/user/kv`, {
        headers: AuthHeader(),
    });
    return r.data.data ?? [];
}
/** GET /user/kv/:key 单条（含 value） */
export async function getUserKv(key) {
    const r = await Request.get(`/user/kv/${encodeURIComponent(key)}`, {
        headers: AuthHeader(),
    });
    const row = r.data.data;
    return {
        ...row,
        value: row.value ?? row.Value ?? '',
    };
}
/** POST /user/kv/ 写入（upsert） */
export async function setUserKv(key, value, type, options) {
    assertPayloadWithinLimit(value);
    await Request.post(`/user/kv/`, { key, value, type }, {
        headers: AuthHeader(),
        onUploadProgress: (ev) => {
            if (ev.total && options?.onUploadProgress) {
                options.onUploadProgress(Math.round((ev.loaded * 100) / ev.total));
            }
        },
    });
}
//# sourceMappingURL=user_kv.js.map