import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Checkbox, Modal, Pagination, Popconfirm, Radio, Select, Slider } from 'antd';
import { DeleteOutlined, EyeInvisibleOutlined, EyeOutlined, HistoryOutlined } from '@ant-design/icons';
import { useIntl } from '@@/plugin-locale';
import type { Algorithm } from '@/services/cubing-pro/algs/typings';
import {
  appendFormulaPracticeRecord,
  clearFormulaPracticeHistory,
  computeAverages,
  createPracticeSession,
  deleteFormulaPracticeRecord,
  getFormulaPracticeHistory,
  PAGE_SIZE,
  type FormulaPracticeRecord,
} from '@/services/cubing-pro/algs/formulaPracticeHistory';
import {
  getFormulaPracticeConfig,
  saveFormulaPracticeConfig,
} from '@/services/cubing-pro/algs/formulaPracticeConfig';
import {
  buildFormulaKey,
  buildGroupKey,
  getFormulaPracticeSelection,
  saveFormulaPracticeSelection,
} from '@/services/cubing-pro/algs/formulaPracticeSelection';
import {
  getFormulaProficiency,
  getProficiencyLevel,
  PROFICIENCY_WEIGHTS,
  setFormulaProficiency,
  type ProficiencyLevel,
} from '@/services/cubing-pro/algs/formulaPracticeProficiency';
import SvgRenderer from './SvgRenderer';
import ProficiencySelect from './ProficiencySelect';
import './FormulaPracticeModal.less';

export type FormulaPracticeMode = 'sequential' | 'random' | 'nonRepeatRandom' | 'weightedRandom';

export interface FormulaItem {
  alg: Algorithm;
  setName: string;
  groupName: string;
}

