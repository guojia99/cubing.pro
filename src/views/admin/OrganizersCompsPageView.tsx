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

const statuses = [
  { value: "Reviewing", label: "待审批" }, { value: "all", label: "全部状态" },
  { value: "Running", label: "已批准" }, { value: "Reject", label: "已驳回" },
  { value: "Temporary", label: "草稿" }, { value: "Ban", label: "已封禁" },
];

function CompetitionList({ admin = false }: { admin?: boolean }) {
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
      if (orgId && orgs.length) setError("你不属于 URL 指定的团队，请选择自己的团队查询");
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
  }, [admin, orgId, orgs, searchText, page, size, form, revision]);

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
    modal.confirm({ title: `${ok ? "通过" : "驳回"}比赛 #${comp.id} ${comp.Name}`,
      content: ok ? "通过后即可录入已配置轮次成绩，不受赛期、结束标记或轮次开放状态限制。" : <Input.TextArea placeholder="填写驳回原因（必填）" onChange={(e) => { reason = e.target.value; }} />,
      okText: ok ? "通过" : "驳回", cancelText: "取消", okButtonProps: { danger: !ok },
      onOk: async () => {
        if (approvalBusy.current) return Promise.reject();
        if (!ok && !reason.trim()) { void message.warning("请填写驳回原因"); return Promise.reject(); }
        approvalBusy.current = true;
        try { await approveGroupCompetition(comp.id, ok, reason.trim()); void message.success("审批已保存"); setRevision((v) => v + 1); }
        catch (e) { void message.error(competitionError(e)); throw e; }
        finally { approvalBusy.current = false; }
      },
    });
  };

  const columns: ColumnsType<CompetitionItem> = [
    { title: "序号", key: "index", width: 64, render: (_, __, index) => (page - 1) * size + index + 1 },
    { title: "日期", key: "date", width: 140, render: (_, row) => <div className="gc-dates">{isGroupCompetition(row) ? <><Tag>{beijingDate(row.CompStartTime)}</Tag><span className="gc-secondary">至</span><Tag>{beijingDate(row.CompEndTime)}</Tag></> : <Tag>{parseDateTime(row.CompStartTime)}</Tag>}</div> },
    { title: "比赛名称", key: "comp", width: 252, render: (_, row) => <div className="gc-name"><Link href={`/competition/${row.id}`}>{row.Name}</Link><small className="gc-secondary">比赛 #{row.id}</small>{row.RejectMsg && <div style={{ color: "#b42318" }}>驳回：{row.RejectMsg}</div>}</div> },
    { title: "主办团队", key: "org", width: 128, render: (_, row) => <div className="gc-name gc-short-name">{row.OrganizersName || orgs.find((org) => org.id === row.OrganizersID)?.Name || "团队名称未提供"}<small className="gc-secondary">ID {row.OrganizersID}</small></div> },
    { title: "群组", key: "group", width: 128, render: (_, row) => <div className="gc-name gc-short-name">{row.GroupName || options.groups.find((group) => group.id === row.GroupId)?.Name || "群组名称未提供"}<small className="gc-secondary">ID {row.GroupId}</small></div> },
    { title: "人数", dataIndex: "Count", width: 70 },
    { title: "项目", dataIndex: "EventMin", width: 160, render: (value: string) => <div className="gc-actions">{(value ?? "").split(";").filter(Boolean).map((id) => <span key={id}>{CubeIcon(id, id, {})}</span>)}</div> },
    { title: "状态", key: "status", width: 175, render: (_, row) => <Tag color={row.Status === "Reviewing" ? "gold" : row.Status === "Reject" ? "red" : "cyan"}>{isGroupCompetition(row) ? competitionStatus(row) : publicCompetitionStatus(row)}</Tag> },
    { title: "待审成绩", dataIndex: "PendingCount", width: 95, render: (value) => value ?? 0 },
    { title: "操作", key: "actions", width: 240, fixed: "right", render: (_, row) => {
      const target = new URLSearchParams({ compId: String(row.id), returnTo: `${pathname}?${searchText}` });
      if (!admin) target.set("orgId", String(row.OrganizersID));
      const base = `${admin ? "/admin/competition/manage" : "/admin/organizers/result"}?${target}`;
      return <div className="gc-actions"><Link href={`${base}&input_tabs=manage`}>比赛管理</Link><Link href={`${base}&input_tabs=pre_result`}>成绩审批</Link>
        {admin && row.Status === "Reviewing" && <><Button size="small" type="primary" onClick={() => approval(row, true)}>通过</Button><Button size="small" danger onClick={() => approval(row, false)}>驳回</Button></>}
      </div>;
    } },
  ];

  return <GroupCompetitionShell title={admin ? "管理员群赛审批" : "团队群赛管理"} description={admin ? "全局筛选群赛、审批申请并管理对应比赛和成绩。默认显示待审批比赛。" : "仅显示你所属团队的比赛；群赛审批通过后即可录入已配置轮次成绩。"}>
    {modalContext}
    <div className="gc-actions" style={{ marginBottom: 16 }}><Link href="/admin/organizers/comps/create"><Button type="primary">创建群赛</Button></Link>{!admin && <Link href="/admin/organizers">主办首页</Link>}<Button loading={loading} onClick={() => setRevision((v) => v + 1)}>刷新</Button></div>
    {error && <Alert type="error" showIcon title={error} style={{ marginBottom: 16 }} />}
    {optionsError && <Alert type="warning" showIcon title={`名称选项加载失败：${optionsError}`} style={{ marginBottom: 16 }} />}
    {!admin && !orgLoading && !orgs.length && <Alert type="info" title="你尚未加入主办团队。管理员可直接进入全局群赛审批。" action={<Link href="/admin/competition/approvals">管理员入口</Link>} />}
    <Card title="筛选比赛"><Form form={form} layout="vertical" onFinish={(values) => navigate(values)}>
      <div className="gc-filters">
        <Form.Item label="比赛 ID" name="id"><InputNumber min={1} precision={0} /></Form.Item>
        <Form.Item label="比赛名称" name="name"><Input.Search allowClear placeholder="搜索赛事名称" onSearch={() => form.submit()} /></Form.Item>
        <Form.Item label="状态" name="status"><Select options={statuses} /></Form.Item>
        <Form.Item label="团队" name="orgId"><Select showSearch optionFilterProp="label" allowClear={admin} placeholder="搜索团队名称" loading={orgLoading} onChange={() => form.setFieldValue("groupId", undefined)} options={orgs.map((org) => ({ value: String(org.id), label: org.Name }))} /></Form.Item>
        <Form.Item label="群组" name="groupId"><Select showSearch optionFilterProp="label" allowClear placeholder="搜索群组名称" loading={orgLoading} options={options.groups.filter((group) => !selectedOrg || String(group.OrganizersID) === String(selectedOrg)).map((group) => ({ value: String(group.id), label: group.Name }))} /></Form.Item>
        <Form.Item label="覆盖日期" name="date"><Input type="date" /></Form.Item>
        <Form.Item label="是否显式结束" name="isDone"><Select allowClear placeholder="全部" options={[{ value: "false", label: "未结束" }, { value: "true", label: "已结束" }]} /></Form.Item>
      </div><div className="gc-actions"><Button type="primary" htmlType="submit" loading={loading}>查询</Button><Button onClick={() => navigate({ status: admin ? "Reviewing" : "all", orgId: admin ? undefined : orgId })}>重置</Button></div>
    </Form></Card>
    <Table aria-label="比赛管理列表" rowKey="id" size="small" tableLayout="fixed" rowClassName={rowClassNameWithStyleLines} loading={loading || orgLoading} dataSource={items} columns={columns} scroll={{ x: 1452 }} sticky pagination={{ current: page, pageSize: size, total, showQuickJumper: true, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (n) => `共 ${n} 场`, onChange: (p, s) => navigate(form.getFieldsValue(), p, s) }} />
  </GroupCompetitionShell>;
}

export function OrganizersCompsPageView() {
  return <OrganizersGuard><CompetitionList /></OrganizersGuard>;
}
export function AdminCompetitionApprovalsPageView() { return <AdminGuard><CompetitionList admin /></AdminGuard>; }
