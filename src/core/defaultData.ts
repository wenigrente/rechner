import type { Session, SessionManifest } from '../types/session';
import { parseCSV } from './sessionManager';
import { POVERTY_CSVS } from './csvData';

export async function loadDefaultSession(): Promise<Session> {
  const manifest: SessionManifest = {
    version: '1.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    tables: [
      {
        id: 'germany_poverty_indicators',
        type: 'reference',
        name: 'Deutschland Armutsquoten',
        metadata: {
          source: 'Eurostat EU-SILC 2024 / IW Köln 2024',
          columns: [
            { name: 'indicator', type: 'string' },
            { name: 'value', type: 'number' },
            { name: 'unit', type: 'string' },
            { name: 'source', type: 'string' },
            { name: 'year', type: 'number' },
          ],
        },
      },
      {
        id: 'eu_poverty_comparison',
        type: 'reference',
        name: 'EU-27 Armutsvergleich (27 Länder)',
        metadata: {
          source: 'Eurostat EU-SILC 2024: Armutsgefährdungsquote (60% Medianeinkommen, nach Sozialleistungen)',
          url: 'https://ec.europa.eu/eurostat/cache/metadata/en/ilc_li01_esms.htm',
          note: 'Quelle des Buches: Eurostat Armutsgefährdungsquote 2024 (nach Sozialleistungen), Abschnitt 6',
          columns: [
            { name: 'rank', type: 'number' },
            { name: 'country', type: 'string' },
            { name: 'poverty_rate', type: 'number' },
            { name: 'year', type: 'number' },
          ],
        },
      },
      {
        id: 'germany_poverty_trends',
        type: 'reference',
        name: 'Deutschland Armutstrends 2019-2024',
        metadata: {
          source: 'Eurostat EU-SILC: Deutschland 2019 (Platz 9), Deutschland 2024 (Platz 19)',
          note: 'Zeigt 10-Platz-Absturz in 5 Jahren, stärkster Absturz im EU-Vergleich',
          columns: [
            { name: 'year', type: 'number' },
            { name: 'germany_absolute', type: 'number' },
            { name: 'germany_relative', type: 'number' },
            { name: 'germany_arope', type: 'number' },
            { name: 'comment', type: 'string' },
          ],
        },
      },
      {
        id: 'poverty_definitions',
        type: 'reference',
        name: 'Armutsdefinitionen (3 Messmethoden)',
        metadata: {
          source: 'Eurostat (2 Indikatoren) / IW Köln 2024 (kaufkraftbereinigt)',
          note: 'Zeigt wie unterschiedliche Definitionen zu unterschiedlichen Armutsquoten führen',
          columns: [
            { name: 'measure', type: 'string' },
            { name: 'value', type: 'number' },
            { name: 'unit', type: 'string' },
            { name: 'description', type: 'string' },
          ],
        },
      },
      {
        id: 'future_cohorts_risk',
        type: 'reference',
        name: 'Kohortenrisiko Altersarmut bis 2056',
        metadata: {
          source: 'Bertelsmann Stiftung: Entwicklung der Altersarmut bis 2036 (extrapoliert)',
          note: 'Zeigt explodierende Altersarmut über Kohorten: von 40% (1959) auf 76% (1989)',
          columns: [
            { name: 'cohort', type: 'number' },
            { name: 'birth_year', type: 'number' },
            { name: 'retirement_year', type: 'number' },
            { name: 'poor_pct', type: 'string' },
            { name: 'not_good_pct', type: 'string' },
            { name: 'total_vulnerable_pct', type: 'string' },
            { name: 'comment', type: 'string' },
          ],
        },
      },
    ],
    calculations: [],
    charts: [],
  };

  const tables = new Map();

  // Load each reference table from embedded CSV data
  const tableIdsMap: Record<string, keyof typeof POVERTY_CSVS> = {
    germany_poverty_indicators: 'germany_poverty_indicators',
    eu_poverty_comparison: 'eu_poverty_comparison',
    germany_poverty_trends: 'germany_poverty_trends',
    poverty_definitions: 'poverty_definitions',
    future_cohorts_risk: 'future_cohorts_risk',
  };

  for (const [tableId, csvKey] of Object.entries(tableIdsMap)) {
    const tableRef = manifest.tables.find(t => t.id === tableId);
    if (!tableRef) continue;

    const csvContent = POVERTY_CSVS[csvKey];
    if (!csvContent) {
      console.warn(`Skipping ${tableId} - CSV not found`);
      continue;
    }

    const data = parseCSV(csvContent);
    console.log(`[Load] ${tableId}: ${data.length} rows`);

    tables.set(tableId, {
      ...tableRef,
      data,
    });
  }

  return {
    manifest,
    tables,
  };
}
