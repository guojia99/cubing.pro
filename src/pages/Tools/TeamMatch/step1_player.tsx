import PreviewModal from '@/pages/Tools/TeamMatch/step1_player_modal';
import { Player, TableData } from '@/pages/Tools/TeamMatch/types';
import { CloseOutlined, DownloadOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Switch, Table, Upload, message } from 'antd';
import React, { useState } from 'react';

type Props = {
  tableData: TableData;
  setTableData: React.Dispatch<React.SetStateAction<TableData>>;
};

function getPlayerLength(tableData: TableData): number {
  let out = 0;
  for (let i = 0; i < tableData.length; i++) {
    out += tableData[i].players.length;
  }
  return out;
}

const GroupPlayerManager: React.FC<Props> = ({ tableData, setTableData }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editGroupIndex, setEditGroupIndex] = useState<number | null>(null);
  const [editGroupName, setEditGroupName] = useState<string>('');
  const [editPlayerIndex, setEditPlayerIndex] = useState<number | null>(null);
  const [editPlayerName, setEditPlayerName] = useState<string>('');
  const [editManName, setEditManName] = useState<string>('');
  const [editManIndex, setEditManIndex] = useState<number | null>(null);
  const [isGroupModalVisible, setGroupModalVisible] = useState(false);
  const [isPlayerModalVisible, setPlayerModalVisible] = useState(false);
  const [isManModalVisible, setManModalVisible] = useState(false); // 新增选手编辑弹窗

  // 添加队伍
  const addPlayer = (groupIndex: number) => {
    if (getPlayerLength(tableData) >= 16) {
      message.error('队伍已满16个').then();
      return;
    }

    if (tableData[groupIndex].players.length >= 4) {
      message.warning('每个组最多只能有4个队伍').then();
      return;
    }


    setTableData((prevData) => {
      const newData = [...prevData];
      newData[groupIndex] = {
        ...newData[groupIndex],
        players: [
          ...newData[groupIndex].players,
          {
            name: `队伍 ${newData[groupIndex].players.length + 1}`,
            seeded: false,
            man: [],
          },
        ], // 新队伍，man为空
      };
      return newData;
    });
  };

  // 添加分组
  const addGroup = () => {
    if (getPlayerLength(tableData) >= 16) {
      message.error('队伍已满16个').then();
      return;
    }
    setTableData((prevData) => [
      ...prevData,
      {
        name: `分组 ${prevData.length + 1}`,
        players: [{ name: '队伍 1', seeded: false, man: [] }], // 默认添加一个队伍，并且man为空
      },
    ]);
  };

  // 更新队伍信息
  const updatePlayer = (groupIndex: number, playerIndex: number, key: keyof Player, value: any) => {
    setTableData((prevData) => {
      const newData = [...prevData];
      newData[groupIndex] = {
        ...newData[groupIndex],
        players: newData[groupIndex].players.map((player, index) =>
          index === playerIndex ? { ...player, [key]: value } : player,
        ),
      };
      return newData;
    });
  };

  // 打开分组名称编辑弹窗
  const openGroupEditModal = (groupIndex: number, groupName: string) => {
    setEditGroupIndex(groupIndex);
    setEditGroupName(groupName);
    setGroupModalVisible(true);
  };

  // 打开队伍名称编辑弹窗
  const openPlayerEditModal = (groupIndex: number, playerIndex: number, playerName: string) => {
    setEditGroupIndex(groupIndex);
    setEditPlayerIndex(playerIndex);
    setEditPlayerName(playerName);
    setPlayerModalVisible(true);
  };

  // 添加选手
  const handleAddMan = (groupIndex: number, playerIndex: number) => {
    setTableData((prevData) =>
      prevData.map((group, gIndex) => {
        if (gIndex !== groupIndex) return group;
        return {
          ...group,
          players: group.players.map((player, pIndex) => {
            if (pIndex !== playerIndex) return player;
            return { ...player, man: [...player.man, '新选手'] };
          }),
        };
      }),
    );
  };

  // 处理分组名称修改
  const handleGroupNameChange = () => {
    if (editGroupIndex !== null) {
      setTableData((prevData) => {
        const newData = [...prevData];
        newData[editGroupIndex] = {
          ...newData[editGroupIndex],
          name: editGroupName,
        };
        return newData;
      });
    }
    setGroupModalVisible(false);
  };

  // 处理队伍名称修改
  const handlePlayerNameChange = () => {
    if (editGroupIndex !== null && editPlayerIndex !== null) {
      setTableData((prevData) => {
        const newData = [...prevData];
        newData[editGroupIndex] = {
          ...newData[editGroupIndex],
          players: newData[editGroupIndex].players.map((player, index) =>
            index === editPlayerIndex ? { ...player, name: editPlayerName } : player,
          ),
        };
        return newData;
      });
    }
    setPlayerModalVisible(false);
  };

  // 下载数据
  const downloadData = () => {
    const jsonData = JSON.stringify(tableData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '组队赛选手列表.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 上传数据
  const uploadProps = {
    beforeUpload: (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = JSON.parse(e.target?.result as string);
          setTableData(result);
          message.success('数据上传成功').then();
        } catch (error) {
          message.error('文件格式错误').then();
        }
      };
      reader.readAsText(file);
      return false;
    },
  };

  const removeGroup = (groupIndex: number) => {
    setTableData((prevData) => prevData.filter((_, index) => index !== groupIndex));
  };

  const removePlayer = (groupIndex: number, playerIndex: number) => {
    setTableData((prevData) => {
      const newData = [...prevData];
      newData[groupIndex] = {
        ...newData[groupIndex],
        players: newData[groupIndex].players.filter((_, index) => index !== playerIndex),
      };
      return newData;
    });
  };

  const removeMan = (groupIndex: number, playerIndex: number, manIndex: number) => {
    setTableData((prevData) => {
      const newData = [...prevData];
      newData[groupIndex] = {
        ...newData[groupIndex],
        players: newData[groupIndex].players.map((player, pIndex) =>
          pIndex === playerIndex
            ? { ...player, man: player.man.filter((_, index) => index !== manIndex) }
            : player,
        ),
      };
      return newData;
    });
  };

  // 打开选手名称编辑弹窗
  const openManEditModal = (
    groupIndex: number,
    playerIndex: number,
    manIndex: number,
    manName: string,
  ) => {
    setEditGroupIndex(groupIndex);
    setEditPlayerIndex(playerIndex);
    setEditManIndex(manIndex); // 设置当前编辑的选手索引
    setEditManName(manName); // 设置选手的名称
    setManModalVisible(true);
  };

  // 处理选手名称修改
  const handleManNameChange = () => {
    if (editGroupIndex !== null && editPlayerIndex !== null && editManIndex !== null) {
      setTableData((prevData) => {
        const newData = [...prevData];
        newData[editGroupIndex] = {
          ...newData[editGroupIndex],
          players: newData[editGroupIndex].players.map((player, pIndex) =>
            pIndex === editPlayerIndex
              ? {
                  ...player,
                  man: player.man.map(
                    (man, mIndex) => (mIndex === editManIndex ? editManName : man), // 使用 editManIndex 更新对应的选手名称
                  ),
                }
              : player,
          ),
        };
        return newData;
      });
    }
    setManModalVisible(false);
  };

  const handleUpdateSeeded = (groupIndex: number, playerIndex: number, checked: boolean) => {
    let curSeeded = 0;

    // 统计所有组的seeded数
    for (let i = 0; i < tableData.length; i++) {
      for (let j = 0; j < tableData[i].players.length; j++) {
        if (tableData[i].players[j].seeded) {
          curSeeded += 1;
        }
      }
    }

    if (checked && curSeeded >= 4) {
      message.warning("种子选手最多只能有四个队伍").then();
      return;
    }

    // 统计当前组内的seeded数
    const group = tableData[groupIndex];
    const hasSeeded = group.players.some((player, index) => player.seeded && index !== playerIndex);

    if (checked && hasSeeded) {
      message.warning("每个分组只能有一个种子选手").then();
      return;
    }

    updatePlayer(groupIndex, playerIndex, 'seeded', checked);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button onClick={() => setPreviewVisible(true)} style={{ marginTop: 16 }}>
          预览分组与选手
        </Button>
        <Button
          type="primary"
          onClick={downloadData}
          icon={<DownloadOutlined />}
          style={{ marginLeft: 8 }}
        >
          下载数据
        </Button>
        <Upload {...uploadProps} showUploadList={false}>
          <Button type="default" icon={<UploadOutlined />} style={{ marginLeft: 8 }}>
            上传数据
          </Button>
        </Upload>
      </div>

      <PreviewModal
        tableData={tableData}
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
      />

      <Table
        bordered
        rowKey={(record) => record.name}
        columns={[
          {
            title: '分组名称',
            dataIndex: 'name',
            render: (text: string, _, index: number) => (
              <Button onClick={() => openGroupEditModal(index, text)}>{text}</Button>
            ),
            width: 250,
          },
          {
            title: '队伍列表',
            dataIndex: 'players',
            render: (_, group, groupIndex) => (
              <Table
                size="small"
                rowKey={(record) => record.name}
                columns={[
                  {
                    title: '种子队',
                    dataIndex: 'seeded',
                    render: (_, __, playerIndex: number) => (
                      <Switch
                        checked={group.players[playerIndex].seeded}
                        onChange={(checked) => handleUpdateSeeded(groupIndex, playerIndex, checked)}
                      />
                    ),
                    width: 120,
                  },
                  {
                    title: '队伍名称',
                    dataIndex: 'name',
                    render: (text: string, _, playerIndex: number) => (
                      <Button onClick={() => openPlayerEditModal(groupIndex, playerIndex, text)}>
                        {text}
                      </Button>
                    ),
                    width: 200,
                  },

                  {
                    title: '选手',
                    dataIndex: 'man',
                    render: (_, player, playerIndex: number) => (
                      <>
                        {player.man.map((man, manIndex) => (
                          <div key={manIndex} style={{ display: 'inline-block', marginRight: 8 }}>
                            <Button
                              onClick={() =>
                                openManEditModal(groupIndex, playerIndex, manIndex, man)
                              } // 传递 manIndex
                            >
                              {man}
                            </Button>
                            <Button
                              type="text"
                              danger
                              icon={<CloseOutlined />}
                              onClick={() => removeMan(groupIndex, playerIndex, manIndex)}
                            />
                          </div>
                        ))}
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddMan(groupIndex, playerIndex)}
                        >
                          添加选手
                        </Button>
                      </>
                    ),
                  },
                  {
                    title: '操作',
                    render: (_, __, playerIndex: number) => (
                      <Button danger onClick={() => removePlayer(groupIndex, playerIndex)}>
                        删除队伍
                      </Button>
                    ),
                    width: 100,
                  },
                ]}
                dataSource={group.players}
                pagination={false}
                footer={() => (
                  <Button
                    type="dashed"
                    onClick={() => addPlayer(groupIndex)}
                    icon={<PlusOutlined />}
                  >
                    添加队伍
                  </Button>
                )}
              />
            ),
          },
          {
            title: '操作',
            render: (_, __, groupIndex: number) => (
              <Button danger onClick={() => removeGroup(groupIndex)}>
                删除分组
              </Button>
            ),
            width: 100,
          },
        ]}
        dataSource={tableData}
        pagination={false}
        footer={() => (
          <Button type="dashed" onClick={addGroup} icon={<PlusOutlined />}>
            添加分组
          </Button>
        )}
      />

      {/* 分组名称编辑弹窗 */}
      <Modal
        title="编辑分组名称"
        visible={isGroupModalVisible}
        onOk={handleGroupNameChange}
        onCancel={() => setGroupModalVisible(false)}
      >
        <Input value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} />
      </Modal>

      {/* 队伍名称编辑弹窗 */}
      <Modal
        title="编辑队伍名称"
        visible={isPlayerModalVisible}
        onOk={handlePlayerNameChange}
        onCancel={() => setPlayerModalVisible(false)}
      >
        <Input value={editPlayerName} onChange={(e) => setEditPlayerName(e.target.value)} />
      </Modal>

      {/* 选手名称编辑弹窗 */}
      <Modal
        title="编辑选手名称"
        visible={isManModalVisible}
        onOk={handleManNameChange}
        onCancel={() => setManModalVisible(false)}
      >
        <Input value={editManName} onChange={(e) => setEditManName(e.target.value)} />
      </Modal>
    </div>
  );
};

export default GroupPlayerManager;
