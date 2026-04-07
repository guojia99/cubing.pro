import {
  playersWithWcaId,
  syncWcaAvatarsForPlayers,
  type WcaAvatarSyncStep,
} from '@/pages/Tools/TeamMatch/syncWcaAvatars';
import type { TeamMatchStoreAction } from '@/pages/Tools/TeamMatch/TeamMatchContext';
import type { TeamMatchSession } from '@/pages/Tools/TeamMatch/types';
import { Avatar, Button, Modal, Progress, Typography, message } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  session: TeamMatchSession;
  dispatch: React.Dispatch<TeamMatchStoreAction>;
};

type HistoryRow = { name: string; wcaId: string; avatar: string | null };

function PersonRow({
  label,
  name,
  wcaId,
  avatar,
  highlight,
}: {
  label: string;
  name: string;
  wcaId: string;
  avatar: string | null;
  highlight?: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: 12,
        borderRadius: 8,
        background: highlight ? 'rgba(22, 119, 255, 0.06)' : 'rgba(0,0,0,0.02)',
        border: highlight ? '1px solid rgba(22, 119, 255, 0.25)' : '1px solid #f0f0f0',
      }}
    >
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
        {label}
      </Typography.Text>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar src={avatar || undefined} size={48} style={{ flexShrink: 0 }}>
          {name.slice(0, 1)}
        </Avatar>
        <div style={{ minWidth: 0 }}>
          <Typography.Text strong ellipsis style={{ display: 'block' }}>
            {name}
          </Typography.Text>
          <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
            {wcaId}
          </Typography.Text>
        </div>
      </div>
    </div>
  );
}

const SyncWcaAvatarsButton: React.FC<Props> = ({ session, dispatch }) => {
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [percent, setPercent] = useState(0);
  const [step, setStep] = useState<WcaAvatarSyncStep | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasWca = useMemo(() => playersWithWcaId(session.players).length > 0, [session.players]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history.length]);

  const cancel = () => {
    abortRef.current?.abort();
  };

  const run = async () => {
    if (!hasWca) {
      message.warning('没有填写 10 位 WCA ID 的选手');
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setModalOpen(true);
    setBusy(true);
    setPercent(0);
    setStep(null);
    setHistory([]);
    try {
      const { players, updatedCount } = await syncWcaAvatarsForPlayers(
        session.players,
        (done, total) => setPercent(Math.min(100, Math.round((done / total) * 100))),
        {
          signal: ac.signal,
          onSyncStep: (s) => setStep(s),
          onFinished: (p, displayAvatar) => {
            setHistory((h) => [
              ...h,
              { name: p.name, wcaId: p.wcaId ?? '', avatar: displayAvatar },
            ]);
          },
        },
      );
      dispatch({ type: 'UPSERT_PLAYERS', players });
      message.success(
        updatedCount > 0 ? `已更新 ${updatedCount} 人头像` : '已拉取完毕（头像无变化或 WCA 无头像）',
      );
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        message.info('已取消');
      } else {
        message.error('同步失败');
      }
    } finally {
      setBusy(false);
      setPercent(0);
      setModalOpen(false);
      setStep(null);
      abortRef.current = null;
    }
  };

  const cur = step?.current;
  const prev = step?.previous;

  return (
    <>
      <Button loading={busy} disabled={!hasWca} onClick={() => void run()}>
        一键同步 WCA 头像
      </Button>
      <Modal
        title="正在同步 WCA 头像"
        open={modalOpen}
        width={560}
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
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {prev ? (
            <PersonRow
              label="上一位"
              name={prev.player.name}
              wcaId={prev.player.wcaId ?? ''}
              avatar={prev.displayAvatar}
            />
          ) : (
            <div
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.02)',
                border: '1px dashed #d9d9d9',
                minHeight: 100,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                无上一位
              </Typography.Text>
            </div>
          )}
          {cur ? (
            <PersonRow
              label="正在同步"
              name={cur.name}
              wcaId={cur.wcaId ?? ''}
              avatar={cur.avatarDataUrl}
              highlight
            />
          ) : (
            <div
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 8,
                background: 'rgba(0,0,0,0.02)',
                border: '1px dashed #d9d9d9',
                minHeight: 100,
              }}
            />
          )}
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 12, marginBottom: 6 }}>
          已完成（滚动查看最新）
        </Typography.Text>
        <div
          ref={scrollRef}
          style={{
            maxHeight: 180,
            overflowY: 'auto',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: 8,
          }}
        >
          {history.length === 0 ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              尚无
            </Typography.Text>
          ) : (
            history.map((row, i) => (
              <div
                key={`${row.wcaId}-${i}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 4px',
                  borderBottom: i < history.length - 1 ? '1px solid #f5f5f5' : undefined,
                }}
              >
                <Avatar src={row.avatar || undefined} size={36}>
                  {row.name.slice(0, 1)}
                </Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Typography.Text ellipsis style={{ display: 'block' }}>
                    {row.name}
                  </Typography.Text>
                  <Typography.Text type="secondary" ellipsis style={{ fontSize: 11 }}>
                    {row.wcaId}
                  </Typography.Text>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  );
};

export default SyncWcaAvatarsButton;
