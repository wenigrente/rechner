import JSZip from 'jszip';
import * as YAML from 'js-yaml';
import type { Session, SessionManifest, TableReference } from '../types/session';

export async function exportSessionAsZip(session: Session): Promise<Blob> {
  const zip = new JSZip();

  const manifestYaml = YAML.dump(session.manifest);
  zip.file('manifest.yaml', manifestYaml);

  for (const [, table] of session.tables) {
    if ((table.type === 'upload' || table.type === 'inline') && table.data) {
      const csvContent = convertToCSV(table.data);
      zip.file(`${table.id}.csv`, csvContent);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function importSessionFromZip(zipBlob: Blob): Promise<Session> {
  const zip = new JSZip();
  await zip.loadAsync(zipBlob);

  const manifestFile = zip.file('manifest.yaml');
  if (!manifestFile) {
    throw new Error('No manifest.yaml found in ZIP');
  }

  const manifestContent = await manifestFile.async('string');
  const manifest = YAML.load(manifestContent) as SessionManifest;

  const tables = new Map<string, TableReference>();

  for (const tableRef of manifest.tables) {
    if (tableRef.type === 'reference') {
      tables.set(tableRef.id, tableRef);
    } else if (tableRef.type === 'upload' || tableRef.type === 'inline') {
      const csvFile = zip.file(`${tableRef.id}.csv`);
      if (csvFile) {
        const csvContent = await csvFile.async('string');
        const data = parseCSV(csvContent);
        tables.set(tableRef.id, {
          ...tableRef,
          data
        });
      }
    }
  }

  return {
    manifest,
    tables
  };
}

export function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export function parseCSV(csv: string): Record<string, unknown>[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const data: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, unknown> = {};

    for (let j = 0; j < headers.length; j++) {
      let value: unknown = values[j] || '';
      
      // Auto-detect number
      if (typeof value === 'string' && value !== '') {
        const num = parseFloat(value);
        if (!isNaN(num) && value === String(num)) {
          value = num;
        }
      }
      
      row[headers[j]] = value;
    }

    data.push(row);
  }

  return data;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}
