"use client";

import { useEffect, useState } from "react";
import { getPublicAdvertisements, type Advertisement } from "@/services/cubing-pro/advertisements";

export function useAdvertisements(enabled = true) {
  const [items, setItems] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setLoading(true);
    setFailed(false);
    getPublicAdvertisements({ signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setItems(data.filter(ad => ad.enabled));
    }).catch(() => {
      if (!controller.signal.aborted) setFailed(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [enabled, attempt]);
  return { items, loading: enabled && loading, failed, retry: () => setAttempt(value => value + 1) };
}
