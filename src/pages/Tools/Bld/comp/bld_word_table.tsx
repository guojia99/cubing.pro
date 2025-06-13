import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  Table,
  Button,
  message,
  Upload,
  Space,
  Modal,
  Input,
} from 'antd';
import { getSubKeyValue, setSubKeyValue } from '@/services/cubing-pro/key_value/keyvalue_store';
import {
  AssociativeWordMap,
  COL_KEYS,
  csvToJson,
  downloadFile,
  jsonToCsv,
  ROW_KEYS,
} from '@/pages/Tools/Bld/comp/utils';
import {
  DownloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';

export type AssociativeWordTableRef = {
  getConfig: () => AssociativeWordMap;
};

// todo 1 手动点击上传下载
// todo 2 本地只保存
// todo 3 再写一个modal框


const AssociativeWordTable = forwardRef<AssociativeWordTableRef>((_, ref) => {
  const KEY = 'blind_tightening_assistant';
  const SUBKEY = 'AssociativeWordListTable';

  const [data, setData] = useState<AssociativeWordMap>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  const load = async () => {
    const localCache = localStorage.getItem('blind_tightening_assistant_AssociativeWordListTable');
    if (localCache) {
      try {
        setData(JSON.parse(localCache));
        return;
      } catch {
        // 解析失败走接口加载
      }
    }
    const value = await getSubKeyValue(KEY, SUBKEY);
    setData(value || {});
  };

  // 修改数据时，同步写入 localStorage
  const saveToLocalCache = (newData: AssociativeWordMap) => {
    localStorage.setItem('blind_tightening_assistant_AssociativeWordListTable', JSON.stringify(newData));
  };

  const save = async () => {
    await setSubKeyValue(KEY, SUBKEY, data);
    message.success('保存成功');
  };

  const handleCellClick = (cellKey: string) => {
    setEditingKey(cellKey);
    setInputValue(data[cellKey] || '');
    setModalOpen(true);
  };

  // 修改 handleModalOk，更新数据后缓存本地
  const handleModalOk = () => {
    if (editingKey) {
      setData(prev => {
        const newData = { ...prev, [editingKey]: inputValue };
        saveToLocalCache(newData);
        return newData;
      });
    }
    setModalOpen(false);
    setEditingKey(null);
    setInputValue('');
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    setEditingKey(null);
    setInputValue('');
  };

  useEffect(() => {
    load();
  }, []);

  // 暴露外部方法
  useImperativeHandle(ref, () => ({
    getConfig: () => data,
  }));

  const columns = [
    {
      title: '',
      dataIndex: 'rowKey',
      width: 60,
      fixed: 'left',
    },
    ...COL_KEYS.map(col => ({
      title: col,
      dataIndex: col,
      width: 80,
      onCell: (record: any) => {
        const cellKey = `${record.rowKey}${col}`;
        return {
          onClick: () => handleCellClick(cellKey),
          style: { cursor: 'pointer', userSelect: 'none' },
        };
      },
      render: (_: any, record: any) => {
        const cellKey = `${record.rowKey}${col}`;
        return data[cellKey] || '';
      },
    })),
  ];

  const tableData = ROW_KEYS.map(row => ({
    key: row,
    rowKey: row,
  }));


  return (
    <div style={{ overflow: 'auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={save}>
          保存
        </Button>

        <Button
          icon={<DownloadOutlined />}
          onClick={() =>
            downloadFile(
              '联想词.json',
              JSON.stringify(data, null, 2),
              'application/json'
            )
          }
        >
          导出 JSON
        </Button>

        <Button
          icon={<DownloadOutlined />}
          onClick={() => downloadFile('联想词.csv', jsonToCsv(data), 'text/csv')}
        >
          导出 CSV
        </Button>

        <Upload
          showUploadList={false}
          accept=".json"
          beforeUpload={file => {
            const reader = new FileReader();
            reader.onload = e => {
              try {
                const json = JSON.parse(e.target?.result as string);
                setData(json);
                message.success('JSON 导入成功');
              } catch {
                message.error('JSON 格式错误');
              }
            };
            reader.readAsText(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>导入 JSON</Button>
        </Upload>

        <Upload
          showUploadList={false}
          accept=".csv"
          beforeUpload={file => {
            const reader = new FileReader();
            reader.onload = e => {
              try {
                const text = e.target?.result as string;
                const parsed = csvToJson(text);
                setData(parsed);
                message.success('CSV 导入成功');
              } catch {
                message.error('CSV 格式错误');
              }
            };
            reader.readAsText(file);
            return false;
          }}
        >
          <Button icon={<UploadOutlined />}>导入 CSV</Button>
        </Upload>
      </Space>

      <Table
        // @ts-ignore
        columns={columns}
        dataSource={tableData}
        pagination={false}
        scroll={{ x: 'max-content', y: 600 }}
        bordered
        size="small"
      />

      <Modal
        title={`请输入 ${editingKey} 的联想词`}
        open={modalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText="确认"
        cancelText="取消"
      >
        <Input
          placeholder="请输入联想词"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onPressEnter={handleModalOk}
        />
      </Modal>
    </div>
  );
});

export default AssociativeWordTable;
