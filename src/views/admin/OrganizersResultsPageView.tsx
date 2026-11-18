"use client";

import { Alert, AutoComplete, Button, Card, Cascader, Form, Input, InputNumber, Modal, Progress, Select, Space, Spin, Switch, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { OrganizersGuard } from "@/components/admin/OrganizersGuard";
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
import { useAdminExtra } from "./useAdminExtra";
import { attemptCount, beijingDate, canEnterResults, canReviewResults, competitionEditTimes, competitionStatus, competitionReturnPath, isGroupCompetition, parseAttempts, parseBatchResults, positiveInteger, preResultReviewFilter, publicCompetitionStatus, validateEvents, type BatchItem } from "@/lib/groupCompetition";

type Service = ReturnType<typeof competitionService>;
type Action = (fn: () => Promise<unknown>, success: string, refresh?: boolean) => Promise<void>;
type BatchProgress = { completed: number; total: number; failed: number; errors: string[] };

function formatResults(row: Result, t: ReturnType<typeof useAdminExtra>["t"]): string {
  const values = row.Result ?? [];
  if (!attemptCount(row.EventRoute)) return values.length ? t("adminExtra.missingResultType", { values: values.join(" / ") }) : t("adminExtra.missingResults");
  if (row.EventRoute >= 8 && row.EventRoute <= 10) {
    const scores: string[] = [];
    const special: Record<number, string> = { [-10002]: "DNP", [-10003]: "DNT" };
    for (let i = 0; i < values.length; i += 3) scores.push(i + 2 < values.length ? `${values[i]}/${values[i + 1]} ${special[values[i + 2]] ?? resultTimeString(values[i + 2])}` : t("adminExtra.missingTriple"));
    return scores.join(" / ") || t("adminExtra.missingResults");
  }
  return resultStringPro(values, row.EventRoute).join(" / ");
}

function ProgressReport({ value }: { value: BatchProgress | null }) {
  const { t } = useAdminExtra();
  if (!value) return null;
  return <Card size="small" title={t("adminExtra.progress", { completed: value.completed, total: value.total, failed: value.failed })}>
    <Progress percent={Math.round(value.completed * 100 / Math.max(value.total, 1))} status={value.completed < value.total ? "active" : value.failed ? "exception" : "success"} />
    {value.errors.length > 0 && <Alert type="error" title={t("adminExtra.retryItems")} description={<ul>{value.errors.map((error, i) => <li key={i}>{error}</li>)}</ul>} />}
  </Card>;
}

function PlayerPicker({ value, onChange, disabled }: { value: string; onChange: (value: string) => void; disabled: boolean }) {
  const { t } = useAdminExtra();
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
        if (!items.length) throw new Error(t("adminExtra.incompletePlayers"));
      }
      if (active) setOptions([...players.values()]);
    })().catch((e) => { if (active) setError(competitionError(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision, t]);
  return <><AutoComplete value={value} options={options} disabled={disabled} onChange={onChange} filterOption={(input, option) => String(option?.label ?? "").toLocaleLowerCase().includes(input.trim().toLocaleLowerCase())} notFoundContent={loading ? <Spin size="small" /> : t("adminExtra.noPlayers")} style={{ width: "100%", maxWidth: 500 }}><Input aria-label={t("adminExtra.playerCubeId")} placeholder={t("adminExtra.playerPlaceholder")} /></AutoComplete>{error && <Alert type="warning" title={t("adminExtra.playersFailed", { error })} action={<Button size="small" onClick={() => setRevision((v) => v + 1)}>{t("adminExtra.retry")}</Button>} />}</>;
}

function ScoreList({ rows, onDelete, busy }: { rows: Result[]; onDelete: (row: Result) => void; busy: boolean }) {
  const { t, text } = useAdminExtra();
  return <Table<Result> rowKey="id" size="small" dataSource={rows} scroll={{ x: 700 }} columns={[
    { title: t("adminExtra.player"), key: "player", width: 320, render: (_, r) => `${r.PersonName || ""} ${r.CubeID || ""}` },
    { title: t("adminExtra.eventRound"), key: "event", width: 150, render: (_, r) => `${r.EventID} / ${text(String(r.Round || r.RoundNumber))}` },
    { title: t("adminExtra.bestAverage"), key: "best", render: (_, r) => r.EventRoute >= 8 ? t("adminExtra.seeMultiBlind") : `${resultTimeString(r.Best ?? NaN, r.EventRoute === 3)} / ${resultTimeString(r.Average ?? NaN)}` },
    { title: t("adminExtra.result"), key: "score", render: (_, r) => formatResults(r, t) },
    { title: t("adminExtra.actions"), key: "delete", width: 90, fixed: "right", render: (_, r) => <Button danger size="small" disabled={busy} onClick={() => onDelete(r)}>{t("adminExtra.delete")}</Button> },
  ]} />;
}

function CompetitionManagement({ comp, service, busy, act, mode }: { comp: CompAPI.Data; service: Service; busy: boolean; act: Action; mode: CompetitionMode }) {
  const { t, text, eventName } = useAdminExtra();
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
  const confirmAction = (title: string, fn: () => Promise<unknown>, success: string, content: string) => modal.confirm({ title, content, cancelText: t("adminExtra.cancel"), okText: t("adminExtra.confirm"), onOk: () => act(fn, success).catch(() => undefined) });
  return <div className="gc-stack">
    {modalContext}
    <Card title={t("adminExtra.competitionActions")}><div className="gc-actions">
      {(comp.Status === "Temporary" || comp.Status === "Reject") && <Button type="primary" loading={busy} onClick={() => confirmAction(t("adminExtra.submitApplication"), service.apply, t("adminExtra.applicationSubmitted"), t(group ? "adminExtra.applyGroupHint" : "adminExtra.applyHint"))}>{t("adminExtra.resubmit")}</Button>}
      {comp.Status === "Running" && !comp.IsDone && <Button danger loading={busy} onClick={() => confirmAction(t("adminExtra.endCompetition"), service.end, t("adminExtra.markedEnded"), t(group ? "adminExtra.endGroupHint" : "adminExtra.endHint"))}>{t("adminExtra.endCompetition")}</Button>}
      <Button disabled={busy} onClick={() => {
        let name = "";
        modal.confirm({ title: t("adminExtra.permanentDelete"), content: <><p>{t("adminExtra.deleteHint", { name: comp.Name })}</p><Input onChange={(e) => { name = e.target.value; }} /></>, okText: t("adminExtra.deletePermanently"), okButtonProps: { danger: true }, cancelText: t("adminExtra.cancel"), onOk: () => {
          if (name.trim() !== comp.Name.trim()) { void message.error(t("adminExtra.nameMismatch")); return; }
          return act(async () => { await service.remove(); router.push(mode === "admin" ? "/admin/competition/approvals" : "/admin/organizers/comps"); }, t("adminExtra.deleted"), false).catch(() => undefined);
        } });
      }}>{t("adminExtra.deleteCompetition")}</Button>
    </div></Card>
    <Card title={t("adminExtra.manualRounds")} extra={group && <Button type="primary" loading={busy} disabled={busy || comp.IsDone || comp.Status !== "Running" || !rounds.some(({ round }) => !round.IsRunning)} onClick={() => confirmAction(t("adminExtra.openAll"), service.openAllRounds, t("adminExtra.allOpened"), t("adminExtra.openAllHint"))}>{t("adminExtra.openAllButton")}</Button>}>{group && <Alert type="info" showIcon title={t("adminExtra.roundAvailabilityHint")} style={{ marginBottom: 16 }} />}
      <Table rowKey="key" size="small" dataSource={rounds} pagination={false} scroll={{ x: 700 }} columns={[
        { title: t("adminExtra.event"), render: (_, r) => <>{eventName(r.event.EventID)} ({r.event.EventID})</> },
        { title: t("adminExtra.round"), render: (_, r) => `${t("adminExtra.roundNumber", { count: r.round.RoundNum })} · ${text(r.round.Round)}` },
        { title: t("adminExtra.status"), render: (_, r) => <Tag color={r.round.IsRunning ? "cyan" : "default"}>{t(r.round.IsRunning ? "adminExtra.open" : "adminExtra.closed")}</Tag> },
        { title: t("adminExtra.actions"), width: 120, fixed: "right", render: (_, r) => <Button type={r.round.IsRunning ? "default" : "primary"} disabled={busy || comp.IsDone || comp.Status !== "Running" || (!r.round.IsRunning && !canEnterResults(comp))} onClick={() => confirmAction(t("adminExtra.roundAction", { action: t(r.round.IsRunning ? "adminExtra.closeRound" : "adminExtra.openRound"), event: r.event.EventID, round: r.round.RoundNum }), () => service.round(r.event.EventID, r.round.RoundNum, !r.round.IsRunning), t("adminExtra.roundUpdated"), t(r.round.IsRunning ? "adminExtra.closeRoundHint" : group ? "adminExtra.openRoundHint" : "adminExtra.confirmOpen"))}>{t(r.round.IsRunning ? "adminExtra.closeRound" : "adminExtra.openRound")}</Button> },
      ]} />
    </Card>
    <Card title={t("adminExtra.editCompetition")}><Form form={form} layout="vertical" disabled={busy} onFinish={async (values) => {
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
            catch (e) { throw new Error(t("adminExtra.renameFailed", { error: competitionError(e) })); }
          }
        }, t("adminExtra.competitionSaved"));
      } catch (e) { setEditError(competitionError(e)); }
    }}>
      <div className="gc-filters">
        <Form.Item name="Name" label={t("adminExtra.competitionName")} rules={[{ required: true, whitespace: true }]}><Input maxLength={200} /></Form.Item>
        <Form.Item name="Count" label={t("adminExtra.participantLimit")} rules={[{ required: true }]}><InputNumber min={1} precision={0} /></Form.Item>
        <Form.Item name="startDate" label={t(group ? "adminExtra.startDay" : "adminExtra.originalStart")} rules={[{ required: group }]}><Input type={group ? "date" : "text"} readOnly={!group} /></Form.Item>
        <Form.Item name="endDate" label={t(group ? "adminExtra.endDay" : "adminExtra.originalEnd")} rules={[{ required: group }]}><Input type={group ? "date" : "text"} readOnly={!group} /></Form.Item>
        <Form.Item name="CanPreResult" label={t("adminExtra.allowPreEntry")} valuePropName="checked"><Switch /></Form.Item>
      </div>
      <Form.Item name="Illustrate" label={t("adminExtra.competitionNotes")}><Input.TextArea autoSize={{ minRows: 3, maxRows: 10 }} /></Form.Item>
      <Form.Item name="events" label={t("adminExtra.editEvents")} rules={[{ required: true }]}><EventTable /></Form.Item>
      {editError && <Alert type="error" title={editError} style={{ marginBottom: 16 }} />}
      <Button type="primary" htmlType="submit" loading={busy}>{t("adminExtra.saveCompetition")}</Button>
    </Form></Card>
    <Card title={t("adminExtra.registrationReview")} extra={<Button loading={regLoading} onClick={() => void loadPlayers()}>{t("adminExtra.loadRegistrations")}</Button>}>
      <Table<Registration> rowKey="id" loading={regLoading} dataSource={registrations} size="small" scroll={{ x: 650 }} columns={[
        { title: t("adminExtra.player"), render: (_, r) => t("adminExtra.registeredPlayer", { name: r.UserName, id: r.UserID }) }, { title: t("adminExtra.event"), dataIndex: "Events" }, { title: t("adminExtra.status"), dataIndex: "Status" },
        { title: t("adminExtra.actions"), width: 170, fixed: "right", render: (_, r) => <Space><Button disabled={busy || comp.IsDone} onClick={() => void act(async () => { await service.approvePlayer(r.id, true); await loadPlayers(); }, t("adminExtra.registrationApproved")).catch(() => undefined)}>{t("adminExtra.approve")}</Button><Button danger disabled={busy || comp.IsDone} onClick={() => void act(async () => { await service.approvePlayer(r.id, false); await loadPlayers(); }, t("adminExtra.registrationRejected")).catch(() => undefined)}>{t("adminExtra.reject")}</Button></Space> },
      ]} />
    </Card>
  </div>;
}

