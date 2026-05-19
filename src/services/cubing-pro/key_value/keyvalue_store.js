import { AuthHeader } from '@/services/cubing-pro/auth/token';
import { Request } from '@/services/cubing-pro/request';
async function getKeyValue(key) {
    const response = await Request.get(`/user/kv/${key}`, {
        headers: AuthHeader(),
    });
    return response.data;
}
async function setKeyValue(key, value) {
    const response = await Request.post(`/user/kv/`, {
        key,
        value: JSON.stringify(value),
        type: 3,
    }, { headers: AuthHeader() });
    return response.data;
}
// 获取某个 key 对应的 map（如果没有，返回空对象）
export async function getKeyMap(key) {
    try {
        const { data } = await getKeyValue(key);
        const raw = data.value ?? data.Value ?? '';
        return raw ? JSON.parse(raw) : {};
    }
    catch (e) {
        // 可以按需处理 404 等错误
    }
    return {}; // 默认空 map
}
// 获取 key 下某个 subkey 的值
export async function getSubKeyValue(key, subKey) {
    const map = await getKeyMap(key);
    return map[subKey];
}
// 设置 key 下某个 subkey 的值
export async function setSubKeyValue(key, subKey, value) {
    const map = await getKeyMap(key);
    map[subKey] = value;
    await setKeyValue(key, map); // 更新整个 map
}
// 删除 key 下的某个 subkey
export async function deleteSubKey(key, subKey) {
    const map = await getKeyMap(key);
    if (subKey in map) {
        delete map[subKey];
        await setKeyValue(key, map);
    }
}
//# sourceMappingURL=keyvalue_store.js.map