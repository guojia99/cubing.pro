"use client";
import { useI18n } from "@/contexts/I18nProvider";
import { useAdminManagement } from "@/views/admin/useAdminManagement";

import "antd/dist/reset.css";

import { VStack } from "@chakra-ui/react";
import { PageHeader } from "@/components/ui/page";
import "./admin-ui.css";
import { Button, Form, Input, List, Modal, Spin, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import {
  apiCreateRanking,
  apiGetAllDiyRankingKey,
  apiUpdateRankingWithKey,
} from "@/services/cubing-pro/statistics/diy_ranking";
import type { StaticAPI } from "@/services/cubing-pro/statistics/typings";

const { Text } = Typography;

const isValidPersonCode = (code: string): boolean => /^\d{4}[A-Z]{4}\d{2}$/.test(code);

function UpdatePersonModal({
  open,
  onClose,
  kv,
}: {
  open: boolean;
  onClose: () => void;
  kv?: StaticAPI.DiyRankKeyValue;
}) {
  const { t } = useI18n();
  const m = useAdminManagement();
  const [persons, setPersons] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (kv?.Value) {
      try {
        const parsed = JSON.parse(kv.Value);
        setPersons(Array.isArray(parsed) ? parsed : []);
      } catch {
        setPersons([]);
      }
    } else {
      setPersons([]);
    }
    setDescription(kv?.Description || "");
  }, [kv]);

  const handleAddPerson = () => {
    if (!inputValue.trim()) return;
    if (!isValidPersonCode(inputValue)) {
      void message.error(m("adminManagement.invalidPersonCode"));
      return;
    }
    setPersons((prev) => [...prev, inputValue]);
    setInputValue("");
  };

  const handleSubmit = async () => {
    const uniquePersons = Array.from(new Set(persons));
    for (const person of uniquePersons) {
      if (!isValidPersonCode(person)) {
        void message.error(m("adminManagement.invalidPerson", { person }));
        return;
      }
    }
    if (!kv) return;
    setLoading(true);
    try {
      await apiUpdateRankingWithKey(kv.id, description, uniquePersons);
      void message.success(t("profile.saveOk"));
      onClose();
    } catch {
      void message.error(m("adminManagement.updateFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={m("adminManagement.editRanking", { name: kv?.Description ?? "" })}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          {t("teamMatch.cancel")}
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={() => void handleSubmit()}>
          {t("competitionAdmin.submit")}
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <div style={{ marginBottom: 16 }}>
          <label>
            {m("adminManagement.description")}
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={m("adminManagement.enterDescription")}
              style={{ width: "100%", marginTop: 4 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder={m("adminManagement.personCode")}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleAddPerson}
            style={{ width: "70%", marginRight: 8 }}
          />
          <Button type="primary" onClick={handleAddPerson}>
            {t("teamMatch.add")}
          </Button>
        </div>
        <div
          style={{
            maxHeight: 300,
            overflowY: "auto",
            border: "1px solid var(--border-default)",
            borderRadius: 4,
            padding: 8,
          }}
        >
          <List
            dataSource={persons}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <a key="delete" onClick={() => setPersons((prev) => prev.filter((_, i) => i !== index))}>
                    {t("teamMatch.delete")}
                  </a>,
                ]}
              >
                <Text>
                  {index + 1}. {item}
                </Text>
              </List.Item>
            )}
          />
        </div>
      </Spin>
    </Modal>
  );
}

function CreateRankingModal({
  open,
  onCancel,
  onOk,
}: {
  open: boolean;
  onCancel: () => void;
  onOk?: () => void;
}) {
  const { t } = useI18n();
  const m = useAdminManagement();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: { key: string; description: string }) => {
    setLoading(true);
    try {
      await apiCreateRanking(values.key, values.description);
      form.resetFields();
      onOk?.();
      onCancel();
    } catch (error) {
      console.error(m("adminManagement.createFailed"), error);
      void message.error(m("adminManagement.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={m("adminManagement.createRanking")}
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={(v) => void handleFinish(v)}>
        <Form.Item
          label={m("adminManagement.key")}
          name="key"
          rules={[
            { required: true, message: m("adminManagement.keyRequired") },
            { max: 50, message: m("adminManagement.keyMax") },
          ]}
        >
          <Input placeholder={m("adminManagement.keyExample")} />
        </Form.Item>
        <Form.Item
          label={m("adminManagement.description")}
          name="description"
          rules={[
            { required: true, message: m("adminManagement.descriptionRequired") },
            { max: 100, message: m("adminManagement.descriptionMax") },
          ]}
        >
          <Input.TextArea rows={3} placeholder={m("adminManagement.rankingDescription")} />
        </Form.Item>
        <div style={{ textAlign: "right" }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            {t("competitionAdmin.submit")}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export function AdminDiyRankingPageView() {
  const { t } = useI18n();
  const m = useAdminManagement();
  const [keys, setKeys] = useState<StaticAPI.DiyRankKeyValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentKey, setCurrentKey] = useState<StaticAPI.DiyRankKeyValue>();
  const [newModalOpen, setNewModalOpen] = useState(false);

  const fetchDiyRankingKey = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGetAllDiyRankingKey();
      setKeys(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDiyRankingKey();
  }, [fetchDiyRankingKey]);

  const columns: ColumnsType<StaticAPI.DiyRankKeyValue> = [
    {
      title: t("competitionAdmin.name"),
      dataIndex: "Description",
      key: "Description",
      align: "center",
    },
    {
      title: m("adminManagement.key"),
      dataIndex: "id",
      key: "id",
      align: "center",
      render: (text: string) => <Tag color="orange">{text}</Tag>,
    },
    {
      title: t("competitionAdmin.players"),
      dataIndex: "Value",
      key: "Value",
      align: "center",
      render: (text: string) => {
        try {
          const data = JSON.parse(text);
          return Array.isArray(data) ? data.length : 0;
        } catch {
          return 0;
        }
      },
    },
    {
      title: t("teamMatch.actions"),
      key: "Option",
      align: "center",
      render: (_, val) => (
        <Button
          size="small"
          disabled={val.id === "diy_rankings_cubing_pro"}
          onClick={() => {
            setCurrentKey(val);
            setUpdateModalOpen(true);
          }}
        >
          {t("teamMatch.edit")}
        </Button>
      ),
    },
  ];

  return (
    <AdminGuard>
      <VStack className="admin-page" align="stretch" gap="6">
        <PageHeader eyebrow={t("nav.admin.admins")} title={m("adminManagement.rankingTitle")} />
        <div style={{ textAlign: "right" }}>
          <Button type="primary" onClick={() => setNewModalOpen(true)}>
            {t("teamMatch.add")}
          </Button>
        </div>
        <Table
          scroll={{ x: "max-content" }}
          dataSource={keys}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
        <UpdatePersonModal
          open={updateModalOpen}
          onClose={() => {
            void fetchDiyRankingKey();
            setUpdateModalOpen(false);
          }}
          kv={currentKey}
        />
        <CreateRankingModal
          open={newModalOpen}
          onCancel={() => setNewModalOpen(false)}
          onOk={() => void fetchDiyRankingKey()}
        />
      </VStack>
    </AdminGuard>
  );
}
