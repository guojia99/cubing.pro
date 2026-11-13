"use client";

import { Button, Card, Form, Input, Select, message } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { competitionError, listGroupCompetitions, type CompetitionFilters, type CompetitionItem, type CompetitionMode } from "@/services/cubing-pro/auth/groupCompetition";
import type { CompAPI } from "@/services/cubing-pro/comps/typings";

export function CompetitionSwitcher({ comp, mode, options, loading }: { comp: CompAPI.Data; mode: CompetitionMode; options: CompetitionFilters; loading: boolean }) {
  const [form] = Form.useForm();
  const router = useRouter();
  const orgId = Form.useWatch("orgId", form);
  const [items, setItems] = useState<CompetitionItem[]>([]);
  const [fetching, setFetching] = useState(false);
  useEffect(() => {
    form.setFieldsValue({ orgId: String(comp.OrganizersID), groupId: comp.GroupId ? String(comp.GroupId) : undefined });
  }, [comp.id, comp.OrganizersID, comp.GroupId, form]);
  return <Card size="small" title="按团队 / 群组选择审批比赛"><Form form={form} layout="vertical" onFinish={async (values) => {
    if (mode !== "admin" && !values.orgId) return;
    setFetching(true);
    try {
      const data = await listGroupCompetitions(mode, values.orgId ?? "", { orgId: values.orgId, groupId: values.groupId, name: values.name, status: "all", page: 1, size: 100 });
      setItems(data.items ?? []);
      if (data.next) void message.info("已显示前 100 场，请输入比赛名称缩小范围");
    } catch (error) { void message.error(competitionError(error)); }
    finally { setFetching(false); }
  }}><div className="gc-filters">
    <Form.Item name="orgId" label="主办团队"><Select allowClear={mode === "admin"} showSearch optionFilterProp="label" placeholder="搜索团队名称" loading={loading} options={options.organizers.map((org) => ({ value: String(org.id), label: org.Name }))} onChange={() => { form.setFieldValue("groupId", undefined); setItems([]); }} /></Form.Item>
    <Form.Item name="groupId" label="群组"><Select allowClear showSearch optionFilterProp="label" placeholder="搜索群组名称" loading={loading} options={options.groups.filter((group) => !orgId || String(group.OrganizersID) === String(orgId)).map((group) => ({ value: String(group.id), label: group.Name }))} onChange={() => setItems([])} /></Form.Item>
    <Form.Item name="name" label="比赛名称"><Input allowClear placeholder="搜索比赛名称" /></Form.Item>
    <Form.Item label="查询"><Button htmlType="submit" loading={fetching}>查找比赛</Button></Form.Item>
    <Form.Item label="进入成绩审批"><Select showSearch optionFilterProp="label" placeholder="先查询，再选择比赛" loading={fetching} options={items.map((item) => ({ value: item.id, label: item.Name }))} onChange={(id) => {
      const item = items.find((row) => row.id === id);
      if (!item) return;
      const params = new URLSearchParams({ compId: String(id), input_tabs: "pre_result" });
      if (mode !== "admin") params.set("orgId", String(item.OrganizersID));
      router.push(`${mode === "admin" ? "/admin/competition/manage" : "/admin/organizers/result"}?${params}`);
    }} /></Form.Item>
  </div></Form></Card>;
}
