import React from 'react';
import { ContactAdFullContent, ContactAdThumbnail } from './ads/contactAd';
import { CuberwenjunFullContent, CuberwenjunThumbnail } from './ads/cuberwenjun';

/** 单个广告的配置 */
export type AdItem = {
  /** 广告唯一 key，用于 /advertisement?key=xxx */
  key: string;
  /** 缩略图组件，用于轮播展示 */
  Thumbnail: React.FC;
  /** 详情页完整内容组件 */
  FullContent: React.FC;
  /** 轮播展示时长（秒），默认 10 */
  duration?: number;
  /** 是否为内置广告（如联系定制），不跳转详情页 */
  builtin?: boolean;
};

/** 广告注册表：新增广告时在此追加 */
const adRegistry: AdItem[] = [
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
export function getAdList(): AdItem[] {
  return adRegistry;
}

/** 根据 key 获取广告 */
export function getAdByKey(key: string): AdItem | undefined {
  return adRegistry.find((ad) => ad.key === key);
}
