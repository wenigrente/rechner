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
4,Niederlande,12.1,2024
5,Finnland,12.6,2024
6,Schweden,12.8,2024
7,Frankreich,13.1,2024
8,Österreich,13.4,2024
9,Deutschland,15.5,2024
10,Luxemburg,15.8,2024
11,Slowenien,16.2,2024
12,Irland,16.5,2024
13,Litauen,16.8,2024
14,Malta,17.1,2024
15,Zypern,17.4,2024
16,Estland,17.7,2024
17,Slowakei,17.9,2024
18,Kroatien,18.2,2024
19,Spanien,19.7,2024
20,Griechenland,19.9,2024
21,Portugal,20.1,2024
22,Lettland,20.5,2024
23,Italien,20.8,2024
24,Ungarn,21.1,2024
25,Polen,21.4,2024
26,Rumänien,21.7,2024
27,Bulgarien,21.9,2024`,

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
        name: 'Kohortenrisiko 1969+',
        metadata: {
          source: 'Bertelsmann Stiftung: Entwicklung der Altersarmut bis 2036',
          note: '55-60% der Kohorte 1969 lebt im Alter unter 2.500 €/Monat (arm oder nicht gut)',
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
