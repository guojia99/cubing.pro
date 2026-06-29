/** WCA 观察：0–15s 正常，15–17s +2，>17s DNF（以毫秒计） */
export const INSPECTION_SAFE_MS = 15000;
export const INSPECTION_DNF_MS = 17000;
/** 观察已超过 12s 时提示闪烁（剩余不足约 3s 安全区） */
export const INSPECTION_WARN_ELAPSED_MS = 12000;

export type InspectionPrecision = 'second' | 'tenth';

export function isBlindEventId(eventId: string): boolean {
  return eventId === '333bf' || eventId === '444bf' || eventId === '555bf' || eventId === '333mbf';
}

/** 显示用：按精度显示秒数 */
export function formatInspectionSeconds(
  mode: 'countdown' | 'countup',
  elapsedMs: number,
  precision: InspectionPrecision,
): string {
  if (precision === 'tenth') {
    if (mode === 'countup') {
      return (Math.round(elapsedMs / 100) / 10).toFixed(1);
    }
    return (Math.round((INSPECTION_SAFE_MS - elapsedMs) / 100) / 10).toFixed(1);
  }
  if (mode === 'countup') {
    return String(Math.floor(elapsedMs / 1000));
  }
  const rem = INSPECTION_SAFE_MS - elapsedMs;
  if (rem > 0) {
    return String(Math.floor((rem - 1) / 1000) + 1);
  }
  return String(Math.ceil(rem / 1000));
}

export function inspectionPlus2FromElapsed(elapsedMs: number): boolean {
  return elapsedMs > INSPECTION_SAFE_MS && elapsedMs <= INSPECTION_DNF_MS;
}

export function inspectionDnfFromElapsed(elapsedMs: number): boolean {
  return elapsedMs > INSPECTION_DNF_MS;
}
