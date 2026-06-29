/**
 * 手动输入：仅数字时，超过三位按「整段百分秒」解析，如 1234 -> 12.34 秒。
 * 含小数点或冒号时按常规解析。
 * @returns 毫秒，解析失败返回 null
 */
export function parseManualTimeToMs(raw: string): number | null {
  const s = raw
    .trim()
    .replace(/：/g, ':')
    .replace(/．/g, '.');
  if (!s) {
    return null;
  }

  if (s.includes(':') || s.includes('.')) {
    return parseColonOrDotSeconds(s);
  }

  if (!/^\d+$/.test(s)) {
    return null;
  }

  const digits = s;
  if (digits.length <= 2) {
    const sec = parseInt(digits, 10);
    if (Number.isNaN(sec)) {
      return null;
    }
    return sec * 1000;
  }
  if (digits.length === 3) {
    // 常见：123 -> 1.23 秒
    const cs = parseInt(digits, 10);
    return (cs / 100) * 1000;
  }
  // 超过三位：整段为百分之一秒整数，如 1234 -> 12.34 秒
  const cs = parseInt(digits, 10);
  return (cs / 100) * 1000;
}

function parseColonOrDotSeconds(s: string): number | null {
  if (s.includes(':')) {
    const parts = s.split(':').map((p) => p.trim());
    if (parts.some((p) => !p)) {
      return null;
    }
    let sec = 0;
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10);
      const rest = parseFloat(parts[1]);
      if (Number.isNaN(m) || Number.isNaN(rest)) {
        return null;
      }
      sec = m * 60 + rest;
    } else if (parts.length === 3) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const rest = parseFloat(parts[2]);
      if (Number.isNaN(h) || Number.isNaN(m) || Number.isNaN(rest)) {
        return null;
      }
      sec = h * 3600 + m * 60 + rest;
    } else {
      return null;
    }
    return sec * 1000;
  }

  const v = parseFloat(s);
  if (Number.isNaN(v)) {
    return null;
  }
  return v * 1000;
}
