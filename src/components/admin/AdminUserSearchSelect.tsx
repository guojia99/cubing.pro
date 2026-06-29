"use client";

import { apiAdminPlayers } from "@/services/cubing-pro/auth/admin";
import type { PlayersAPI } from "@/services/cubing-pro/players/typings";
import { Select, Spin } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function pickItems(resp: unknown): PlayersAPI.Player[] {
  if (resp === null || typeof resp !== "object") return [];
  const r = resp as { data?: { items?: PlayersAPI.Player[] } };
  const items = r.data?.items;
  return Array.isArray(items) ? items : [];
}

function playerLabel(p: PlayersAPI.Player): string {
  const wca = p.WcaID ? ` WCA:${p.WcaID}` : "";
  return `${p.Name || "未命名"}（${p.CubeID}）${wca}`;
}

export type AdminUserSearchSelectProps = {
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  onPlayerChange?: (player: PlayersAPI.Player | null) => void;
  mode?: "multiple";
  placeholder?: string;
  allowClear?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

export function AdminUserSearchSelect({
  value,
  onChange,
  onPlayerChange,
  mode,
  placeholder = "输入姓名、CubeID 或 WCA ID 搜索",
  allowClear = true,
  disabled,
  style,
  className,
}: AdminUserSearchSelectProps) {
  const [loading, setLoading] = useState(false);
  const [searchOptions, setSearchOptions] = useState<
    { value: string; label: string; player: PlayersAPI.Player }[]
  >([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prefetchedRef = useRef<string | null>(null);

  const search = useCallback(async (q: string) => {
    const keyword = q.trim();
    if (!keyword) {
      setSearchOptions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiAdminPlayers({
        name: keyword,
        page: 1,
        size: 50,
      });
      const items = pickItems(res);
      setSearchOptions(
        items.map((p) => ({
          value: p.CubeID,
          label: playerLabel(p),
          player: p,
        })),
      );
    } catch {
      setSearchOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    (q: string) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void search(q);
      }, 320);
    },
    [search],
  );

  useEffect(() => {
    if (mode === "multiple") {
      const first = Array.isArray(value) && value.length > 0 ? value[0] : "";
      if (!first) {
        prefetchedRef.current = null;
        return;
      }
      if (first !== prefetchedRef.current) {
        prefetchedRef.current = first;
        void search(first);
      }
      return;
    }
    if (typeof value !== "string" || !value) {
      prefetchedRef.current = null;
      return;
    }
    if (value !== prefetchedRef.current) {
      prefetchedRef.current = value;
      void search(value);
    }
  }, [value, mode, search]);

  const mergedOptions = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    for (const o of searchOptions) {
      map.set(o.value, { value: o.value, label: o.label });
    }
    if (mode === "multiple" && Array.isArray(value)) {
      for (const id of value) {
        if (!map.has(id)) {
          map.set(id, { value: id, label: id });
        }
      }
    } else if (!mode && typeof value === "string" && value && !map.has(value)) {
      map.set(value, { value, label: value });
    }
    return [...map.values()];
  }, [searchOptions, mode, value]);

  if (mode === "multiple") {
    return (
      <Select
        mode="multiple"
        className={className}
        style={style}
        disabled={disabled}
        allowClear={allowClear}
        placeholder={placeholder}
        showSearch
        filterOption={false}
        onSearch={debouncedSearch}
        notFoundContent={loading ? <Spin size="small" /> : undefined}
        options={mergedOptions}
        value={value}
        onChange={(v) => {
          onChange?.(v as string[]);
        }}
        maxTagCount="responsive"
      />
    );
  }

  return (
    <Select
      className={className}
      style={style}
      disabled={disabled}
      allowClear={allowClear}
      placeholder={placeholder}
      showSearch
      filterOption={false}
      onSearch={debouncedSearch}
      notFoundContent={loading ? <Spin size="small" /> : undefined}
      options={mergedOptions}
      value={value || undefined}
      onChange={(cubeId) => {
        const id = cubeId as string;
        onChange?.(id);
        const found = searchOptions.find((x) => x.value === id);
        onPlayerChange?.(found?.player ?? null);
      }}
    />
  );
}
