import { CubesCn } from '@/components/CubeIcon/cube';
import { secondTimeFormat } from '@/pages/WCA/utils/wca_results';
import type { CompAPI } from '@/services/cubing-pro/comps/typings';
import type { EventsAPI } from '@/services/cubing-pro/events/typings';
import { MoreOutlined, UnorderedListOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Checkbox,
  ColorPicker,
  Drawer,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { history, useLocation } from '@umijs/max';
import { getExtraRows } from './buildScrambleRows';
import { buildEventContexts } from './buildEventContexts';
import { buildCompactExportLines } from './formatExport';
import {
  findContextByEventId,
  findIncompleteOtherEvents,
  getAllMainSlots,
  getAttemptInRound,
  getFirstUnfilledMainSlot,
  getMainIndicesForRound,
  getNextMainSlot,
  getRoundExportNumber,
  getRoundStatsScheduleIdx,
  hasStartedEvent,
  isEventFullyRecorded,
  normalizeCursor,
  reopenCursor,
  roundHasAnyRecorded,
  roundHasMissingSlots,
} from './navigation';
import { parseManualTimeToMs } from './parseManualTime';
import { getToken } from '@/services/cubing-pro/auth/token';
import { USER_KV_KEYS, getUserKv, setUserKv } from '@/services/cubing-pro/user/user_kv';
import { loadGroupTimer, saveGroupTimer } from './storage';
import {
  defaultGroupTimerUi,
  loadGroupTimerUiFromStorage,
  normalizeGroupTimerUi,
  saveGroupTimerUiToStorage,
  type GroupTimerUiConfig,
} from './uiConfig';
import {
  effectiveTimeMs,
  eventCompetitionAverage,
  formatMsForDisplay,
  roundBestMs,
} from './stats';
import type { GroupTimerPersisted, MbfPhase, SolveRecord } from './types';
import { makeSlotKey } from './types';
import {
  INSPECTION_DNF_MS,
  INSPECTION_WARN_ELAPSED_MS,
  formatInspectionSeconds,
  inspectionDnfFromElapsed,
  inspectionPlus2FromElapsed,
  isBlindEventId,
} from './inspection';
import { shouldHideScrambleImage } from '../scrambleSegments';
import { ScrambleImageMini } from './ScrambleImageMini';
import './GroupTimer.css';

const { Text, Paragraph: TypographyParagraph } = Typography;

/** 松手开始计时的最短按住时间（毫秒） */
const TIMER_HOLD_MIN_MS = 350;
/** 观察阶段：同一套空格逻辑（待命 / 倒计时）在 120ms 内至多生效一次，抑制连按；与长按无关（长按仅一次 keydown→keyup） */
const SPACE_INSPECTION_THROTTLE_MS = 120;

/** 历史成绩：还原/录入时间，本地「月-日 时:分」 */
function formatHistoryRecordedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return '—';
  }
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${mo}-${day} ${hh}:${mi}`;
}

function exportRoundKey(eid: string, scheduleIdx: number): string {
  return `${eid}::${scheduleIdx}`;
}

function parseExportRoundKey(k: string): { eid: string; scheduleIdx: number } | null {
  const i = k.indexOf('::');
  if (i === -1) {
    return null;
  }
  const eid = k.slice(0, i);
  const scheduleIdx = parseInt(k.slice(i + 2), 10);
  if (Number.isNaN(scheduleIdx)) {
    return null;
  }
  return { eid, scheduleIdx };
}

type Props = {
  comp: CompAPI.CompResp;
  baseEvents: EventsAPI.Event[];
  open: boolean;
  onClose: () => void;
};

function formatResultLine(rec: SolveRecord, eventId: string): string {
  if (eventId === '333mbf' && rec.mbf && rec.timeMs !== null) {
    const t = secondTimeFormat(rec.timeMs / 1000, true);
    return `${rec.mbf.solved}/${rec.mbf.attempted} ${t}${rec.dnf ? ' DNF' : ''}`;
  }
  if (rec.dns) {
    return 'DNS';
  }
  if (rec.dnf) {
    return 'DNF';
  }
  if (rec.timeMs === null) {
    return '—';
  }
  const ms = effectiveTimeMs(rec)!;
  return formatMsForDisplay(ms, eventId) + (rec.plus2 ? ' +' : '');
}

function consumedExtraLineIndices(eventId: string, solves: Record<string, SolveRecord>): Set<number> {
  const set = new Set<number>();
  for (const [k, r] of Object.entries(solves)) {
    if (!k.startsWith(eventId + '|')) {
      continue;
    }
    if (r.usedSpare && r.extraLineIndex != null) {
      set.add(r.extraLineIndex);
    }
  }
  return set;
}

const GroupTimer: React.FC<Props> = ({ comp, baseEvents, open, onClose }) => {
  const location = useLocation();
  const compId = comp.data.id;

  const goToLoginWithRedirect = useCallback(() => {
    const sp = new URLSearchParams(location.search);
    sp.set('comps_tabs', 'scrambles');
    sp.set('groupTimer', '1');
    const next = `${location.pathname}?${sp.toString()}`;
    history.push(`/login?redirect=${encodeURIComponent(next)}`);
  }, [location.pathname, location.search]);
  const contexts = useMemo(
    () => buildEventContexts(comp.data.comp_json.Events, baseEvents),
    [comp.data.comp_json.Events, baseEvents],
  );

  const [store, setStore] = useState<GroupTimerPersisted>(() => loadGroupTimer(compId));
  const [manualRaw, setManualRaw] = useState('');
  const [running, setRunning] = useState(false);
  const [displayMs, setDisplayMs] = useState(0);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const stopHandledRef = useRef(false);

  const [mbfPhase, setMbfPhase] = useState<MbfPhase | null>(null);
  const [mbfAttemptedStr, setMbfAttemptedStr] = useState('');
  const [mbfSolvedStr, setMbfSolvedStr] = useState('');

  const [pendingSpare, setPendingSpare] = useState<{
    extraLineIndex: number;
    spareScramble: string;
    originalScramble: string;
  } | null>(null);

  const [listOpen, setListOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  /** 按轮次 scheduleIdx 字符串勾选 */
  const [exportCheckedRounds, setExportCheckedRounds] = useState<Record<string, boolean>>({});
  const [exportDraft, setExportDraft] = useState('');

  const [eventDone, setEventDone] = useState(false);
  const [eventOverviewOpen, setEventOverviewOpen] = useState(false);
  /** 按住准备计时：全屏淡绿提示 */
  const [timerHoldOverlay, setTimerHoldOverlay] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [eventDoneGuideOpen, setEventDoneGuideOpen] = useState(false);
  const [uiConfig, setUiConfig] = useState<GroupTimerUiConfig>(() => loadGroupTimerUiFromStorage());
  const [uiForm] = Form.useForm<GroupTimerUiConfig>();

  const holdStartMsRef = useRef<number | null>(null);
  const holdPointerIdRef = useRef<number | null>(null);
  const inspectionStartRef = useRef<number>(0);
  const [inspectionElapsedMs, setInspectionElapsedMs] = useState(0);
  /** 已点击计时区进入观察倒计时（未点击前仅待命） */
  const [inspectionCounting, setInspectionCounting] = useState(false);
  const pendingInspectionPlus2Ref = useRef(false);
  const spaceAwaitingKeyDownRef = useRef(false);
  const spaceCountingKeyDownRef = useRef(false);
  /** 上次「待命→倒计时」由空格成功触发的时间；null 表示本格尚未触发过 */
  const lastSpaceAwaitingEmitAtRef = useRef<number | null>(null);
  /** 上次「倒计时内松手结束观察」由空格成功触发的时间 */
  const lastSpaceCountingEmitAtRef = useRef<number | null>(null);
  /** 本格观察倒计时是否已因超 17s 自动记 DNF（防重复提交） */
  const inspectionAutoDnfDoneRef = useRef(false);

  /** 仅在打开计时器且 contexts 就绪时从本地恢复一次，避免覆盖项目/轮次切换 */
  const lastTimerInitSigRef = useRef<string | null>(null);
  useEffect(() => {
    if (!open) {
      lastTimerInitSigRef.current = null;
      return;
    }
    if (contexts.length === 0) {
      return;
    }
    const sig = `${compId}`;
    if (lastTimerInitSigRef.current === sig) {
      return;
    }
    lastTimerInitSigRef.current = sig;
    const st = loadGroupTimer(compId);
    const cur = normalizeCursor(contexts, reopenCursor(contexts, st.solves));
    setStore({ ...st, cursor: cur });
  }, [open, compId, contexts]);

  useEffect(() => {
    if (!open) {
      return;
    }
    saveGroupTimer(store);
  }, [store, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const tok = getToken();
    if (!tok?.token) {
      return;
    }
    void getUserKv(USER_KV_KEYS.group_timer_ui_config)
      .then((r) => {
        if (!r.value) {
          return;
        }
        try {
          const parsed = JSON.parse(r.value) as Partial<GroupTimerUiConfig>;
          const merged = normalizeGroupTimerUi(parsed);
          setUiConfig(merged);
          saveGroupTimerUiToStorage(merged);
        } catch {
          /* noop */
        }
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open || !eventDone) {
      return;
    }
    const key = `groupTimer.eventDoneGuideDismissed.v1:${compId}`;
    if (sessionStorage.getItem(key)) {
      return;
    }
    setEventDoneGuideOpen(true);
  }, [open, eventDone, compId]);

  useEffect(() => {
    if (settingsOpen) {
      uiForm.setFieldsValue(uiConfig);
    }
  }, [settingsOpen, uiConfig, uiForm]);

  const mode = uiConfig.inputMode;

  const ctx = findContextByEventId(contexts, store.cursor.eventId);
  const scheduleRound = ctx?.scheduleRounds.find((r) => r.scheduleIdx === store.cursor.scheduleIdx);
  const rows = scheduleRound?.rows ?? [];
  const currentRow = rows[store.cursor.lineIndex];
  const eventId = ctx?.event.EventID ?? '';

  const isMbf = eventId === '333mbf';

  const slotKey = ctx ? makeSlotKey(eventId, store.cursor.scheduleIdx, store.cursor.lineIndex) : '';
  const currentSlotHasRecord = Boolean(slotKey && store.solves[slotKey]);
  /** 当前格已有成绩时仅允许重试 / 切换，不允许再次录入（含项目已全部完成时停留在最后一格） */
  const inputLocked = currentSlotHasRecord;

  const shouldUseInspection =
    mode === 'timer' &&
    uiConfig.inspectionEnabled &&
    !inputLocked &&
    !(uiConfig.blindSkipInspection && isBlindEventId(eventId)) &&
    !isMbf;

  const inspectionAwaitingTap = shouldUseInspection && !running && !inspectionCounting;
  const inInspectionCountingPhase = shouldUseInspection && !running && inspectionCounting;

  const selectPopupProps = useMemo(
    () => ({
      styles: { popup: { root: { zIndex: 3100 } } },
      popupClassName: 'group-timer-popup-z',
    }),
    [],
  );

  useEffect(() => {
    setMbfPhase(null);
    setMbfAttemptedStr('');
    setMbfSolvedStr('');
    setPendingSpare(null);
  }, [eventId]);

  /** 切换项目/轮次后，若 lineIndex 不在当前轮主赛程内则纠正 */
  useEffect(() => {
    if (!ctx) {
      return;
    }
    const sr = ctx.scheduleRounds.find((r) => r.scheduleIdx === store.cursor.scheduleIdx);
    if (!sr || sr.skipped) {
      return;
    }
    const mains = getMainIndicesForRound(ctx, store.cursor.scheduleIdx);
    if (mains.length === 0) {
      return;
    }
    if (!mains.includes(store.cursor.lineIndex)) {
      setStore((s) => ({
        ...s,
        cursor: { ...s.cursor, lineIndex: mains[0] },
      }));
    }
  }, [ctx, store.cursor.eventId, store.cursor.scheduleIdx, store.cursor.lineIndex]);

  useEffect(() => {
    if (!ctx) {
      return;
    }
    const done = isEventFullyRecorded(ctx, store.solves, eventId);
    setEventDone(done);
  }, [ctx, eventId, store.solves]);

  useEffect(() => {
    setInspectionCounting(false);
    setInspectionElapsedMs(0);
    spaceAwaitingKeyDownRef.current = false;
    spaceCountingKeyDownRef.current = false;
    lastSpaceAwaitingEmitAtRef.current = null;
    lastSpaceCountingEmitAtRef.current = null;
    inspectionAutoDnfDoneRef.current = false;
  }, [slotKey]);

  const commitRecord = useCallback(
    (rec: SolveRecord) => {
      if (!ctx) {
        return;
      }
      const key = makeSlotKey(eventId, store.cursor.scheduleIdx, store.cursor.lineIndex);
      if (store.solves[key]) {
        return;
      }
      const nextSolves = { ...store.solves, [key]: rec };
      const nextSlot = getNextMainSlot(ctx, {
        scheduleIdx: store.cursor.scheduleIdx,
        lineIndex: store.cursor.lineIndex,
      });

      let newCursor = store.cursor;
      if (nextSlot === 'done') {
        setEventDone(true);
        newCursor = { ...store.cursor };
      } else {
        newCursor = { eventId, scheduleIdx: nextSlot.scheduleIdx, lineIndex: nextSlot.lineIndex };
      }

      setStore((s) => ({
        ...s,
        solves: nextSolves,
        cursor: newCursor,
      }));
      setPendingSpare(null);
      setManualRaw('');
      setMbfPhase(null);
      setMbfAttemptedStr('');
      setMbfSolvedStr('');
    },
    [ctx, eventId, store.cursor, store.solves],
  );

  const commitTimeMs = useCallback(
    async (ms: number) => {
      if (!ctx || !currentRow) {
        return;
      }
      if (isMbf) {
        if (mbfPhase === 'time') {
          const attempted = parseInt(mbfAttemptedStr, 10);
          if (Number.isNaN(attempted) || attempted < 1) {
            message.error('请先填写尝试魔方数');
            return;
          }
          setMbfPhase('solved');
          // 时间先写入 ref 状态由 solved 阶段提交
          setDisplayMs(ms);
          return;
        }
      }
      const scramble = pendingSpare ? pendingSpare.spareScramble : currentRow.scramble;
      const originalScramble = pendingSpare ? pendingSpare.originalScramble : currentRow.scramble;
      const plus2FromInspection = pendingInspectionPlus2Ref.current;
      pendingInspectionPlus2Ref.current = false;
      const rec: SolveRecord = {
        timeMs: ms,
        dnf: false,
        dns: false,
        plus2: plus2FromInspection,
        usedSpare: !!pendingSpare,
        originalScramble: pendingSpare ? originalScramble : undefined,
        extraLineIndex: pendingSpare?.extraLineIndex,
        scramble,
        updatedAt: new Date().toISOString(),
      };
      if (isMbf) {
        const att = parseInt(mbfAttemptedStr, 10);
        const sol = parseInt(mbfSolvedStr, 10);
        if (mbfPhase !== 'solved' || Number.isNaN(att) || Number.isNaN(sol)) {
          message.error('请完成多盲步骤');
          return;
        }
        rec.mbf = { attempted: att, solved: sol };
      }
      commitRecord(rec);
    },
    [
      ctx,
      currentRow,
      isMbf,
      mbfPhase,
      mbfAttemptedStr,
      mbfSolvedStr,
      pendingSpare,
      commitRecord,
    ],
  );

  const commitTimeMsRef = useRef(commitTimeMs);
  useEffect(() => {
    commitTimeMsRef.current = commitTimeMs;
  });

  const tick = useCallback(() => {
    const elapsed = performance.now() - startRef.current;
    setDisplayMs(elapsed);
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (!running) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      return;
    }
    stopHandledRef.current = false;
    startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, tick]);

  const finalizeTimerStop = useCallback((elapsed: number) => {
    if (stopHandledRef.current) {
      return;
    }
    stopHandledRef.current = true;
    setRunning(false);
    setDisplayMs(elapsed);
    void commitTimeMsRef.current(elapsed);
  }, []);

  useEffect(() => {
    if (!open || !running) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const elapsed = performance.now() - startRef.current;
      finalizeTimerStop(elapsed);
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open, running, finalizeTimerStop]);

  const onManualConfirm = () => {
    if (!ctx || !currentRow) {
      return;
    }
    if (inputLocked) {
      return;
    }
    if (isMbf) {
      if (mbfPhase === 'time') {
        const ms = parseManualTimeToMs(manualRaw);
        if (ms === null) {
          message.error('时间格式无效');
          return;
        }
        setDisplayMs(ms);
        setMbfPhase('solved');
        return;
      }
      if (mbfPhase === 'solved') {
        const ms = displayMs || parseManualTimeToMs(manualRaw);
        if (ms === null) {
          message.error('时间无效');
          return;
        }
        const sol = parseInt(mbfSolvedStr, 10);
        const att = parseInt(mbfAttemptedStr, 10);
        if (Number.isNaN(sol) || Number.isNaN(att)) {
          message.error('请输入还原数量');
          return;
        }
        const scramble = pendingSpare ? pendingSpare.spareScramble : currentRow.scramble;
        const originalScramble = pendingSpare ? pendingSpare.originalScramble : currentRow.scramble;
        commitRecord({
          timeMs: ms,
          dnf: false,
          dns: false,
          plus2: false,
          usedSpare: !!pendingSpare,
          originalScramble: pendingSpare ? originalScramble : undefined,
          extraLineIndex: pendingSpare?.extraLineIndex,
          scramble,
          mbf: { attempted: att, solved: sol },
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }
    const ms = parseManualTimeToMs(manualRaw);
    if (ms === null) {
      message.error('时间格式无效');
      return;
    }
    const scramble = pendingSpare ? pendingSpare.spareScramble : currentRow.scramble;
    const originalScramble = pendingSpare ? pendingSpare.originalScramble : currentRow.scramble;
    commitRecord({
      timeMs: ms,
      dnf: false,
      dns: false,
      plus2: false,
      usedSpare: !!pendingSpare,
      originalScramble: pendingSpare ? originalScramble : undefined,
      extraLineIndex: pendingSpare?.extraLineIndex,
      scramble,
      updatedAt: new Date().toISOString(),
    });
  };

  const onDnf = () => {
    if (!ctx || !currentRow) {
      return;
    }
    if (inputLocked) {
      return;
    }
    const scramble = pendingSpare ? pendingSpare.spareScramble : currentRow.scramble;
    const originalScramble = pendingSpare ? pendingSpare.originalScramble : currentRow.scramble;
    commitRecord({
      timeMs: null,
      dnf: true,
      dns: false,
      plus2: false,
      priorTimeMs: undefined,
      usedSpare: !!pendingSpare,
      originalScramble: pendingSpare ? originalScramble : undefined,
      extraLineIndex: pendingSpare?.extraLineIndex,
      scramble,
      mbf: isMbf && mbfAttemptedStr
        ? {
            attempted: parseInt(mbfAttemptedStr, 10) || 0,
            solved: 0,
          }
        : undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  const clearCurrentDns = () => {
    if (!slotKey) {
      return;
    }
    const rec = store.solves[slotKey];
    if (!rec?.dns) {
      return;
    }
    const nextSolves = { ...store.solves };
    delete nextSolves[slotKey];
    setStore((s) => ({ ...s, solves: nextSolves }));
    setPendingSpare(null);
    message.success('已清除本条');
  };

  const onDns = () => {
    if (!ctx || !currentRow) {
      return;
    }
    if (inputLocked) {
      return;
    }
    const scramble = pendingSpare ? pendingSpare.spareScramble : currentRow.scramble;
    const originalScramble = pendingSpare ? pendingSpare.originalScramble : currentRow.scramble;
    commitRecord({
      timeMs: null,
      dnf: false,
      dns: true,
      plus2: false,
      priorTimeMs: undefined,
      usedSpare: !!pendingSpare,
      originalScramble: pendingSpare ? originalScramble : undefined,
      extraLineIndex: pendingSpare?.extraLineIndex,
      scramble,
      mbf: undefined,
      updatedAt: new Date().toISOString(),
    });
  };

  useEffect(() => {
    if (!open || !inInspectionCountingPhase) {
      return;
    }
    inspectionStartRef.current = performance.now();
    setInspectionElapsedMs(0);
    const id = window.setInterval(() => {
      setInspectionElapsedMs(performance.now() - inspectionStartRef.current);
    }, 100);
    return () => window.clearInterval(id);
  }, [open, inInspectionCountingPhase, slotKey]);

  const onDnfRef = useRef(onDnf);
  useEffect(() => {
    onDnfRef.current = onDnf;
  });

  /** 观察超过 17s 自动结束并记 DNF（无需再松手） */
  useEffect(() => {
    if (!open || !inInspectionCountingPhase || running) {
      return;
    }
    if (inspectionElapsedMs <= INSPECTION_DNF_MS) {
      return;
    }
    if (inspectionAutoDnfDoneRef.current) {
      return;
    }
    inspectionAutoDnfDoneRef.current = true;
    setInspectionCounting(false);
    setInspectionElapsedMs(0);
    setTimerHoldOverlay(false);
    message.warning('观察超过 17 秒，已记为 DNF');
    onDnfRef.current();
  }, [open, running, inInspectionCountingPhase, inspectionElapsedMs]);

  /** 长按松手后启动计时 */
  const beginTimerFromHold = useCallback(() => {
    if (inputLocked) {
      return;
    }
    if (isMbf && mbfPhase !== 'time') {
      return;
    }
    setRunning(true);
  }, [inputLocked, isMbf, mbfPhase]);

  const tryFinishInspectionAndStartSolve = useCallback(
    (insElapsedMs: number) => {
      if (inspectionDnfFromElapsed(insElapsedMs)) {
        onDnf();
        return;
      }
      pendingInspectionPlus2Ref.current = inspectionPlus2FromElapsed(insElapsedMs);
      beginTimerFromHold();
    },
    [beginTimerFromHold, onDnf],
  );

  const tryFinishInspectionAndStartSolveRef = useRef(tryFinishInspectionAndStartSolve);
  useEffect(() => {
    tryFinishInspectionAndStartSolveRef.current = tryFinishInspectionAndStartSolve;
  });

  useEffect(() => {
    if (running) {
      setTimerHoldOverlay(false);
      holdStartMsRef.current = null;
    }
  }, [running]);

  useEffect(() => {
    if (!open || mode !== 'timer') {
      setTimerHoldOverlay(false);
      holdStartMsRef.current = null;
      holdPointerIdRef.current = null;
    }
  }, [open, mode]);

  useEffect(() => {
    if (!open || running || mode !== 'timer' || inputLocked || !inInspectionCountingPhase) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') {
        return;
      }
      if (e.repeat) {
        return;
      }
      e.preventDefault();
      spaceCountingKeyDownRef.current = true;
      setTimerHoldOverlay(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') {
        return;
      }
      e.preventDefault();
      if (!spaceCountingKeyDownRef.current) {
        return;
      }
      spaceCountingKeyDownRef.current = false;
      const now = performance.now();
      if (
        lastSpaceCountingEmitAtRef.current !== null &&
        now - lastSpaceCountingEmitAtRef.current < SPACE_INSPECTION_THROTTLE_MS
      ) {
        setTimerHoldOverlay(false);
        return;
      }
      lastSpaceCountingEmitAtRef.current = now;
      setTimerHoldOverlay(false);
      const insElapsedMs = now - inspectionStartRef.current;
      tryFinishInspectionAndStartSolveRef.current(insElapsedMs);
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      spaceCountingKeyDownRef.current = false;
      setTimerHoldOverlay(false);
    };
  }, [open, running, mode, inputLocked, inInspectionCountingPhase]);

  /** 观察待命：空格一次进入倒计时 */
  useEffect(() => {
    if (!open || running || mode !== 'timer' || inputLocked || !inspectionAwaitingTap) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') {
        return;
      }
      if (e.repeat) {
        return;
      }
      e.preventDefault();
      spaceAwaitingKeyDownRef.current = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') {
        return;
      }
      e.preventDefault();
      if (!spaceAwaitingKeyDownRef.current) {
        return;
      }
      spaceAwaitingKeyDownRef.current = false;
      const now = performance.now();
      if (
        lastSpaceAwaitingEmitAtRef.current !== null &&
        now - lastSpaceAwaitingEmitAtRef.current < SPACE_INSPECTION_THROTTLE_MS
      ) {
        return;
      }
      lastSpaceAwaitingEmitAtRef.current = now;
      inspectionStartRef.current = performance.now();
      setInspectionElapsedMs(0);
      setInspectionCounting(true);
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      spaceAwaitingKeyDownRef.current = false;
    };
  }, [open, running, mode, inputLocked, inspectionAwaitingTap]);

  useEffect(() => {
    if (!open || running || mode !== 'timer' || inputLocked) {
      return;
    }
    if (shouldUseInspection) {
      return;
    }
    if (isMbf && mbfPhase !== 'time') {
      return;
    }
    let spaceArmed = false;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') {
        return;
      }
      if (e.repeat) {
        return;
      }
      e.preventDefault();
      if (spaceArmed) {
        return;
      }
      spaceArmed = true;
      holdStartMsRef.current = Date.now();
      setTimerHoldOverlay(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') {
        return;
      }
      e.preventDefault();
      if (!spaceArmed) {
        return;
      }
      spaceArmed = false;
      const t = holdStartMsRef.current;
      holdStartMsRef.current = null;
      setTimerHoldOverlay(false);
      if (t == null) {
        return;
      }
      if (Date.now() - t < TIMER_HOLD_MIN_MS) {
        return;
      }
      if (isMbf && mbfPhase !== 'time') {
        return;
      }
      beginTimerFromHold();
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [open, running, mode, inputLocked, shouldUseInspection, isMbf, mbfPhase, beginTimerFromHold]);

  const onTimerTapPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (inputLocked || running || mode !== 'timer') {
        return;
      }
      if (isMbf && mbfPhase !== 'time') {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      if (shouldUseInspection) {
        holdPointerIdRef.current = e.pointerId;
        holdStartMsRef.current = null;
        if (inspectionCounting) {
          setTimerHoldOverlay(true);
        }
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* noop */
        }
        return;
      }
      holdStartMsRef.current = Date.now();
      holdPointerIdRef.current = e.pointerId;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      setTimerHoldOverlay(true);
    },
    [inputLocked, running, mode, isMbf, mbfPhase, shouldUseInspection, inspectionCounting],
  );

  const onTimerTapPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (holdPointerIdRef.current !== e.pointerId) {
        return;
      }
      e.preventDefault();
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* noop */
      }
      holdPointerIdRef.current = null;
      if (shouldUseInspection && !running) {
        if (!inspectionCounting) {
          inspectionStartRef.current = performance.now();
          setInspectionElapsedMs(0);
          setInspectionCounting(true);
          return;
        }
        setTimerHoldOverlay(false);
        const insElapsedMs = performance.now() - inspectionStartRef.current;
        tryFinishInspectionAndStartSolve(insElapsedMs);
        return;
      }
      const t = holdStartMsRef.current;
      holdStartMsRef.current = null;
      setTimerHoldOverlay(false);
      if (t == null) {
        return;
      }
      if (Date.now() - t < TIMER_HOLD_MIN_MS) {
        return;
      }
      beginTimerFromHold();
    },
    [beginTimerFromHold, shouldUseInspection, running, inspectionCounting, tryFinishInspectionAndStartSolve],
  );

  const onTimerTapPointerCancel = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (holdPointerIdRef.current !== e.pointerId) {
      return;
    }
    holdPointerIdRef.current = null;
    holdStartMsRef.current = null;
    setTimerHoldOverlay(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      /* noop */
    }
  }, []);

  const toggleCurrentDnf = () => {
    if (!ctx || !slotKey) {
      return;
    }
    const rec = store.solves[slotKey];
    if (!rec) {
      return;
    }
    if (rec.dns) {
      setStore((s) => ({
        ...s,
        solves: {
          ...s.solves,
          [slotKey]: {
            ...rec,
            dns: false,
            dnf: true,
            timeMs: null,
            plus2: false,
            priorTimeMs: undefined,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
      return;
    }
    if (rec.dnf) {
      const t = rec.priorTimeMs;
      setStore((s) => ({
        ...s,
        solves: {
          ...s.solves,
          [slotKey]: {
            ...rec,
            dnf: false,
            dns: false,
            timeMs: t !== undefined ? t : null,
            priorTimeMs: undefined,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    } else {
      setStore((s) => ({
        ...s,
        solves: {
          ...s.solves,
          [slotKey]: {
            ...rec,
            dnf: true,
            dns: false,
            priorTimeMs: rec.timeMs !== null ? rec.timeMs : rec.priorTimeMs,
            timeMs: null,
            plus2: false,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    }
  };

  const toggleCurrentPlus2 = () => {
    if (!slotKey) {
      return;
    }
    const rec = store.solves[slotKey];
    if (!rec || rec.dns || rec.dnf || rec.timeMs === null) {
      message.info('请先完成有效成绩后再使用 +2');
      return;
    }
    setStore((s) => ({
      ...s,
      solves: {
        ...s.solves,
        [slotKey]: {
          ...rec,
          plus2: !rec.plus2,
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const onRetry = () => {
    if (!ctx || !currentRow) {
      return;
    }
    const key = makeSlotKey(eventId, store.cursor.scheduleIdx, store.cursor.lineIndex);
    const old = store.solves[key];
    const nextSolves = { ...store.solves };
    delete nextSolves[key];
    setStore((s) => ({ ...s, solves: nextSolves }));
    if (old?.usedSpare && old.extraLineIndex != null) {
      /* 备打回收：删除记录即释放 */
    }
    setPendingSpare(null);
    setManualRaw('');
    setInspectionCounting(false);
    setInspectionElapsedMs(0);
    inspectionAutoDnfDoneRef.current = false;
    message.success('已重试');
  };

  const onSpare = () => {
    if (!ctx || !scheduleRound || isMbf) {
      return;
    }
    if (inputLocked) {
      return;
    }
    if (pendingSpare) {
      setPendingSpare(null);
      message.info('已取消备打');
      return;
    }
    const extras = getExtraRows(rows);
    const used = consumedExtraLineIndices(eventId, store.solves);
    const free = extras.find((ex) => !used.has(ex.lineIndex));
    if (!free) {
      message.error('无可用备打');
      return;
    }
    setPendingSpare({
      extraLineIndex: free.lineIndex,
      spareScramble: free.scramble,
      originalScramble: currentRow!.scramble,
    });
    message.success('已选用备打，本把以备打乱为准');
  };

  const openExport = () => {
    if (contexts.length === 0) {
      return;
    }
    const check: Record<string, boolean> = {};
    for (const c of contexts) {
      const eid = c.event.EventID;
      const expRounds = store.exportByEvent[eid]?.exportedRounds ?? [];
      for (const r of c.scheduleRounds.filter((x) => !x.skipped)) {
        const mains = getMainIndicesForRound(c, r.scheduleIdx);
        if (mains.length === 0) {
          continue;
        }
        if (!roundHasAnyRecorded(c, store.solves, eid, r.scheduleIdx)) {
          continue;
        }
        const k = exportRoundKey(eid, r.scheduleIdx);
        check[k] = !expRounds.includes(String(r.scheduleIdx));
      }
    }
    setExportCheckedRounds(check);
    setExportOpen(true);
  };

  const copyExportText = () => {
    void navigator.clipboard.writeText(exportDraft).then(() => {
      message.success('已复制到剪贴板');
    });
  };

  const confirmExportAndRecord = () => {
    const selected = Object.keys(exportCheckedRounds).filter((k) => exportCheckedRounds[k]);
    if (selected.length === 0) {
      message.warning('请至少勾选一项');
      return;
    }
    void navigator.clipboard.writeText(exportDraft).then(() => {
      message.success('已复制到剪贴板');
    });
    const now = new Date().toISOString();
    const perEvent: Record<string, { keys: string[]; rounds: string[] }> = {};
    const sorted = selected.slice().sort();
    for (const sel of sorted) {
      const parsed = parseExportRoundKey(sel);
      if (!parsed) {
        continue;
      }
      const { eid, scheduleIdx: sch } = parsed;
      const c = findContextByEventId(contexts, eid);
      if (!c) {
        continue;
      }
      if (!perEvent[eid]) {
        perEvent[eid] = {
          keys: [...(store.exportByEvent[eid]?.exportedKeys ?? [])],
          rounds: [...(store.exportByEvent[eid]?.exportedRounds ?? [])],
        };
      }
      const pe = perEvent[eid];
      const mains = getMainIndicesForRound(c, sch);
      for (const li of mains) {
        const key = makeSlotKey(eid, sch, li);
        const rec = store.solves[key];
        if (!rec) {
          continue;
        }
        if (!pe.keys.includes(key)) {
          pe.keys.push(key);
        }
      }
      const rs = String(sch);
      if (!pe.rounds.includes(rs)) {
        pe.rounds.push(rs);
      }
    }

    setStore((s) => {
      const nextExport = { ...s.exportByEvent };
      for (const [eid, pe] of Object.entries(perEvent)) {
        nextExport[eid] = {
          lastExportedAt: now,
          exportedKeys: Array.from(new Set(pe.keys)),
          exportedRounds: Array.from(new Set(pe.rounds)),
        };
      }
      return { ...s, exportByEvent: nextExport };
    });
    setExportOpen(false);
  };

  const uiPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushUiSettings = useCallback(async () => {
    try {
      const v = await uiForm.validateFields();
      const bgRaw = v.fullscreenBg;
      let bgStr = '';
      if (typeof bgRaw === 'string' && bgRaw.trim()) {
        bgStr = bgRaw.trim();
      } else if (bgRaw != null && typeof bgRaw === 'object' && 'toHexString' in bgRaw) {
        bgStr = (bgRaw as { toHexString: () => string }).toHexString();
      }
      const cfg = normalizeGroupTimerUi({
        inputMode: v.inputMode,
        scrambleFontPx: v.scrambleFontPx,
        fullscreenBg: bgStr,
        timerTapMinVh: v.timerTapMinVh,
        metaFontPx: v.metaFontPx,
        inspectionEnabled: v.inspectionEnabled,
        inspectionDisplayMode: v.inspectionDisplayMode,
        inspectionPrecision: v.inspectionPrecision,
        blindSkipInspection: v.blindSkipInspection,
      });
      saveGroupTimerUiToStorage(cfg);
      setUiConfig(cfg);
      const tok = getToken();
      if (tok?.token) {
        try {
          await setUserKv(USER_KV_KEYS.group_timer_ui_config, JSON.stringify(cfg), 3);
        } catch {
          message.warning('已应用本机设置，云端同步失败');
        }
      }
    } catch {
      /* 校验未通过时不写入 */
    }
  }, [uiForm]);

  const scheduleUiSettingsPersist = useCallback(() => {
    if (uiPersistTimerRef.current) {
      clearTimeout(uiPersistTimerRef.current);
    }
    uiPersistTimerRef.current = setTimeout(() => {
      uiPersistTimerRef.current = null;
      void flushUiSettings();
    }, 320);
  }, [flushUiSettings]);

  useEffect(() => {
    return () => {
      if (uiPersistTimerRef.current) {
        clearTimeout(uiPersistTimerRef.current);
      }
    };
  }, []);

  const dismissEventDoneGuide = () => {
    sessionStorage.setItem(`groupTimer.eventDoneGuideDismissed.v1:${compId}`, '1');
    setEventDoneGuideOpen(false);
  };

  const currentSlotRec = slotKey ? store.solves[slotKey] : undefined;

  /** 统计区「本轮最佳 / 本轮成绩」：当前轮尚无成绩时展示上一轮（如复赛第一把前显示初赛） */
  const statsScheduleIdx = useMemo(() => {
    if (!ctx) {
      return store.cursor.scheduleIdx;
    }
    return getRoundStatsScheduleIdx(ctx, store.solves, eventId, store.cursor.scheduleIdx);
  }, [ctx, store.solves, eventId, store.cursor.scheduleIdx]);

  const statsRoundTitle = useMemo(() => {
    if (!ctx) {
      return '';
    }
    return ctx.scheduleRounds.find((r) => r.scheduleIdx === statsScheduleIdx)?.roundTitle ?? '';
  }, [ctx, statsScheduleIdx]);

  const roundRecords = useMemo(() => {
    if (!ctx) {
      return [];
    }
    const mains = getMainIndicesForRound(ctx, statsScheduleIdx);
    const out: { lineIndex: number; rec: SolveRecord }[] = [];
    for (const li of mains) {
      const k = makeSlotKey(eventId, statsScheduleIdx, li);
      const r = store.solves[k];
      if (r) {
        out.push({ lineIndex: li, rec: r });
      }
    }
    return out;
  }, [ctx, statsScheduleIdx, eventId, store.solves]);

  /** 仅当前轮是否已有成绩（备打等交互仍按当前轮） */
  const hasAnyRecordInCursorRound = useMemo(() => {
    if (!ctx) {
      return false;
    }
    return roundHasAnyRecorded(ctx, store.solves, eventId, store.cursor.scheduleIdx);
  }, [ctx, store.solves, eventId, store.cursor.scheduleIdx]);

  const eventAvg = useMemo(() => {
    if (!ctx) {
      return null;
    }
    const times: number[] = [];
    for (const s of getAllMainSlots(ctx)) {
      const k = makeSlotKey(eventId, s.scheduleIdx, s.lineIndex);
      const r = store.solves[k];
      if (!r || r.dns || r.dnf || r.timeMs === null || eventId === '333mbf') {
        continue;
      }
      times.push(effectiveTimeMs(r)!);
    }
    return eventCompetitionAverage(times, ctx.route, !!ctx.route.integer);
  }, [ctx, eventId, store.solves]);

  const nextPlaySlot = useMemo(() => {
    if (!ctx) {
      return null;
    }
    return getFirstUnfilledMainSlot(ctx, store.solves, eventId);
  }, [ctx, eventId, store.solves]);

  const showBackToLatest = useMemo(() => {
    if (!ctx || !nextPlaySlot) {
      return false;
    }
    return (
      store.cursor.eventId !== eventId ||
      store.cursor.scheduleIdx !== nextPlaySlot.scheduleIdx ||
      store.cursor.lineIndex !== nextPlaySlot.lineIndex
    );
  }, [ctx, eventId, nextPlaySlot, store.cursor]);

  const incompleteOtherIds = useMemo(
    () => (ctx ? findIncompleteOtherEvents(contexts, store.solves, eventId) : []),
    [ctx, contexts, store.solves, eventId],
  );

  const hasExportableRoundAnyEvent = useMemo(() => {
    for (const c of contexts) {
      const eid = c.event.EventID;
      for (const r of c.scheduleRounds.filter((x) => !x.skipped)) {
        if (roundHasAnyRecorded(c, store.solves, eid, r.scheduleIdx)) {
          return true;
        }
      }
    }
    return false;
  }, [contexts, store.solves]);

  const selectedExportKeys = useMemo(
    () => Object.keys(exportCheckedRounds).filter((k) => exportCheckedRounds[k]),
    [exportCheckedRounds],
  );

  const exportPreviewText = useMemo(
    () => buildCompactExportLines(contexts, store.solves, selectedExportKeys),
    [contexts, store.solves, selectedExportKeys],
  );

  useEffect(() => {
    if (!exportOpen) {
      return;
    }
    setExportDraft(exportPreviewText);
  }, [exportOpen, exportPreviewText]);

  const rb = roundBestMs(roundRecords.map((x) => ({ lineIndex: x.lineIndex, rec: x.rec })), eventId);

  const historyEntries = useMemo(() => {
    const out: {
      key: string;
      eventId: string;
      scheduleIdx: number;
      lineIndex: number;
      heading: string;
      result: string;
      recordedAtLabel: string;
      isCurrent: boolean;
    }[] = [];
    for (const c of contexts) {
      const eid = c.event.EventID;
      for (const sr of c.scheduleRounds.filter((r) => !r.skipped)) {
        const mains = getMainIndicesForRound(c, sr.scheduleIdx);
        for (const li of mains) {
          const k = makeSlotKey(eid, sr.scheduleIdx, li);
          const rec = store.solves[k];
          if (!rec) {
            continue;
          }
          const att = getAttemptInRound(c, sr.scheduleIdx, li);
          out.push({
            key: k,
            eventId: eid,
            scheduleIdx: sr.scheduleIdx,
            lineIndex: li,
            heading: `${CubesCn(eid)} · ${sr.roundTitle} · 第 ${att} 把`,
            result: formatResultLine(rec, eid),
            recordedAtLabel: formatHistoryRecordedAt(rec.updatedAt),
            isCurrent:
              eid === store.cursor.eventId &&
              sr.scheduleIdx === store.cursor.scheduleIdx &&
              li === store.cursor.lineIndex,
          });
        }
      }
    }
    out.sort((a, b) => {
      const ua = store.solves[a.key]?.updatedAt ?? '';
      const ub = store.solves[b.key]?.updatedAt ?? '';
      const cmp = ub.localeCompare(ua);
      if (cmp !== 0) {
        return cmp;
      }
      return b.key.localeCompare(a.key);
    });
    return out;
  }, [contexts, store.solves, store.cursor.eventId, store.cursor.scheduleIdx, store.cursor.lineIndex]);

  const currentRoundMains = useMemo(() => {
    if (!ctx) {
      return [];
    }
    return getMainIndicesForRound(ctx, store.cursor.scheduleIdx);
  }, [ctx, store.cursor.scheduleIdx]);

  if (!open) {
    return null;
  }

  if (comp.data.IsDone) {
    return createPortal(
      <div className="group-timer-fs">
        <Button className="group-timer-exit" type="primary" danger size="middle" onClick={onClose}>
          退出
        </Button>
        <p className="group-timer-muted">比赛已结束，无法使用群赛计时器。</p>
      </div>,
      document.body,
    );
  }

  if (contexts.length === 0) {
    return createPortal(
      <div className="group-timer-fs">
        <Button className="group-timer-exit" type="primary" danger size="middle" onClick={onClose}>
          退出
        </Button>
        <p className="group-timer-muted">暂无可比赛项目或缺少项目元数据</p>
      </div>,
      document.body,
    );
  }

  const scrambleDisplay = (() => {
    if (!currentRow) {
      return '—';
    }
    if (pendingSpare) {
      return (
        <>
          <div>打乱：{pendingSpare.originalScramble}</div>
          <div className="group-timer-spare-label">备打：{pendingSpare.spareScramble}</div>
        </>
      );
    }
    return currentRow.scramble;
  })();

  const runningFullscreen = running && mode === 'timer';

  return createPortal(
    <>
      <div
        className={`group-timer-fs ${runningFullscreen ? 'group-timer-fs--minimal' : ''}`}
        style={{
          ...(uiConfig.fullscreenBg ? { backgroundColor: uiConfig.fullscreenBg } : {}),
          ['--gt-tap-min-vh' as string]: `${uiConfig.timerTapMinVh}vh`,
        }}
      >
        {!runningFullscreen && (
          <>
            <div className="group-timer-corner-right">
              <Dropdown
                getPopupContainer={() => document.body}
                overlayClassName="group-timer-popup-z"
                overlayStyle={{ zIndex: 3100 }}
                menu={{
                  items: [
                    ...(getToken()?.token
                      ? []
                      : [
                          {
                            key: 'login',
                            label: '登录',
                            onClick: goToLoginWithRedirect,
                          },
                        ]),
                    {
                      key: 'progress',
                      label: '项目进度',
                      onClick: () => setEventOverviewOpen(true),
                    },
                    {
                      key: 'export',
                      label: '导出成绩',
                      onClick: openExport,
                    },
                    {
                      key: 'list',
                      label: '成绩列表',
                      onClick: () => setListOpen(true),
                    },
                    {
                      key: 'settings',
                      label: '设置',
                      onClick: () => setSettingsOpen(true),
                    },
                  ],
                }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Button type="default" size="middle" icon={<MoreOutlined />}>
                  更多
                </Button>
              </Dropdown>
              <Button type="primary" danger size="middle" onClick={onClose}>
                退出全屏
              </Button>
            </div>
          </>
        )}

        {runningFullscreen ? (
          <div
            className="group-timer-running"
            tabIndex={0}
            role="presentation"
            onClick={() => {
              const elapsed = performance.now() - startRef.current;
              finalizeTimerStop(elapsed);
            }}
            onKeyDown={(e) => {
              if (e.code === 'Space' && e.repeat) {
                e.preventDefault();
              }
            }}
          >
            <div className="group-timer-running__value">
              {secondTimeFormat(displayMs / 1000, false)}
            </div>
            <Text type="secondary" className="group-timer-running__hint">
              任意键或点击结束
            </Text>
          </div>
        ) : (
          <>
            <div className="group-timer-scroll">
            <div className="group-timer-top">
              <div
                className="group-timer-scramble-box"
                key={`${eventId}-${store.cursor.scheduleIdx}-${store.cursor.lineIndex}-${pendingSpare?.extraLineIndex ?? 'n'}`}
                style={{ fontSize: uiConfig.scrambleFontPx }}
              >
                {typeof scrambleDisplay === 'string' ? scrambleDisplay : scrambleDisplay}
              </div>
            </div>

            {ctx ? (
              <div className="group-timer-meta-bar" style={{ fontSize: uiConfig.metaFontPx }}>
                <div className="group-timer-meta-bar__row">
                  <Select
                    className="group-timer-meta-select"
                    value={store.cursor.eventId}
                    onChange={(ev) => {
                      const c = findContextByEventId(contexts, ev);
                      if (!c) {
                        return;
                      }
                      const first = getAllMainSlots(c)[0];
                      if (first) {
                        setStore((s) => ({
                          ...s,
                          cursor: { eventId: ev, scheduleIdx: first.scheduleIdx, lineIndex: first.lineIndex },
                        }));
                      }
                      setEventDone(false);
                    }}
                    options={contexts.map((c) => ({
                      label: CubesCn(c.event.EventID),
                      value: c.event.EventID,
                    }))}
                    {...selectPopupProps}
                    getPopupContainer={() => document.body}
                    popupMatchSelectWidth={false}
                  />
                  <Select
                    className="group-timer-meta-select"
                    value={store.cursor.scheduleIdx}
                    onChange={(sch) => {
                      setStore((s) => {
                        const c = findContextByEventId(contexts, s.cursor.eventId);
                        const mains = c ? getMainIndicesForRound(c, sch) : [];
                        return {
                          ...s,
                          cursor: {
                            ...s.cursor,
                            scheduleIdx: sch,
                            lineIndex: mains[0] ?? 0,
                          },
                        };
                      });
                    }}
                    options={
                      findContextByEventId(contexts, store.cursor.eventId)?.scheduleRounds
                        .filter((r) => !r.skipped)
                        .map((r) => ({ label: r.roundTitle, value: r.scheduleIdx })) ?? []
                    }
                    {...selectPopupProps}
                    getPopupContainer={() => document.body}
                    popupMatchSelectWidth={false}
                  />
                  <Select
                    className="group-timer-meta-select group-timer-meta-select--attempt"
                    value={
                      currentRoundMains.includes(store.cursor.lineIndex)
                        ? store.cursor.lineIndex
                        : (currentRoundMains[0] ?? store.cursor.lineIndex)
                    }
                    disabled={currentRoundMains.length === 0}
                    onChange={(lineIndex) => {
                      setStore((s) => ({
                        ...s,
                        cursor: { ...s.cursor, lineIndex },
                      }));
                    }}
                    options={currentRoundMains.map((li, idx) => ({
                      label: `第 ${idx + 1} 把`,
                      value: li,
                    }))}
                    {...selectPopupProps}
                    getPopupContainer={() => document.body}
                    popupMatchSelectWidth={false}
                  />
                </div>
              </div>
            ) : null}

            <div className="group-timer-stack group-timer-stack--wide">
              <div className="group-timer-work">
              <div className="group-timer-center-body">
              {inputLocked && currentSlotRec ? (
                <div className="group-timer-current-result">
                  {formatResultLine(currentSlotRec, eventId)}
                </div>
              ) : null}

              {isMbf && (
                <div className="group-timer-mbf">
                  {!mbfPhase && (
                    <>
                      <Text type="secondary">多盲：先输入本次尝试魔方数</Text>
                      <Input
                        inputMode="numeric"
                        placeholder="尝试个数"
                        value={mbfAttemptedStr}
                        disabled={inputLocked}
                        onChange={(e) => setMbfAttemptedStr(e.target.value.replace(/\D/g, ''))}
                      />
                      <Button
                        type="primary"
                        disabled={inputLocked}
                        onClick={() => {
                          const n = parseInt(mbfAttemptedStr, 10);
                          if (Number.isNaN(n) || n < 1) {
                            message.error('请输入有效的魔方数量');
                            return;
                          }
                          setMbfPhase('time');
                        }}
                      >
                        下一步（计时）
                      </Button>
                    </>
                  )}
                  {mbfPhase === 'time' && (
                    <>
                      <Text>尝试 {mbfAttemptedStr} 个魔方，请输入或计时成绩</Text>
                      {mode === 'manual' ? (
                        <div className="group-timer-input-row group-timer-input-row--inline">
                          <Input
                            value={manualRaw}
                            disabled={inputLocked}
                            onChange={(e) => setManualRaw(e.target.value)}
                            placeholder="时间"
                            onPressEnter={onManualConfirm}
                          />
                          <Button type="primary" disabled={inputLocked} onClick={onManualConfirm}>
                            确认时间
                          </Button>
                        </div>
                      ) : (
                        <div
                          className={`group-timer-tap-area group-timer-tap-area--compact${
                            inputLocked ? ' group-timer-tap-area--locked' : ''
                          }`}
                          tabIndex={0}
                          role="presentation"
                          onPointerDown={onTimerTapPointerDown}
                          onPointerUp={onTimerTapPointerUp}
                          onPointerCancel={onTimerTapPointerCancel}
                        >
                          {!running ? (
                            <Text className="group-timer-tap-area__label">按住 · 松手开始计时</Text>
                          ) : (
                            <Text type="secondary">计时中…</Text>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {mbfPhase === 'solved' && (
                    <>
                      <Text>还原个数（已成功）</Text>
                      <Input
                        inputMode="numeric"
                        value={mbfSolvedStr}
                        disabled={inputLocked}
                        onChange={(e) => setMbfSolvedStr(e.target.value.replace(/\D/g, ''))}
                      />
                      <Button
                        type="primary"
                        disabled={inputLocked}
                        onClick={() => {
                          const ms = displayMs;
                          if (!ms && mode === 'manual') {
                            const p = parseManualTimeToMs(manualRaw);
                            if (p !== null) {
                              setDisplayMs(p);
                            }
                          }
                          onManualConfirm();
                        }}
                      >
                        提交本把
                      </Button>
                    </>
                  )}
                </div>
              )}

              {!isMbf && (
                <div
                  className={`group-timer-input-row${
                    mode === 'manual'
                      ? ' group-timer-input-row--inline'
                      : !inputLocked
                        ? ' group-timer-input-row--timer-fill'
                        : ''
                  }`}
                >
                  {mode === 'manual' ? (
                    <>
                      <Input
                        size="large"
                        value={manualRaw}
                        disabled={inputLocked}
                        onChange={(e) => setManualRaw(e.target.value)}
                        placeholder="输入时间"
                        onPressEnter={onManualConfirm}
                      />
                      <Button type="primary" size="large" disabled={inputLocked} onClick={onManualConfirm}>
                        确认
                      </Button>
                    </>
                  ) : (
                    <div
                      className={`group-timer-tap-area${inputLocked ? ' group-timer-tap-area--locked' : ''}`}
                      tabIndex={0}
                      role="presentation"
                      onPointerDown={onTimerTapPointerDown}
                      onPointerUp={onTimerTapPointerUp}
                      onPointerCancel={onTimerTapPointerCancel}
                    >
                      {!running ? (
                        shouldUseInspection ? (
                          inspectionCounting ? (
                            <div className="group-timer-inspection">
                              <div
                                className={`group-timer-inspection__value${
                                  uiConfig.inspectionDisplayMode === 'countdown'
                                    ? ' group-timer-inspection__value--countdown'
                                    : ''
                                }${
                                  inspectionElapsedMs > INSPECTION_WARN_ELAPSED_MS
                                    ? ' group-timer-inspection__value--warn-blink'
                                    : ''
                                }`}
                              >
                                {formatInspectionSeconds(
                                  uiConfig.inspectionDisplayMode,
                                  inspectionElapsedMs,
                                  uiConfig.inspectionPrecision,
                                )}
                              </div>
                              <Text type="secondary" className="group-timer-inspection__hint">
                                长按开始计时
                              </Text>
                            </div>
                          ) : (
                            <Text className="group-timer-tap-area__label">点击计时区开始观察</Text>
                          )
                        ) : (
                          <Text className="group-timer-tap-area__label">按住 · 松手开始计时</Text>
                        )
                      ) : (
                        <Text type="secondary">计时中…</Text>
                      )}
                    </div>
                  )}
                </div>
              )}

              </div>

              <Space wrap size="small" className="group-timer-actions">
                <Button
                  size="small"
                  className="group-timer-btn-dnf"
                  onClick={() => (inputLocked ? toggleCurrentDnf() : onDnf())}
                >
                  DNF
                </Button>
                <Button
                  size="small"
                  className="group-timer-btn-plus2"
                  disabled={!inputLocked || isMbf || Boolean(currentSlotRec?.dns)}
                  onClick={toggleCurrentPlus2}
                >
                  +2
                </Button>
                {!isMbf && (
                  <Button
                    size="small"
                    className="group-timer-btn-dns"
                    disabled={inputLocked && !currentSlotRec?.dns}
                    onClick={() => {
                      if (inputLocked && currentSlotRec?.dns) {
                        clearCurrentDns();
                      } else if (!inputLocked) {
                        onDns();
                      }
                    }}
                  >
                    DNS
                  </Button>
                )}
                <Button size="small" disabled={!inputLocked || isMbf} onClick={onRetry}>
                  重试
                </Button>
                {!isMbf && (
                  <Button
                    size="small"
                    disabled={inputLocked || !hasAnyRecordInCursorRound}
                    onClick={onSpare}
                  >
                    {pendingSpare ? '取消备打' : '使用备打'}
                  </Button>
                )}
              </Space>
              </div>

            </div>

            </div>

            <div className="group-timer-bottom-dock">
            <div className="group-timer-side-row">
              <div className="group-timer-side-row__left">
                <div className="group-timer-history-trigger">
                  <Button
                    type="default"
                    size="small"
                    className="group-timer-history-open-btn"
                    icon={<UnorderedListOutlined />}
                    onClick={() => setHistoryModalOpen(true)}
                  >
                    成绩收纳
                    {historyEntries.length > 0 ? `（${historyEntries.length}）` : ''}
                  </Button>
                </div>

                <div className="group-timer-bl group-timer-bl--stats">
                  <div>
                    本轮最佳：{rb != null ? formatMsForDisplay(rb, eventId) : '—'}
                    {statsScheduleIdx !== store.cursor.scheduleIdx && statsRoundTitle ? (
                      <Text type="secondary" style={{ marginLeft: 6 }}>
                        （{statsRoundTitle}）
                      </Text>
                    ) : null}
                  </div>
                  <div className="group-timer-small">
                    本轮成绩：
                    {roundRecords.length === 0
                      ? '—'
                      : roundRecords.map((x) => formatResultLine(x.rec, eventId)).join('，')}
                    {statsScheduleIdx !== store.cursor.scheduleIdx && statsRoundTitle ? (
                      <Text type="secondary"> （{statsRoundTitle}）</Text>
                    ) : null}
                  </div>
                  <div className="group-timer-small">
                    本场该项目平均：{eventAvg ?? '—'}
                  </div>
                </div>

                {showBackToLatest && nextPlaySlot ? (
                  <div className="group-timer-back-latest">
                    <Button
                      type="primary"
                      size="small"
                      onClick={() =>
                        setStore((s) => ({
                          ...s,
                          cursor: { eventId, ...nextPlaySlot },
                        }))
                      }
                    >
                      回到最新一把
                    </Button>
                  </div>
                ) : null}
              </div>

              {currentRow &&
                ctx &&
                !shouldHideScrambleImage(eventId, ctx.baseEvent) && (
                  <aside className="group-timer-side-row__right" aria-label="打乱图示">
                    <div className="group-timer-scramble-preview">
                      <ScrambleImageMini
                        key={`${eventId}-${store.cursor.scheduleIdx}-${store.cursor.lineIndex}-${(pendingSpare ? pendingSpare.spareScramble : currentRow.scramble).slice(0, 32)}`}
                        className="group-timer-scramble-preview__img"
                        scramble={pendingSpare ? pendingSpare.spareScramble : currentRow.scramble}
                        puzzleId={currentRow.puzzleIdForImage}
                      />
                    </div>
                  </aside>
                )}
            </div>
            </div>

          </>
        )}
        {timerHoldOverlay && !running && (
          <div className="group-timer-hold-overlay" aria-hidden>
            <span className="group-timer-hold-overlay__text">松手开始计时</span>
          </div>
        )}
      </div>

      <Drawer
        title="群赛计时 · 设置"
        placement="right"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        width={380}
        zIndex={3100}
        rootClassName="group-timer-popup-z"
        footer={
          <Button type="primary" block onClick={() => setSettingsOpen(false)}>
            关闭
          </Button>
        }
      >
        <TypographyParagraph type="secondary" style={{ marginBottom: 12 }}>
          修改即时生效并写入本机；已登录时将自动同步到云端。
        </TypographyParagraph>
        <Form form={uiForm} layout="vertical" onValuesChange={() => scheduleUiSettingsPersist()}>
          <Form.Item label="成绩录入方式" name="inputMode" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value="timer">计时器（按住松手计时）</Radio>
              <Radio value="manual">手动输入时间</Radio>
            </Radio.Group>
          </Form.Item>
          <Card title="观察时间" size="small" style={{ marginBottom: 16 }}>
            <Form.Item label="观察阶段（15s 规则）" name="inspectionEnabled" valuePropName="checked">
              <Checkbox />
            </Form.Item>
            <Form.Item label="观察时间显示" name="inspectionDisplayMode" rules={[{ required: true }]}>
              <Select
                style={{ width: '100%' }}
                options={[
                  { value: 'countdown', label: '倒数 15.0→0' },
                  { value: 'countup', label: '正计 0.0→…' },
                ]}
                getPopupContainer={() => document.body}
                {...selectPopupProps}
              />
            </Form.Item>
            <Form.Item label="显示精度" name="inspectionPrecision" rules={[{ required: true }]}>
              <Select
                style={{ width: '100%' }}
                options={[
                  { value: 'tenth', label: '0.1 秒' },
                  { value: 'second', label: '精确到秒' },
                ]}
                getPopupContainer={() => document.body}
                {...selectPopupProps}
              />
            </Form.Item>
            <Form.Item label="盲拧项目不观察" name="blindSkipInspection" valuePropName="checked">
              <Checkbox />
            </Form.Item>
          </Card>
          <Form.Item label="打乱区字号（px）" name="scrambleFontPx" rules={[{ required: true }]}>
            <InputNumber min={12} max={32} step={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="全屏背景色"
            name="fullscreenBg"
            extra="留空则使用主题默认；可点清除恢复默认"
            getValueFromEvent={(color) => {
              if (color == null) {
                return '';
              }
              if (typeof color === 'string') {
                return color.trim();
              }
              const hex = (color as { toHexString?: () => string }).toHexString?.();
              return hex ?? '';
            }}
            rules={[
              {
                validator: (_, val) => {
                  if (val == null || String(val).trim() === '') {
                    return Promise.resolve();
                  }
                  if (/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(String(val).trim())) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('格式应为 #RRGGBB 或留空'));
                },
              },
            ]}
          >
            <ColorPicker
              showText
              format="hex"
              allowClear
              disabledAlpha
              style={{ width: '100%' }}
              presets={[
                {
                  label: '浅色',
                  colors: ['#ffffff', '#f5f5f5', '#fafafa', '#fffbe6', '#e6f7ff'],
                },
                {
                  label: '深色',
                  colors: ['#141414', '#1f1f1f', '#000000', '#262626', '#001529'],
                },
              ]}
            />
          </Form.Item>
          <Form.Item label="计时区最小高度（vh）" name="timerTapMinVh" rules={[{ required: true }]}>
            <InputNumber min={18} max={70} step={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="项目/轮次信息字号（px）" name="metaFontPx" rules={[{ required: true }]}>
            <InputNumber min={12} max={24} step={1} style={{ width: '100%' }} />
          </Form.Item>
          <Button
            block
            onClick={() => {
              const d = defaultGroupTimerUi();
              uiForm.setFieldsValue(d);
              const cfg = normalizeGroupTimerUi(d);
              saveGroupTimerUiToStorage(cfg);
              setUiConfig(cfg);
              const tok = getToken();
              if (tok?.token) {
                void setUserKv(USER_KV_KEYS.group_timer_ui_config, JSON.stringify(cfg), 3).catch(() => {
                  message.warning('已恢复默认（本机），云端同步失败');
                });
              }
            }}
          >
            恢复默认
          </Button>
        </Form>
      </Drawer>

      <Drawer
        title="成绩列表（点击成绩跳转）"
        open={listOpen}
        onClose={() => setListOpen(false)}
        width={480}
        zIndex={3100}
        rootClassName="group-timer-popup-z"
      >
        {contexts.map((c) => {
          const eid = c.event.EventID;
          return (
            <div key={eid} className="group-timer-list-event">
              <div className="group-timer-list-event-title">{CubesCn(eid)}</div>
              {c.scheduleRounds
                .filter((r) => !r.skipped)
                .map((sr) => {
                  const mains = getMainIndicesForRound(c, sr.scheduleIdx);
                  return (
                    <div key={sr.scheduleIdx} className="group-timer-list-round">
                      <span className="group-timer-list-round-label">{sr.roundTitle}</span>
                      <div className="group-timer-list-scores">
                        {mains.map((li) => {
                          const k = makeSlotKey(eid, sr.scheduleIdx, li);
                          const rec = store.solves[k];
                          const att = getAttemptInRound(c, sr.scheduleIdx, li);
                          const label = rec ? formatResultLine(rec, eid) : '—';
                          return (
                            <button
                              key={k}
                              type="button"
                              className="group-timer-list-score-chip"
                              onClick={() => {
                                setStore((st) => ({
                                  ...st,
                                  cursor: { eventId: eid, scheduleIdx: sr.scheduleIdx, lineIndex: li },
                                }));
                                setListOpen(false);
                              }}
                            >
                              成绩{att}：{label}
                              {rec?.usedSpare ? <TagSpare /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </Drawer>

      <Modal
        title={
          <span className="group-timer-history-modal__title">
            历史成绩
            <Text type="secondary" className="group-timer-history-modal__title-hint">
              按还原时间倒序 · 点击切换
            </Text>
          </span>
        }
        open={historyModalOpen}
        onCancel={() => setHistoryModalOpen(false)}
        footer={
          <div className="group-timer-history-modal__footer">
            <Button
              size="small"
              onClick={() => {
                setHistoryModalOpen(false);
                setListOpen(true);
              }}
            >
              完整成绩列表…
            </Button>
            <Button type="primary" size="small" onClick={() => setHistoryModalOpen(false)}>
              关闭
            </Button>
          </div>
        }
        width={420}
        centered
        destroyOnClose
        zIndex={3100}
        rootClassName="group-timer-popup-z"
        className="group-timer-history-modal"
        styles={{
          content: { maxHeight: 'min(85dvh, 480px)' },
          body: {
            maxHeight: 'min(42vh, 280px)',
            overflowY: 'auto',
            paddingTop: 4,
            paddingBottom: 8,
          },
        }}
      >
        {historyEntries.length === 0 ? (
          <div className="group-timer-muted group-timer-history-empty">暂无已录成绩</div>
        ) : (
          <div className="group-timer-history-modal__list">
            {historyEntries.map((h) => (
              <div
                key={h.key}
                className={`group-timer-history-item${h.isCurrent ? ' group-timer-history-item--current' : ''}`}
              >
                <button
                  type="button"
                  className="group-timer-history-item__main group-timer-history-item__main--modal"
                  onClick={() => {
                    setStore((s) => ({
                      ...s,
                      cursor: {
                        eventId: h.eventId,
                        scheduleIdx: h.scheduleIdx,
                        lineIndex: h.lineIndex,
                      },
                    }));
                    setHistoryModalOpen(false);
                  }}
                >
                  <span className="group-timer-history-item__time">{h.recordedAtLabel}</span>
                  <span className="group-timer-history-item__label">{h.heading}</span>
                  <span className="group-timer-history-item__result">{h.result}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        title="本项目全部轮次已完成"
        open={eventDoneGuideOpen}
        onOk={dismissEventDoneGuide}
        onCancel={dismissEventDoneGuide}
        okText="知道了"
        cancelButtonProps={{ style: { display: 'none' } }}
        zIndex={3100}
        rootClassName="group-timer-popup-z"
        width={480}
      >
        <p>您当前项目的所有轮次、所有把次均已录入成绩。</p>
        {incompleteOtherIds.length > 0 ? (
          <div style={{ marginTop: 12 }}>
            <p style={{ marginBottom: 8 }}>
              您可通过顶部项目下拉框或「更多」里的「成绩列表」切换至尚未完成的其它项目：
            </p>
            <Space wrap>
              {incompleteOtherIds.map((id) => (
                <Button
                  key={id}
                  type="link"
                  size="small"
                  onClick={() => {
                    const c = findContextByEventId(contexts, id);
                    const slot = c ? getAllMainSlots(c)[0] : null;
                    if (slot && c) {
                      setStore((s) => ({
                        ...s,
                        cursor: { eventId: id, ...slot },
                      }));
                      setEventDone(false);
                      dismissEventDoneGuide();
                    }
                  }}
                >
                  {CubesCn(id)}
                </Button>
              ))}
            </Space>
          </div>
        ) : (
          <p className="group-timer-muted" style={{ marginTop: 12 }}>
            本场暂无其它未完成项目。
          </p>
        )}
      </Modal>

      <Modal
        title="导出成绩（全部项目）"
        open={exportOpen}
        onCancel={() => setExportOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setExportOpen(false)}>关闭</Button>
            <Button onClick={copyExportText}>一键复制</Button>
            <Button type="primary" onClick={confirmExportAndRecord}>
              复制并标记已导出
            </Button>
          </Space>
        }
        width={600}
        zIndex={3100}
        rootClassName="group-timer-popup-z"
      >
        <div className="group-timer-export-check-scroll">
          <Checkbox.Group
            className="group-timer-export-check-group"
            value={Object.keys(exportCheckedRounds).filter((k) => exportCheckedRounds[k])}
            onChange={(vals) => {
              const set = new Set(vals as string[]);
              const n: Record<string, boolean> = { ...exportCheckedRounds };
              Object.keys(n).forEach((k) => {
                n[k] = set.has(k);
              });
              setExportCheckedRounds(n);
            }}
          >
            {contexts.flatMap((c) => {
              const eid = c.event.EventID;
              return c.scheduleRounds
                .filter((r) => !r.skipped)
                .map((r) => {
                  const mains = getMainIndicesForRound(c, r.scheduleIdx);
                  if (mains.length === 0) {
                    return null;
                  }
                  if (!roundHasAnyRecorded(c, store.solves, eid, r.scheduleIdx)) {
                    return null;
                  }
                  const k = exportRoundKey(eid, r.scheduleIdx);
                  const exp = store.exportByEvent[eid]?.exportedRounds?.includes(String(r.scheduleIdx));
                  const miss = roundHasMissingSlots(c, store.solves, eid, r.scheduleIdx);
                  const filledCount = mains.filter(
                    (li) => store.solves[makeSlotKey(eid, r.scheduleIdx, li)],
                  ).length;
                  return (
                    <Checkbox key={k} value={k}>
                      {CubesCn(eid)} · {r.roundTitle}（第 {getRoundExportNumber(r.scheduleIdx)} 轮）
                      {miss ? (
                        <span className="group-timer-muted">
                          （{filledCount}/{mains.length}）
                        </span>
                      ) : null}
                      {exp ? <span className="group-timer-muted">（曾导出）</span> : null}
                    </Checkbox>
                  );
                });
            })}
          </Checkbox.Group>
        </div>
        <Input.TextArea
          style={{ marginTop: 12, fontFamily: 'ui-monospace, monospace' }}
          rows={10}
          value={exportDraft}
          onChange={(e) => setExportDraft(e.target.value)}
          placeholder={
            hasExportableRoundAnyEvent
              ? '勾选轮次后在此预览，可编辑后再复制'
              : '请先在任意轮次录入至少一把成绩（含 DNF）'
          }
        />
        {!hasExportableRoundAnyEvent ? (
          <p className="group-timer-muted" style={{ marginTop: 8 }}>
            请先在任意轮次录入至少一把成绩（含 DNF）后，该轮才会出现在导出列表中。
          </p>
        ) : null}
      </Modal>

      <Modal
        title="项目进度（点击切换项目）"
        open={eventOverviewOpen}
        onCancel={() => setEventOverviewOpen(false)}
        footer={null}
        width={520}
        zIndex={3100}
        rootClassName="group-timer-popup-z group-timer-overview-modal-root"
        className="group-timer-overview-modal"
        destroyOnClose
        styles={{ body: { maxHeight: 'min(72vh, 560px)', overflowY: 'auto', paddingTop: 8 } }}
      >
        <div className="group-timer-overview-list">
        {contexts.map((c) => {
          const id = c.event.EventID;
          const started = hasStartedEvent(c, store.solves, id);
          const done = isEventFullyRecorded(c, store.solves, id);
          let statusText = '未开始';
          if (done) {
            statusText = '已完成';
          } else if (started) {
            statusText = '进行中';
          }
          const rowTone = done
            ? 'group-timer-overview-row--done'
            : started
              ? 'group-timer-overview-row--progress'
              : 'group-timer-overview-row--idle';
          return (
            <div
              key={id}
              className={`group-timer-overview-row ${rowTone}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                const slot = getAllMainSlots(c)[0];
                if (slot) {
                  setStore((st) => ({
                    ...st,
                    cursor: { eventId: id, scheduleIdx: slot.scheduleIdx, lineIndex: slot.lineIndex },
                  }));
                  setEventOverviewOpen(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  const slot = getAllMainSlots(c)[0];
                  if (slot) {
                    setStore((st) => ({
                      ...st,
                      cursor: { eventId: id, scheduleIdx: slot.scheduleIdx, lineIndex: slot.lineIndex },
                    }));
                    setEventOverviewOpen(false);
                  }
                }
              }}
            >
              <div className="group-timer-overview-row__inner">
                <Text strong>{CubesCn(id)}</Text>
                <Text type="secondary">{statusText}</Text>
                <div className="group-timer-overview-rounds">
                  {c.scheduleRounds
                    .filter((r) => !r.skipped)
                    .map((sr) => {
                      const mains = getMainIndicesForRound(c, sr.scheduleIdx);
                      const filled = mains.filter((li) => store.solves[makeSlotKey(id, sr.scheduleIdx, li)]).length;
                      const total = mains.length;
                      return (
                        <div key={sr.scheduleIdx} className="group-timer-overview-round-line">
                          {sr.roundTitle}（第 {getRoundExportNumber(sr.scheduleIdx)} 轮）：已录 {filled}/{total} 把
                          {filled === total && total > 0 ? (
                            <span className="group-timer-overview-round-done"> · 已满</span>
                          ) : null}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          );
        })}
        </div>
      </Modal>
    </>,
    document.body,
  );
};

function TagSpare() {
  return <span className="group-timer-spare-tag">备打</span>;
}

export default GroupTimer;
