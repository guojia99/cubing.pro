import { buildTeamRosterPasteImport } from '@/pages/Tools/TeamMatch/teamRosterPasteImport';
import type { TeamMatchStoreAction } from '@/pages/Tools/TeamMatch/TeamMatchContext';
import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { TEAM_PLAYERS } from '@/pages/Tools/TeamMatch/types';
import { Button, Input, Modal, Space, Typography, message } from 'antd';
import React, { useState } from 'react';

type Props = {
  session: TeamMatchSession;
  dispatch: React.Dispatch<TeamMatchStoreAction>;
};

const EXAMPLE = `广城理队（广州城市理工学院）\t许根进2017XUGE01\t刘宇邦2016LIUY31\t黄文政
二师培正联队\t饶诗颖\t彭扬懿2024PENG08\t吴旭涛`;

const TeamRosterPasteCard: React.FC<Props> = ({ session, dispatch }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const apply = () => {
    const r = buildTeamRosterPasteImport(session, text);
    if (!r.ok) {
      message.warning(r.message);
      return;
    }
    const n = r.teams.length - session.teams.length;
    dispatch({ type: 'UPSERT_SCHOOLS', schools: r.schools });
    dispatch({ type: 'UPSERT_PLAYERS', players: r.players });
    dispatch({ type: 'UPSERT_TEAMS', teams: r.teams });
    message.success(`已添加 ${n} 支队伍及相关学校与选手`);
    setText('');
    setOpen(false);
  };

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        粘贴导入（学校、选手、队伍）
      </Button>
      <Modal
        title="粘贴导入（学校、选手、队伍）"
        open={open}
        onCancel={() => setOpen(false)}
        width={920}
        footer={null}
        destroyOnClose
        styles={{ body: { paddingTop: 12 } }}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          每行：队名（学校名）或仅队名，Tab 或两个以上空格分隔，其后 {TEAM_PLAYERS}{' '}
          名队员。姓名后可紧跟 10 位 WCA ID。无学校时队员挂靠自由人池，队伍按自由人队规则生成。
        </Typography.Paragraph>
        <Input.TextArea
          rows={18}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
        <Space style={{ marginTop: 16 }} wrap>
          <Button type="primary" onClick={apply}>
            解析并添加
          </Button>
          <Button onClick={() => setText(EXAMPLE)}>填入示例</Button>
          <Button type="link" onClick={() => setOpen(false)}>
            关闭
          </Button>
        </Space>
      </Modal>
    </>
  );
};

export default TeamRosterPasteCard;