interface FormulaPracticeModalProps {
  open: boolean;
  onClose: () => void;
  cube: string;
  classId: string;
  flatAlgs: FormulaItem[];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 每个公式随机选一条打乱，一个公式对应一个 slot */
function buildFormulaSlots(selectedAlgs: FormulaItem[]): Array<{ algIdx: number; scrambleIdx: number }> {
  return selectedAlgs.map((item, algIdx) => {
    const scrambles = item.alg.scrambles ?? [];
    const scrambleIdx =
      scrambles.length <= 1 ? 0 : Math.floor(Math.random() * scrambles.length);
    return { algIdx, scrambleIdx };
  });
}

/** 权重随机：按熟练度权重抽取，权重高的更易被抽到 */
function buildWeightedSlots(
  selectedAlgs: FormulaItem[],
  getWeight: (formulaKey: string) => number,
  count: number,
): Array<{ algIdx: number; scrambleIdx: number }> {
  if (selectedAlgs.length === 0) return [];
  const slots: Array<{ algIdx: number; scrambleIdx: number }> = [];
  const baseSlots = selectedAlgs.map((item, algIdx) => {
    const scrambles = item.alg.scrambles ?? [];
    const scrambleIdx = scrambles.length <= 1 ? 0 : Math.floor(Math.random() * scrambles.length);
    return { algIdx, scrambleIdx, key: `${item.setName}:${item.groupName}:${item.alg.name}` };
  });
  const totalWeight = baseSlots.reduce((s, slot) => s + getWeight(slot.key), 0) || 1;
  for (let i = 0; i < count; i++) {
    let r = Math.random() * totalWeight;
    let picked = false;
    for (const slot of baseSlots) {
      r -= getWeight(slot.key);
      if (r <= 0) {
        slots.push({ algIdx: slot.algIdx, scrambleIdx: slot.scrambleIdx });
        picked = true;
        break;
      }
    }
    if (!picked) slots.push({ algIdx: baseSlots[0].algIdx, scrambleIdx: baseSlots[0].scrambleIdx });
  }
  return slots;
}

const FormulaPracticeModal: React.FC<FormulaPracticeModalProps> = ({
  open,
  onClose,
  cube,
  classId,
  flatAlgs,
}) => {
  const intl = useIntl();
  const [phase, setPhase] = useState<'config' | 'practice'>('practice');
  const [mode, setMode] = useState<FormulaPracticeMode>('sequential');
  const [selectedFormulaKeys, setSelectedFormulaKeys] = useState<Set<string>>(new Set());
  const [scrambleSlots, setScrambleSlots] = useState<Array<{ algIdx: number; scrambleIdx: number }>>([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);
  const [timerState, setTimerState] = useState<'ready' | 'running' | 'stopped'>('ready');
  const [timerMs, setTimerMs] = useState(0);
  const [history, setHistory] = useState<FormulaPracticeRecord[]>([]);
  const [detailRecord, setDetailRecord] = useState<FormulaPracticeRecord | null>(null);
  const [contentVisible, setContentVisible] = useState(true);
  const [fullHistoryOpen, setFullHistoryOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [trimRatio, setTrimRatio] = useState(() => getFormulaPracticeConfig(cube, classId).trimRatio);
  const [proficiencyRemindOpen, setProficiencyRemindOpen] = useState(false);
  const [lastPracticedFormula, setLastPracticedFormula] = useState<{ formulaKey: string; formulaName: string; setName: string; groupName: string } | null>(null);
  const [proficiencyMap, setProficiencyMap] = useState<Record<string, ProficiencyLevel>>(() => getFormulaProficiency(cube, classId));
  const [remindProficiency, setRemindProficiency] = useState(() => getFormulaPracticeConfig(cube, classId).remindProficiency);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerStateRef = useRef(timerState);
  const remindProficiencyRef = useRef(remindProficiency);
  timerStateRef.current = timerState;
  remindProficiencyRef.current = remindProficiency;

  /** 练习会话：仅在 startPractice 时创建，结束计时时从此读取数据 */
  type PracticeSession = {
    sessionId: string;
    algs: FormulaItem[];
    slots: Array<{ algIdx: number; scrambleIdx: number }>;
    mode: FormulaPracticeMode;
  };
  const sessionRef = useRef<PracticeSession | null>(null);
  const currentSlotIndexRef = useRef(0);
  currentSlotIndexRef.current = currentSlotIndex;

  const selectedAlgs = useMemo(() => {
    return flatAlgs.filter((item) =>
      selectedFormulaKeys.has(buildFormulaKey(item.setName, item.groupName, item.alg.name)),
    );
  }, [flatAlgs, selectedFormulaKeys]);

  /** formulaKey -> image，用于历史记录中 image 被精简时的回填展示 */
  const formulaKeyToImage = useMemo(() => {
    const map = new Map<string, string>();
    flatAlgs.forEach((item) => {
      map.set(buildFormulaKey(item.setName, item.groupName, item.alg.name), item.alg.image ?? '');
    });
    return map;
  }, [flatAlgs]);

  const currentSlot = scrambleSlots[currentSlotIndex];
  const currentItem = currentSlot ? selectedAlgs[currentSlot.algIdx] : null;
  const currentScramble = currentItem
    ? (currentItem.alg.scrambles ?? [])[currentSlot?.scrambleIdx ?? 0] ?? ''
    : '';

  const loadHistory = useCallback(() => {
    setHistory(getFormulaPracticeHistory(cube, classId));
  }, [cube, classId]);

  const initSelection = useCallback(() => {
    const saved = getFormulaPracticeSelection(cube, classId);
    if (saved?.selectedFormulas?.length) {
      const keys = new Set<string>();
      saved.selectedFormulas.forEach((key) => {
        if (flatAlgs.some((item) => buildFormulaKey(item.setName, item.groupName, item.alg.name) === key)) {
          keys.add(key);
        }
      });
      if (keys.size > 0) {
        setSelectedFormulaKeys(keys);
        return;
      }
    }
    setSelectedFormulaKeys(new Set(flatAlgs.map((i) => buildFormulaKey(i.setName, i.groupName, i.alg.name))));
  }, [cube, classId, flatAlgs]);

  const saveSelection = useCallback(() => {
    const selectedSets = new Set<string>();
    const selectedGroups = new Set<string>();
    const selectedFormulas: string[] = [];
    selectedFormulaKeys.forEach((key) => {
      const parts = key.split(':');
      if (parts.length >= 3) {
        const [setName, groupName, algName] = parts;
        selectedSets.add(setName);
        selectedGroups.add(buildGroupKey(setName, groupName));
        selectedFormulas.push(key);
      }
    });
    saveFormulaPracticeSelection(cube, classId, {
      selectedSets: Array.from(selectedSets),
      selectedGroups: Array.from(selectedGroups),
      selectedFormulas,
    });
  }, [cube, classId, selectedFormulaKeys]);

  const getWeightForKey = useCallback((formulaKey: string) => {
    const level = proficiencyMap[formulaKey] ?? 'average';
    return PROFICIENCY_WEIGHTS[level];
  }, [proficiencyMap]);

  const buildSlotsForMode = useCallback((m: FormulaPracticeMode) => {
    const baseSlots = buildFormulaSlots(selectedAlgs);
    if (m === 'sequential') return baseSlots;
    if (m === 'weightedRandom') {
      return buildWeightedSlots(selectedAlgs, getWeightForKey, Math.max(selectedAlgs.length, 1));
    }
    return shuffle([...baseSlots]);
  }, [selectedAlgs, getWeightForKey]);

  useEffect(() => {
    if (open) {
      loadHistory();
      initSelection();
      const config = getFormulaPracticeConfig(cube, classId);
      setTrimRatio(config.trimRatio);
      setRemindProficiency(config.remindProficiency);
      setProficiencyMap(getFormulaProficiency(cube, classId));
    }
  }, [open, loadHistory, initSelection, cube, classId]);

  // 进入时直接到练习器：有选中公式则自动开始，否则到配置
  const hasAutoStarted = useRef(false);
  useEffect(() => {
    if (!open) {
      hasAutoStarted.current = false;
      return;
    }
    if (selectedAlgs.length === 0 && scrambleSlots.length === 0) {
      setPhase('config');
    } else if (selectedAlgs.length > 0 && scrambleSlots.length === 0 && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      saveSelection();
      const formulaKeys = selectedAlgs.map((i) =>
        buildFormulaKey(i.setName, i.groupName, i.alg.name),
      );
      const sessionId = createPracticeSession(cube, classId, {
        mode,
        selectedFormulas: formulaKeys,
      });
      const slots = buildSlotsForMode(mode);
      sessionRef.current = { sessionId, algs: [...selectedAlgs], slots: [...slots], mode };
      setScrambleSlots(slots);
      setCurrentSlotIndex(0);
      setPhase('practice');
    }
  }, [open, selectedAlgs.length, scrambleSlots.length, mode, saveSelection, cube, classId, buildSlotsForMode]);

  const groupedAlgs = useMemo(() => {
    const map = new Map<string, Map<string, FormulaItem[]>>();
    flatAlgs.forEach((item) => {
      if (!map.has(item.setName)) {
        map.set(item.setName, new Map());
      }
      const groupMap = map.get(item.setName)!;
      if (!groupMap.has(item.groupName)) {
        groupMap.set(item.groupName, []);
      }
      groupMap.get(item.groupName)!.push(item);
    });
    return map;
  }, [flatAlgs]);

  const handleSetToggle = (setName: string) => {
    const groupMap = groupedAlgs.get(setName);
    if (!groupMap) return;
    const keys: string[] = [];
    groupMap.forEach((items) => {
      items.forEach((item) => keys.push(buildFormulaKey(item.setName, item.groupName, item.alg.name)));
    });
    setSelectedFormulaKeys((prev) => {
      const next = new Set(prev);
      const allSelected = keys.every((k) => prev.has(k));
      keys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const handleGroupToggle = (setName: string, groupName: string) => {
    const items = groupedAlgs.get(setName)?.get(groupName) ?? [];
    const keys = items.map((i) => buildFormulaKey(i.setName, i.groupName, i.alg.name));
    setSelectedFormulaKeys((prev) => {
      const next = new Set(prev);
      const allSelected = keys.every((k) => prev.has(k));
      keys.forEach((k) => (allSelected ? next.delete(k) : next.add(k)));
      return next;
    });
  };

  const handleFormulaToggle = (setName: string, groupName: string, algName: string) => {
    const key = buildFormulaKey(setName, groupName, algName);
    setSelectedFormulaKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const startPractice = () => {
    if (selectedAlgs.length === 0) return;
    saveSelection();

    const formulaKeys = selectedAlgs.map((i) =>
      buildFormulaKey(i.setName, i.groupName, i.alg.name),
    );
    const sessionId = createPracticeSession(cube, classId, {
      mode,
      selectedFormulas: formulaKeys,
    });

    const slots = buildSlotsForMode(mode);

    sessionRef.current = {
      sessionId,
      algs: [...selectedAlgs],
      slots: [...slots],
      mode,
    };

    setScrambleSlots(slots);
    setCurrentSlotIndex(0);
    setTimerState('ready');
    setTimerMs(0);
    setContentVisible(true);
    setPhase('practice');
  };

  const stopTimerAndNext = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const elapsedMs = Date.now() - startTimeRef.current;
    setTimerState('stopped');

    const session = sessionRef.current;
    const slotIdx = currentSlotIndexRef.current;

    if (!session) {
      setTimerState('ready');
      setTimerMs(0);
      return;
    }

    const { algs, slots, mode: sessionMode } = session;
    const slot = slots[slotIdx];
    const item = slot != null ? algs[slot.algIdx] : null;

    // 1. 保存练习记录到历史（追加到当前会话）
    const formulaKey = item != null ? buildFormulaKey(item.setName, item.groupName, item.alg.name) : '';
    if (item != null && slot != null && session.sessionId) {
      const scramble = (item.alg.scrambles ?? [])[slot.scrambleIdx ?? 0] ?? '';

      const nextHistory = appendFormulaPracticeRecord(cube, classId, session.sessionId, {
        timeMs: elapsedMs,
        formulaKey,
        formulaName: item.alg.name,
        setName: item.setName,
        groupName: item.groupName,
        scramble,
        scrambleIndex: slot.scrambleIdx,
        image: '', // 不存储 SVG 以节省 localStorage 配额，展示时通过 formulaKey 查找
        algs: item.alg.algs ?? [],
      });
      setHistory(nextHistory);

      // 权重模式下，练习完成后弹窗提醒标记熟练度（若用户未勾选不再提醒）
      if (sessionMode === 'weightedRandom' && remindProficiencyRef.current) {
        setLastPracticedFormula({ formulaKey, formulaName: item.alg.name, setName: item.setName, groupName: item.groupName });
        setProficiencyRemindOpen(true);
      }
    }

    // 2. 切换到下一个公式
    const nextIdx = slotIdx + 1 >= slots.length ? 0 : slotIdx + 1;

    if (nextIdx === 0 && slots.length > 1) {
      if (sessionMode === 'nonRepeatRandom') {
        const shuffled = shuffle([...slots]);
        sessionRef.current = { sessionId: session.sessionId, algs, slots: shuffled, mode: sessionMode };
        setScrambleSlots(shuffled);
      } else if (sessionMode === 'weightedRandom') {
        const newSlots = buildWeightedSlots(algs, (k) => PROFICIENCY_WEIGHTS[getProficiencyLevel(cube, classId, k)], Math.max(algs.length, 1));
        sessionRef.current = { sessionId: session.sessionId, algs, slots: newSlots, mode: sessionMode };
        setScrambleSlots(newSlots);
      }
    }

    setCurrentSlotIndex(nextIdx);
    setTimerState('ready');
    setTimerMs(0);
  }, [cube, classId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open || phase !== 'practice') return;
      if (timerStateRef.current === 'running') {
        e.preventDefault();
        e.stopPropagation();
        stopTimerAndNext();
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (timerStateRef.current === 'ready') {
          startTimeRef.current = Date.now();
          setTimerMs(0);
          setTimerState('running');
        }
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setCurrentSlotIndex((i) => (i - 1 + scrambleSlots.length) % scrambleSlots.length);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setCurrentSlotIndex((i) => (i + 1) % scrambleSlots.length);
      }
    },
    [open, phase, scrambleSlots.length, stopTimerAndNext],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKeyDown(e);
    document.addEventListener('keydown', handler, true);
    return () => {
      document.removeEventListener('keydown', handler, true);
      if (timerRef.current != null) clearInterval(timerRef.current);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (timerState === 'running' && phase === 'practice') {
      const tick = () => {
        setTimerMs(Date.now() - startTimeRef.current);
      };
      timerRef.current = setInterval(tick, 50);
      return () => {
        if (timerRef.current != null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
    }
  }, [timerState, phase]);

  const handleClearHistory = () => {
    clearFormulaPracticeHistory(cube, classId);
    loadHistory();
  };

  const handleBackToConfig = () => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    sessionRef.current = null;
    setPhase('config');
    setTimerState('ready');
    setTimerMs(0);
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const cent = Math.floor((ms % 1000) / 10);
    return `${m > 0 ? `${m}:` : ''}${sec.toString().padStart(2, '0')}.${cent.toString().padStart(2, '0')}`;
  };

  if (!open) return null;

  if (phase === 'config') {
    return (
      <Modal
        open={open}
        onCancel={onClose}
        title={intl.formatMessage({ id: 'algs.formulaPractice.title' })}
        footer={null}
        width={640}
        className="formula-practice-modal"
      >
        <div className="formula-practice-config">
          <div className="formula-practice-mode-row">
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              {intl.formatMessage({ id: 'algs.formulaPractice.mode' })}
            </div>
            <Radio.Group value={mode} onChange={(e) => setMode(e.target.value)}>
              <Radio value="sequential">
                {intl.formatMessage({ id: 'algs.formulaPractice.modeSequential' })}
              </Radio>
              <Radio value="random">
                {intl.formatMessage({ id: 'algs.formulaPractice.modeRandom' })}
              </Radio>
              <Radio value="nonRepeatRandom">
                {intl.formatMessage({ id: 'algs.formulaPractice.modeNonRepeat' })}
              </Radio>
              <Radio value="weightedRandom">
                {intl.formatMessage({ id: 'algs.formulaPractice.modeWeighted' })}
              </Radio>
            </Radio.Group>
          </div>

          <div className="formula-practice-selector">
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
                {intl.formatMessage({ id: 'algs.detail.set' })}
              </span>
              <Button
                size="small"
                onClick={() =>
                  setSelectedFormulaKeys(
                    new Set(flatAlgs.map((i) => buildFormulaKey(i.setName, i.groupName, i.alg.name))),
                  )
                }
              >
                {intl.formatMessage({ id: 'algs.detail.selectAll' })}
              </Button>
              <Button size="small" onClick={() => setSelectedFormulaKeys(new Set())}>
                {intl.formatMessage({ id: 'algs.detail.deselectAll' })}
              </Button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {Array.from(groupedAlgs.keys()).map((setName) => {
                const groupMap = groupedAlgs.get(setName)!;
                const allKeys = Array.from(groupMap.values()).flat().map((i) => buildFormulaKey(i.setName, i.groupName, i.alg.name));
                const setSelected = allKeys.every((k) => selectedFormulaKeys.has(k));
                return (
                  <Button
                    key={setName}
                    type={setSelected ? 'primary' : 'default'}
                    size="small"
                    onClick={() => handleSetToggle(setName)}
                    style={{
                      borderRadius: 20,
                      ...(setSelected ? { backgroundColor: 'rgba(100, 149, 237, 0.85)', borderColor: 'rgba(100, 149, 237, 0.85)' } : {}),
                    }}
                  >
                    {setName}
                  </Button>
                );
              })}
            </div>
            <div style={{ marginBottom: 8, fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
              {intl.formatMessage({ id: 'algs.detail.group' })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Array.from(groupedAlgs.entries()).map(([setName, groupMap]) => (
                <div key={setName}>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.5)', marginBottom: 6 }}>{setName}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Array.from(groupMap.entries()).map(([groupName, items]) => {
                      const groupKey = buildGroupKey(setName, groupName);
                      const groupSelected = items.every((item) =>
                        selectedFormulaKeys.has(buildFormulaKey(item.setName, item.groupName, item.alg.name)),
                      );
                      return (
                        <div key={groupKey}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                            <Button
                              type={groupSelected ? 'primary' : 'default'}
                              size="small"
                              onClick={() => handleGroupToggle(setName, groupName)}
                              style={{
                                borderRadius: 16,
                                ...(groupSelected
                                  ? { backgroundColor: 'rgba(100, 149, 237, 0.85)', borderColor: 'rgba(100, 149, 237, 0.85)' }
                                  : {}),
                              }}
                            >
                              {groupName}
                            </Button>
                            {items.map((item) => {
                              const key = buildFormulaKey(item.setName, item.groupName, item.alg.name);
                              const sel = selectedFormulaKeys.has(key);
                              return (
                                <Button
                                  key={key}
                                  type={sel ? 'primary' : 'default'}
                                  size="small"
                                  onClick={() => handleFormulaToggle(setName, groupName, item.alg.name)}
                                  style={{
                                    borderRadius: 16,
                                    ...(sel
                                      ? { backgroundColor: 'rgba(100, 149, 237, 0.85)', borderColor: 'rgba(100, 149, 237, 0.85)' }
                                      : {}),
                                  }}
                                >
                                  {item.alg.name}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12, fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
            {intl.formatMessage({ id: 'algs.formulaPractice.selectedCount' }, { count: selectedAlgs.length })}
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>
              {intl.formatMessage({ id: 'algs.formulaPractice.trimRatio' })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Slider
                min={0}
                max={50}
                value={trimRatio}
                onChange={(v) => {
                  const n = typeof v === 'number' ? v : v[0];
                  setTrimRatio(n);
                  saveFormulaPracticeConfig(cube, classId, { trimRatio: n });
                }}
                style={{ flex: 1, maxWidth: 200 }}
              />
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
                {trimRatio}%
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.5)', marginTop: 4 }}>
              {intl.formatMessage({ id: 'algs.formulaPractice.trimRatioDesc' }, { p: trimRatio })}
            </div>
          </div>

          <Button
            type="primary"
            size="large"
            onClick={startPractice}
            disabled={selectedAlgs.length === 0}
          >
            {intl.formatMessage({ id: 'algs.formulaPractice.start' })}
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <span>{intl.formatMessage({ id: 'algs.formulaPractice.title' })}</span>
            <Select
              value={mode}
              onChange={(v) => {
                const newMode = v as FormulaPracticeMode;
                setMode(newMode);
                if (sessionRef.current) {
                  const { algs, sessionId } = sessionRef.current;
                  const newSlots = newMode === 'sequential'
                    ? buildFormulaSlots(algs)
                    : newMode === 'weightedRandom'
                      ? buildWeightedSlots(algs, getWeightForKey, Math.max(algs.length, 1))
                      : shuffle(buildFormulaSlots(algs));
                  sessionRef.current = { ...sessionRef.current, mode: newMode, slots: newSlots };
                  setScrambleSlots(newSlots);
                  setCurrentSlotIndex(0);
                }
              }}
              size="small"
              style={{ width: 140 }}
              options={[
                { value: 'sequential', label: intl.formatMessage({ id: 'algs.formulaPractice.modeSequential' }) },
                { value: 'random', label: intl.formatMessage({ id: 'algs.formulaPractice.modeRandom' }) },
                { value: 'nonRepeatRandom', label: intl.formatMessage({ id: 'algs.formulaPractice.modeNonRepeat' }) },
                { value: 'weightedRandom', label: intl.formatMessage({ id: 'algs.formulaPractice.modeWeighted' }) },
              ]}
            />
          </div>
        }
        footer={null}
        width={720}
        className="formula-practice-modal"
      >
        <div className="formula-practice-main">
          {currentScramble ? (
            <>
              {currentItem && (
                <div className={`formula-practice-header ${contentVisible ? '' : 'formula-practice-header-hidden'}`}>
                  {contentVisible ? (
                    <>
                      <SvgRenderer
                        svg={currentItem.alg.image}
                        maxWidth={140}
                        maxHeight={200}
                        style={{ flexShrink: 0 }}
                      />
                      <div className="formula-practice-header-info">
                        <div className="formula-practice-formula-name">{currentItem.alg.name}</div>
                        <div className="formula-practice-formula-meta">
                          {currentItem.setName} · {currentItem.groupName}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="formula-practice-header-placeholder">•••</div>
                  )}
                  <Button
                    type="text"
                    size="small"
                    icon={contentVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                    onClick={() => setContentVisible(!contentVisible)}
                    style={{ marginLeft: 8 }}
                  >
                    {contentVisible
                      ? intl.formatMessage({ id: 'algs.formulaPractice.hideContent' })
                      : intl.formatMessage({ id: 'algs.formulaPractice.showContent' })}
                  </Button>
                </div>
              )}

              <div
                className="formula-practice-scramble-block formula-practice-scramble-clickable"
                onClick={() =>
                  currentItem &&
                  setDetailRecord({
                    id: '',
                    createdAt: 0,
                    timeMs: 0,
                    formulaKey: buildFormulaKey(currentItem.setName, currentItem.groupName, currentItem.alg.name),
                    formulaName: currentItem.alg.name,
                    setName: currentItem.setName,
                    groupName: currentItem.groupName,
                    scramble: currentScramble,
                    scrambleIndex: currentSlot?.scrambleIdx ?? 0,
                    image: currentItem.alg.image,
                    algs: currentItem.alg.algs ?? [],
                  })
                }
              >
                <div className="formula-practice-scramble-label">
                  {intl.formatMessage({ id: 'algs.formulaPractice.scrambleLabel' })}
                </div>
                <div className="formula-practice-scramble">{currentScramble}</div>
              </div>

              <div
                className={`formula-practice-timer ${timerState === 'ready' ? 'ready' : ''} ${timerState === 'running' ? 'running' : ''}`}
              >
                {timerState === 'ready'
                  ? intl.formatMessage({ id: 'algs.formulaPractice.pressSpaceToStart' })
                  : formatTime(timerMs)}
              </div>
              {timerState === 'running' && (
                <Button type="primary" danger size="middle" onClick={stopTimerAndNext} style={{ marginTop: 8 }}>
                  {intl.formatMessage({ id: 'algs.formulaPractice.stopTimer' })}
                </Button>
              )}

              {currentItem && (
                <div className="formula-practice-nav-hint">
                  {intl.formatMessage(
                    { id: 'algs.formulaPractice.formulaNavHint' },
                    { current: currentSlotIndex + 1, total: scrambleSlots.length },
                  )}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: 'rgba(0,0,0,0.45)' }}>
              {intl.formatMessage({ id: 'algs.formulaPractice.noScramble' })}
            </div>
          )}

          <div className="formula-practice-hints">
            {timerState === 'running'
              ? intl.formatMessage({ id: 'algs.formulaPractice.hintAnyKey' })
              : intl.formatMessage({ id: 'algs.formulaPractice.hintSpace' })}
            <br />
            {intl.formatMessage({ id: 'algs.formulaPractice.hintArrow' })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <Button size="small" onClick={handleBackToConfig}>
            {intl.formatMessage({ id: 'algs.formulaPractice.backToConfig' })}
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={handleClearHistory}>
            {intl.formatMessage({ id: 'algs.formulaPractice.clearHistory' })}
          </Button>
        </div>

        <div className="formula-practice-history">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 500 }}>{intl.formatMessage({ id: 'algs.formulaPractice.historyTitle' })}</span>
            <Button
              type="link"
              size="small"
              icon={<HistoryOutlined />}
              onClick={() => {
                setHistoryPage(1);
                setFullHistoryOpen(true);
              }}
              style={{ padding: 0 }}
            >
              {intl.formatMessage({ id: 'algs.formulaPractice.viewAllHistory' })}
            </Button>
          </div>
          {history.length > 0 && (() => {
            const avgs = computeAverages(history, trimRatio);
            return (
              <div className="formula-practice-ao-row">
                {avgs.ao50 != null && (
                  <span className="formula-practice-ao-item">ao50: {formatTime(avgs.ao50)}</span>
                )}
                {avgs.ao100 != null && (
                  <span className="formula-practice-ao-item">ao100: {formatTime(avgs.ao100)}</span>
                )}
                {avgs.ao1000 != null && (
                  <span className="formula-practice-ao-item">ao1000: {formatTime(avgs.ao1000)}</span>
                )}
              </div>
            );
          })()}
          {history.length === 0 ? (
            <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12 }}>
              {intl.formatMessage({ id: 'algs.formulaPractice.historyEmpty' })}
            </div>
          ) : (
            history.slice(0, 3).map((record) => {
              const displayImage = record.image || formulaKeyToImage.get(record.formulaKey) || '';
              const prof = proficiencyMap[record.formulaKey] ?? 'average';
              return (
              <div
                key={record.id}
                className="formula-practice-history-item"
                onClick={() => setDetailRecord(record)}
              >
                <SvgRenderer svg={displayImage} maxWidth={36} maxHeight={48} style={{ flexShrink: 0 }} />
                <div className="formula-practice-history-item-info">
                  <div className="formula-practice-history-item-name">{record.formulaName}</div>
                  <div className="formula-practice-history-item-meta">
                    {record.setName} · {record.groupName}
                  </div>
                </div>
                <span className="formula-practice-history-item-time">{formatTime(record.timeMs)}</span>
                <div onClick={(e) => e.stopPropagation()}>
                  <ProficiencySelect
                    value={prof}
                    onChange={(v) => {
                      setFormulaProficiency(cube, classId, record.formulaKey, v);
                      setProficiencyMap((prev) => ({ ...prev, [record.formulaKey]: v }));
                    }}
                    size="small"
                  />
                </div>
              </div>
            );
            })
          )}
        </div>

        <Modal
          open={fullHistoryOpen}
          onCancel={() => setFullHistoryOpen(false)}
          title={intl.formatMessage({ id: 'algs.formulaPractice.fullHistory' })}
          footer={null}
          width={560}
          className="formula-practice-full-history-modal"
        >
          <div className="formula-practice-full-history-list">
            {history.length === 0 ? (
              <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, padding: 24, textAlign: 'center' }}>
                {intl.formatMessage({ id: 'algs.formulaPractice.historyEmpty' })}
              </div>
            ) : (
              (() => {
                const start = (historyPage - 1) * PAGE_SIZE;
                const pageRecords = history.slice(start, start + PAGE_SIZE);
                return pageRecords.map((record) => {
                  const displayImage = record.image || formulaKeyToImage.get(record.formulaKey) || '';
                  const prof = proficiencyMap[record.formulaKey] ?? 'average';
                  return (
                  <div key={record.id} className="formula-practice-full-history-item">
                    <SvgRenderer svg={displayImage} maxWidth={40} maxHeight={56} style={{ flexShrink: 0 }} />
                    <div
                      className="formula-practice-full-history-item-info"
                      onClick={() => {
                        setDetailRecord(record);
                        setFullHistoryOpen(false);
                      }}
                    >
                      <div className="formula-practice-full-history-item-name">{record.formulaName}</div>
                      <div className="formula-practice-full-history-item-meta">
                        {record.setName} · {record.groupName}
                      </div>
                    </div>
                    <span className="formula-practice-full-history-item-time">{formatTime(record.timeMs)}</span>
                    <ProficiencySelect
                      value={prof}
                      onChange={(v) => {
                        setFormulaProficiency(cube, classId, record.formulaKey, v);
                        setProficiencyMap((prev) => ({ ...prev, [record.formulaKey]: v }));
                      }}
                      size="small"
                    />
                    <Popconfirm
                      title={intl.formatMessage({ id: 'algs.formulaPractice.confirmDelete' })}
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        const next = deleteFormulaPracticeRecord(cube, classId, record.id);
                        setHistory(next);
                        if (pageRecords.length === 1 && historyPage > 1) {
                          setHistoryPage(historyPage - 1);
                        }
                      }}
                    >
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </div>
                  );
                });
              })()
            )}
          </div>
          {history.length > PAGE_SIZE && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <Pagination
                current={historyPage}
                pageSize={PAGE_SIZE}
                total={history.length}
                onChange={setHistoryPage}
                showSizeChanger={false}
                showTotal={(total) => intl.formatMessage({ id: 'algs.formulaPractice.totalRecords' }, { total })}
              />
            </div>
          )}
        </Modal>
      </Modal>

      <Modal
        open={proficiencyRemindOpen}
        onCancel={() => setProficiencyRemindOpen(false)}
        title={intl.formatMessage({ id: 'algs.formulaPractice.proficiencyRemindTitle' })}
        footer={null}
        width={400}
      >
        {lastPracticedFormula && (
          <div>
            <div style={{ marginBottom: 12, color: 'rgba(0,0,0,0.65)' }}>
              {intl.formatMessage({ id: 'algs.formulaPractice.proficiencyRemindDesc' }, { name: lastPracticedFormula.formulaName })}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {(['mastered', 'skilled', 'average', 'unskilled', 'unknown'] as ProficiencyLevel[]).map((level) => (
                <Button
                  key={level}
                  size="small"
                  type={proficiencyMap[lastPracticedFormula.formulaKey] === level ? 'primary' : 'default'}
                  onClick={() => {
                    setFormulaProficiency(cube, classId, lastPracticedFormula.formulaKey, level);
                    setProficiencyMap((prev) => ({ ...prev, [lastPracticedFormula.formulaKey]: level }));
                    setProficiencyRemindOpen(false);
                  }}
                >
                  {intl.formatMessage({ id: `algs.formulaPractice.proficiency.${level}` })}
                </Button>
              ))}
            </div>
            <Checkbox
              checked={!remindProficiency}
              onChange={(e) => {
                const next = !e.target.checked;
                setRemindProficiency(next);
                saveFormulaPracticeConfig(cube, classId, { remindProficiency: next });
              }}
            >
              {intl.formatMessage({ id: 'algs.formulaPractice.proficiencyDontRemind' })}
            </Checkbox>
          </div>
        )}
      </Modal>

      <Modal
        open={!!detailRecord}
        onCancel={() => setDetailRecord(null)}
        title={detailRecord?.formulaName}
        footer={null}
        width={480}
        className="formula-practice-formula-detail-modal"
      >
        {detailRecord && (
          <div>
            <div style={{ marginBottom: 8, fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
              {intl.formatMessage({ id: 'algs.modal.scramble' })}
            </div>
            <div className="formula-practice-detail-scramble">{detailRecord.scramble}</div>
            <SvgRenderer
              svg={detailRecord.image || formulaKeyToImage.get(detailRecord.formulaKey) || ''}
              maxHeight={180}
              style={{ marginBottom: 16 }}
            />
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
                {intl.formatMessage({ id: 'algs.proficiencyCard.title' })}:
              </span>
              <ProficiencySelect
                value={proficiencyMap[detailRecord.formulaKey] ?? 'average'}
                onChange={(v) => {
                  setFormulaProficiency(cube, classId, detailRecord.formulaKey, v);
                  setProficiencyMap((prev) => ({ ...prev, [detailRecord.formulaKey]: v }));
                }}
                size="small"
              />
            </div>
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', marginBottom: 8 }}>
              {intl.formatMessage({ id: 'algs.modal.formulaList' })}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {detailRecord.algs.map((alg, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    background: 'rgba(0,0,0,0.04)',
                    borderRadius: 8,
                    fontFamily: 'monospace',
                    fontSize: 14,
                  }}
                >
                  {alg}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default FormulaPracticeModal;
