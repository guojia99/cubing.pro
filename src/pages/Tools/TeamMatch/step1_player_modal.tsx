import { Button, List, Modal, Tag, Typography } from 'antd';
import React from 'react';
import {TableData} from "@/pages/Tools/TeamMatch/types";

type Props = {
  tableData: TableData;
  visible: boolean;
  onClose: () => void;
};

const PreviewModal: React.FC<Props> = ({ tableData, visible, onClose }) => {
  return (
    <Modal
      title="分组与选手预览"
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
    >
      <List
        dataSource={tableData}
        renderItem={(group) => (
          <List.Item>
            <div style={{ width: '100%' }}>
              <Typography.Title level={5}>{group.name}</Typography.Title>
              <List
                size="small"
                dataSource={group.players}
                renderItem={(player) => (
                  <List.Item>
                    {player.seeded ? (
                      <Tag color="orangered">{player.name}（种子选手）</Tag>
                    ) : (
                      <span>{player.name}</span>
                    )}
                  </List.Item>
                )}
              />
            </div>
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default PreviewModal;
