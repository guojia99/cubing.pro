import { useTeamMatchI18n } from '@/views/TeamMatch/i18n';
import { parseBulkOneUidText, syncOneIdFromPaste } from '@/views/TeamMatch/bulkOneUidImport';
import type { TeamMatchStoreAction } from '@/views/TeamMatch/TeamMatchContext';
import type { TeamMatchSession } from '@/views/TeamMatch/types';
import { App, Button, Input, Modal, Space, Typography } from 'antd';
import React, { useState } from 'react';

type Props = {
  session: TeamMatchSession;
  dispatch: React.Dispatch<TeamMatchStoreAction>;
  disabled?: boolean;
};

const EXAMPLE = `1\t薛泽韩\t2546
2\t陈诚骏\t7735
3\t蔡镇宇\t10954`;

const BulkOneUidImportModal: React.FC<Props> = ({ session, dispatch, disabled }) => {
  const { t: tr } = useTeamMatchI18n();
  const { modal, message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const apply = () => {
    const parsed = parseBulkOneUidText(text);
    if (parsed.length === 0) {
      message.warning(tr('teamMatch.uidInvalidRows'));
      return;
    }
    if (session.players.length === 0) {
      message.warning(tr('teamMatch.uidExistingOnly'));
      return;
    }

    const outcome = syncOneIdFromPaste(parsed, session.players);
    if (!outcome.ok) {
      modal.error({
        className: 'tm-workbench-modal',
        title: tr('teamMatch.uidConflict'),
        content: (
          <Typography.Paragraph>{tr('teamMatch.uidConflictHelp', { p0: outcome.duplicateOneIds.join(' / ') })}</Typography.Paragraph>
        ),
      });
      return;
    }

    const r = outcome.data;
    const { applied, unmatched, batchDuplicateNameSkipped, unchanged } = r;

    const doCommit = () => {
      if (applied.length === 0) {
        message.info(tr('teamMatch.uidNoChanges'));
        setText('');
        setOpen(false);
        return;
      }
      dispatch({ type: 'UPSERT_PLAYERS', players: r.nextPlayers });
      const parts: string[] = [tr('teamMatch.uidUpdated', { p0: applied.length })];
      if (unmatched.length > 0) parts.push(tr('teamMatch.uidUnmatched', { p0: unmatched.length }));
      if (batchDuplicateNameSkipped.length > 0) {
        parts.push(tr('teamMatch.uidDuplicateNames', { p0: batchDuplicateNameSkipped.length }));
      }
      if (unchanged.length > 0) parts.push(tr('teamMatch.uidUnchanged', { p0: unchanged.length }));
      message.success(parts.join(' · '));
      setText('');
      setOpen(false);
    };

    const needConfirm = unmatched.length > 0 || batchDuplicateNameSkipped.length > 0;
    if (needConfirm && applied.length > 0) {
      modal.confirm({
        className: 'tm-workbench-modal',
        title: tr('teamMatch.confirmUidSync'),
        width: 640,
        content: (
          <div>
            <Typography.Paragraph>{tr('teamMatch.uidWillUpdate', { p0: applied.length })}</Typography.Paragraph>
            {unmatched.length > 0 && (
              <>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>{tr('teamMatch.uidUnmatchedHelp')}</Typography.Paragraph>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {unmatched.map((x) => x.name).join(' / ')}
                </Typography.Text>
              </>
            )}
            {batchDuplicateNameSkipped.length > 0 && (
              <Typography.Paragraph type="secondary" style={{ marginTop: 12 }}>{tr('teamMatch.uidDuplicateHelp', { p0: batchDuplicateNameSkipped.length })}</Typography.Paragraph>
            )}
          </div>
        ),
        okText: tr('teamMatch.confirmWrite'),
        onOk: doCommit,
      });
      return;
    }

    doCommit();
  };

  return (
    <>
      <Button disabled={disabled} onClick={() => setOpen(true)}>{tr('teamMatch.syncUid')}</Button>
      <Modal
        className="tm-workbench-modal"
        title={tr('teamMatch.syncUid')}
        open={open}
        onCancel={() => setOpen(false)}
        width={720}
        footer={null}
        destroyOnHidden
        styles={{ body: { paddingTop: 12 } }}
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>{tr('teamMatch.uidPasteHelp')}</Typography.Paragraph>
        <Input.TextArea
          rows={18}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={EXAMPLE}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
        />
        <Space style={{ marginTop: 16 }} wrap>
          <Button type="primary" onClick={apply}>{tr('teamMatch.parseSync')}</Button>
          <Button onClick={() => setText(EXAMPLE)}>{tr('teamMatch.fillExample')}</Button>
          <Button type="link" onClick={() => setOpen(false)}>{tr('teamMatch.close')}</Button>
        </Space>
      </Modal>
    </>
  );
};

export default BulkOneUidImportModal;
