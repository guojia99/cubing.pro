import type { Player, SeedingEntry } from '@/pages/Tools/TeamMatch/types';
import { pickBestForEvent } from '@/pages/Tools/TeamMatch/wcaSeeding';
import { getWCAPersonResults } from '@/services/cubing-pro/wca/player';
import { Button, InputNumber, Modal, Space, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  player: Player | null;
  eventId: string;
  entry: SeedingEntry | null;
  onSave: (next: SeedingEntry) => void;
};

const SeedingPlayerModal: React.FC<Props> = ({ open, onClose, player, eventId, entry, onSave }) => {
  const [single, setSingle] = useState<number | 'DNF' | null>(null);
  const [average, setAverage] = useState<number | 'DNF' | null>(null);
  const [wcaLoading, setWcaLoading] = useState(false);

  useEffect(() => {
    if (!open || !entry || !player) return;
    setSingle(entry.single);
    setAverage(entry.average);
  }, [open, entry, player]);

  const handleOk = () => {
    if (!player || !entry) return;
    onSave({
      playerId: player.id,
      eventId,
      single,
      average,
    });
    onClose();
  };

  const fetchWca = async () => {
    if (!player) return;
    if (!player.wcaId || player.wcaId.length !== 10) {
      message.warning('请先填写有效 WCA ID（10 位）');
      return;
    }
    setWcaLoading(true);
    try {
      const res = await getWCAPersonResults(player.wcaId);
      const b = pickBestForEvent(res, eventId);
      setSingle(b.single);
      setAverage(b.average);
      message.success('已拉取 WCA 成绩');
    } catch {
      message.error('拉取失败');
    } finally {
      setWcaLoading(false);
    }
  };

  const setRowDnf = () => {
    setSingle('DNF');
    setAverage('DNF');
  };

  const title = player ? `编辑成绩 · ${player.name}` : '编辑成绩';

  return (
    <Modal
      title={title}
      open={open && !!player && !!entry}
      onCancel={onClose}
      onOk={handleOk}
      width={480}
      destroyOnClose
    >
      {player && entry && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Typography.Text type="secondary">单次（秒）</Typography.Text>
            {single === 'DNF' ? (
              <Space style={{ marginTop: 8, display: 'flex' }}>
                <Typography.Text type="danger">DNF</Typography.Text>
                <Button type="link" size="small" onClick={() => setSingle(null)}>
                  改填数字
                </Button>
              </Space>
            ) : (
              <InputNumber
                style={{ width: '100%', marginTop: 8 }}
                min={0}
                step={0.01}
                value={typeof single === 'number' ? single : undefined}
                onChange={(v) => setSingle(v === null ? null : Number(v))}
              />
            )}
            {single !== 'DNF' && (
              <Button type="link" size="small" style={{ paddingLeft: 0 }} onClick={() => setSingle('DNF')}>
                设为 DNF
              </Button>
            )}
          </div>
          <div>
            <Typography.Text type="secondary">平均（秒）</Typography.Text>
            {average === 'DNF' ? (
              <Space style={{ marginTop: 8, display: 'flex' }}>
                <Typography.Text type="danger">DNF</Typography.Text>
                <Button type="link" size="small" onClick={() => setAverage(null)}>
                  改填数字
                </Button>
              </Space>
            ) : (
              <InputNumber
                style={{ width: '100%', marginTop: 8 }}
                min={0}
                step={0.01}
                value={typeof average === 'number' ? average : undefined}
                onChange={(v) => setAverage(v === null ? null : Number(v))}
              />
            )}
            {average !== 'DNF' && (
              <Button type="link" size="small" style={{ paddingLeft: 0 }} onClick={() => setAverage('DNF')}>
                设为 DNF
              </Button>
            )}
          </div>
          <Space wrap>
            <Button size="small" onClick={setRowDnf}>
              本行全 DNF
            </Button>
            <Button size="small" loading={wcaLoading} onClick={() => void fetchWca()}>
              拉取 WCA
            </Button>
          </Space>
        </Space>
      )}
    </Modal>
  );
};

export default SeedingPlayerModal;
