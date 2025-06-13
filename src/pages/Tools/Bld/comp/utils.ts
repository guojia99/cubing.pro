export type AssociativeWordMap = Record<string, string>;

export const ROW_KEYS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
export const COL_KEYS = ROW_KEYS;

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function jsonToCsv(data: AssociativeWordMap): string {
  const rows = [['', ...COL_KEYS]];
  for (const row of ROW_KEYS) {
    const rowData = [row];
    for (const col of COL_KEYS) {
      const key = `${row}${col}`;
      rowData.push(data[key] || '');
    }
    rows.push(rowData);
  }
  return rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
}

export function csvToJson(csvText: string): AssociativeWordMap {
  const lines = csvText.trim().split('\n');
  const result: AssociativeWordMap = {};
  const cols = lines[0].split(',').map(s => s.replace(/"/g, '')).slice(1); // A~Z

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map(s => s.replace(/"/g, ''));
    const rowKey = cells[0];
    for (let j = 0; j < cols.length; j++) {
      const colKey = cols[j];
      const value = cells[j + 1];
      const fullKey = `${rowKey}${colKey}`;
      if (value) result[fullKey] = value;
    }
  }
  return result;
}
