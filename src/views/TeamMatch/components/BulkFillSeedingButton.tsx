import { useTeamMatchI18n } from '@/views/TeamMatch/i18n';
import { bulkFillSeedingScores, canBulkFillSeeding } from '@/views/TeamMatch/bulkFillSeeding';
import type { TeamMatchStoreAction } from '@/views/TeamMatch/TeamMatchContext';
import type { TeamMatchSession } from '@/views/TeamMatch/types';
import { Button, Modal, Progress, Space, message } from 'antd';
import React, { useRef, useState } from 'react';

type Props = {
  session: TeamMatchSession;
  dispatch: React.Dispatch<TeamMatchStoreAction>;
};

const BulkFillSeedingButton: React.FC<Props> = ({ session, dispatch }) => {
  const { t: tr } = useTeamMatchI18n();
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [percent, setPercent] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const disabled = !canBulkFillSeeding(session);

  const cancel = () => {
    abortRef.current?.abort();
  };

  const run = async () => {
    if (disabled) {
      message.warning(tr('teamMatch.needAnyId'));
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setModalOpen(true);
    setBusy(true);
    setPercent(0);
    try {
      const seeding = await bulkFillSeedingScores(session, session.eventIds, setPercent, { signal: ac.signal });
      dispatch({ type: 'SET_SEEDING', seeding });
      message.success(tr('teamMatch.bulkScoresDone'));
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        message.info(tr('teamMatch.cancelled'));
      } else {
        message.error(tr('teamMatch.bulkScoresFailed'));
      }
    } finally {
      setBusy(false);
      setPercent(0);
      setModalOpen(false);
      abortRef.current = null;
    }
  };

  return (
    <Space orientation="vertical" size="small" style={{ width: '100%', maxWidth: 420 }}>
      <Button type="default" loading={busy} disabled={disabled} onClick={() => void run()}>{tr('teamMatch.bulkScores')}</Button>
      <Modal
        className="tm-workbench-modal"
        title={tr('teamMatch.fetchingScores')}
        open={modalOpen}
        mask={{ closable: false }}
        closable={false}
        keyboard={false}
        footer={
          <Button onClick={cancel} disabled={!busy}>{tr('teamMatch.cancel')}</Button>
        }
        destroyOnHidden
      >
        <Progress percent={percent} status={busy ? 'active' : 'normal'} />
      </Modal>
    </Space>
  );
};

export default BulkFillSeedingButton;