function PreResults({ comp, service, busy, act }: { comp: CompAPI.Data; service: Service; busy: boolean; act: Action }) {
  const { t, text, intlLocale } = useAdminExtra();
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
    if (!targets.length) { void message.warning(t("adminExtra.selectPending")); return; }
    const actionLabel = ({ ok: t("adminExtra.approve"), not: t("adminExtra.reject"), timeout: t("adminExtra.markTimeout"), doubtful: t("adminExtra.markDoubtful") } as Record<string, string>)[detail];
    const dialog = modal.confirm({ title: t("adminExtra.confirmBatchReview", { action: actionLabel, count: targets.length }), content: t("adminExtra.sequentialHint"), cancelText: t("adminExtra.cancel"), okText: t("adminExtra.confirm"), keyboard: false, maskClosable: false,
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
        if (status.failed) throw new Error(t("adminExtra.batchSummary", { total: status.total, success: status.total - status.failed, failed: status.failed }));
      }, t("adminExtra.selectedReviewed")).catch(() => undefined),
    });
  };

  const approveOne = (row: PreResult) => modal.confirm({ title: t("adminExtra.approveOneTitle", { id: row.id }), content: `${row.PersonName} · ${row.EventID} · ${text(row.Round)}`, okText: t("adminExtra.standardApproval"), cancelText: t("adminExtra.cancel"), onOk: () => act(async () => {
    await service.approveResult(row.id, "ok"); setRevision((value) => value + 1);
  }, t("adminExtra.resultApproved")).catch(() => undefined) });

  const columns: ColumnsType<PreResult> = [
    { title: t("adminExtra.submittedAt"), key: "id", width: 180, render: (_, r) => <><span>#{r.id}</span><br /><Tag>{r.updatedAt ? new Date(r.updatedAt).toLocaleString(intlLocale, { timeZone: "Asia/Shanghai" }) : t("adminExtra.missingTime")}</Tag></> },
    { title: t("adminExtra.player"), key: "player", width: 320, render: (_, r) => <div className="gc-name">{r.PersonName}<br />{r.CubeID || t("adminExtra.missingCubeId")}</div> },
    { title: t("adminExtra.eventRound"), key: "event", width: 150, render: (_, r) => `${r.EventID} / ${text(String(r.RoundName || r.Round || r.RoundNumber || t("adminExtra.missing")))}` },
    { title: t("adminExtra.result"), key: "result", width: 320, render: (_, r) => formatResults(r, t) },
    { title: t("adminExtra.bestAverage"), key: "best", width: 150, render: (_, r) => r.EventRoute >= 8 ? t("adminExtra.seeMultiBlind") : `${resultTimeString(r.Best ?? NaN, r.EventRoute === 3)} / ${resultTimeString(r.Average ?? NaN)}` },
    { title: t("adminExtra.source"), dataIndex: "Source", width: 150 },
    { title: t("adminExtra.reviewStatus"), key: "status", width: 110, render: (_, r) => <Tag color={r.FinishDetail === "ok" ? "cyan" : r.Finish ? "red" : "gold"}>{({ ok: t("adminExtra.passed"), not: t("adminExtra.rejected"), timeout: t("adminExtra.timedOut"), doubtful: t("adminExtra.doubtful"), wait: t("adminExtra.awaitingReview") } as Record<string, string>)[r.Finish ? r.FinishDetail : r.Detail] || t(r.Finish ? "adminExtra.processed" : "adminExtra.awaitingReview")}</Tag> },
    { title: t("adminExtra.processor"), key: "processor", width: 320, render: (_, r) => <div className="gc-name">{r.Processor || "—"}<br />{r.Detail}</div> },
    { title: t("adminExtra.singleReview"), key: "action", width: 210, fixed: "right", render: (_, row) => !row.Finish && <div className="gc-actions"><Button size="small" disabled={busy || !canReviewResults(comp)} onClick={() => approveOne(row)}>{t("adminExtra.standardApproval")}</Button></div> },
  ];
  return <div className="gc-stack">
    {modalContext}
    <Card title={t("adminExtra.reviewFilters")}><Form form={form} layout="vertical" disabled={busy} onFinish={(values) => {
      if (values.start_time && values.end_time && Number(values.start_time) >= Number(values.end_time)) { void message.error(t("adminExtra.timeOrder")); return; }
      navigate(values);
    }}><div className="gc-filters">
      <Form.Item label={t("adminExtra.reviewStatus")} name="finish"><Select options={[{ value: "false", label: t("adminExtra.awaitingReview") }, { value: "ok", label: t("adminExtra.passed") }, { value: "not", label: t("adminExtra.rejected") }, { value: "timeout", label: t("adminExtra.timedOut") }, { value: "true", label: t("adminExtra.allFinished") }, { value: "all", label: t("adminExtra.all") }]} /></Form.Item>
      <Form.Item label={t("adminExtra.event")} name="event"><Select allowClear options={comp.comp_json.Events.map((ev) => ({ value: ev.EventID, label: ev.EventID }))} /></Form.Item>
      <Form.Item label={t("adminExtra.round")} name="round"><InputNumber min={1} precision={0} /></Form.Item>
      <Form.Item label={t("adminExtra.nameCubeId")} name="player"><Input allowClear /></Form.Item>
      <Form.Item label={t("adminExtra.exactSource")} name="source"><Input allowClear placeholder={t("adminExtra.sourceExample")} /></Form.Item>
      <Form.Item label={t("adminExtra.submittedFrom")} name="start_time"><InputNumber min={0} precision={0} /></Form.Item>
      <Form.Item label={t("adminExtra.submittedUntil")} name="end_time"><InputNumber min={0} precision={0} /></Form.Item>
    </div><div className="gc-actions"><Button type="primary" htmlType="submit" loading={loading}>{t("adminExtra.search")}</Button><Button onClick={() => navigate({ finish: "false" })}>{t("adminExtra.reset")}</Button><Button onClick={() => setRevision((v) => v + 1)} loading={loading}>{t("adminExtra.refresh")}</Button></div></Form></Card>
    {error && <Alert type="error" title={error} showIcon />}
    <ProgressReport value={progress} />
    <Card title={t("adminExtra.reviewTotal", { count: total })}>
      <div className="gc-actions" style={{ marginBottom: 16 }}><span>{t("adminExtra.selectedCount", { count: selected.length })}</span><Button type="primary" disabled={busy || !canReviewResults(comp) || !selected.length} onClick={() => approve("ok")}>{t("adminExtra.approve")}</Button><Button danger disabled={busy || !canReviewResults(comp) || !selected.length} onClick={() => approve("not")}>{t("adminExtra.reject")}</Button><Button disabled={busy || !canReviewResults(comp) || !selected.length} onClick={() => approve("timeout")}>{t("adminExtra.markTimeout")}</Button><Button disabled={busy || !canReviewResults(comp) || !selected.length} onClick={() => approve("doubtful")}>{t("adminExtra.doubtful")}</Button></div>
      <Table rowKey="id" dataSource={rows} columns={columns} size="small" loading={loading} scroll={{ x: 2250 }} rowSelection={{ selectedRowKeys: selected, onChange: setSelected, getCheckboxProps: (row) => ({ disabled: busy || row.Finish || !canReviewResults(comp) }) }} pagination={{ current: page, pageSize: size, total, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], onChange: (p, s) => navigate(form.getFieldsValue(), p, s) }} />
    </Card>
  </div>;
}

