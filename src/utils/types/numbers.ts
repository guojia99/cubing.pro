export function isNumber(value: unknown): boolean {
  if (typeof value === 'number' && !isNaN(value)) {
    return true;
  }

  return typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value));
}
