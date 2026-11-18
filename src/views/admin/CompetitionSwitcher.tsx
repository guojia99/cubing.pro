"use client";

import { Button, Card, Form, Input, Select, message } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { competitionError, listGroupCompetitions, type CompetitionFilters, type CompetitionItem, type CompetitionMode } from "@/services/cubing-pro/auth/groupCompetition";
import type { CompAPI } from "@/services/cubing-pro/comps/typings";
import { useAdminExtra } from "./useAdminExtra";

export function CompetitionSwitcher({ comp, mode, options, loading }: { comp: CompAPI.Data; mode: CompetitionMode; options: CompetitionFilters; loading: boolean }) {
  const { t } = useAdminExtra();
  const [form] = Form.useForm();
  const router = useRouter();
  const orgId = Form.useWatch("orgId", form);
  const [items, setItems] = useState<CompetitionItem[]>([]);
  const [fetching, setFetching] = useState(false);
  useEffect(() => {
    form.setFieldsValue({ orgId: String(comp.OrganizersID), groupId: comp.GroupId ? String(comp.GroupId) : undefined });
  }, [comp.id, comp.OrganizersID, comp.GroupId, form]);
  return <Card size="small" title={t("adminExtra.switchTitle")}><Form form={form} layout="vertical" onFinish={async (values) => {
    if (mode !== "admin" && !values.orgId) return;
    setFetching(true);
    try {
      const data = await listGroupCompetitions(mode, values.orgId ?? "", { orgId: values.orgId, groupId: values.groupId, name: values.name, status: "all", page: 1, size: 100 });
      setItems(data.items ?? []);
      if (data.next) void message.info(t("adminExtra.firstHundred"));
    } catch (error) { void message.error(competitionError(error)); }
    finally { setFetching(false); }
  }}><div className="gc-filters">
    <Form.Item name="orgId" label={t("adminExtra.organizerTeam")}><Select allowClear={mode === "admin"} showSearch optionFilterProp="label" placeholder={t("adminExtra.searchTeam")} loading={loading} options={options.organizers.map((org) => ({ value: String(org.id), label: org.Name }))} onChange={() => { form.setFieldValue("groupId", undefined); setItems([]); }} /></Form.Item>
    <Form.Item name="groupId" label={t("adminExtra.group")}><Select allowClear showSearch optionFilterProp="label" placeholder={t("adminExtra.searchGroup")} loading={loading} options={options.groups.filter((group) => !orgId || String(group.OrganizersID) === String(orgId)).map((group) => ({ value: String(group.id), label: group.Name }))} onChange={() => setItems([])} /></Form.Item>
    <Form.Item name="name" label={t("adminExtra.competitionName")}><Input allowClear placeholder={t("adminExtra.searchCompetition")} /></Form.Item>
    <Form.Item label={t("adminExtra.search")}><Button htmlType="submit" loading={fetching}>{t("adminExtra.findCompetition")}</Button></Form.Item>
    <Form.Item label={t("adminExtra.enterReview")}><Select showSearch optionFilterProp="label" placeholder={t("adminExtra.queryThenSelect")} loading={fetching} options={items.map((item) => ({ value: item.id, label: item.Name }))} onChange={(id) => {
      const item = items.find((row) => row.id === id);
      if (!item) return;
      const params = new URLSearchParams({ compId: String(id), input_tabs: "pre_result" });
      if (mode !== "admin") params.set("orgId", String(item.OrganizersID));
      router.push(`${mode === "admin" ? "/admin/competition/manage" : "/admin/organizers/result"}?${params}`);
    }} /></Form.Item>
  </div></Form></Card>;
}
