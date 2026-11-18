import { tm, useTeamMatchI18n, type TeamMatchLocale } from '@/views/TeamMatch/i18n';
import { fetchOneUserGrades, pickBestOneGradeForEvent } from '@/views/TeamMatch/oneGradeApi';
import { resolveOfficialScores, seedingSourceLabel } from '@/views/TeamMatch/seedingScorePick';
import type {
  Player,
  SeedingAdoptStrategy,
  SeedingEntry,
  SeedingEntryPreliminary,
  SeedingEntrySnapshot,
  SeedingScoreSource,
} from '@/views/TeamMatch/types';
import { throttleBeforeWcaResultsRequest } from '@/views/TeamMatch/wcaRequestThrottle';
import { pickBestForEvent } from '@/views/TeamMatch/wcaSeeding';
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

function fmtSnapshot(s: SeedingEntrySnapshot | null, locale: TeamMatchLocale) {
  if (!s || (s.single === null && s.average === null)) return '—';
  return tm(locale, 'teamMatch.snapshotLine', { p0: fmt(s.single), p1: fmt(s.average) });
}

function inferAdoptStrategy(e: SeedingEntry): SeedingAdoptStrategy {
  if (e.adoptStrategy) return e.adoptStrategy;
  if (e.activeSource === 'manual') return 'manual';
  return 'best_average';
}

