import { bulkFillSeedingScores, canBulkFillSeeding } from '@/pages/Tools/TeamMatch/bulkFillSeeding';
import type { TeamMatchStoreAction } from '@/pages/Tools/TeamMatch/TeamMatchContext';
import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { Button, Modal, Progress, Space, message } from 'antd';
import React, { useRef, useState } from 'react';

type Props = {
  session: TeamMatchSession;
  dispatch: React.Dispatch<TeamMatchStoreAction>;
};

const BulkFillSeedingButton: React.FC<Props> = ({ session, dispatch }) => {
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
      message.warning('请至少为一名选手填写 WCA ID 或 One ID');
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
      message.success('已按顺序拉取并合并 WCA / One 成绩');
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        message.info('已取消');
      } else {
        message.error('批量填充失败');
      }
    } finally {
      setBusy(false);
      setPercent(0);
      setModalOpen(false);
      abortRef.current = null;
    }
  };

  return (
    <Space direction="vertical" size="small" style={{ width: '100%', maxWidth: 420 }}>
      <Button type="default" loading={busy} disabled={disabled} onClick={() => void run()}>
        一键填充 WCA / One 成绩
      </Button>
      <Modal
        title="正在拉取 WCA / One 成绩"
        open={modalOpen}
        maskClosable={false}
        closable={false}
        keyboard={false}
        footer={
          <Button onClick={cancel} disabled={!busy}>
            取消
          </Button>
        }
        destroyOnClose
      >
        <Progress percent={percent} status={busy ? 'active' : 'normal'} />
      </Modal>
    </Space>
  );
};

export default BulkFillSeedingButton;
