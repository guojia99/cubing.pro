import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const WATERMARK = 'Cubing.Pro';
const PAGE_MARGIN_TOP = 20;
const PAGE_MARGIN_BOTTOM = 20;
const PAGE_MARGIN_LEFT = 15;
const PAGE_MARGIN_RIGHT = 15;
const TITLE_HEIGHT = 14;

export async function exportAlgsPdf(
  element: HTMLElement,
  cube: string,
  classId: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const report = (p: number) => {
    onProgress?.(Math.min(100, Math.max(0, p)));
  };
  report(2);
  const scrollX = window.scrollX ?? document.documentElement.scrollLeft;
  const scrollY = window.scrollY ?? document.documentElement.scrollTop;
  element.scrollIntoView({ block: 'start', behavior: 'auto' });
  await new Promise((r) => {setTimeout(r, 150)});

  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - PAGE_MARGIN_LEFT - PAGE_MARGIN_RIGHT;
  const contentH = pageH - PAGE_MARGIN_TOP - PAGE_MARGIN_BOTTOM - TITLE_HEIGHT;

  const title = `${cube} - ${classId}`;
  let currentY = PAGE_MARGIN_TOP + TITLE_HEIGHT;

  const cards = element.querySelectorAll<HTMLElement>('[data-algs-group-card]');
  if (cards.length === 0) {
    report(10);
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const scale = contentW / canvas.width;
    const imgH = Math.min(canvas.height * scale, contentH);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, pageW / 2, PAGE_MARGIN_TOP + 8, { align: 'center' });
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', PAGE_MARGIN_LEFT, PAGE_MARGIN_TOP + TITLE_HEIGHT, contentW, imgH);
    report(50);
  } else {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(title, pageW / 2, PAGE_MARGIN_TOP + 8, { align: 'center' });
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const canvas = await html2canvas(card, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const scale = contentW / canvas.width;
      const cardH = canvas.height * scale;

      if (currentY + cardH > pageH - PAGE_MARGIN_BOTTOM) {
        doc.addPage();
        currentY = PAGE_MARGIN_TOP;
      }

      doc.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        PAGE_MARGIN_LEFT,
        currentY,
        contentW,
        cardH,
      );
      currentY += cardH + 8;
      report(((i + 1) / cards.length) * 85);
    }
  }

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(36);
  doc.setFont('helvetica', 'normal');
  const totalPages = doc.getNumberOfPages();
  report(90);
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.saveGraphicsState();
    doc.setGState(doc.GState({ opacity: 0.4 }));
    doc.text(WATERMARK, pageW / 2, pageH / 2, { align: 'center', baseline: 'middle' });
    doc.restoreGraphicsState();
  }

  report(98);
  doc.save(`${cube}-${classId}.pdf`);
  report(100);
  window.scrollTo(scrollX, scrollY);
}
