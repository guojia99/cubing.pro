"use client";

import { Alert, AutoComplete, Button, Card, Cascader, Form, Input, InputNumber, Modal, Progress, Select, Space, Spin, Switch, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { OrganizersGuard } from "@/components/admin/OrganizersGuard";
import { CubesCn } from "@/components/CubeIcon/cube";
import { resultStringPro, resultTimeString, type PreResult, type Result } from "@/components/Data/types/result";
import { NavTabs } from "@/components/Tabs/NavTabs";
import { useRouteParam } from "@/hooks/useRouteParam";
import { competitionError, competitionService, type CompetitionMode, type Query, type Registration } from "@/services/cubing-pro/auth/groupCompetition";
import type { CompAPI } from "@/services/cubing-pro/comps/typings";
import { apiPlayers } from "@/services/cubing-pro/players/players";
import { GroupCompetitionShell } from "./GroupCompetitionShell";
import { EventTable } from "./OrganizersCreateCompsPageView";
import { CompetitionSwitcher } from "./CompetitionSwitcher";
import { useCompetitionOptions } from "./useCompetitionOptions";
import { attemptCount, beijingDate, canEnterResults, canReviewResults, competitionEditTimes, competitionStatus, competitionReturnPath, isGroupCompetition, parseAttempts, parseBatchResults, positiveInteger, preResultReviewFilter, publicCompetitionStatus, validateEvents, type BatchItem } from "@/lib/groupCompetition";

type Service = ReturnType<typeof competitionService>;
type Action = (fn: () => Promise<unknown>, success: string, refresh?: boolean) => Promise<void>;
type BatchProgress = { completed: number; total: number; failed: number; errors: string[] };

function formatResults(row: Result): string {
  const values = row.Result ?? [];
  if (!attemptCount(row.EventRoute)) return values.length ? `${values.join(" / ")}（成绩类型缺失）` : "历史成绩缺失";
  if (row.EventRoute >= 8 && row.EventRoute <= 10) {
    const scores: string[] = [];
    const special: Record<number, string> = { [-10002]: "DNP", [-10003]: "DNT" };
    for (let i = 0; i < values.length; i += 3) scores.push(i + 2 < values.length ? `${values[i]}/${values[i + 1]} ${special[values[i + 2]] ?? resultTimeString(values[i + 2])}` : "多盲三元组缺失");
    return scores.join(" / ") || "历史成绩缺失";
  }
  return resultStringPro(values, row.EventRoute).join(" / ");
}

function ProgressReport({ value }: { value: BatchProgress | null }) {
  if (!value) return null;
  return <Card size="small" title={`已处理 ${value.completed}/${value.total} · 失败 ${value.failed}`}>
    <Progress percent={Math.round(value.completed * 100 / Math.max(value.total, 1))} status={value.completed < value.total ? "active" : value.failed ? "exception" : "success"} />
    {value.errors.length > 0 && <Alert type="error" title="以下项目未成功，可修正后重试" description={<ul>{value.errors.map((error, i) => <li key={i}>{error}</li>)}</ul>} />}
  </Card>;
}

function PlayerPicker({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    (async () => {
      const players = new Map<string, { value: string; label: string }>();
      let loaded = 0;
      for (let page = 1; active; page++) {
        const response = await apiPlayers({ page, size: 500, name: "" });
        if (!active) return;
        const items = response.data.items ?? [];
        for (const player of items) {
          if (player.CubeID) players.set(player.CubeID, { value: player.CubeID, label: `${player.Name} · ${player.CubeID}` });
        }
        loaded += items.length;
        if (loaded >= response.data.total) break;
        if (!items.length) throw new Error("选手列表未加载完整，请重试");
      }
      if (active) setOptions([...players.values()]);
    })().catch((e) => { if (active) setError(competitionError(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  return <><AutoComplete value={value} options={options} disabled={disabled} onChange={onChange} filterOption={(input, option) => String(option?.label ?? "").toLocaleLowerCase().includes(input.trim().toLocaleLowerCase())} notFoundContent={loading ? <Spin size="small" /> : "无匹配选手"} style={{ width: "100%", maxWidth: 500 }}><Input aria-label="选手 CubeID" placeholder="输入 CubeID，或搜索姓名后选择" /></AutoComplete>{error && <Alert type="warning" title={`选手列表加载失败：${error}`} action={<Button size="small" onClick={() => setRevision((v) => v + 1)}>重试</Button>} />}</>;
}

function ScoreList({ rows, onDelete, busy }: { rows: Result[]; onDelete: (row: Result) => void; busy: boolean }) {
  return <Table<Result> rowKey="id" size="small" dataSource={rows} scroll={{ x: 700 }} columns={[
    { title: "选手", key: "player", width: 320, render: (_, r) => `${r.PersonName || ""} ${r.CubeID || ""}` },
    { title: "项目 / 轮次", key: "event", width: 150, render: (_, r) => `${r.EventID} / ${r.Round || r.RoundNumber}` },
    { title: "最佳 / 平均", key: "best", render: (_, r) => r.EventRoute >= 8 ? "见多盲成绩" : `${resultTimeString(r.Best ?? NaN, r.EventRoute === 3)} / ${resultTimeString(r.Average ?? NaN)}` },
    { title: "成绩", key: "score", render: (_, r) => formatResults(r) },
    { title: "操作", key: "delete", width: 90, fixed: "right", render: (_, r) => <Button danger size="small" disabled={busy} onClick={() => onDelete(r)}>删除</Button> },
  ]} />;
}

function CompetitionManagement({ comp, service, busy, act, mode }: { comp: CompAPI.Data; service: Service; busy: boolean; act: Action; mode: CompetitionMode }) {
  const group = isGroupCompetition(comp);
  const router = useRouter();
  const [modal, modalContext] = Modal.useModal();
  const [form] = Form.useForm();
  const [editError, setEditError] = useState("");
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [regLoading, setRegLoading] = useState(false);
  const loadPlayers = async () => {
    setRegLoading(true);
    try { setRegistrations(await service.players() ?? []); } catch (e) { setRegistrations([]); void message.error(competitionError(e)); } finally { setRegLoading(false); }
  };
  useEffect(() => {
    form.setFieldsValue({ Name: comp.Name, Count: comp.Count, CanPreResult: comp.CanPreResult,
      startDate: group ? beijingDate(comp.CompStartTime) : comp.CompStartTime, endDate: group ? beijingDate(comp.CompEndTime) : comp.CompEndTime, Illustrate: comp.Illustrate,
      events: comp.comp_json.Events.map((event) => ({ ...event, Key: event.Key || event.EventID })) });
  }, [comp, form, group]);

  const rounds = comp.comp_json.Events.flatMap((event) => event.Schedule.map((round) => ({ key: `${event.EventID}-${round.RoundNum}`, event, round })));
  const confirmAction = (title: string, fn: () => Promise<unknown>, success: string, content: string) => modal.confirm({ title, content, cancelText: "取消", okText: "确认", onOk: () => act(fn, success).catch(() => undefined) });
  return <div className="gc-stack">
    {modalContext}
    <Card title="比赛操作"><div className="gc-actions">
      {(comp.Status === "Temporary" || comp.Status === "Reject") && <Button type="primary" loading={busy} onClick={() => confirmAction("提交比赛申请", service.apply, "申请已提交", group ? "提交后等待管理员审批；通过后即可录入已配置项目轮次的成绩。" : "提交后等待管理员审批。")}>提交 / 重新申请</Button>}
      {comp.Status === "Running" && !comp.IsDone && <Button danger loading={busy} onClick={() => confirmAction("结束比赛", service.end, "比赛已标记结束", group ? "允许存在待审成绩。标记结束后仍可新增、覆盖、修改、删除成绩和审批，不受赛期或轮次开放状态限制。此操作不可恢复。" : "确认结束比赛？此操作不可恢复。")}>结束比赛</Button>}
      <Button disabled={busy} onClick={() => {
        let name = "";
        modal.confirm({ title: "永久删除比赛", content: <><p>将删除比赛及成绩等关联数据。请输入完整比赛名称「{comp.Name}」确认。</p><Input onChange={(e) => { name = e.target.value; }} /></>, okText: "永久删除", okButtonProps: { danger: true }, cancelText: "取消", onOk: () => {
          if (name.trim() !== comp.Name.trim()) { void message.error("名称不一致"); return; }
          return act(async () => { await service.remove(); router.push(mode === "admin" ? "/admin/competition/approvals" : "/admin/organizers/comps"); }, "已删除", false).catch(() => undefined);
        } });
      }}>删除比赛</Button>
    </div></Card>
    <Card title="手动轮次管理" extra={group && <Button type="primary" loading={busy} disabled={busy || comp.IsDone || comp.Status !== "Running" || !rounds.some(({ round }) => !round.IsRunning)} onClick={() => confirmAction("开放全部轮次", service.openAllRounds, "全部轮次已开放", "将一次性开放本场群赛所有项目的全部轮次，保留现有成绩、打乱和晋级名单。")}>一键开放全部轮次</Button>}>{group && <Alert type="info" showIcon title="轮次开放状态用于赛程管理，不限制已审批群赛的成绩录入；关闭轮次也可新增或覆盖成绩。" style={{ marginBottom: 16 }} />}
      <Table rowKey="key" size="small" dataSource={rounds} pagination={false} scroll={{ x: 700 }} columns={[
        { title: "项目", render: (_, r) => <>{CubesCn(r.event.EventID)} ({r.event.EventID})</> },
        { title: "轮次", render: (_, r) => `第 ${r.round.RoundNum} 轮 · ${r.round.Round}` },
        { title: "状态", render: (_, r) => <Tag color={r.round.IsRunning ? "cyan" : "default"}>{r.round.IsRunning ? "开放中" : "已关闭 / 未开放"}</Tag> },
        { title: "操作", width: 120, fixed: "right", render: (_, r) => <Button type={r.round.IsRunning ? "default" : "primary"} disabled={busy || comp.IsDone || comp.Status !== "Running" || (!r.round.IsRunning && !canEnterResults(comp))} onClick={() => confirmAction(`${r.round.IsRunning ? "关闭" : "开放"} ${r.event.EventID} 第 ${r.round.RoundNum} 轮`, () => service.round(r.event.EventID, r.round.RoundNum, !r.round.IsRunning), "轮次状态已更新", r.round.IsRunning ? "关闭后将计算晋级名单。下一轮需另行手动开放。" : group ? "开放此轮次，不影响其他轮次、已有成绩或晋级名单。" : "确认开放此轮次？")}>{r.round.IsRunning ? "关闭轮次" : "开放轮次"}</Button> },
      ]} />
    </Card>
    <Card title="编辑比赛"><Form form={form} layout="vertical" disabled={busy} onFinish={async (values) => {
      try {
        setEditError("");
        const times = competitionEditTimes(comp, values.startDate, values.endDate);
        const events: CompAPI.Event[] = values.events;
        validateEvents(events);
        await act(async () => {
          // Preserve every existing field required by the backend's full-edit contract.
          await service.update({ ...comp, Count: values.Count, CanPreResult: values.CanPreResult, Illustrate: values.Illustrate,
             ...times, comp_json: { ...comp.comp_json, Events: events } });
          if (values.Name.trim() !== comp.Name) {
            try { await service.rename(values.Name.trim()); }
            catch (e) { throw new Error(`比赛配置已保存，但名称修改失败：${competitionError(e)}。请刷新后重试改名。`); }
          }
        }, "比赛已保存");
      } catch (e) { setEditError(competitionError(e)); }
    }}>
      <div className="gc-filters">
        <Form.Item name="Name" label="比赛名称" rules={[{ required: true, whitespace: true }]}><Input maxLength={200} /></Form.Item>
        <Form.Item name="Count" label="人数上限" rules={[{ required: true }]}><InputNumber min={1} precision={0} /></Form.Item>
        <Form.Item name="startDate" label={group ? "开始日（00:00）" : "开赛时间（保留原时间与时区）"} rules={[{ required: group }]}><Input type={group ? "date" : "text"} readOnly={!group} /></Form.Item>
        <Form.Item name="endDate" label={group ? "结束日（含全天）" : "结束时间（保留原时间与时区）"} rules={[{ required: group }]}><Input type={group ? "date" : "text"} readOnly={!group} /></Form.Item>
        <Form.Item name="CanPreResult" label="允许预录入" valuePropName="checked"><Switch /></Form.Item>
      </div>
      <Form.Item name="Illustrate" label="比赛说明"><Input.TextArea autoSize={{ minRows: 3, maxRows: 10 }} /></Form.Item>
      <Form.Item name="events" label="项目与轮次（开放状态仅通过上方开关管理）" rules={[{ required: true }]}><EventTable /></Form.Item>
      {editError && <Alert type="error" title={editError} style={{ marginBottom: 16 }} />}
      <Button type="primary" htmlType="submit" loading={busy}>保存比赛</Button>
    </Form></Card>
    <Card title="报名选手审批" extra={<Button loading={regLoading} onClick={() => void loadPlayers()}>加载 / 刷新报名</Button>}>
      <Table<Registration> rowKey="id" loading={regLoading} dataSource={registrations} size="small" scroll={{ x: 650 }} columns={[
        { title: "选手", render: (_, r) => `${r.UserName} · 用户 #${r.UserID}` }, { title: "项目", dataIndex: "Events" }, { title: "状态", dataIndex: "Status" },
        { title: "操作", width: 170, fixed: "right", render: (_, r) => <Space><Button disabled={busy || comp.IsDone} onClick={() => void act(async () => { await service.approvePlayer(r.id, true); await loadPlayers(); }, "报名已通过").catch(() => undefined)}>通过</Button><Button danger disabled={busy || comp.IsDone} onClick={() => void act(async () => { await service.approvePlayer(r.id, false); await loadPlayers(); }, "报名已驳回").catch(() => undefined)}>驳回</Button></Space> },
      ]} />
    </Card>
  </div>;
}

function PreResults({ comp, service, busy, act }: { comp: CompAPI.Data; service: Service; busy: boolean; act: Action }) {
  const [modal, modalContext] = Modal.useModal();
  const router = useRouter();
  const search = useSearchParams();
  const queryString = search?.toString() ?? "";
  const [form] = Form.useForm();
  const [rows, setRows] = useState<PreResult[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const page = positiveInteger(search?.get("pre_page") ?? null);
  const size = positiveInteger(search?.get("pre_size") ?? null, 20, 100);
  const mode = search?.get("pre_finish") || "false";
  const { id: compId } = comp;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(queryString);
    const filters: Query = { page, size };
    const values: Record<string, string> = { finish: mode };
    for (const name of ["event", "round", "player", "source", "start_time", "end_time"]) {
      const value = params.get(`pre_${name}`) || "";
      values[name] = value;
      if (value) filters[name] = value;
    }
    form.setFieldsValue(values);
    setLoading(true); setSelected([]); setError(""); setRows([]); setTotal(0);
    (async () => {
      const data = await service.preResults({ ...filters, ...preResultReviewFilter(mode) }, controller.signal);
      if (!controller.signal.aborted) { setRows(data.items ?? []); setTotal(data.total); }
    })().catch((e) => { if (!controller.signal.aborted) setError(competitionError(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
    // Service is selected by the parent mode/org/competition identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString, compId, form, revision]);

  const navigate = (values: Record<string, unknown>, p = 1, s = size) => {
    const params = new URLSearchParams(window.location.search);
    for (const name of ["finish", "event", "round", "player", "source", "start_time", "end_time"]) {
      const value = values[name];
      if (value !== "" && value !== undefined && value !== null) params.set(`pre_${name}`, String(value)); else params.delete(`pre_${name}`);
    }
    params.set("pre_page", String(p)); params.set("pre_size", String(s));
    router.push(`${window.location.pathname}?${params}`);
  };

  const approve = (detail: string) => {
    const targets = rows.filter((row) => selected.includes(row.id) && !row.Finish);
    if (!targets.length) { void message.warning("请选择待审成绩"); return; }
    const actionLabel = ({ ok: "通过", not: "驳回", timeout: "标记超时", doubtful: "标记存疑" } as Record<string, string>)[detail];
    const dialog = modal.confirm({ title: `确认${actionLabel} ${targets.length} 条成绩`, content: "操作会逐条执行。成功项保留，失败项将显示具体原因。", cancelText: "取消", okText: "确认", keyboard: false, maskClosable: false,
      onOk: () => act(async () => {
        const status: BatchProgress = { completed: 0, total: targets.length, failed: 0, errors: [] };
        setProgress({ ...status });
        dialog.update({ cancelButtonProps: { disabled: true } });
        for (const row of targets) {
          try { await service.approveResult(row.id, detail); }
           catch (e) {
             const error = competitionError(e);
             status.failed++; status.errors.push(`#${row.id} ${row.PersonName} ${row.EventID}：${error}`);
           }
          status.completed++; setProgress({ ...status, errors: [...status.errors] });
          dialog.update({ content: <ProgressReport value={{ ...status, errors: [...status.errors] }} /> });
        }
        setRevision((v) => v + 1);
        if (status.failed) throw new Error(`已处理 ${status.total} 条，成功 ${status.total - status.failed} 条，失败 ${status.failed} 条`);
      }, "选中成绩审批完成").catch(() => undefined),
    });
  };

  const approveOne = (row: PreResult) => modal.confirm({ title: `普通审批通过 #${row.id}`, content: `${row.PersonName} · ${row.EventID} · ${row.Round}`, okText: "普通审批", cancelText: "取消", onOk: () => act(async () => {
    await service.approveResult(row.id, "ok"); setRevision((value) => value + 1);
  }, "成绩已通过").catch(() => undefined) });

  const columns: ColumnsType<PreResult> = [
    { title: "ID / 提交时间", key: "id", width: 180, render: (_, r) => <><span>#{r.id}</span><br /><Tag>{r.updatedAt ? new Date(r.updatedAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }) : "历史时间缺失"}</Tag></> },
    { title: "选手", key: "player", width: 320, render: (_, r) => <div className="gc-name">{r.PersonName}<br />{r.CubeID || "CubeID 缺失"}</div> },
    { title: "项目 / 轮次", key: "event", width: 150, render: (_, r) => `${r.EventID} / ${r.RoundName || r.Round || r.RoundNumber || "缺失"}` },
    { title: "成绩", key: "result", width: 320, render: (_, r) => formatResults(r) },
    { title: "最佳 / 平均", key: "best", width: 150, render: (_, r) => r.EventRoute >= 8 ? "见多盲成绩" : `${resultTimeString(r.Best ?? NaN, r.EventRoute === 3)} / ${resultTimeString(r.Average ?? NaN)}` },
    { title: "来源", dataIndex: "Source", width: 150 },
    { title: "处理状态", key: "status", width: 110, render: (_, r) => <Tag color={r.FinishDetail === "ok" ? "cyan" : r.Finish ? "red" : "gold"}>{({ ok: "已通过", not: "已驳回", timeout: "已超时", doubtful: "存疑待审", wait: "待审" } as Record<string, string>)[r.Finish ? r.FinishDetail : r.Detail] || (r.Finish ? "已处理" : "待审")}</Tag> },
    { title: "处理人 / 说明", key: "processor", width: 320, render: (_, r) => <div className="gc-name">{r.Processor || "—"}<br />{r.Detail}</div> },
    { title: "单条审批", key: "action", width: 210, fixed: "right", render: (_, row) => !row.Finish && <div className="gc-actions"><Button size="small" disabled={busy || !canReviewResults(comp)} onClick={() => approveOne(row)}>普通审批</Button></div> },
  ];
  return <div className="gc-stack">
    {modalContext}
    <Card title="成绩审批筛选"><Form form={form} layout="vertical" disabled={busy} onFinish={(values) => {
      if (values.start_time && values.end_time && Number(values.start_time) >= Number(values.end_time)) { void message.error("时间终点必须大于起点"); return; }
      navigate(values);
    }}><div className="gc-filters">
      <Form.Item label="处理状态" name="finish"><Select options={[{ value: "false", label: "待审" }, { value: "ok", label: "已通过" }, { value: "not", label: "已驳回" }, { value: "timeout", label: "已超时" }, { value: "true", label: "全部已完成" }, { value: "all", label: "全部" }]} /></Form.Item>
      <Form.Item label="项目" name="event"><Select allowClear options={comp.comp_json.Events.map((ev) => ({ value: ev.EventID, label: ev.EventID }))} /></Form.Item>
      <Form.Item label="轮次" name="round"><InputNumber min={1} precision={0} /></Form.Item>
      <Form.Item label="姓名 / CubeID" name="player"><Input allowClear /></Form.Item>
      <Form.Item label="来源（精确）" name="source"><Input allowClear placeholder="web-api / robot-group-7" /></Form.Item>
      <Form.Item label="提交起点（Unix 秒，含）" name="start_time"><InputNumber min={0} precision={0} /></Form.Item>
      <Form.Item label="提交终点（Unix 秒，不含）" name="end_time"><InputNumber min={0} precision={0} /></Form.Item>
    </div><div className="gc-actions"><Button type="primary" htmlType="submit" loading={loading}>查询</Button><Button onClick={() => navigate({ finish: "false" })}>重置</Button><Button onClick={() => setRevision((v) => v + 1)} loading={loading}>刷新</Button></div></Form></Card>
    {error && <Alert type="error" title={error} showIcon />}
    <ProgressReport value={progress} />
    <Card title={`成绩审批 · 共 ${total} 条`}>
      <div className="gc-actions" style={{ marginBottom: 16 }}><span>已选 {selected.length} 条</span><Button type="primary" disabled={busy || !canReviewResults(comp) || !selected.length} onClick={() => approve("ok")}>通过</Button><Button danger disabled={busy || !canReviewResults(comp) || !selected.length} onClick={() => approve("not")}>驳回</Button><Button disabled={busy || !canReviewResults(comp) || !selected.length} onClick={() => approve("timeout")}>标记超时</Button><Button disabled={busy || !canReviewResults(comp) || !selected.length} onClick={() => approve("doubtful")}>存疑待审</Button></div>
      <Table rowKey="id" dataSource={rows} columns={columns} size="small" loading={loading} scroll={{ x: 2250 }} rowSelection={{ selectedRowKeys: selected, onChange: setSelected, getCheckboxProps: (row) => ({ disabled: busy || row.Finish || !canReviewResults(comp) }) }} pagination={{ current: page, pageSize: size, total, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], onChange: (p, s) => navigate(form.getFieldsValue(), p, s) }} />
    </Card>
  </div>;
}

function OrganizersResultsContent({ orgId, compId, mode }: { orgId: string; compId: string; mode: CompetitionMode }) {
  const [modal, modalContext] = Modal.useModal();
  const search = useSearchParams();
  const returnTo = competitionReturnPath(search?.get("returnTo") ?? null, mode === "admin");
  const [comp, setComp] = useState<CompAPI.Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [clock, setClock] = useState(Date.now());
  const [player, setPlayer] = useState("");
  const [round, setRound] = useState<[string, number] | null>(null);
  const [inputs, setInputs] = useState<string[]>([]);
  const [batchText, setBatchText] = useState("");
  const [batchRows, setBatchRows] = useState<BatchItem[]>([]);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const [resultLoading, setResultLoading] = useState(false);
  const resultRequest = useRef(0);
  const service = competitionService(mode, orgId, compId);
  const { options, loading: optionsLoading, error: optionsError } = useCompetitionOptions(mode === "admin");

  const reload = useCallback(async () => {
    const value = await competitionService(mode, orgId, compId).detail();
    if (mode === "organizer" && String(value.OrganizersID) !== orgId) throw new Error("比赛不属于当前团队");
    setComp(value);
  }, [mode, orgId, compId]);

  useEffect(() => {
    const controller = new AbortController();
    setComp(null); setError("");
    competitionService(mode, orgId, compId).detail(controller.signal).then((value) => {
      if (mode === "organizer" && String(value.OrganizersID) !== orgId) throw new Error("比赛不属于当前团队");
      if (!controller.signal.aborted) setComp(value);
    }).catch((e) => { if (!controller.signal.aborted) setError(competitionError(e)); });
    return () => controller.abort();
  }, [mode, orgId, compId]);
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 15_000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    resultRequest.current++;
    setResults([]); setResultLoading(false);
  }, [round, player]);

  const act: Action = async (fn, success, refresh = true) => {
    if (busyRef.current) throw new Error("正在处理，请勿重复提交");
    busyRef.current = true; setBusy(true);
    try {
      await fn();
      void message.success(success);
      if (refresh) await reload().catch((e) => message.warning(`操作已成功，但刷新比赛失败：${competitionError(e)}。请刷新页面，不要重复提交。`));
    }
    catch (e) { void message.error(competitionError(e)); throw e; }
    finally { busyRef.current = false; setBusy(false); }
  };

  const loadResults = useCallback(async (withPlayer = false) => {
    if ((withPlayer && !player.trim()) || (!withPlayer && !round && !player.trim())) { setResults([]); return; }
    const request = ++resultRequest.current;
    setResultLoading(true); setResults([]);
    try {
      const rows = await competitionService(mode, orgId, compId).results(!withPlayer && round ? { event_id: round[0], round_num: round[1] } : { cube_id: player.trim() });
      if (request === resultRequest.current) setResults(rows ?? []);
    }
    catch (e) { if (request === resultRequest.current) void message.error(competitionError(e)); }
    finally { if (request === resultRequest.current) setResultLoading(false); }
  }, [mode, orgId, compId, round, player]);

  if (error) return <Alert type="error" showIcon title={error} action={<Button onClick={() => { setError(""); void reload().catch((e) => setError(competitionError(e))); }}>重试</Button>} />;
  if (!comp) return <Spin description="加载比赛…"><div style={{ minHeight: 100 }} /></Spin>;
  const group = isGroupCompetition(comp);
  const canEnter = canEnterResults(comp);
  const currentEvent = comp.comp_json.Events.find((event) => event.EventID === round?.[0]);
  const currentRound = currentEvent?.Schedule.find((schedule) => schedule.RoundNum === round?.[1]);
  const count = attemptCount(currentEvent?.EventRoute ?? 0);
  const validNewEntry = () => {
    if (!canEnterResults(comp)) throw new Error("群赛尚未审批通过，不能录入成绩");
    if (!player.trim()) throw new Error("请填写或选择选手 CubeID");
  };
  const validateRound = (eventId: string, roundNum: number) => {
    const event = comp.comp_json.Events.find((ev) => ev.EventID === eventId);
    const schedule = event?.Schedule.find((s) => s.RoundNum === roundNum);
    if (!event || !schedule) throw new Error(`${eventId} 第 ${roundNum} 轮不存在`);
    return event;
  };
  const parseBatch = (text: string) => parseBatchResults(text, comp.comp_json.Events, false);

  const entry = (multi: boolean) => <div className="gc-stack"><Card title={multi ? "批量录入同一选手成绩" : "单条成绩录入"}>
    <Form layout="vertical" disabled={busy} onFinish={async () => {
      let actionStarted = false;
      try {
        validNewEntry();
        if (!multi) {
          if (!round || !currentEvent || !currentRound) throw new Error("请选择项目与轮次");
          validateRound(round[0], round[1]);
          if (inputs.length < count || Array.from({ length: count }, (_, index) => inputs[index]?.trim()).some((value) => !value)) throw new Error(`请填写完整的 ${count} 个成绩`);
          const scores = parseAttempts(inputs.slice(0, count).join(" "), currentEvent.EventRoute);
          actionStarted = true;
          await act(async () => { await service.addResult(round[0], round[1], scores, player.trim()); setInputs([]); }, "成绩录入成功");
          await loadResults(false);
        } else {
          const rows = parseBatch(batchText);
          setBatchRows(rows);
          if (!rows.length) throw new Error("请输入批量成绩");
          if (rows.some((row) => row.error)) throw new Error("请先修正预览中的格式或轮次错误");
          actionStarted = true;
          await act(async () => {
            const status: BatchProgress = { completed: 0, total: rows.length, failed: 0, errors: [] };
            const failed: BatchItem[] = [];
            setProgress({ ...status });
            for (const row of rows) {
              try { validNewEntry(); await service.addResult(row.event, row.round, row.values, player.trim()); }
              catch (e) { status.failed++; row.error = competitionError(e); status.errors.push(`${row.event}[${row.round}]：${row.error}`); failed.push(row); }
              status.completed++; setProgress({ ...status, errors: [...status.errors] });
            }
            setBatchRows(failed); setBatchText(failed.map((row) => row.line).join("\n"));
            if (status.failed) throw new Error(`成功 ${rows.length - failed.length} 条，失败 ${failed.length} 条；输入区仅保留失败项`);
          }, "批量成绩录入完成");
          await loadResults(true);
        }
       } catch (e) { if (!actionStarted) void message.error(competitionError(e)); else await loadResults(multi); }
    }}>
      <Form.Item label="选手 CubeID（录入资格由后台校验，赛后仍可查询）"><PlayerPicker value={player} onChange={setPlayer} disabled={busy} /></Form.Item>
      {!multi ? <>
        <Form.Item label="项目与轮次"><Cascader aria-label="查询项目与轮次" style={{ width: "100%", maxWidth: 500 }} value={round ? [round[0], String(round[1])] : undefined} options={comp.comp_json.Events.map((ev) => ({ value: ev.EventID, label: `${ev.EventID} ${ev.EventName}`, children: ev.Schedule.map((s) => ({ value: String(s.RoundNum), label: `${s.RoundNum} · ${s.Round}${s.IsRunning ? "（开放）" : "（关闭）"}` })) }))} onChange={(v) => { setRound(v ? [String(v[0]), Number(v[1])] : null); setInputs([]); }} /></Form.Item>
        {Array.from({ length: count }, (_, i) => <Form.Item key={i} label={`成绩 ${i + 1}`}><Input disabled={!canEnter} value={inputs[i] ?? ""} placeholder={currentEvent && currentEvent.EventRoute >= 8 ? "3/4 10:00 / 3/4 DNF / 0/0 DNS" : "12.34 / 1:02.34 / DNF / DNS"} onChange={(e) => setInputs((previous) => { const next = [...previous]; next[i] = e.target.value; return next; })} style={{ maxWidth: 500 }} /></Form.Item>)}
      </> : <>
        <Alert type="info" title="每行一个项目轮次，如 333[1] 12 13 14 15 16。多盲如 333mbf[1] 3/4 10:00；多次多盲连续填写多组。成功行会移除，仅保留失败行。" style={{ marginBottom: 16 }} />
        <Form.Item label="批量成绩"><Input.TextArea disabled={!canEnter} rows={8} value={batchText} onChange={(e) => { setBatchText(e.target.value); setBatchRows(parseBatch(e.target.value)); }} /></Form.Item>
        <Table rowKey="key" dataSource={batchRows} size="small" pagination={false} scroll={{ x: 700 }} columns={[{ title: "项目", dataIndex: "event" }, { title: "轮次", dataIndex: "round" }, { title: "原始输入", dataIndex: "line" }, { title: "校验", render: (_, row) => row.error ? <Tag color="red">{row.error}</Tag> : <Tag color="cyan">可提交</Tag> }]} />
      </>}
      <Button htmlType="submit" type="primary" loading={busy} disabled={!canEnter || (!multi && !currentRound)} style={{ marginTop: 16 }}>确认录入{multi ? ` ${batchRows.length} 条` : ""}</Button>
    </Form>
  </Card>{multi && <ProgressReport value={progress} />}<Card title="已录入成绩" extra={<Button loading={resultLoading} disabled={busy} onClick={() => void loadResults(multi)}>查询 / 刷新成绩</Button>}>
    <ScoreList rows={results} busy={busy || (group && !canEnter)} onDelete={(row) => modal.confirm({ title: `删除 #${row.id} ${row.PersonName} ${row.EventID} ${row.Round}？`, okText: "删除", cancelText: "取消", okButtonProps: { danger: true }, onOk: () => act(async () => { await service.deleteResult(row.id); await loadResults(multi); }, "成绩已删除").catch(() => undefined) })} />
  </Card></div>;

  const orgName = comp.OrganizersName || comp.Org?.Name || options.organizers.find((org) => org.id === comp.OrganizersID)?.Name || "团队名称未提供";
  const groupName = comp.GroupName || comp.Group?.name || options.groups.find((group) => group.id === comp.GroupId)?.Name || "群组名称未提供";
  return <GroupCompetitionShell title={`#${comp.id} ${comp.Name}`} description={<>{orgName}{group && <> · {groupName}</>} · {group ? competitionStatus(comp, clock) : publicCompetitionStatus(comp, clock)} · <Tag>{group ? beijingDate(comp.CompStartTime) : comp.CompStartTime}</Tag>至 <Tag>{group ? beijingDate(comp.CompEndTime) : comp.CompEndTime}</Tag></>}>
    {modalContext}
    <div className="gc-actions" style={{ marginBottom: 16 }}><Link href={returnTo}>返回比赛列表</Link><Button disabled={busy} onClick={() => void reload().catch((e) => message.error(competitionError(e)))}>刷新比赛</Button><Tag color="cyan">{mode === "admin" ? "管理员模式" : "主办模式"}</Tag></div>
    {optionsError && <Alert type="warning" title={`名称选项加载失败：${optionsError}`} style={{ marginBottom: 16 }} />}
    <CompetitionSwitcher comp={comp} mode={mode} options={options} loading={optionsLoading} />
    {group && <Alert type={canEnter ? "info" : "warning"} showIcon title={canEnter ? "群赛已审批通过，可新增、覆盖、修改、删除成绩和审批，不受赛期、结束标记或轮次开放状态限制。" : "群赛尚未审批通过，暂不能录入或修改成绩。"} style={{ marginBottom: 16 }} />}
    <NavTabs tabsKey="input_tabs" items={[
      { key: "manage", label: "比赛管理", disabled: busy, children: <CompetitionManagement comp={comp} service={service} busy={busy} act={act} mode={mode} /> },
      { key: "one", label: "单条录入", disabled: busy, children: entry(false) },
      { key: "multi", label: "批量录入", disabled: busy, children: entry(true) },
      { key: "pre_result", label: "成绩审批", disabled: busy, children: <PreResults comp={comp} service={service} busy={busy} act={act} /> },
    ]} />
  </GroupCompetitionShell>;
}

export function OrganizersResultsPageView({ orgId: orgIdProp, compId: compIdProp, admin = false }: { orgId?: string; compId?: string; admin?: boolean }) {
  const search = useSearchParams();
  const routeOrg = useRouteParam("orgId");
  const routeComp = useRouteParam("compId");
  const orgId = orgIdProp ?? routeOrg ?? search?.get("orgId") ?? "";
  const compId = compIdProp ?? routeComp ?? search?.get("compId") ?? "";
  const Guard = admin ? AdminGuard : OrganizersGuard;
  const validId = (value: string) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
  const valid = validId(compId) && (admin || validId(orgId));
  return <Guard>{valid ? <OrganizersResultsContent key={`${admin ? "admin" : orgId}:${compId}`} orgId={orgId} compId={compId} mode={admin ? "admin" : "organizer"} /> : <Alert type="info" title="请从比赛列表选择比赛进入管理。" action={<Link href={admin ? "/admin/competition/approvals" : "/admin/organizers/comps"}>比赛列表</Link>} />}</Guard>;
}
