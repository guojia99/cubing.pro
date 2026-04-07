import { fetchOneUserGrades, pickBestOneGradeForEvent } from '@/pages/Tools/TeamMatch/oneGradeApi';
import { resolveOfficialScores, SEEDING_SOURCE_LABEL } from '@/pages/Tools/TeamMatch/seedingScorePick';
import type {
  Player,
  SeedingAdoptStrategy,
  SeedingEntry,
  SeedingEntryPreliminary,
  SeedingEntrySnapshot,
  SeedingScoreSource,
} from '@/pages/Tools/TeamMatch/types';
import { throttleBeforeWcaResultsRequest } from '@/pages/Tools/TeamMatch/wcaRequestThrottle';
import { pickBestForEvent } from '@/pages/Tools/TeamMatch/wcaSeeding';
import { getWCAPersonResults } from '@/services/cubing-pro/wca/player';
import { Button, Divider, InputNumber, Modal, Radio, Space, Tag, Typography, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  player: Player | null;
  eventId: string;
  entry: SeedingEntry | null;
  onSave: (next: SeedingEntry) => void;
};

function fmt(v: number | 'DNF' | null) {
  return v === 'DNF' ? 'DNF' : v === null ? '—' : String(v);
}

function fmtSnapshot(s: SeedingEntrySnapshot | null) {
  if (!s || (s.single === null && s.average === null)) return '—';
  return `单次 ${fmt(s.single)} · 平均 ${fmt(s.average)}`;
}

function inferAdoptStrategy(e: SeedingEntry): SeedingAdoptStrategy {
  if (e.adoptStrategy) return e.adoptStrategy;
  if (e.activeSource === 'manual') return 'manual';
  return 'best_average';
}

