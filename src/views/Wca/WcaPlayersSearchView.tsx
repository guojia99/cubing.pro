"use client";

import "antd/dist/reset.css";

import { Alert, Input, Spin, Table, Typography } from "antd";
import { useEffect, useRef, useState } from "react";

import { WCALink, WCALinkWithCnName } from "@/components/Link/WcaLinks";
import { useI18n } from "@/contexts/I18nProvider";
import { getCountryNameByIso2 } from "@/views/Wca/PlayerComponents/region/all_contiry";
import { getWCAPersons } from "@/services/cubing-pro/wca/player";
import type { WCAPerson } from "@/services/cubing-pro/wca/types";

const { Title } = Typography;

function isValidWCAPersonArray(data: unknown): data is WCAPerson[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      item &&
      typeof item === "object" &&
      typeof (item as WCAPerson).wca_id === "string" &&
      typeof (item as WCAPerson).name === "string",
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 600,
  fontSize: "18px",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid var(--border-default)",
  boxShadow: "0 2px 8px color-mix(in srgb, var(--foreground) 8%, transparent)",
};

export function WcaPlayersSearchView() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WCAPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed === "") {
      setResults((prev) => (prev.length === 0 ? prev : []));
      setError((prev) => (prev === null ? prev : null));
      return;
    }

    if (trimmed.length > 32) {
      setError(t("wca.players.errorMaxLength"));
      setResults((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setError(null);
      setLoading(true);
      try {
        const data = await getWCAPersons(trimmed);

        if (isValidWCAPersonArray(data)) {
          setResults(data);
        } else {
          setResults([]);
          setError(t("wca.players.errorFormat"));
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : t("wca.players.errorNetwork");
        setError(message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, t]);

  const columns = [
    {
      title: t("wca.players.wcaId"),
      dataIndex: "wca_id",
      key: "wca_id",
      width: 150,
      render: (text: string) => WCALink(text, text),
    },
    {
      title: t("wca.players.country"),
      dataIndex: "iso2",
      key: "iso2",
      width: 120,
      render: (text: string, record: WCAPerson) => (
        <>{getCountryNameByIso2(text || record.country_id)}</>
      ),
    },
    {
      title: t("wca.players.name"),
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      render: (_: string, record: WCAPerson) =>
        WCALinkWithCnName(record.wca_id, record.name),
    },
    {
      title: t("wca.players.gender"),
      dataIndex: "gender",
      key: "gender",
      width: 120,
      render: (gender: string) => {
        if (gender === "m") {
          return t("wca.players.genderMale");
        }
        if (gender === "f") {
          return t("wca.players.genderFemale");
        }
        return t("wca.players.genderOther");
      },
    },
  ];

  const isEmptyState = !query && results.length === 0 && !loading && !error;

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: 1000,
        margin: "0 auto",
        display: isEmptyState ? "flex" : "block",
        flexDirection: isEmptyState ? "column" : undefined,
        justifyContent: isEmptyState ? "center" : undefined,
        alignItems: isEmptyState ? "center" : undefined,
        minHeight: isEmptyState ? "50vh" : undefined,
        boxSizing: "border-box",
      }}
    >
      <Title level={2} style={{ textAlign: "center", marginBottom: 24 }}>
        {t("wca.players.title")}
      </Title>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("wca.players.placeholder")}
        allowClear
        size="large"
        style={inputStyle}
      />

      {error && (
        <div style={{ marginTop: 16, width: "100%", maxWidth: 600 }}>
          <Alert
            message={t("wca.players.queryTip")}
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        </div>
      )}

      {loading && results.length === 0 && (
        <div style={{ marginTop: 24 }}>
          <Spin description={t("wca.players.searching")} />
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginTop: 24, width: "100%" }}>
          <Table
            dataSource={results}
            columns={columns}
            rowKey={(record) => record.wca_id}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </div>
      )}
    </div>
  );
}
