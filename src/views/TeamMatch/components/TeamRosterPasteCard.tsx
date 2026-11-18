import { useTeamMatchI18n } from '@/views/TeamMatch/i18n';
import { buildTeamRosterPasteImport } from '@/views/TeamMatch/teamRosterPasteImport';
import type { TeamMatchStoreAction } from '@/views/TeamMatch/TeamMatchContext';
import type { TeamMatchSession } from '@/views/TeamMatch/types';
import { TEAM_PLAYERS } from '@/views/TeamMatch/types';
import { Button, Input, Modal, Space, Typography, message } from 'antd';
import React, { useState } from 'react';

type Props = {
  session: TeamMatchSession;
  dispatch: React.Dispatch<TeamMatchStoreAction>;
};

const EXAMPLE = `广城理队（广州城市理工学院）\t许根进2017XUGE01\t刘宇邦2016LIUY31\t黄文政
二师培正联队\t饶诗颖\t彭扬懿2024PENG08\t吴旭涛`;

const TeamRosterPasteCard: React.FC<Props> = ({ session, dispatch }) => {
  const { t: tr, locale } = useTeamMatchI18n();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const apply = () => {
    const r = buildTeamRosterPasteImport(session, text, locale);
    if (!r.ok) {
      message.warning(r.message);
      return;
    }
    const n = r.teams.length - session.teams.length;
    dispatch({ type: 'UPSERT_SCHOOLS', schools: r.schools });
    dispatch({ type: 'UPSERT_PLAYERS', players: r.players });
    dispatch({ type: 'UPSERT_TEAMS', teams: r.teams });
    message.success(tr('teamMatch.rosterAdded', { p0: n }));
    setText('');
    setOpen(false);
  };

  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>{tr('teamMatch.pasteRoster')}</Button>
      <Modal
        className="tm-workbench-modal"
        title={tr('teamMatch.pasteRoster')}
        open={open}
        onCancel={() => setOpen(false)}
        width={920}
        footer={null}
        destroyOnHidden
        styles={{ body: { paddingTop: 12 } }}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>{tr('teamMatch.pasteRosterHelp', { p0: TEAM_PLAYERS })}</Typography.Paragraph>
        <Input.TextArea
          rows={18}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
        <Space style={{ marginTop: 16 }} wrap>
          <Button type="primary" onClick={apply}>{tr('teamMatch.parseAdd')}</Button>
          <Button onClick={() => setText(EXAMPLE)}>{tr('teamMatch.fillExample')}</Button>
          <Button type="link" onClick={() => setOpen(false)}>{tr('teamMatch.close')}</Button>
        </Space>
      </Modal>
    </>
  );
};

export default TeamRosterPasteCard;
