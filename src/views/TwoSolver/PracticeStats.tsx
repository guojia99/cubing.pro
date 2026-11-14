"use client";

import dynamic from "next/dynamic";
import { useId, useState } from "react";
import type { EChartsOption, LineSeriesOption } from "echarts";
import { useI18n } from "@/contexts/I18nProvider";
import { buildPracticeStats, formatPracticeDate, formatPracticeTooltip, formatStatistic } from "./practiceStatistics";
import { adjustedTime, formatTime, type PracticeRecord } from "./uiPractice";
import styles from "./PracticeStats.module.css";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: ChartLoading,
});

function ChartLoading() {
  const { t } = useI18n();
  return <p className={styles.loading} role="status">{t("two.detail.chartLoading")}</p>;
}

export type PracticeStatsProps = {
  records: readonly PracticeRecord[];
  precision: number;
  onReview: (record: PracticeRecord) => void;
  windowSize?: number;
};

export default function PracticeStats({ records, precision, onReview, windowSize = 50 }: PracticeStatsProps) {
  const { locale, t, tf } = useI18n();
  const headingId = useId();
  const selectId = useId();
  const [showAo5, setShowAo5] = useState(true);
  const [showAo12, setShowAo12] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const stats = buildPracticeStats(records, windowSize);
  const selected = records.find((record) => record.id === selectedId) ?? records[0];
  const pointById = new Map(stats.points.map((point) => [point.record.id, point]));
  const finite = stats.points.flatMap((point) => point.single === null ? [] : [point.single / 1000]);
  const visibleTimes = stats.points.flatMap((point) => [point.single, ...(showAo5 ? [point.ao5] : []), ...(showAo12 ? [point.ao12] : [])]
    .filter((value): value is number => value !== null && Number.isFinite(value)).map((value) => value / 1000));
  const dnfCap = Math.max(1, ...visibleTimes) * 1.15;
  const places = Number.isInteger(precision) ? Math.max(0, Math.min(3, precision)) : 2;
  const line = (name: string, key: "single" | "ao5" | "ao12", color: string): LineSeriesOption => ({
    name,
    type: "line",
    smooth: false,
    connectNulls: false,
    showSymbol: true,
    symbolSize: key === "single" ? 6 : 4,
    lineStyle: { width: key === "single" ? 1.5 : 2 },
    itemStyle: { color },
    emphasis: { focus: "series", scale: 1.6 },
    data: stats.points.map((point) => ({
      value: point[key] !== null && Number.isFinite(point[key]) ? point[key]! / 1000 : null,
      recordId: point.record.id,
    })),
  });
  const series: EChartsOption["series"] = [line(t("two.detail.single"), "single", "#1696a6")];
  if (showAo5) series.push(line("ao5", "ao5", "#bf851b"));
  if (showAo12) series.push(line("ao12", "ao12", "#9875cf"));
  series.push({
    name: "DNF",
    type: "scatter",
    symbol: "diamond",
    symbolSize: 10,
    itemStyle: { color: "#d85564" },
    label: { show: true, formatter: "DNF", position: "top", color: "#d85564", fontSize: 10 },
    data: stats.points.filter((point) => point.single === null).map((point) => ({
      value: [String(point.number), dnfCap], recordId: point.record.id,
    })),
  });
  const option: EChartsOption = {
    animation: false,
    backgroundColor: "transparent",
    grid: { left: 56, right: 22, top: 40, bottom: 66 },
    legend: { top: 0, textStyle: { color: "#8795a1", fontSize: 11 }, selectedMode: false },
    xAxis: {
      type: "category", name: t("two.detail.attemptAxis"), boundaryGap: true,
      data: stats.points.map((point) => String(point.number)),
      axisLabel: { color: "#8795a1", hideOverlap: true },
      axisLine: { lineStyle: { color: "#8795a1" } },
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: "value", name: t("two.detail.secondsAxis"), min: 0,
      max: stats.points.some((point) => point.single === null) ? dnfCap * 1.15 : undefined,
      nameTextStyle: { color: "#8795a1" },
      axisLabel: { color: "#8795a1", formatter: (value: number) => value.toFixed(places) },
      splitLine: { lineStyle: { color: "rgba(135,149,161,0.18)" } },
    },
    tooltip: {
      trigger: "item", confine: true, renderMode: "richText",
      textStyle: { fontSize: 12, width: 240 },
      formatter: (params) => {
        const data = (Array.isArray(params) ? params[0] : params)?.data as { recordId?: string } | undefined;
        const point = data?.recordId ? pointById.get(data.recordId) : undefined;
        return point ? formatPracticeTooltip(point, precision, locale) : "";
      },
    },
    dataZoom: [
      { type: "inside", filterMode: "none", zoomOnMouseWheel: "ctrl" },
      { type: "slider", filterMode: "none", bottom: 4, height: 18, showDetail: false, borderColor: "transparent" },
    ],
    series,
  };
  const reviewPoint = (event: { data?: { recordId?: string } }) => {
    const record = records.find((row) => row.id === event.data?.recordId);
    if (record) {
      setSelectedId(record.id);
      onReview(record);
    }
  };
  const metrics = [
    [t("two.detail.latest"), stats.latest], [t("two.detail.best"), stats.best], [t("two.detail.mean"), stats.mean],
    ["mo3", stats.mo3], ["ao5", stats.ao5], ["ao12", stats.ao12],
  ] as const;

  return <section className={styles.panel} aria-labelledby={headingId}>
    <div className={styles.heading}>
      <h2 id={headingId}>{t("two.detail.chartTitle")}</h2>
      <span className={styles.source}>{tf("two.detail.chartSummary", { total: stats.total, dnfCount: stats.dnfCount, count: stats.points.length })}</span>
    </div>
    <dl className={styles.metrics}>
      {metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{formatStatistic(value, precision)}</dd></div>)}
    </dl>
    <div className={styles.controls} role="group" aria-label={t("two.detail.rollingAverages")}>
      <label><input type="checkbox" checked={showAo5} onChange={(event) => setShowAo5(event.target.checked)} />ao5</label>
      <label><input type="checkbox" checked={showAo12} onChange={(event) => setShowAo12(event.target.checked)} />ao12</label>
      <span className={styles.hint}>{t("two.detail.chartHint")}</span>
    </div>
    {!stats.total ? <p className={styles.empty}>{t("two.detail.chartEmpty")}</p> : <>
      {!finite.length && <p className={styles.notice} role="status">{t("two.detail.chartAllDnf")}</p>}
      <div className={styles.chartFrame}><ReactECharts className={styles.chart} option={option} style={{ height: 280, width: "100%" }}
        notMerge onEvents={{ click: reviewPoint }} opts={{ renderer: "canvas" }} /></div>
      <div className={styles.review}>
        <label htmlFor={selectId}>{t("two.detail.selectReview")}</label>
        <select id={selectId} value={selected?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}>
          {records.map((record, index) => <option key={record.id} value={record.id}>
            {tf("two.detail.attempt", { number: records.length - index })} · {formatTime(adjustedTime(record), precision)}{record.penalty === "+2" ? " (+2)" : ""} · {formatPracticeDate(record.date, locale)}
          </option>)}
        </select>
        <button type="button" disabled={!selected} onClick={() => { if (selected) onReview(selected); }}>{t("two.detail.review")}</button>
        <span className={styles.hint}>{tf("two.detail.current", { time: selected ? formatTime(adjustedTime(selected), precision) : "—" })}</span>
      </div>
    </>}
    <p className={styles.footnote}>{t("two.detail.chartFootnote")}</p>
  </section>;
}
