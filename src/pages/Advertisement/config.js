import { ContactAdFullContent, ContactAdThumbnail } from './ads/contactAd';
import { CuberwenjunFullContent, CuberwenjunThumbnail } from './ads/cuberwenjun';
/** 广告注册表：新增广告时在此追加 */
const adRegistry = [
    {
        key: 'cuberwenjun',
        Thumbnail: CuberwenjunThumbnail,
        FullContent: CuberwenjunFullContent,
        duration: 10,
    },
    {
        key: 'contact',
        Thumbnail: ContactAdThumbnail,
        FullContent: ContactAdFullContent,
        duration: 3,
        builtin: true,
    },
];
/** 获取所有广告（用于轮播） */
export function getAdList() {
    return adRegistry;
}
/** 根据 key 获取广告 */
export function getAdByKey(key) {
    return adRegistry.find((ad) => ad.key === key);
}
//# sourceMappingURL=config.js.map