const SeedingPlayerModal: React.FC<Props> = ({ open, onClose, player, eventId, entry, onSave }) => {
  const { t: tr, locale } = useTeamMatchI18n();
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
      message.warning(tr('teamMatch.validWcaRequired'));
      return;
    }
    setWcaLoading(true);
    try {
      await throttleBeforeWcaResultsRequest();
      const res = await getWCAPersonResults(player.wcaId);
      const b = pickBestForEvent(res, eventId);
      setWcaBest({ single: b.single, average: b.average });
      message.success(tr('teamMatch.wcaScoresFetched'));
    } catch {
      message.error(tr('teamMatch.fetchFailed'));
    } finally {
      setWcaLoading(false);
    }
  };

  const fetchOne = async () => {
    if (!player) return;
    const uid = (player.oneId ?? '').trim();
    if (!uid || !/^\d+$/.test(uid)) {
      message.warning(tr('teamMatch.validOneRequired'));
      return;
    }
    setOneLoading(true);
    try {
      const rows = await fetchOneUserGrades(uid);
      const b = pickBestOneGradeForEvent(rows, eventId);
      setOneBest({ single: b.single, average: b.average });
      message.success(tr('teamMatch.oneScoresFetched'));
    } catch {
      message.error(tr('teamMatch.oneFetchFailed'));
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
      message.success(tr('teamMatch.autoBestApplied'));
    } else {
      message.warning(tr('teamMatch.needScoreSource'));
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
      message.warning(tr('teamMatch.sourceEmpty'));
    }
  };

  const title = player ? tr('teamMatch.editScoresPlayer', { p0: player.name }) : tr('teamMatch.editScores');

  return (
    <Modal
      className="tm-workbench-modal"
      title={title}
      open={open && !!player && !!entry}
      onCancel={onClose}
      onOk={handleOk}
      width={700}
      destroyOnHidden
    >
      {player && entry && (
        <Space orientation="vertical" style={{ width: '100%' }} size="middle">
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{tr('teamMatch.adoptHelp')}</Typography.Text>

          <div>
            <Typography.Text strong>{tr('teamMatch.preliminary')}</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap align="center">
                <Typography.Text type="secondary">{tr('teamMatch.singleSeconds')}</Typography.Text>
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
                  <Button type="link" size="small" onClick={() => setPreliminary((p) => ({ ...p, single: 'DNF' }))}>{tr('teamMatch.singleDnf')}</Button>
                )}
              </Space>
            </div>
            <div style={{ marginTop: 8 }}>
              <Space wrap align="center">
                <Typography.Text type="secondary">{tr('teamMatch.averageSeconds')}</Typography.Text>
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
                  <Button type="link" size="small" onClick={() => setPreliminary((p) => ({ ...p, average: 'DNF' }))}>{tr('teamMatch.averageDnf')}</Button>
                )}
              </Space>
            </div>
          </div>

          <div>
            <Space wrap align="center">
              <Typography.Text strong>WCA</Typography.Text>
              <Typography.Text type="secondary">{fmtSnapshot(wcaBest, locale)}</Typography.Text>
              <Button size="small" loading={wcaLoading} onClick={() => void fetchWca()}>{tr('teamMatch.fetchWca')}</Button>
            </Space>
          </div>

          <div>
            <Space wrap align="center">
              <Typography.Text strong>One</Typography.Text>
              <Typography.Text type="secondary">{fmtSnapshot(oneBest, locale)}</Typography.Text>
              <Button size="small" loading={oneLoading} onClick={() => void fetchOne()}>{tr('teamMatch.fetchOne')}</Button>
            </Space>
          </div>

          <div>
            <Typography.Text strong>{tr('teamMatch.adoptResults')}</Typography.Text>
            <Radio.Group
              style={{ display: 'block', marginTop: 8 }}
              value={adoptStrategy}
              onChange={(e) => onStrategyChange(e.target.value as SeedingAdoptStrategy)}
            >
              <Space orientation="vertical" size={4}>
                <Radio value="best_average">{tr('teamMatch.strategyAuto')}</Radio>
                <Radio value="preliminary">{tr('teamMatch.strategyPrelim')}</Radio>
                <Radio value="wca">{tr('teamMatch.strategyWca')}</Radio>
                <Radio value="one">{tr('teamMatch.strategyOne')}</Radio>
                <Radio value="manual">{tr('teamMatch.strategyManual')}</Radio>
              </Space>
            </Radio.Group>
          </div>

          <Space wrap>
            <Button size="small" onClick={applyBestClick}>{tr('teamMatch.applyAutoBest')}</Button>
            <Button size="small" onClick={setRowDnf}>{tr('teamMatch.officialAllDnf')}</Button>
          </Space>

          <Divider style={{ margin: '8px 0' }} />

          <div>
            <Space wrap align="center" style={{ marginBottom: 8 }}>
              <Typography.Text strong>{tr('teamMatch.currentAdopted')}</Typography.Text>
              <Tag color={activeSource === 'wca' ? 'blue' : activeSource === 'one' ? 'green' : activeSource === 'preliminary' ? 'orange' : 'default'}>
                {seedingSourceLabel(activeSource, locale)}
              </Tag>
              {adoptStrategy === 'best_average' && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>{tr('teamMatch.autoStrategyHint')}</Typography.Text>
              )}
            </Space>
            <div>
              <Typography.Text type="secondary">{tr('teamMatch.singleSeconds')}</Typography.Text>
              {single === 'DNF' ? (
                <Space style={{ marginTop: 8, display: 'flex' }}>
                  <Typography.Text type="danger">DNF</Typography.Text>
                  <Button type="link" size="small" onClick={() => { setSingle(null); markOfficialManual(); }}>{tr('teamMatch.enterNumber')}</Button>
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
                <Button type="link" size="small" style={{ paddingLeft: 0 }} onClick={() => { setSingle('DNF'); markOfficialManual(); }}>{tr('teamMatch.setDnf')}</Button>
              )}
            </div>
            <div style={{ marginTop: 12 }}>
              <Typography.Text type="secondary">{tr('teamMatch.averageSeconds')}</Typography.Text>
              {average === 'DNF' ? (
                <Space style={{ marginTop: 8, display: 'flex' }}>
                  <Typography.Text type="danger">DNF</Typography.Text>
                  <Button type="link" size="small" onClick={() => { setAverage(null); markOfficialManual(); }}>{tr('teamMatch.enterNumber')}</Button>
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
                <Button type="link" size="small" style={{ paddingLeft: 0 }} onClick={() => { setAverage('DNF'); markOfficialManual(); }}>{tr('teamMatch.setDnf')}</Button>
              )}
            </div>
          </div>
        </Space>
      )}
    </Modal>
  );
};

export default SeedingPlayerModal;
