export const COCKTAIL_SAFETY_ACK_KEY = "cubing-pro-cocktails-safety-ack-v1";

export function hasAcknowledgedCocktailSafety(): boolean {
  try {
    return localStorage.getItem(COCKTAIL_SAFETY_ACK_KEY) === "1";
  } catch {
    return false;
  }
}

export function acknowledgeCocktailSafety(): void {
  try {
    localStorage.setItem(COCKTAIL_SAFETY_ACK_KEY, "1");
  } catch {
    /* ignore */
  }
}
