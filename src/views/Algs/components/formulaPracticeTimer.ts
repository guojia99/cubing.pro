import type { FormulaItem, FormulaPracticeMode } from '../types';
import type { AppendRecordInput, FormulaPracticeRecord } from '@/services/cubing-pro/algs/formulaPracticeHistory';

export type TimerPhase = 'ready' | 'armed' | 'running' | 'loading' | 'saving' | 'clearing' | 'error';
export interface PracticeSnapshot {
  cube: string;
  classId: string;
  mode: FormulaPracticeMode;
  trimRatio: number;
  remindProficiency: boolean;
  algs: FormulaItem[];
}
export interface PracticeSlot { algIdx: number; scrambleIdx: number }
export interface TimerView {
  phase: TimerPhase;
  snapshot: PracticeSnapshot | null;
  identity: string;
  sessionId: string | null;
  slots: PracticeSlot[];
  index: number;
  elapsed: number;
  startedAt: number;
  pending: AppendRecordInput | null;
  lastRecord: FormulaPracticeRecord | null;
  revision: number;
  interrupted: boolean;
}
interface TimerServices {
  now: () => number;
  random: () => number;
  weight: (key: string) => number;
  create: (snapshot: PracticeSnapshot) => Promise<string>;
  // Retry the same pending ID; refresh/analytics must not affect persistence.
  append: (snapshot: PracticeSnapshot, sessionId: string, input: AppendRecordInput) => Promise<FormulaPracticeRecord>;
  clear: (snapshot: PracticeSnapshot) => Promise<void>;
}

function isSessionMissing(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'PRACTICE_SESSION_MISSING';
}

export function formulaKey(item: FormulaItem): string {
  return `${item.setName}:${item.groupName}:${item.alg.name}`;
}

export function snapshotIdentity(snapshot: PracticeSnapshot): string {
  return JSON.stringify([snapshot.cube, snapshot.classId, snapshot.mode, snapshot.trimRatio, snapshot.remindProficiency,
    snapshot.algs.map((item) => [item.setName, item.groupName, item.alg.name, item.alg.scrambles ?? [], item.alg.algs, item.alg.image ?? ''])]);
}

export function formatPracticeTime(ms: number): string {
  const centiseconds = Math.floor(Math.max(0, ms) / 10);
  const seconds = Math.floor(centiseconds / 100);
  return `${seconds >= 60 ? `${Math.floor(seconds / 60)}:` : ''}${String(seconds % 60).padStart(2, '0')}.${String(centiseconds % 100).padStart(2, '0')}`;
}

export function buildPracticeSlots(snapshot: PracticeSnapshot, random: () => number, weight: (key: string) => number): PracticeSlot[] {
  const base = snapshot.algs.map((item, algIdx) => ({ algIdx, scrambleIdx: Math.floor(random() * Math.max(1, item.alg.scrambles?.length ?? 0)) }));
  if (snapshot.mode === 'sequential') return base;
  if (snapshot.mode === 'weightedRandom') {
    const weights = snapshot.algs.map((item) => weight(formulaKey(item)));
    const total = weights.reduce((sum, value) => sum + value, 0);
    return base.map(() => {
      let remaining = random() * total;
      return base.find((slot) => (remaining -= weights[slot.algIdx]) <= 0) ?? base[0];
    });
  }
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  return base;
}

