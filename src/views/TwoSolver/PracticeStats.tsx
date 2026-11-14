"use client";

import dynamic from "next/dynamic";
import { useId, useState } from "react";
import type { EChartsOption, LineSeriesOption } from "echarts";
import { buildPracticeStats, formatPracticeTooltip, formatStatistic } from "./practiceStatistics";
import { adjustedTime, formatTime, type PracticeRecord } from "./uiPractice";
import styles from "./PracticeStats.module.css";

const ReactECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => <p className={styles.loading} role="status">正在加载成绩曲线…</p>,
});

export type PracticeStatsProps = {
  records: readonly PracticeRecord[];
  precision: number;
  onReview: (record: PracticeRecord) => void;
  windowSize?: number;
};

export default function PracticeStats({ records, precision, onReview, windowSize = 50 }: PracticeStatsProps) {
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
  const series: EChartsOption["series"] = [line("单次", "single", "#1696a6")];
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
      type: "category", name: "次", boundaryGap: true,
      data: stats.points.map((point) => String(point.number)),
      axisLabel: { color: "#8795a1", hideOverlap: true },
      axisLine: { lineStyle: { color: "#8795a1" } },
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: "value", name: "秒", min: 0,
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
        return point ? formatPracticeTooltip(point, precision) : "";
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
    ["最新", stats.latest], ["单次最佳", stats.best], ["平均", stats.mean],
    ["mo3", stats.mo3], ["ao5", stats.ao5], ["ao12", stats.ao12],
  ] as const;

  return <section className={styles.panel} aria-labelledby={headingId}>
    <div className={styles.heading}>
      <h2 id={headingId}>成绩曲线</h2>
      <span className={styles.source}>已保存 {stats.total} 次 · DNF {stats.dnfCount} 次 · 曲线显示最近 {stats.points.length} 次</span>
    </div>
    <dl className={styles.metrics}>
      {metrics.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{formatStatistic(value, precision)}</dd></div>)}
    </dl>
    <div className={styles.controls} role="group" aria-label="滚动平均曲线">
      <label><input type="checkbox" checked={showAo5} onChange={(event) => setShowAo5(event.target.checked)} />ao5</label>
      <label><input type="checkbox" checked={showAo12} onChange={(event) => setShowAo12(event.target.checked)} />ao12</label>
      <span className={styles.hint}>点击成绩点复盘 · 拖动底部滑块缩放</span>
    </div>
    {!stats.total ? <p className={styles.empty}>暂无已保存成绩，完成一次练习后显示曲线。</p> : <>
      {!finite.length && <p className={styles.notice} role="status">显示范围内全部为 DNF，暂无有效用时；菱形标记仅表示 DNF，不代表用时。</p>}
      <div className={styles.chartFrame}><ReactECharts className={styles.chart} option={option} style={{ height: 280, width: "100%" }}
        notMerge onEvents={{ click: reviewPoint }} opts={{ renderer: "canvas" }} /></div>
      <div className={styles.review}>
        <label htmlFor={selectId}>选择成绩复盘</label>
        <select id={selectId} value={selected?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}>
          {records.map((record, index) => <option key={record.id} value={record.id}>
            第 {records.length - index} 次 · {formatTime(adjustedTime(record), precision)}{record.penalty === "+2" ? " (+2)" : ""} · {record.date}
          </option>)}
        </select>
        <button type="button" disabled={!selected} onClick={() => { if (selected) onReview(selected); }}>复盘</button>
        <span className={styles.hint}>当前：{selected ? formatTime(adjustedTime(selected), precision) : "—"}</span>
      </div>
    </>}
    <p className={styles.footnote}>统计基于全部已保存成绩，+2 已计入。mo3 不去头尾；ao5 / ao12 各去掉最快和最慢一次，两个 DNF 计为 DNF；不足次数显示 —。DNF 菱形的高度仅作标记，不代表用时。</p>
  </section>;
}
