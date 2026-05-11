import type { Session, SessionManifest } from '../types/session';
import { parseCSV } from './sessionManager';

// Embedded poverty data - always available
const POVERTY_DATA = {
  germany_poverty_indicators: `indicator,value,unit,source,year
kaufkraftbereinigt_eu_weit,9,percent,IW Köln,2024
armutsgefaehrdungsquote,15.5,percent,Eurostat,2024
arope_armut_ausgrenzung,21.1,percent,Eurostat,2024`,

  eu_poverty_comparison: `rank,country,poverty_rate,year
1,Tschechien,9.5,2024
2,Dänemark,11.6,2024
3,Belgien,11.4,2024
5,Niederlande,12.1,2024
6,Finnland,12.6,2024
16,Deutschland,15.5,2024
21,Spanien,19.7,2024
27,Bulgarien,21.7,2024`,

  germany_poverty_trends: `year,germany_absolute,germany_relative,germany_arope,comment
2019,0,16.6,17.3,Baseline - Platz 9 in EU
2024,0,15.5,21.1,Platz 19 in EU - 10 Ränge gefallen`,

  poverty_definitions: `measure,value,unit,description
kaufkraftbereinigt_eu_standard,9,percent,60% eines gemeinsamen EU-Kaufkraftstandards (IW Köln)
national_median_60pct,15.5,percent,60% des nationalen Medianeinkommens (Eurostat)
arope_combined,21.1,percent,Armut ODER Unterbeschäftigung ODER materielle Entbehrung (Eurostat)
schwelle_single_monat,1378,euro,Armutsgefährdungsschwelle für Singles (2024)`,

  future_cohorts_risk: `cohort,birth_year,retirement_year,poor_pct,not_good_pct,total_vulnerable_pct,comment
1969,1969,2036,20-22,35-38,55-60,Zeitbombe - Mehrheit unter 2500 Euro`,
};

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
          source: 'Eurostat / IW Köln',
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
        name: 'EU-27 Armutsvergleich',
        metadata: {
          source: 'Eurostat',
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
          source: 'Eurostat',
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
        name: 'Armutsdefinitionen',
        metadata: {
          source: 'Eurostat / IW Köln',
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
        name: 'Kohortenrisiko 1969+',
        metadata: {
          source: 'Bertelsmann Stiftung',
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

  // Load each reference table from embedded data
  for (const tableId of Object.keys(POVERTY_DATA) as (keyof typeof POVERTY_DATA)[]) {
    const tableRef = manifest.tables.find(t => t.id === tableId);
    if (!tableRef) continue;

    const csvContent = POVERTY_DATA[tableId];
    const data = parseCSV(csvContent);

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
