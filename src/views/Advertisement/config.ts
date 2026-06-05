import type { ComponentType } from "react";

import { ContactAdFullContent, ContactAdThumbnail } from "@/views/Advertisement/ads/contactAd";
import { CuberwenjunFullContent, CuberwenjunThumbnail } from "@/views/Advertisement/ads/cuberwenjun";

export type AdItem = {
  key: string;
  Thumbnail: ComponentType;
  FullContent: ComponentType;
  duration?: number;
  builtin?: boolean;
};

const adRegistry: AdItem[] = [
  {
    key: "cuberwenjun",
    Thumbnail: CuberwenjunThumbnail,
    FullContent: CuberwenjunFullContent,
    duration: 10,
  },
  {
    key: "contact",
    Thumbnail: ContactAdThumbnail,
    FullContent: ContactAdFullContent,
    duration: 3,
    builtin: true,
  },
];

export function getAdList(): AdItem[] {
  return adRegistry;
}

export function getAdByKey(key: string): AdItem | undefined {
  return adRegistry.find((ad) => ad.key === key);
}