/** One synchronous authority for input, immutable question snapshots and async writes. */
export class PracticeTimer {
  private view: TimerView = { phase: 'ready', snapshot: null, identity: '', sessionId: null, slots: [], index: 0, elapsed: 0, startedAt: 0, pending: null, lastRecord: null, revision: 0, interrupted: false };
  private listeners = new Set<() => void>();
  private owner: string | null = null;
  private generation = 0;
  constructor(private services: TimerServices) {}
  getSnapshot = (): TimerView => this.view;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private update(patch: Partial<TimerView>) {
    this.view = { ...this.view, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  async configure(input: PracticeSnapshot): Promise<boolean> {
    if (this.isBlocked()) return false;
    const identity = snapshotIdentity(input);
    if (this.view.sessionId && identity === this.view.identity) return true;
    const snapshot: PracticeSnapshot = { ...input, algs: input.algs.map((item) => ({ ...item, alg: { ...item.alg, algs: [...item.alg.algs], scrambles: [...(item.alg.scrambles ?? [])] } })) };
    if (!snapshot.algs.length) return false;
    const generation = ++this.generation;
    this.owner = null;
    this.update({ phase: 'loading', snapshot, identity, sessionId: null, slots: [], index: 0, elapsed: 0, lastRecord: null, interrupted: false });
    try {
      const sessionId = await this.services.create(snapshot);
      if (generation !== this.generation) return false;
      this.update({ sessionId, slots: buildPracticeSlots(snapshot, this.services.random, this.services.weight), phase: 'ready' });
      return true;
    } catch {
      if (generation === this.generation) this.update({ phase: 'error' });
      return false;
    }
  }
  isBlocked(): boolean {
    return ['armed', 'running', 'saving', 'loading', 'clearing'].includes(this.view.phase) || this.view.pending !== null;
  }
  arm(owner: string): boolean {
    if (this.view.phase !== 'ready' || !this.view.sessionId) return false;
    const slot = this.view.slots[this.view.index];
    if (!slot || !this.view.snapshot?.algs[slot.algIdx]?.alg.scrambles?.[slot.scrambleIdx]) return false;
    this.owner = owner;
    this.update({ phase: 'armed', elapsed: 0, interrupted: false });
    return true;
  }
  release(owner: string) {
    if (this.view.phase !== 'armed' || owner !== this.owner) return;
    this.owner = null;
    this.update({ phase: 'running', startedAt: this.services.now() });
  }
  cancelArm(owner: string) {
    if (this.view.phase !== 'armed' || owner !== this.owner) return;
    this.owner = null;
    this.update({ phase: 'ready' });
  }
  interrupt() {
    if (!['armed', 'running'].includes(this.view.phase)) return;
    this.owner = null;
    this.update({ phase: 'ready', elapsed: 0, interrupted: true });
  }
  navigate(delta: number) {
    if (this.view.phase !== 'ready' || !this.view.slots.length) return;
    this.update({ index: (this.view.index + delta + this.view.slots.length) % this.view.slots.length, elapsed: 0 });
  }
  stop() {
    if (this.view.phase !== 'running' || !this.view.snapshot) return;
    const { snapshot, slots, index, startedAt } = this.view;
    const slot = slots[index];
    const item = snapshot.algs[slot.algIdx];
    const elapsed = Math.max(0, this.services.now() - startedAt);
    this.update({ phase: 'saving', elapsed, pending: { id: crypto.randomUUID(), createdAt: Date.now(), timeMs: elapsed, formulaKey: formulaKey(item), formulaName: item.alg.name, setName: item.setName, groupName: item.groupName, scramble: item.alg.scrambles?.[slot.scrambleIdx] ?? '', scrambleIndex: slot.scrambleIdx, image: item.alg.image ?? '', algs: [...item.alg.algs] } });
    void this.save();
  }
  retry() {
    if (this.view.phase !== 'error' || !this.view.pending) return;
    this.update({ phase: 'saving' });
    void this.save();
  }
  private async save() {
    const { snapshot, pending } = this.view;
    let { sessionId } = this.view;
    if (!snapshot || !pending) return;
    let lastRecord: FormulaPracticeRecord;
    try {
      if (sessionId) {
        try {
          lastRecord = await this.services.append(snapshot, sessionId, pending);
        } catch (error) {
          if (!isSessionMissing(error)) throw error;
          sessionId = null;
          this.update({ sessionId: null });
        }
      }
      // External clear/import may remove a paused session. Recover with the
      // original snapshot and pending ID, at most once per explicit save/retry.
      if (!sessionId) {
        sessionId = await this.services.create(snapshot);
        this.update({ sessionId });
        try {
          lastRecord = await this.services.append(snapshot, sessionId, pending);
        } catch (error) {
          if (isSessionMissing(error)) this.update({ sessionId: null });
          throw error;
        }
      }
    } catch {
      this.update({ phase: 'error' });
      return;
    }
    // Once committed, this result must never become retryable, even if building
    // a subsequent round fails (for example a custom weight provider throws).
    this.update({ pending: null, lastRecord: lastRecord!, revision: this.view.revision + 1 });
    try {
      const index = (this.view.index + 1) % this.view.slots.length;
      let slots = this.view.slots;
      if (index === 0 && slots.length > 1) {
        if (snapshot.mode === 'weightedRandom') slots = buildPracticeSlots(snapshot, this.services.random, this.services.weight);
        else if (snapshot.mode === 'nonRepeatRandom') {
          slots = [...slots];
          for (let i = slots.length - 1; i > 0; i--) {
            const j = Math.floor(this.services.random() * (i + 1));
            [slots[i], slots[j]] = [slots[j], slots[i]];
          }
        }
      }
      this.update({ phase: 'ready', index, slots });
    } catch { this.update({ phase: 'ready', index: (this.view.index + 1) % this.view.slots.length }); }
  }
  async clearHistory(): Promise<boolean> {
    const { snapshot } = this.view;
    if (this.isBlocked() || !snapshot) return false;
    this.update({ phase: 'clearing' });
    try { await this.services.clear(snapshot); }
    catch { this.update({ phase: this.view.sessionId ? 'ready' : 'error' }); return false; }
    this.update({ phase: 'ready', sessionId: null, lastRecord: null, elapsed: 0, revision: this.view.revision + 1 });
    return this.configure(snapshot);
  }
}
