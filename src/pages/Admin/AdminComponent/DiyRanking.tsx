import {
  apiCreateRanking,
  apiGetAllDiyRankingKey,
  apiUpdateRankingWithKey,
} from '@/services/cubing-pro/statistics/diy_ranking';
import { StaticAPI } from '@/services/cubing-pro/statistics/typings';
import { Button, Form, Input, List, Modal, Spin, Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';

const { Text } = Typography;

type UpdatePersonModalProps = {
  open: boolean;
  onClose: () => void;
  kv?: StaticAPI.DiyRankKeyValue;
};

// 校验函数：是否符合格式 2025JIAY01
const isValidPersonCode = (code: string): boolean => {
  const regex = /^\d{4}[A-Z]{4}\d{2}$/; // 年份(4) + 大写字母(4) + 数字(2)
  return regex.test(code);
};

const UpdatePersonModal: React.FC<UpdatePersonModalProps> = ({ open, onClose, kv }) => {
  const [persons, setPersons] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 初始化数据
  useEffect(() => {
    if (kv?.Value) {
      try {
        const parsed = JSON.parse(kv.Value);
        if (Array.isArray(parsed)) {
          setPersons(parsed);
        }
      } catch (e) {
        console.error('解析 Value 出错', e);
        setPersons([]);
      }
    }
    setDescription(kv?.Description || '');
  }, [kv]);

  // 添加新成员
  const handleAddPerson = () => {
    if (!inputValue.trim()) return;
    if (!isValidPersonCode(inputValue)) {
      message.error(`编号格式不正确，应为类似 2025ABCD01`).then();
      return;
    }

    setPersons((prev) => [...prev, inputValue]);
    setInputValue('');
  };

  // 删除某个成员
  const handleDeletePerson = (index: number) => {
    setPersons((prev) => prev.filter((_, i) => i !== index));
  };

  // 提交更新
  const handleSubmit = async () => {
    const uniquePersons = Array.from(new Set(persons));

    // 校验所有项是否合法
    for (const person of uniquePersons) {
      if (!isValidPersonCode(person)) {
        message.error(`编号 ${person} 不符合格式要求`).then();
        return;
      }
    }

    if (!kv) return;

    setLoading(true);
    try {
      await apiUpdateRankingWithKey(kv.id, description, uniquePersons);
      message.success('更新成功').then();
      onClose();
    } catch (error) {
      message.error('更新失败，请稍后再试').then();
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
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          提交
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        {/* 描述编辑 */}
        <div style={{ marginBottom: 16 }}>
          <label>
            描述：
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入描述信息"
              style={{ width: '100%', marginTop: 4 }}
            />
          </label>
        </div>

        {/* 添加人员 */}
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="请输入人员编号（例如：2025JIAY01）"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleAddPerson}
            style={{ width: '70%', marginRight: 8 }}
          />
          <Button type="primary" onClick={handleAddPerson}>
            添加
          </Button>
        </div>

        {/* 人员列表 */}
        <div
          style={{
            maxHeight: 300,
            overflowY: 'auto',
            border: '1px solid #e8e8e8',
            borderRadius: 4,
            padding: 8,
          }}
        >
          <List
            dataSource={persons}
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <a key="delete" onClick={() => handleDeletePerson(index)}>
                    删除
                  </a>,
                ]}
              >
                <Text>{index+1}. {item}</Text>
              </List.Item>
            )}
          />
        </div>
      </Spin>
    </Modal>
  );
};

interface CreateRankingModalProps {
  open: boolean;
  onCancel: () => void;
  onOk?: () => void; // 创建成功后的回调
}

const CreateRankingModal: React.FC<CreateRankingModalProps> = ({ open, onCancel, onOk }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values: { key: string; description: string }) => {
    const { key, description } = values;

    setLoading(true);
    try {
      await apiCreateRanking(key, description);
      form.resetFields();
      onOk?.(); // 触发外部刷新逻辑
    } catch (error) {
      console.error('创建失败', error);
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
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          label="Key"
          name="key"
          rules={[
            { required: true, message: '请输入 Key' },
            { max: 50, message: 'Key 不能超过 50 个字符' },
          ]}
        >
          <Input placeholder="例如：rank_2025" />
        </Form.Item>

        <Form.Item
          label="描述"
          name="description"
          rules={[
            { required: true, message: '请输入描述' },
            { max: 100, message: '描述不能超过 100 个字符' },
          ]}
        >
          <Input.TextArea rows={3} placeholder="请输入该项的描述信息" />
        </Form.Item>

        <div style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            提交
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

const DiyRankingManager: React.FC = () => {
  const [keys, setKeys] = useState<StaticAPI.DiyRankKeyValue[]>([]);

  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [currentKey, setCurrentKey] = useState<StaticAPI.DiyRankKeyValue>();

  const [newModalOpen, setNewModalOpen] = useState(false);

  const fetchDiyRankingKey = () => {
    apiGetAllDiyRankingKey().then((res) => {
      setKeys(res.data);
    });
  };
  useEffect(() => {
    fetchDiyRankingKey();
  }, []);

  const columns: ColumnsType<StaticAPI.DiyRankKeyValue> = [
    {
      title: '名称',
      dataIndex: 'Description',
      key: 'Description',
      align: 'center',
    },
    {
      title: 'Key',
      dataIndex: 'id',
      key: 'id',
      render: (text) => {
        return <Tag color={'orange'}>{text}</Tag>;
      },
      align: 'center',
    },
    {
      title: '人数',
      dataIndex: 'Value',
      key: 'Value',
      render: (text) => {
        const data = JSON.parse(text);
        return data.length;
      },
      align: 'center',
    },
    {
      title: '操作',
      key: 'Option',
      align: 'center',
      render: (_, val: StaticAPI.DiyRankKeyValue) => {
        return (
          <>
            <Button
              size={'small'}
              disabled={val.id === 'diy_rankings_cubing_pro'}
              onClick={() => {
                setCurrentKey(val);
                setUpdateModalOpen(true);
              }}
            >
              修改
            </Button>
          </>
        );
      },
    },
  ];

  return (
    <>
      <div style={{ textAlign: 'right', marginBottom: 16 }}>
        <Button type={'primary'} onClick={() => setNewModalOpen(true)}>
          添加
        </Button>
      </div>
      <Table
        dataSource={keys}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        size={'small'}
      />
      <UpdatePersonModal
        open={updateModalOpen}
        onClose={() => {
          fetchDiyRankingKey();
          setUpdateModalOpen(false);
        }}
        // @ts-ignore
        kv={currentKey}
      />

      <CreateRankingModal
        open={newModalOpen}
        onCancel={() => {
          setNewModalOpen(false);
        }}
        onOk={fetchDiyRankingKey}
      />
    </>
  );
};

export default DiyRankingManager;
