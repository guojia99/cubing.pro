"use client";

import "antd/dist/reset.css";

import { Heading, VStack } from "@chakra-ui/react";
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
      void message.error("编号格式不正确，应为类似 2025ABCD01");
      return;
    }
    setPersons((prev) => [...prev, inputValue]);
    setInputValue("");
  };

  const handleSubmit = async () => {
    const uniquePersons = Array.from(new Set(persons));
    for (const person of uniquePersons) {
      if (!isValidPersonCode(person)) {
        void message.error(`编号 ${person} 不符合格式要求`);
        return;
      }
    }
    if (!kv) return;
    setLoading(true);
    try {
      await apiUpdateRankingWithKey(kv.id, description, uniquePersons);
      void message.success("更新成功");
      onClose();
    } catch {
      void message.error("更新失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`修改 ${kv?.Description} 名单列表`}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={() => void handleSubmit()}>
          提交
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        <div style={{ marginBottom: 16 }}>
          <label>
            描述：
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入描述信息"
              style={{ width: "100%", marginTop: 4 }}
            />
          </label>
        </div>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="请输入人员编号（例如：2025JIAY01）"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleAddPerson}
            style={{ width: "70%", marginRight: 8 }}
          />
          <Button type="primary" onClick={handleAddPerson}>
            添加
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
                    删除
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
      console.error("创建失败", error);
      void message.error("创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="新建排名项"
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
          label="Key"
          name="key"
          rules={[
            { required: true, message: "请输入 Key" },
            { max: 50, message: "Key 不能超过 50 个字符" },
          ]}
        >
          <Input placeholder="例如：rank_2025" />
        </Form.Item>
        <Form.Item
          label="描述"
          name="description"
          rules={[
            { required: true, message: "请输入描述" },
            { max: 100, message: "描述不能超过 100 个字符" },
          ]}
        >
          <Input.TextArea rows={3} placeholder="请输入该项的描述信息" />
        </Form.Item>
        <div style={{ textAlign: "right" }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            提交
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

export function AdminDiyRankingPageView() {
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
      title: "名称",
      dataIndex: "Description",
      key: "Description",
      align: "center",
    },
    {
      title: "Key",
      dataIndex: "id",
      key: "id",
      align: "center",
      render: (text: string) => <Tag color="orange">{text}</Tag>,
    },
    {
      title: "人数",
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
      title: "操作",
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
          修改
        </Button>
      ),
    },
  ];

  return (
    <AdminGuard>
      <VStack align="stretch" gap="6">
        <Heading size="xl">DIY 榜单管理</Heading>
        <div style={{ textAlign: "right" }}>
          <Button type="primary" onClick={() => setNewModalOpen(true)}>
            添加
          </Button>
        </div>
        <Table
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