function OrganizersResultsContent({ orgId, compId, mode }: { orgId: string; compId: string; mode: CompetitionMode }) {
  const { t, text, eventName } = useAdminExtra();
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
    if (mode === "organizer" && String(value.OrganizersID) !== orgId) throw new Error(t("adminExtra.wrongCompetitionTeam"));
    setComp(value);
  }, [mode, orgId, compId, t]);

  useEffect(() => {
    const controller = new AbortController();
    setComp(null); setError("");
    competitionService(mode, orgId, compId).detail(controller.signal).then((value) => {
      if (mode === "organizer" && String(value.OrganizersID) !== orgId) throw new Error(t("adminExtra.wrongCompetitionTeam"));
      if (!controller.signal.aborted) setComp(value);
    }).catch((e) => { if (!controller.signal.aborted) setError(competitionError(e)); });
    return () => controller.abort();
  }, [mode, orgId, compId, t]);
  useEffect(() => { const timer = setInterval(() => setClock(Date.now()), 15_000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    resultRequest.current++;
    setResults([]); setResultLoading(false);
  }, [round, player]);

  const act: Action = async (fn, success, refresh = true) => {
    if (busyRef.current) throw new Error(t("adminExtra.processing"));
    busyRef.current = true; setBusy(true);
    try {
      await fn();
      void message.success(success);
      if (refresh) await reload().catch((e) => message.warning(t("adminExtra.refreshFailed", { error: competitionError(e) })));
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

  if (error) return <Alert type="error" showIcon title={error} action={<Button onClick={() => { setError(""); void reload().catch((e) => setError(competitionError(e))); }}>{t("adminExtra.retry")}</Button>} />;
  if (!comp) return <Spin description={t("adminExtra.loadingCompetition")}><div style={{ minHeight: 100 }} /></Spin>;
  const group = isGroupCompetition(comp);
  const canEnter = canEnterResults(comp);
  const currentEvent = comp.comp_json.Events.find((event) => event.EventID === round?.[0]);
  const currentRound = currentEvent?.Schedule.find((schedule) => schedule.RoundNum === round?.[1]);
  const count = attemptCount(currentEvent?.EventRoute ?? 0);
  const validNewEntry = () => {
    if (!canEnterResults(comp)) throw new Error(t("adminExtra.notApproved"));
    if (!player.trim()) throw new Error(t("adminExtra.requirePlayer"));
  };
  const validateRound = (eventId: string, roundNum: number) => {
    const event = comp.comp_json.Events.find((ev) => ev.EventID === eventId);
    const schedule = event?.Schedule.find((s) => s.RoundNum === roundNum);
    if (!event || !schedule) throw new Error(t("adminExtra.missingRound", { event: eventId, round: roundNum }));
    return event;
  };
  const parseBatch = (text: string) => parseBatchResults(text, comp.comp_json.Events, false);

  const entry = (multi: boolean) => <div className="gc-stack"><Card title={t(multi ? "adminExtra.batchEntryTitle" : "adminExtra.singleEntryTitle")}>
    <Form layout="vertical" disabled={busy} onFinish={async () => {
      let actionStarted = false;
      try {
        validNewEntry();
        if (!multi) {
          if (!round || !currentEvent || !currentRound) throw new Error(t("adminExtra.requireRound"));
          validateRound(round[0], round[1]);
          if (inputs.length < count || Array.from({ length: count }, (_, index) => inputs[index]?.trim()).some((value) => !value)) throw new Error(t("adminExtra.requireResults", { count }));
          const scores = parseAttempts(inputs.slice(0, count).join(" "), currentEvent.EventRoute);
          actionStarted = true;
          await act(async () => { await service.addResult(round[0], round[1], scores, player.trim()); setInputs([]); }, t("adminExtra.resultEntered"));
          await loadResults(false);
        } else {
          const rows = parseBatch(batchText);
          setBatchRows(rows);
          if (!rows.length) throw new Error(t("adminExtra.requireBatch"));
          if (rows.some((row) => row.error)) throw new Error(t("adminExtra.fixPreview"));
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
            if (status.failed) throw new Error(t("adminExtra.failedRetained", { success: rows.length - failed.length, failed: failed.length }));
          }, t("adminExtra.batchEntered"));
          await loadResults(true);
        }
       } catch (e) { if (!actionStarted) void message.error(competitionError(e)); else await loadResults(multi); }
    }}>
      <Form.Item label={t("adminExtra.playerEligibility")}><PlayerPicker value={player} onChange={setPlayer} disabled={busy} /></Form.Item>
      {!multi ? <>
        <Form.Item label={t("adminExtra.eventsRounds")}><Cascader aria-label={t("adminExtra.queryRound")} style={{ width: "100%", maxWidth: 500 }} value={round ? [round[0], String(round[1])] : undefined} options={comp.comp_json.Events.map((ev) => ({ value: ev.EventID, label: `${ev.EventID} ${eventName(ev.EventID)}`, children: ev.Schedule.map((s) => ({ value: String(s.RoundNum), label: `${s.RoundNum} · ${text(s.Round)}${t(s.IsRunning ? "adminExtra.roundOpen" : "adminExtra.roundClosed")}` })) }))} onChange={(v) => { setRound(v ? [String(v[0]), Number(v[1])] : null); setInputs([]); }} /></Form.Item>
        {Array.from({ length: count }, (_, i) => <Form.Item key={i} label={t("adminExtra.attemptNumber", { count: i + 1 })}><Input disabled={!canEnter} value={inputs[i] ?? ""} placeholder={t(currentEvent && currentEvent.EventRoute >= 8 ? "adminExtra.multiBlindExample" : "adminExtra.resultExample")} onChange={(e) => setInputs((previous) => { const next = [...previous]; next[i] = e.target.value; return next; })} style={{ maxWidth: 500 }} /></Form.Item>)}
      </> : <>
        <Alert type="info" title={t("adminExtra.batchHint")} style={{ marginBottom: 16 }} />
        <Form.Item label={t("adminExtra.batchResults")}><Input.TextArea disabled={!canEnter} rows={8} value={batchText} onChange={(e) => { setBatchText(e.target.value); setBatchRows(parseBatch(e.target.value)); }} /></Form.Item>
        <Table rowKey="key" dataSource={batchRows} size="small" pagination={false} scroll={{ x: 700 }} columns={[{ title: t("adminExtra.event"), dataIndex: "event" }, { title: t("adminExtra.round"), dataIndex: "round" }, { title: t("adminExtra.rawInput"), dataIndex: "line" }, { title: t("adminExtra.validation"), render: (_, row) => row.error ? <Tag color="red">{row.error}</Tag> : <Tag color="cyan">{t("adminExtra.ready")}</Tag> }]} />
      </>}
      <Button htmlType="submit" type="primary" loading={busy} disabled={!canEnter || (!multi && !currentRound)} style={{ marginTop: 16 }}>{multi ? t("adminExtra.confirmBatchEntry", { count: batchRows.length }) : t("adminExtra.confirmEntry")}</Button>
    </Form>
  </Card>{multi && <ProgressReport value={progress} />}<Card title={t("adminExtra.enteredResults")} extra={<Button loading={resultLoading} disabled={busy} onClick={() => void loadResults(multi)}>{t("adminExtra.refreshResults")}</Button>}>
    <ScoreList rows={results} busy={busy || (group && !canEnter)} onDelete={(row) => modal.confirm({ title: t("adminExtra.deleteResultTitle", { id: row.id, name: row.PersonName, event: row.EventID, round: text(row.Round) }), okText: t("adminExtra.delete"), cancelText: t("adminExtra.cancel"), okButtonProps: { danger: true }, onOk: () => act(async () => { await service.deleteResult(row.id); await loadResults(multi); }, t("adminExtra.resultDeleted")).catch(() => undefined) })} />
  </Card></div>;

  const orgName = comp.OrganizersName || comp.Org?.Name || options.organizers.find((org) => org.id === comp.OrganizersID)?.Name || t("adminExtra.missingTeam");
  const groupName = comp.GroupName || comp.Group?.name || options.groups.find((group) => group.id === comp.GroupId)?.Name || t("adminExtra.missingGroup");
  return <GroupCompetitionShell title={`#${comp.id} ${comp.Name}`} description={<>{orgName}{group && <> · {groupName}</>} · {text(group ? competitionStatus(comp, clock) : publicCompetitionStatus(comp, clock))} · <Tag>{group ? beijingDate(comp.CompStartTime) : comp.CompStartTime}</Tag>{t("adminExtra.to")} <Tag>{group ? beijingDate(comp.CompEndTime) : comp.CompEndTime}</Tag></>}>
    {modalContext}
    <div className="gc-actions" style={{ marginBottom: 16 }}><Link href={returnTo}>{t("adminExtra.backList")}</Link><Button disabled={busy} onClick={() => void reload().catch((e) => message.error(competitionError(e)))}>{t("adminExtra.refreshCompetition")}</Button><Tag color="cyan">{t(mode === "admin" ? "adminExtra.adminMode" : "adminExtra.organizerMode")}</Tag></div>
    {optionsError && <Alert type="warning" title={t("adminExtra.optionsFailed", { error: optionsError })} style={{ marginBottom: 16 }} />}
    <CompetitionSwitcher comp={comp} mode={mode} options={options} loading={optionsLoading} />
    {group && <Alert type={canEnter ? "info" : "warning"} showIcon title={t(canEnter ? "adminExtra.approvedEntryHint" : "adminExtra.unapprovedEntryHint")} style={{ marginBottom: 16 }} />}
    <NavTabs tabsKey="input_tabs" items={[
      { key: "manage", label: t("adminExtra.manage"), disabled: busy, children: <CompetitionManagement comp={comp} service={service} busy={busy} act={act} mode={mode} /> },
      { key: "one", label: t("adminExtra.singleEntry"), disabled: busy, children: entry(false) },
      { key: "multi", label: t("adminExtra.batchEntry"), disabled: busy, children: entry(true) },
      { key: "pre_result", label: t("adminExtra.resultReview"), disabled: busy, children: <PreResults comp={comp} service={service} busy={busy} act={act} /> },
    ]} />
  </GroupCompetitionShell>;
}

export function OrganizersResultsPageView({ orgId: orgIdProp, compId: compIdProp, admin = false }: { orgId?: string; compId?: string; admin?: boolean }) {
  const { t } = useAdminExtra();
  const search = useSearchParams();
  const routeOrg = useRouteParam("orgId");
  const routeComp = useRouteParam("compId");
  const orgId = orgIdProp ?? routeOrg ?? search?.get("orgId") ?? "";
  const compId = compIdProp ?? routeComp ?? search?.get("compId") ?? "";
  const Guard = admin ? AdminGuard : OrganizersGuard;
  const validId = (value: string) => /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
  const valid = validId(compId) && (admin || validId(orgId));
  return <Guard>{valid ? <OrganizersResultsContent key={`${admin ? "admin" : orgId}:${compId}`} orgId={orgId} compId={compId} mode={admin ? "admin" : "organizer"} /> : <Alert type="info" title={t("adminExtra.chooseFromList")} action={<Link href={admin ? "/admin/competition/approvals" : "/admin/organizers/comps"}>{t("adminExtra.competitionList")}</Link>} />}</Guard>;
}
