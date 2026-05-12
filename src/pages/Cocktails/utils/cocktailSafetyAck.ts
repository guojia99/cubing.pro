/** 调酒模块：饮酒提示与免责声明，用户确认后写入本地，仅提示一次 */

export const COCKTAIL_SAFETY_ACK_KEY = 'cubing-pro-cocktails-safety-ack-v1';

export function hasAcknowledgedCocktailSafety(): boolean {
  try {
    return localStorage.getItem(COCKTAIL_SAFETY_ACK_KEY) === '1';
  } catch {
    return false;
  }
}

export function acknowledgeCocktailSafety(): void {
  try {
    localStorage.setItem(COCKTAIL_SAFETY_ACK_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}
