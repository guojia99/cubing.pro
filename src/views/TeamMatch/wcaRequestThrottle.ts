/** WCA 成绩接口有频率限制：两次请求之间至少间隔（毫秒） */
export const WCA_REQUEST_MIN_INTERVAL_MS = 1600;

let lastWcaRequestStartAt = 0;

/** 在发起下一次 WCA 成绩请求前调用，自动等待至满足最小间隔 */
export async function throttleBeforeWcaResultsRequest(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastWcaRequestStartAt;
  const wait = Math.max(0, WCA_REQUEST_MIN_INTERVAL_MS - elapsed);
  if (wait > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, wait);
    });
  }
  lastWcaRequestStartAt = Date.now();
}

/** 头像同步：每人一次 profile 请求，两次之间至少间隔 1 秒（与成绩接口独立节流） */
export const WCA_AVATAR_MIN_INTERVAL_MS = 1000;

let lastWcaAvatarRequestAt = 0;

export async function throttleBeforeWcaAvatarRequest(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastWcaAvatarRequestAt;
  const wait = Math.max(0, WCA_AVATAR_MIN_INTERVAL_MS - elapsed);
  if (wait > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, wait);
    });
  }
  lastWcaAvatarRequestAt = Date.now();
}

/** 粗饼头像经自家后端代理，后端仍有串行+间隔；前端再隔 1.6s，减轻并发压力 */
export const CUBING_AVATAR_MIN_INTERVAL_MS = 1600;

let lastCubingAvatarRequestAt = 0;

export async function throttleBeforeCubingAvatarRequest(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastCubingAvatarRequestAt;
  const wait = Math.max(0, CUBING_AVATAR_MIN_INTERVAL_MS - elapsed);
  if (wait > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, wait);
    });
  }
  lastCubingAvatarRequestAt = Date.now();
}
