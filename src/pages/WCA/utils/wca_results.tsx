/**
 * 格式化秒数为 HH:MM:SS.ss 或 MM:SS.ss 或 S.ss
 * @param seconds - 时间（秒）
 * @param mbf - 是否为多盲模式（多盲时整数秒不显示小数）
 */
export function secondTimeFormat(seconds: number, mbf: boolean): string {
  const intSeconds = Math.floor(seconds);
  const decimalSeconds = Math.floor(seconds * 100) % 100;
  const duration = intSeconds;

  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const secs = duration % 60;

  let mmSecondsStr = `.${decimalSeconds.toString().padStart(2, '0')}`;
  if (decimalSeconds === 0 && (duration >= 3600 || mbf)) {
    mmSecondsStr = ''; // 整数秒且满足条件时，不显示 .00
  }

  if (duration < 60) {
    return `${secs}${mmSecondsStr}`;
  } else if (duration < 3600) {
    return `${minutes}:${secs.toString().padStart(2, '0')}${mmSecondsStr}`;
  } else {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}${mmSecondsStr}`;
  }
}

/**
 * 解析 333mbf 成绩
 * 格式: DD TTTTT MM → solved = (99 - DD) + MM, attempted = solved + MM
 * @returns [solved, attempted, seconds, formattedTime]
 * @param inValue
 */
export function get333MBFResult(inValue: number): {
  solved: number;
  attempted: number;
  seconds: number;
  formattedTime: string;
} {
  const str = inValue.toString().padStart(7, '0'); // 确保至少7位
  const diff = parseInt(str.substring(0, 2), 10); // DD
  const timePart = str.substring(2, 7); // TTTTT
  const missed = parseInt(str.substring(7), 10); // MM

  let seconds: number;
  if (timePart === '99999') {
    seconds = 3600; // WCA 中 99999 表示超时（1小时）
  } else {
    seconds = parseInt(timePart, 10);
  }

  const solved = 99 - diff + missed;
  const attempted = solved + missed;
  const formattedTime = secondTimeFormat(seconds, true);

  return { solved, attempted, seconds, formattedTime };
}

/**
 * 格式化 WCA 比赛成绩
 * @param value - 原始成绩（单位：百分之一秒）
 * @param event - 项目 ID（如 '333', '333fm', '333mbf'）
 * @param isAvg
 * @returns 格式化后的字符串
 */
export function resultsTimeFormat(value: number, event: string, isAvg: boolean): string {
  if (value === 0) {
    return '';
  }
  // 特殊值处理
  if (value === -1) return 'DNF';
  if (value === -2) return 'DNS';

  switch (event) {
    case '333fm':
      if (isAvg) {
        return (value / 100).toFixed(2);
      }
      // FMC：单位为 0.01 步 → 转为 x.xx 步
      return `${value}`;

    case '333mbf':
      // 多盲：解析 DD TTTTT MM
      // eslint-disable-next-line no-case-declarations
      const { solved, attempted, formattedTime } = get333MBFResult(value);
      return `${solved}/${attempted} ${formattedTime}`;

    default:
      // 其他项目：转换为秒并格式化
      // eslint-disable-next-line no-case-declarations
      const seconds = value / 100;
      return secondTimeFormat(seconds, false);
  }
}

// 格式化 attempts 显示（高亮最佳与最差）
export const formatAttempts = (
  attempts: number[],
  eventId: string,
  best_index: number,
  worst_index: number,
): JSX.Element => {
  const cellWidth = 85; // 每个成绩单元格固定宽度

  const len = attempts.filter((v) => v !== 0).length

  const items = attempts.map((time, i) => {
    if (time === 0) {
      return (
        <span key={i}></span>
      );
    }

    const formatted = resultsTimeFormat(time, eventId, false);

    let displayText = formatted;

    // 仅在 attempts.length === 5 时，对最佳和最差加括号
    if (len === 5) {
      if (i === best_index) displayText = `(${formatted})`;
      else if (i === worst_index) displayText = `(${formatted})`;
    }

    return (
      <span
        key={i}
        style={{
          display: 'inline-block',
          width: cellWidth,
          textAlign: 'left',
          fontWeight:
            len === 5 && (i === best_index || i === worst_index) ? 800 : 500,
          fontFamily: 'monospace',
        }}
      >
        {displayText}
      </span>
    );
  });

  return <div style={{ display: 'flex', gap: 1 }}>{items}</div>;
};
