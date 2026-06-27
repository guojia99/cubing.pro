import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

function safeFileBase(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'team-match';
  return trimmed
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

export function formatBracketExportFilename(sessionName: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${safeFileBase(sessionName)}-bracket-${stamp}.png`;
}

/**
 * 将正赛对阵图区域导出为 PNG（克隆 DOM 内去掉 scale transform，便于高清与完整宽度）。
 */
export async function exportBracketElementToPng(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#0a0a12',
    logging: false,
    useCORS: true,
    onclone: (_doc, cloned) => {
      const wrap = cloned.querySelector('.tmBracketExportBlock .tmBracketScaleWrap') as HTMLElement | null;
      if (wrap) {
        wrap.style.transform = 'none';
        wrap.style.transformOrigin = 'top center';
      }
    },
  });

  await new Promise<void>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('toBlob failed'));
          return;
        }
        saveAs(blob, filename);
        resolve();
      },
      'image/png',
      1,
    );
  });
}
