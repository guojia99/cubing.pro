"use client";

import { Alert, Button, Card, Form, Input, InputNumber, Modal, Select, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { OrganizersGuard } from "@/components/admin/OrganizersGuard";
import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import { rowClassNameWithStyleLines } from "@/components/Table/table_style";
import { approveGroupCompetition, competitionError, listGroupCompetitions, type CompetitionItem, type Query } from "@/services/cubing-pro/auth/groupCompetition";
import { GroupCompetitionShell } from "./GroupCompetitionShell";
import { beijingDate, competitionStatus, isGroupCompetition, positiveInteger, publicCompetitionStatus } from "@/lib/groupCompetition";
import { parseDateTime } from "@/utils/time/data_time";
import { useCompetitionOptions } from "./useCompetitionOptions";
import { useAdminExtra } from "./useAdminExtra";

function CompetitionList({ admin = false }: { admin?: boolean }) {
  const { t, text } = useAdminExtra();
  const statuses = [
    { value: "Reviewing", label: t("adminExtra.pending") }, { value: "all", label: t("adminExtra.allStatuses") },
    { value: "Running", label: t("adminExtra.approved") }, { value: "Reject", label: t("adminExtra.rejected") },
    { value: "Temporary", label: t("adminExtra.draft") }, { value: "Ban", label: t("adminExtra.banned") },
  ];
  const [modal, modalContext] = Modal.useModal();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const searchText = search?.toString() ?? "";
  const [form] = Form.useForm();
  const { options, loading: orgLoading, error: optionsError } = useCompetitionOptions(admin);
  const orgs = options.organizers;
  const selectedOrg = Form.useWatch("orgId", form);
  const [items, setItems] = useState<CompetitionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const approvalBusy = useRef(false);
  const page = positiveInteger(search?.get("page") ?? null);
  const size = positiveInteger(search?.get("size") ?? null, 20, 100);
  const orgId = search?.get("orgId") ?? (admin ? "" : String(orgs[0]?.id ?? ""));

  useEffect(() => {
    const params = new URLSearchParams(searchText);
    form.setFieldsValue({ id: params.get("id") || undefined, name: params.get("name") || undefined,
      status: params.get("status") || (admin ? "Reviewing" : "all"), orgId: orgId || undefined,
      groupId: params.get("groupId") || undefined, date: params.get("date") || "",
      isDone: params.get("isDone") || undefined });
    if (!admin && (!orgId || !orgs.some((org) => String(org.id) === orgId))) {
      setItems([]); setTotal(0);
      if (orgId && orgs.length) setError(t("adminExtra.wrongUrlTeam"));
      return;
    }
    const controller = new AbortController();
    const query: Query = { page, size, status: admin ? "Reviewing" : "all" };
    for (const key of ["id", "name", "status", "orgId", "groupId", "isDone", "date"]) {
      const value = params.get(key);
      if (value) query[key] = value;
    }
    setLoading(true); setError(""); setItems([]); setTotal(0);
    listGroupCompetitions(admin ? "admin" : "organizer", orgId, query, controller.signal)
      .then((value) => { if (!controller.signal.aborted) { setItems(value.items ?? []); setTotal(value.total); } })
      .catch((e) => { if (!controller.signal.aborted) setError(competitionError(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [admin, orgId, orgs, searchText, page, size, form, revision, t]);

  const navigate = (values: Record<string, unknown>, nextPage = 1, nextSize = size) => {
    const params = new URLSearchParams(searchText);
    for (const key of ["id", "name", "status", "orgId", "groupId", "isDone", "date"]) {
      const value = values[key];
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value)); else params.delete(key);
    }
    params.set("page", String(nextPage)); params.set("size", String(nextSize));
    router.push(`${pathname}?${params}`);
  };

  const approval = (comp: CompetitionItem, ok: boolean) => {
    let reason = "";
    modal.confirm({ title: t("adminExtra.approvalTitle", { action: t(ok ? "adminExtra.approve" : "adminExtra.reject"), id: comp.id, name: comp.Name }),
      content: ok ? t("adminExtra.approvalHint") : <Input.TextArea placeholder={t("adminExtra.rejectReason")} onChange={(e) => { reason = e.target.value; }} />,
      okText: t(ok ? "adminExtra.approve" : "adminExtra.reject"), cancelText: t("adminExtra.cancel"), okButtonProps: { danger: !ok },
      onOk: async () => {
        if (approvalBusy.current) return Promise.reject();
        if (!ok && !reason.trim()) { void message.warning(t("adminExtra.requireReason")); return Promise.reject(); }
        approvalBusy.current = true;
        try { await approveGroupCompetition(comp.id, ok, reason.trim()); void message.success(t("adminExtra.approvalSaved")); setRevision((v) => v + 1); }
        catch (e) { void message.error(competitionError(e)); throw e; }
        finally { approvalBusy.current = false; }
      },
    });
  };

  const columns: ColumnsType<CompetitionItem> = [
    { title: t("adminExtra.index"), key: "index", width: 64, render: (_, __, index) => (page - 1) * size + index + 1 },
    { title: t("adminExtra.date"), key: "date", width: 140, render: (_, row) => <div className="gc-dates">{isGroupCompetition(row) ? <><Tag>{beijingDate(row.CompStartTime)}</Tag><span className="gc-secondary">{t("adminExtra.to")}</span><Tag>{beijingDate(row.CompEndTime)}</Tag></> : <Tag>{parseDateTime(row.CompStartTime)}</Tag>}</div> },
    { title: t("adminExtra.competitionName"), key: "comp", width: 252, render: (_, row) => <div className="gc-name"><Link href={`/competition/${row.id}`}>{row.Name}</Link><small className="gc-secondary">{t("adminExtra.competitionNumber", { id: row.id })}</small>{row.RejectMsg && <div style={{ color: "var(--destructive)" }}>{t("adminExtra.rejectedReason", { reason: row.RejectMsg })}</div>}</div> },
    { title: t("adminExtra.organizerTeam"), key: "org", width: 128, render: (_, row) => <div className="gc-name gc-short-name">{row.OrganizersName || orgs.find((org) => org.id === row.OrganizersID)?.Name || t("adminExtra.missingTeam")}<small className="gc-secondary">ID {row.OrganizersID}</small></div> },
    { title: t("adminExtra.group"), key: "group", width: 128, render: (_, row) => <div className="gc-name gc-short-name">{row.GroupName || options.groups.find((group) => group.id === row.GroupId)?.Name || t("adminExtra.missingGroup")}<small className="gc-secondary">ID {row.GroupId}</small></div> },
    { title: t("adminExtra.participants"), dataIndex: "Count", width: 70 },
    { title: t("adminExtra.event"), dataIndex: "EventMin", width: 160, render: (value: string) => <div className="gc-actions">{(value ?? "").split(";").filter(Boolean).map((id) => <span key={id}>{CubeIcon(id, id, {})}</span>)}</div> },
    { title: t("adminExtra.status"), key: "status", width: 175, render: (_, row) => <Tag color={row.Status === "Reviewing" ? "gold" : row.Status === "Reject" ? "red" : "cyan"}>{text(isGroupCompetition(row) ? competitionStatus(row) : publicCompetitionStatus(row))}</Tag> },
    { title: t("adminExtra.pendingResults"), dataIndex: "PendingCount", width: 95, render: (value) => value ?? 0 },
    { title: t("adminExtra.actions"), key: "actions", width: 240, fixed: "right", render: (_, row) => {
      const target = new URLSearchParams({ compId: String(row.id), returnTo: `${pathname}?${searchText}` });
      if (!admin) target.set("orgId", String(row.OrganizersID));
      const base = `${admin ? "/admin/competition/manage" : "/admin/organizers/result"}?${target}`;
      return <div className="gc-actions"><Link href={`${base}&input_tabs=manage`}>{t("adminExtra.manage")}</Link><Link href={`${base}&input_tabs=pre_result`}>{t("adminExtra.resultReview")}</Link>
        {admin && row.Status === "Reviewing" && <><Button size="small" type="primary" onClick={() => approval(row, true)}>{t("adminExtra.approve")}</Button><Button size="small" danger onClick={() => approval(row, false)}>{t("adminExtra.reject")}</Button></>}
      </div>;
    } },
  ];

  return <GroupCompetitionShell title={t(admin ? "adminExtra.adminTitle" : "adminExtra.teamTitle")} description={t(admin ? "adminExtra.adminDescription" : "adminExtra.teamDescription")}>
    {modalContext}
    <div className="gc-actions" style={{ marginBottom: 16 }}><Link href="/admin/organizers/comps/create"><Button type="primary">{t("adminExtra.create")}</Button></Link>{!admin && <Link href="/admin/organizers">{t("adminExtra.organizerHome")}</Link>}<Button loading={loading} onClick={() => setRevision((v) => v + 1)}>{t("adminExtra.refresh")}</Button></div>
    {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
    {optionsError && <Alert type="warning" showIcon title={t("adminExtra.optionsFailed", { error: optionsError })} style={{ marginBottom: 16 }} />}
    {!admin && !orgLoading && !orgs.length && <Alert type="info" title={t("adminExtra.noTeam")} action={<Link href="/admin/competition/approvals">{t("adminExtra.adminEntry")}</Link>} />}
    <Card title={t("adminExtra.filterCompetitions")}><Form form={form} layout="vertical" onFinish={(values) => navigate(values)}>
      <div className="gc-filters">
        <Form.Item label={t("adminExtra.competitionId")} name="id"><InputNumber min={1} precision={0} /></Form.Item>
        <Form.Item label={t("adminExtra.competitionName")} name="name"><Input.Search allowClear placeholder={t("adminExtra.searchCompetition")} onSearch={() => form.submit()} /></Form.Item>
        <Form.Item label={t("adminExtra.status")} name="status"><Select options={statuses} /></Form.Item>
        <Form.Item label={t("adminExtra.team")} name="orgId"><Select showSearch optionFilterProp="label" allowClear={admin} placeholder={t("adminExtra.searchTeam")} loading={orgLoading} onChange={() => form.setFieldValue("groupId", undefined)} options={orgs.map((org) => ({ value: String(org.id), label: org.Name }))} /></Form.Item>
        <Form.Item label={t("adminExtra.group")} name="groupId"><Select showSearch optionFilterProp="label" allowClear placeholder={t("adminExtra.searchGroup")} loading={orgLoading} options={options.groups.filter((group) => !selectedOrg || String(group.OrganizersID) === String(selectedOrg)).map((group) => ({ value: String(group.id), label: group.Name }))} /></Form.Item>
        <Form.Item label={t("adminExtra.dateCovered")} name="date"><Input type="date" /></Form.Item>
        <Form.Item label={t("adminExtra.explicitEnd")} name="isDone"><Select allowClear placeholder={t("adminExtra.all")} options={[{ value: "false", label: t("adminExtra.notEnded") }, { value: "true", label: t("adminExtra.ended") }]} /></Form.Item>
      </div><div className="gc-actions"><Button type="primary" htmlType="submit" loading={loading}>{t("adminExtra.search")}</Button><Button onClick={() => navigate({ status: admin ? "Reviewing" : "all", orgId: admin ? undefined : orgId })}>{t("adminExtra.reset")}</Button></div>
    </Form></Card>
    <Table aria-label={t("adminExtra.managementList")} rowKey="id" size="small" tableLayout="fixed" rowClassName={rowClassNameWithStyleLines} loading={loading || orgLoading} dataSource={items} columns={columns} scroll={{ x: 1452 }} sticky pagination={{ current: page, pageSize: size, total, showQuickJumper: true, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (n) => t("adminExtra.competitionTotal", { count: n }), onChange: (p, s) => navigate(form.getFieldsValue(), p, s) }} />
  </GroupCompetitionShell>;
}

export function OrganizersCompsPageView() {
  return <OrganizersGuard><CompetitionList /></OrganizersGuard>;
}
export function AdminCompetitionApprovalsPageView() { return <AdminGuard><CompetitionList admin /></AdminGuard>; }