const SeedingPlayerModal: React.FC<Props> = ({ open, onClose, player, eventId, entry, onSave }) => {
  const [single, setSingle] = useState<number | 'DNF' | null>(null);
  const [average, setAverage] = useState<number | 'DNF' | null>(null);
  const [activeSource, setActiveSource] = useState<SeedingScoreSource>('manual');
  const [adoptStrategy, setAdoptStrategy] = useState<SeedingAdoptStrategy>('best_average');
  const [wcaBest, setWcaBest] = useState<SeedingEntrySnapshot | null>(null);
  const [oneBest, setOneBest] = useState<SeedingEntrySnapshot | null>(null);
  const [preliminary, setPreliminary] = useState<SeedingEntryPreliminary>({ single: null, average: null });

  const [wcaLoading, setWcaLoading] = useState(false);
  const [oneLoading, setOneLoading] = useState(false);
  /** 避免「从 entry 载入」与「快照联动」两个 effect 同一帧重复写正式成绩 */
  const skipSnapshotSyncOnce = useRef(false);

  useEffect(() => {
    if (!open || !entry || !player) return;
    skipSnapshotSyncOnce.current = true;
    const strat = inferAdoptStrategy(entry);
    const wca = entry.wcaBest ?? null;
    const one = entry.oneBest ?? null;
    const pre = entry.preliminary ?? { single: entry.single, average: entry.average };
    setWcaBest(wca);
    setOneBest(one);
    setPreliminary(pre);
    setAdoptStrategy(strat);
    if (strat === 'manual') {
      setSingle(entry.single);
      setAverage(entry.average);
      setActiveSource(entry.activeSource ?? 'manual');
    } else {
      const r = resolveOfficialScores(strat, wca, one, pre);
      if (r) {
        setSingle(r.single);
        setAverage(r.average);
        setActiveSource(r.activeSource);
      } else {
        setSingle(entry.single);
        setAverage(entry.average);
        setActiveSource(entry.activeSource ?? 'manual');
      }
    }
  }, [open, entry, player, eventId]);

  useEffect(() => {
    if (!open || !entry || !player) return;
    if (skipSnapshotSyncOnce.current) {
      skipSnapshotSyncOnce.current = false;
      return;
    }
    if (adoptStrategy === 'manual') return;
    const r = resolveOfficialScores(adoptStrategy, wcaBest, oneBest, preliminary);
    if (r) {
      setSingle(r.single);
      setAverage(r.average);
      setActiveSource(r.activeSource);
    }
  }, [adoptStrategy, wcaBest, oneBest, preliminary, open, entry, player]);

  const handleOk = () => {
    if (!player || !entry) return;
    onSave({
      playerId: player.id,
      eventId,
      single,
      average,
      activeSource,
      adoptStrategy,
      wcaBest,
      oneBest,
      preliminary,
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
      await throttleBeforeWcaResultsRequest();
      const res = await getWCAPersonResults(player.wcaId);
      const b = pickBestForEvent(res, eventId);
      setWcaBest({ single: b.single, average: b.average });
      message.success('已拉取 WCA 成绩');
    } catch {
      message.error('拉取失败');
    } finally {
      setWcaLoading(false);
    }
  };

  const fetchOne = async () => {
    if (!player) return;
    const uid = (player.oneId ?? '').trim();
    if (!uid || !/^\d+$/.test(uid)) {
      message.warning('请先在选手资料中填写有效 One ID（数字 uid）');
      return;
    }
    setOneLoading(true);
    try {
      const rows = await fetchOneUserGrades(uid);
      const b = pickBestOneGradeForEvent(rows, eventId);
      setOneBest({ single: b.single, average: b.average });
      message.success('已拉取 One 成绩');
    } catch {
      message.error('拉取失败（网络、跨域或该项目无记录）');
    } finally {
      setOneLoading(false);
    }
  };

  const applyBestClick = () => {
    setAdoptStrategy('best_average');
    const r = resolveOfficialScores('best_average', wcaBest, oneBest, preliminary);
    if (r) {
      setSingle(r.single);
      setAverage(r.average);
      setActiveSource(r.activeSource);
      message.success('已切换为「自动：三者最佳平均」并写入');
    } else {
      message.warning('请先填写初赛或成功拉取 WCA / One');
    }
  };

  const setRowDnf = () => {
    setAdoptStrategy('manual');
    setSingle('DNF');
    setAverage('DNF');
    setActiveSource('manual');
  };

  const markOfficialManual = () => {
    setAdoptStrategy('manual');
    setActiveSource('manual');
  };

  const onStrategyChange = (v: SeedingAdoptStrategy) => {
    setAdoptStrategy(v);
    if (v === 'manual') return;
    const r = resolveOfficialScores(v, wcaBest, oneBest, preliminary);
    if (!r) {
      message.warning('该来源暂无有效成绩，可先拉取或填写对应区块');
    }
  };

  const title = player ? `编辑成绩 · ${player.name}` : '编辑成绩';

  return (
    <Modal
      title={title}
      open={open && !!player && !!entry}
      onCancel={onClose}
      onOk={handleOk}
      width={700}
      destroyOnClose
    >
      {player && entry && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            初赛 / WCA / One 可并存；<strong>正式成绩采用方式</strong>由下方单选决定。WCA 可能偏旧、选手退步时可改选初赛、One 或手填。
          </Typography.Text>

          <div>
            <Typography.Text strong>初赛</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap align="center">
                <Typography.Text type="secondary">单次（秒）</Typography.Text>
                {preliminary.single === 'DNF' ? (
                  <Typography.Text type="danger">DNF</Typography.Text>
                ) : (
                  <InputNumber
                    min={0}
                    step={0.01}
                    style={{ width: 120 }}
                    value={typeof preliminary.single === 'number' ? preliminary.single : undefined}
                    onChange={(v) =>
                      setPreliminary((p) => ({ ...p, single: v === null ? null : Number(v) }))
                    }
                  />
                )}
                {preliminary.single !== 'DNF' && (
                  <Button type="link" size="small" onClick={() => setPreliminary((p) => ({ ...p, single: 'DNF' }))}>
                    单次 DNF
                  </Button>
                )}
              </Space>
            </div>
            <div style={{ marginTop: 8 }}>
              <Space wrap align="center">
                <Typography.Text type="secondary">平均（秒）</Typography.Text>
                {preliminary.average === 'DNF' ? (
                  <Typography.Text type="danger">DNF</Typography.Text>
                ) : (
                  <InputNumber
                    min={0}
                    step={0.01}
                    style={{ width: 120 }}
                    value={typeof preliminary.average === 'number' ? preliminary.average : undefined}
                    onChange={(v) =>
                      setPreliminary((p) => ({ ...p, average: v === null ? null : Number(v) }))
                    }
                  />
                )}
                {preliminary.average !== 'DNF' && (
                  <Button type="link" size="small" onClick={() => setPreliminary((p) => ({ ...p, average: 'DNF' }))}>
                    平均 DNF
                  </Button>
                )}
              </Space>
            </div>
          </div>

          <div>
            <Space wrap align="center">
              <Typography.Text strong>WCA</Typography.Text>
              <Typography.Text type="secondary">{fmtSnapshot(wcaBest)}</Typography.Text>
              <Button size="small" loading={wcaLoading} onClick={() => void fetchWca()}>
                拉取 WCA
              </Button>
            </Space>
          </div>

          <div>
            <Space wrap align="center">
              <Typography.Text strong>One</Typography.Text>
              <Typography.Text type="secondary">{fmtSnapshot(oneBest)}</Typography.Text>
              <Button size="small" loading={oneLoading} onClick={() => void fetchOne()}>
                拉取 One
              </Button>
            </Space>
          </div>

          <div>
            <Typography.Text strong>正式成绩采用</Typography.Text>
            <Radio.Group
              style={{ display: 'block', marginTop: 8 }}
              value={adoptStrategy}
              onChange={(e) => onStrategyChange(e.target.value as SeedingAdoptStrategy)}
            >
              <Space direction="vertical" size={4}>
                <Radio value="best_average">自动：三者最佳平均（初赛 / WCA / One 中比较）</Radio>
                <Radio value="preliminary">固定采用初赛</Radio>
                <Radio value="wca">固定采用 WCA（可能偏旧）</Radio>
                <Radio value="one">固定采用 One</Radio>
                <Radio value="manual">手填：仅使用下方「当前采用」数字</Radio>
              </Space>
            </Radio.Group>
          </div>

          <Space wrap>
            <Button size="small" onClick={applyBestClick}>
              快捷：切到「自动最佳平均」并写入
            </Button>
            <Button size="small" onClick={setRowDnf}>
              当前采用全 DNF
            </Button>
          </Space>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Space wrap align="center" style={{ marginBottom: 8 }}>
              <Typography.Text strong>当前采用（种子/排序）</Typography.Text>
              <Tag color={activeSource === 'wca' ? 'blue' : activeSource === 'one' ? 'green' : activeSource === 'preliminary' ? 'orange' : 'default'}>
                {SEEDING_SOURCE_LABEL[activeSource]}
              </Tag>
              {adoptStrategy === 'best_average' && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  （策略：自动最佳平均）
                </Typography.Text>
              )}
            </Space>
            <div>
              <Typography.Text type="secondary">单次（秒）</Typography.Text>
              {single === 'DNF' ? (
                <Space style={{ marginTop: 8, display: 'flex' }}>
                  <Typography.Text type="danger">DNF</Typography.Text>
                  <Button type="link" size="small" onClick={() => { setSingle(null); markOfficialManual(); }}>
                    改填数字
                  </Button>
                </Space>
              ) : (
                <InputNumber
                  style={{ width: '100%', marginTop: 8 }}
                  min={0}
                  step={0.01}
                  value={typeof single === 'number' ? single : undefined}
                  onChange={(v) => {
                    setSingle(v === null ? null : Number(v));
                    markOfficialManual();
                  }}
                />
              )}
              {single !== 'DNF' && (
                <Button type="link" size="small" style={{ paddingLeft: 0 }} onClick={() => { setSingle('DNF'); markOfficialManual(); }}>
                  设为 DNF
                </Button>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <Typography.Text type="secondary">平均（秒）</Typography.Text>
              {average === 'DNF' ? (
                <Space style={{ marginTop: 8, display: 'flex' }}>
                  <Typography.Text type="danger">DNF</Typography.Text>
                  <Button type="link" size="small" onClick={() => { setAverage(null); markOfficialManual(); }}>
                    改填数字
                  </Button>
                </Space>
              ) : (
                <InputNumber
                  style={{ width: '100%', marginTop: 8 }}
                  min={0}
                  step={0.01}
                  value={typeof average === 'number' ? average : undefined}
                  onChange={(v) => {
                    setAverage(v === null ? null : Number(v));
                    markOfficialManual();
                  }}
                />
              )}
              {average !== 'DNF' && (
                <Button type="link" size="small" style={{ paddingLeft: 0 }} onClick={() => { setAverage('DNF'); markOfficialManual(); }}>
                  设为 DNF
                </Button>
              )}
            </div>
          </div>
        </Space>
      )}
    </Modal>
  );
};

export default SeedingPlayerModal;
