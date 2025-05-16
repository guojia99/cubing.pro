import { apiGetAllDiyRankingKey } from '@/services/cubing-pro/statistics/diy_ranking';
import { StaticAPI } from '@/services/cubing-pro/statistics/typings';
import {Button, Modal, Table} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';

type UpdatePersonModalProps = {
  open: boolean;
  onClose: () => void;
  kv: StaticAPI.DiyRankKeyValue,
}
const UpdatePersonModal: React.FC<UpdatePersonModalProps> = ({open, onClose, kv}) => {
  // const [persons, setPersons] = useState<string[]>([]);

  useEffect(() => {

  }, [kv])

  return (
    <Modal
      title={`修改 ${kv.Description} 名单列表`}
      open={open}
      onCancel={onClose}
    >

    </Modal>
  )
}





const DiyRankingManager: React.FC = () => {
  const [keys, setKeys] = useState<StaticAPI.DiyRankKeyValue[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentKey, setCurrentKey] = useState<StaticAPI.DiyRankKeyValue>();



  const fetchDiyRankingKey = () => {
    apiGetAllDiyRankingKey().then((res) => {
      setKeys(res.data);
    });
  }
  useEffect(() => {
    fetchDiyRankingKey()
  }, []);

  const columns: ColumnsType<StaticAPI.DiyRankKeyValue> = [
    {
      title: '名称',
      dataIndex: 'Description',
      key: 'Description',
    },
    {
      title: 'Key',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '人数',
      dataIndex: 'Value',
      key: 'Value',
      render: (text) => {
        const data = JSON.parse(text);
        return data.length;
      },
    },
    {
      title: '修改成员',
      key: 'Option',
      render: (_, val: StaticAPI.DiyRankKeyValue) => {
        return <>
          <Button size={"small"} disabled={val.id === 'diy_rankings_cubing_pro'} onClick={() => {
            setCurrentKey(val)
            setModalOpen(true);
          }}>添加</Button>
        </>;
      },
    },
  ];


  return (
    <>
      <Table dataSource={keys} columns={columns} rowKey="id" pagination={{ pageSize: 10 }} />
      <UpdatePersonModal
        open={modalOpen}
        onClose={() => {setModalOpen(false);}}
        // @ts-ignore
        kv={currentKey}
      />
    </>
  )
};

export default DiyRankingManager;
