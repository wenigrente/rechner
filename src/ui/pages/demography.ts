import * as d3 from 'd3';
import { fetchResource } from '../../core/resources';

// source values in the CSV (column 6):
// 'original'      → Volkszählungen / amtliche Statistiken
// 'reconstructed' → interpolierte Werte für Lückenjahre
// 'projection'    → 16. kBv Vorausberechnung (Statistisches Bundesamt)
type DataSource = 'original' | 'reconstructed' | 'projection';

function parseSource(raw: string): DataSource {
  if (raw === 'original') return 'original';
  if (raw === 'reconstructed') return 'reconstructed';
  return 'projection';
}

// Color pairs [male, female] per source type
const COLORS: Record<DataSource, { male: string; female: string }> = {
  original:      { male: '#3b82f6', female: '#ec4899' }, // saturated blue / pink
  reconstructed: { male: '#93c5fd', female: '#f9a8d4' }, // light tint blue / pink
  projection:    { male: '#a78bfa', female: '#fbbf24' }, // violet / amber
};

const BAR_OPACITY = 0.85;

// ── Variant decoder ──────────────────────────────────────────────────────────
//
// Covers all 16. kBv variant codes:
//   Varianten 1–27: G[123]L[123]W[123]  (3³ = 27 combinations)
//   Variante 28:    GZL2W0  (moderat, keine Wanderung)
//   Variante 29:    GRL2W0  (Bestandserhaltung, keine Wanderung)

type StandardVariantInfo = {
  kind: 'standard';
  code: string;
  g: { num: string; label: string; value: string };
  l: { num: string; label: string; value: string };
  w: { num: string; label: string; value: string };
  isBasis: boolean;
};

type HypothesisVariantInfo = {
  kind: 'hypothesis';
  code: string;
  varNr: 28 | 29;
  name: string;
  description: string;
  g: string;
  l: string;
  note: string;
};

type VariantInfo = StandardVariantInfo | HypothesisVariantInfo;

const G_LEVELS: Record<string, { label: string; value: string }> = {
  '1': { label: 'niedrig', value: '1,35 Kinder/Frau' },
  '2': { label: 'moderat', value: '1,47 Kinder/Frau' },
  '3': { label: 'hoch',    value: '1,65 Kinder/Frau' },
};
const L_LEVELS: Record<string, { label: string; value: string }> = {
  '1': { label: 'niedrig', value: 'Männer 82,6 / Frauen 86,1 Jahre' },
  '2': { label: 'moderat', value: 'Männer 84,5 / Frauen 87,7 Jahre' },
  '3': { label: 'hoch',    value: 'Männer 86,4 / Frauen 89,3 Jahre' },
};
const W_LEVELS: Record<string, { label: string; value: string }> = {
  '1': { label: 'niedrig', value: '+150.000 p.a.' },
  '2': { label: 'moderat', value: '+250.000 p.a.' },
  '3': { label: 'hoch',    value: '+350.000 p.a.' },
};

function decodeVariant(code: string): VariantInfo | null {
  // Variante 28: GZL2W0 — moderat, kein Wanderungssaldo
  if (/^GZL2W0$/i.test(code)) {
    return {
      kind: 'hypothesis',
      code,
      varNr: 28,
      name: 'GZ·L2·W0 — Hypothese moderat',
      description: 'Kein Außenwanderungssaldo (W=0). Zeigt den natürlichen Bevölkerungsrückgang ohne Migration.',
      g: 'G2 moderat (1,47 Kinder/Frau)',
      l: 'L2 moderat (Männer 84,5 / Frauen 87,7 Jahre)',
      note: 'Analytisches Referenzszenario — keine Prognose.',
    };
  }

  // Variante 29: GRL2W0 — bestandserhaltende Geburtenrate, kein Wanderungssaldo
  if (/^GRL2W0$/i.test(code)) {
    return {
      kind: 'hypothesis',
      code,
      varNr: 29,
      name: 'GR·L2·W0 — Hypothese Bestandserhalt',
      description: 'Bestandserhaltende Geburtenrate (GR = 2,1 Kinder/Frau), kein Außenwanderungssaldo (W=0). Zeigt, welche Geburtenrate allein die Bevölkerung stabilisieren würde.',
      g: 'GR Bestandserhalt (2,1 Kinder/Frau)',
      l: 'L2 moderat (Männer 84,5 / Frauen 87,7 Jahre)',
      note: 'Analytisches Referenzszenario — keine Prognose.',
    };
  }

  // Varianten 1–27: G[123]L[123]W[123]
  const m = code.match(/^G([123])L([123])W([123])/i);
  if (!m) return null;
  const [, gn, ln, wn] = m;
  return {
    kind: 'standard',
    code,
    g: { num: gn, ...G_LEVELS[gn] },
    l: { num: ln, ...L_LEVELS[ln] },
    w: { num: wn, ...W_LEVELS[wn] },
    isBasis: gn === '2' && ln === '2' && wn === '1',
  };
}

// ── Variant popup ────────────────────────────────────────────────────────────

function buildPopupBody(info: VariantInfo): string {
  if (info.kind === 'hypothesis') {
    return `
      <div style="margin-bottom:10px;">
        <strong style="font-size:13px;">16. kBv — Var. ${info.varNr}: ${info.name}</strong>
      </div>
      <p style="margin:0 0 10px 0;color:#555;">${info.description}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tbody>
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:4px 6px;font-weight:600;">Geburtenrate</td>
            <td style="padding:4px 6px;">${info.g}</td>
          </tr>
          <tr style="border-bottom:1px solid #f3f4f6;">
            <td style="padding:4px 6px;font-weight:600;">Lebenserwartung</td>
            <td style="padding:4px 6px;">${info.l}</td>
          </tr>
          <tr>
            <td style="padding:4px 6px;font-weight:600;">Wanderungssaldo</td>
            <td style="padding:4px 6px;">W0 — kein Saldo (geschlossene Bevölkerung)</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:10px;font-size:10px;color:#888;border-top:1px solid #f3f4f6;padding-top:8px;">
        ⚠️ ${info.note}<br>
        Statistisches Bundesamt, 16. kBv (Nov. 2025).
      </div>`;
  }

  // Standard variant
  const basisBadge = info.isBasis
    ? `<span style="background:#f5f3ff;color:#5b21b6;border:1px solid #c4b5fd;border-radius:10px;padding:1px 7px;font-size:10px;margin-left:6px;">Basisvariante</span>`
    : '';

  return `
    <div style="margin-bottom:10px;">
      <strong style="font-size:13px;">16. kBv — Variante ${info.code}${basisBadge}</strong>
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <th style="text-align:left;padding:3px 6px;color:#666;font-weight:600;font-size:11px;">Parameter</th>
          <th style="text-align:left;padding:3px 6px;color:#666;font-weight:600;font-size:11px;">Stufe</th>
          <th style="text-align:left;padding:3px 6px;color:#666;font-weight:600;font-size:11px;">Zielwert 2070</th>
        </tr>
      </thead>
      <tbody>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:4px 6px;"><strong>G${info.g.num}</strong> Geburtenrate</td>
          <td style="padding:4px 6px;">${info.g.label}</td>
          <td style="padding:4px 6px;">${info.g.value}</td>
        </tr>
        <tr style="border-bottom:1px solid #f3f4f6;">
          <td style="padding:4px 6px;"><strong>L${info.l.num}</strong> Lebenserwartung</td>
          <td style="padding:4px 6px;">${info.l.label}</td>
          <td style="padding:4px 6px;">${info.l.value}</td>
        </tr>
        <tr>
          <td style="padding:4px 6px;"><strong>W${info.w.num}</strong> Wanderungssaldo</td>
          <td style="padding:4px 6px;">${info.w.label}</td>
          <td style="padding:4px 6px;">${info.w.value}</td>
        </tr>
      </tbody>
    </table>
    <div style="margin-top:10px;font-size:10px;color:#888;border-top:1px solid #f3f4f6;padding-top:8px;">
      Statistisches Bundesamt, 16. koordinierte Bevölkerungsvorausberechnung (Nov. 2025).<br>
      Ausgangswert 2024: Geburtenrate ~1,35 · Männer 78,3 / Frauen 83,2 Jahre.
    </div>`;
}

function showVariantPopup(anchorEl: HTMLElement, code: string): void {
  document.getElementById('variant-popup')?.remove();

  const info = decodeVariant(code);
  if (!info) return;

  const popup = document.createElement('div');
  popup.id = 'variant-popup';
  popup.style.cssText = `
    position: fixed;
    background: #fff;
    border: 1px solid #c4b5fd;
    border-radius: 8px;
    padding: 14px 16px;
    font-size: 12px;
    color: #333;
    z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    max-width: 320px;
    line-height: 1.6;
  `;

  popup.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:4px;">
      <button id="variant-popup-close" style="background:none;border:none;cursor:pointer;font-size:16px;color:#999;padding:0;">✕</button>
    </div>
    ${buildPopupBody(info)}
  `;

  document.body.appendChild(popup);

  const rect = anchorEl.getBoundingClientRect();
  const popupW = 320;
  let left = rect.left;
  if (left + popupW > window.innerWidth - 10) left = window.innerWidth - popupW - 10;
  popup.style.left = `${left}px`;
  popup.style.top  = `${rect.bottom + 8}px`;

  popup.querySelector('#variant-popup-close')!.addEventListener('click', () => popup.remove());
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!popup.contains(e.target as Node)) {
        popup.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 0);
}

// ── Data types ───────────────────────────────────────────────────────────────

interface DemographyData {
  jahr: number;
  alter: number;
  maennlich: number;
  weiblich: number;
  gesamt: number;
  source: DataSource;
  sourceRaw: string;
  variante: string;
}

interface SourceSummary {
  original: number;
  reconstructed: number;
  projection: number;
  varianteCode: string;
  isFullyOriginal: boolean;
  hasProjection: boolean;
}

interface ParsedDemography {
  years: number[];
  dataByYear: Map<number, DemographyData[]>;
  maxValue: number;
  sourceByYear: Map<number, SourceSummary>;
}

let demographyCache: ParsedDemography | null = null;
let selectedYear: number | null = null;

// ── Data loading ─────────────────────────────────────────────────────────────

async function loadDemographyData(): Promise<ParsedDemography> {
  if (demographyCache) return demographyCache;

  const csv = await fetchResource('demographie_complete');

  const lines = csv.trim().split('\n');
  const dataByYear = new Map<number, DemographyData[]>();
  const yearsSet = new Set<number>();
  let maxValue = 0;

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim());
    if (parts.length < 5) continue;

    const jahr      = parseInt(parts[0]);
    const alter     = parseInt(parts[1]);
    const maennlich = parseInt(parts[2]) || 0;
    const weiblich  = parseInt(parts[3]) || 0;
    const gesamt    = parseInt(parts[4]) || 0;
    const sourceRaw = parts[5] ?? '';
    const variante  = parts[6] ?? '';
    const source    = parseSource(sourceRaw);

    if (isNaN(jahr) || isNaN(alter)) continue;

    yearsSet.add(jahr);
    maxValue = Math.max(maxValue, maennlich, weiblich);
    if (!dataByYear.has(jahr)) dataByYear.set(jahr, []);
    dataByYear.get(jahr)!.push({ jahr, alter, maennlich, weiblich, gesamt, source, sourceRaw, variante });
  }

  const years = Array.from(yearsSet).sort((a, b) => a - b);
  if (years.length === 0) throw new Error('No valid demographic data found in CSV');

  const sourceByYear = new Map<number, SourceSummary>();
  for (const [year, rows] of dataByYear) {
    const orig  = rows.filter(r => r.source === 'original').length;
    const recon = rows.filter(r => r.source === 'reconstructed').length;
    const proj  = rows.filter(r => r.source === 'projection').length;
    const varianteCode = rows.find(r => r.source === 'projection')?.variante ?? '';
    sourceByYear.set(year, {
      original: orig, reconstructed: recon, projection: proj,
      varianteCode,
      isFullyOriginal: recon === 0 && proj === 0,
      hasProjection: proj > 0,
    });
  }

  demographyCache = { years, dataByYear, maxValue, sourceByYear };
  console.log(`✓ Loaded ${years.length} years of demographic data (up to ${years[years.length - 1]})`);
  return demographyCache;
}

// ── Chart rendering ──────────────────────────────────────────────────────────

function renderD3Pyramid(container: HTMLElement, data: DemographyData[], year: number, maxValue: number): void {
  const chartContainer = container.querySelector('#demography-chart') as HTMLDivElement;
  if (!chartContainer) return;
  chartContainer.innerHTML = '';

  const margin = { top: 30, right: 20, bottom: 30, left: 40 };
  const width  = 700 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  const sortedData = [...data].sort((a, b) => a.alter - b.alter);

  const svg = d3.select(chartContainer)
    .append('svg').attr('viewBox', `0 0 700 400`).attr('width', '100%').attr('height', '400').style('max-width', '100%');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear().domain([-maxValue, maxValue]).range([0, width]);
  const yScale = d3.scaleBand().domain(sortedData.map(d => d.alter.toString())).range([height, 0]).padding(0.05);

  const xAxis = d3.axisBottom(xScale)
    .tickFormat((d: any) => {
      const abs = Math.abs(d);
      if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(0)}M`;
      if (abs >= 1_000) return `${(abs / 1_000).toFixed(0)}k`;
      return d;
    })
    .tickSize(-height);

  g.append('g').attr('transform', `translate(0,${height})`).call(xAxis).style('font-size', '11px').select('.domain').remove();
  g.selectAll('.tick line').style('stroke', '#f0f0f0');
  g.append('g').call(d3.axisLeft(yScale).tickValues(sortedData.filter((_, i) => i % 5 === 0).map(d => d.alter.toString())))
    .style('font-size', '10px').select('.domain').remove();
  g.append('line').attr('x1', xScale(0)).attr('x2', xScale(0)).attr('y1', 0).attr('y2', height)
    .style('stroke', '#ccc').style('stroke-width', '1px').style('stroke-dasharray', '4,4');

  const tooltipLabel = (d: DemographyData) =>
    d.source === 'original' ? '📋 Originaldaten' :
    d.source === 'reconstructed' ? '🔁 Rekonstruiert' :
    `📈 Projektion ${d.variante}`;

  const barAttrs = (sel: d3.Selection<SVGRectElement, DemographyData, SVGGElement, unknown>, gender: 'male' | 'female') =>
    sel.style('fill', d => COLORS[d.source][gender])
      .style('opacity', BAR_OPACITY)
      .on('mouseover', function(event: MouseEvent, d: DemographyData) {
        d3.select(this).style('opacity', 1);
        const val = gender === 'male' ? d.maennlich : d.weiblich;
        const label = gender === 'male' ? 'Männlich' : 'Weiblich';
        showTooltip(event, `Alter ${d.alter} | ${label}: ${formatNumber(val)}\n${tooltipLabel(d)}`);
      })
      .on('mousemove', (event: MouseEvent) => moveTooltip(event))
      .on('mouseout', function() { d3.select(this).style('opacity', BAR_OPACITY); hideTooltip(); });

  barAttrs(
    g.selectAll('.bar-male').data(sortedData).enter().append('rect').attr('class', 'bar-male')
      .attr('x', d => xScale(-d.maennlich)).attr('y', d => yScale(d.alter.toString()) || 0)
      .attr('width', d => xScale(0) - xScale(-d.maennlich)).attr('height', yScale.bandwidth()),
    'male'
  );

  barAttrs(
    g.selectAll('.bar-female').data(sortedData).enter().append('rect').attr('class', 'bar-female')
      .attr('x', xScale(0)).attr('y', d => yScale(d.alter.toString()) || 0)
      .attr('width', d => xScale(d.weiblich) - xScale(0)).attr('height', yScale.bandwidth()),
    'female'
  );

  svg.append('text').attr('x', 350).attr('y', 20).attr('text-anchor', 'middle')
    .style('font-size', '16px').style('font-weight', 'bold').style('fill', '#333')
    .text(`Bevölkerungspyramide Deutschland ${year}`);
}

// ── Tooltip helpers ──────────────────────────────────────────────────────────

let tooltip: HTMLDivElement | null = null;

function getTooltip(): HTMLDivElement {
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: fixed; background: rgba(30,30,30,0.92); color: #fff;
      padding: 7px 11px; border-radius: 5px; font-size: 12px;
      pointer-events: none; white-space: pre-line; line-height: 1.5;
      z-index: 9999; display: none; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(tooltip);
  }
  return tooltip;
}

function showTooltip(event: MouseEvent, text: string): void {
  const t = getTooltip(); t.textContent = text; t.style.display = 'block'; moveTooltip(event);
}

function moveTooltip(event: MouseEvent): void {
  const t = getTooltip();
  t.style.left = `${event.clientX + 14}px`;
  t.style.top  = `${event.clientY - 30}px`;
}

function hideTooltip(): void { if (tooltip) tooltip.style.display = 'none'; }

// ── Statistics cards ─────────────────────────────────────────────────────────

function renderStatistics(container: HTMLElement, data: DemographyData[], src: SourceSummary): void {
  const statsContainer = container.querySelector('#demography-stats') as HTMLDivElement;
  if (!statsContainer) return;

  const totalMales   = data.reduce((sum, d) => sum + d.maennlich, 0);
  const totalFemales = data.reduce((sum, d) => sum + d.weiblich, 0);
  const totalPop     = totalMales + totalFemales;
  const malePct      = ((totalMales / totalPop) * 100).toFixed(1);
  const femalePct    = ((totalFemales / totalPop) * 100).toFixed(1);

  let sourceCard: string;
  if (src.hasProjection) {
    const info = decodeVariant(src.varianteCode);
    const isBasis = info?.kind === 'standard' && info.isBasis;
    const isHyp   = info?.kind === 'hypothesis';
    sourceCard = `
      <div style="padding: 12px; background: #f5f3ff; border-radius: 4px; border-left: 3px solid #8b5cf6;">
        <div style="font-size: 11px; color: #666; margin-bottom: 3px;">Datenquelle</div>
        <div style="font-size: 13px; font-weight: bold; color: #5b21b6; display:flex; align-items:center; gap:6px;">
          ${isHyp ? '🔬' : '📈'} Projektion
          <button id="variant-info-btn" style="
            background: #ede9fe; border: 1px solid #c4b5fd; border-radius: 12px;
            color: #5b21b6; font-size: 10px; font-weight: 700; cursor: pointer;
            padding: 1px 8px; line-height: 1.6;
          ">${src.varianteCode} ?</button>
        </div>
        <div style="font-size: 10px; color: #6b7280; margin-top: 2px;">
          16. kBv · Destatis Nov. 2025${isBasis ? ' · <em>Basisvariante</em>' : ''}${isHyp ? ' · <em>Hypothese</em>' : ''}
        </div>
      </div>`;
  } else if (src.isFullyOriginal) {
    sourceCard = `
      <div style="padding: 12px; background: #f0fdf4; border-radius: 4px; border-left: 3px solid #10b981;">
        <div style="font-size: 11px; color: #666; margin-bottom: 3px;">Datenquelle</div>
        <div style="font-size: 13px; font-weight: bold; color: #065f46;">📋 Originaldaten</div>
        <div style="font-size: 10px; color: #6b7280;">Volkszählung / Statistisches Amt</div>
      </div>`;
  } else {
    sourceCard = `
      <div style="padding: 12px; background: #fef9ec; border-radius: 4px; border-left: 3px solid #f59e0b;">
        <div style="font-size: 11px; color: #666; margin-bottom: 3px;">Datenquelle</div>
        <div style="font-size: 13px; font-weight: bold; color: #92400e;">🔁 Teils rekonstruiert</div>
        <div style="font-size: 10px; color: #6b7280;">${src.original} original · ${src.reconstructed} rekonstruiert</div>
      </div>`;
  }

  statsContainer.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;">
      <div style="padding: 12px; background: #f0f9ff; border-radius: 4px; border-left: 3px solid #3b82f6;">
        <div style="font-size: 11px; color: #666; margin-bottom: 3px;">Männlich</div>
        <div style="font-size: 16px; font-weight: bold; color: #3b82f6;">${formatNumber(totalMales)}</div>
        <div style="font-size: 10px; color: #999;">${malePct}%</div>
      </div>
      <div style="padding: 12px; background: #fdf2f8; border-radius: 4px; border-left: 3px solid #ec4899;">
        <div style="font-size: 11px; color: #666; margin-bottom: 3px;">Weiblich</div>
        <div style="font-size: 16px; font-weight: bold; color: #ec4899;">${formatNumber(totalFemales)}</div>
        <div style="font-size: 10px; color: #999;">${femalePct}%</div>
      </div>
      <div style="padding: 12px; background: #f0fdf4; border-radius: 4px; border-left: 3px solid #10b981;">
        <div style="font-size: 11px; color: #666; margin-bottom: 3px;">Gesamt</div>
        <div style="font-size: 16px; font-weight: bold; color: #10b981;">${formatNumber(totalPop)}</div>
        <div style="font-size: 10px; color: #999;">100%</div>
      </div>
      ${sourceCard}
    </div>
  `;

  const btn = statsContainer.querySelector('#variant-info-btn') as HTMLButtonElement | null;
  if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); showVariantPopup(btn, src.varianteCode); });
}

// ── Legend ───────────────────────────────────────────────────────────────────

function updateLegend(container: HTMLElement, src: SourceSummary): void {
  const el = container.querySelector('#legend-source-note') as HTMLElement;
  if (!el) return;

  if (src.hasProjection) {
    el.style.background  = '#f5f3ff';
    el.style.borderColor = '#c4b5fd';
    const info = decodeVariant(src.varianteCode);
    if (!info) {
      el.innerHTML = `<strong>📈 Projektion</strong> ${src.varianteCode} — 16. kBv, Destatis Nov. 2025.`;
    } else if (info.kind === 'hypothesis') {
      el.innerHTML = `<strong>🔬 ${info.name}</strong> — 16. kBv, Destatis Nov. 2025.<br>${info.description}`;
    } else {
      el.innerHTML = `<strong>📈 Projektion ${info.code}</strong>${info.isBasis ? ' <em>(Basisvariante)</em>' : ''} — 16. kBv, Destatis Nov. 2025.<br>
        G${info.g.num} Geburtenrate ${info.g.label} (${info.g.value}) ·
        L${info.l.num} Lebenserwartung ${info.l.label} ·
        W${info.w.num} Wanderung ${info.w.label} (${info.w.value}).`;
    }
  } else if (src.isFullyOriginal) {
    el.style.background  = '#f0fdf4';
    el.style.borderColor = '#86efac';
    el.innerHTML = `<strong>📋 Originaldaten</strong> — Volkszählungen &amp; amtliche Statistiken (satte Farbe).`;
  } else {
    el.style.background  = '#fef9ec';
    el.style.borderColor = '#fcd34d';
    el.innerHTML = `<strong>📋 Originaldaten</strong> (satte Farbe) — ${src.original} Altersgruppen.<br>
      <strong>🔁 Rekonstruiert</strong> (helle Farbe) — ${src.reconstructed} Altersgruppen.`;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000)     return (num / 1_000).toFixed(0) + 'k';
  return num.toString();
}

// ── Chart update ─────────────────────────────────────────────────────────────

function updateChart(container: HTMLElement, demography: ParsedDemography): void {
  if (!selectedYear || !demography.dataByYear.has(selectedYear)) return;

  const yearData = demography.dataByYear.get(selectedYear)!;
  const src      = demography.sourceByYear.get(selectedYear)!;

  renderStatistics(container, yearData, src);
  renderD3Pyramid(container, yearData, selectedYear, demography.maxValue);
  updateLegend(container, src);

  const sourceIndicator = container.querySelector('#source-indicator') as HTMLSpanElement;
  if (sourceIndicator) {
    if (src.hasProjection) {
      const info = decodeVariant(src.varianteCode);
      const isHyp = info?.kind === 'hypothesis';
      sourceIndicator.textContent      = `${isHyp ? '🔬' : '📈'} ${src.varianteCode}`;
      sourceIndicator.style.background = '#ede9fe';
      sourceIndicator.style.color      = '#5b21b6';
      sourceIndicator.style.border     = '1px solid #c4b5fd';
      sourceIndicator.style.cursor     = 'pointer';
      sourceIndicator.title            = 'Klicken für Modelldetails';
      sourceIndicator.onclick          = (e) => { e.stopPropagation(); showVariantPopup(sourceIndicator, src.varianteCode); };
    } else if (src.isFullyOriginal) {
      sourceIndicator.textContent      = '📋 Originaldaten';
      sourceIndicator.style.background = '#dcfce7';
      sourceIndicator.style.color      = '#065f46';
      sourceIndicator.style.border     = '1px solid #86efac';
      sourceIndicator.style.cursor     = 'default';
      sourceIndicator.onclick          = null;
    } else {
      sourceIndicator.textContent      = '🔁 Rekonstruiert';
      sourceIndicator.style.background = '#fef9ec';
      sourceIndicator.style.color      = '#92400e';
      sourceIndicator.style.border     = '1px solid #fcd34d';
      sourceIndicator.style.cursor     = 'default';
      sourceIndicator.onclick          = null;
    }
  }

  const dropdown  = container.querySelector('#year-selector') as HTMLSelectElement;
  const slider    = container.querySelector('#year-slider') as HTMLInputElement;
  const yearLabel = container.querySelector('#year-label') as HTMLDivElement;
  if (dropdown)  dropdown.value        = selectedYear.toString();
  if (slider)    slider.value          = selectedYear.toString();
  if (yearLabel) yearLabel.textContent = selectedYear.toString();
}

// ── Main render ──────────────────────────────────────────────────────────────

export async function render(container: HTMLElement): Promise<void> {
  container.innerHTML = `
    <div style="padding: 20px;">
      <h1 style="margin: 0 0 8px 0; font-size: 22px;">Bevölkerungsdemographie</h1>
      <p style="margin: 0 0 20px 0; color: #666; font-size: 13px;">
        Interaktive Bevölkerungspyramide mit Altersverteilung nach Geschlecht, 1871–2070.
        Projektionsdaten: 16. koordinierte Bevölkerungsvorausberechnung, Destatis Nov. 2025.
      </p>

      <div style="margin-bottom: 20px; padding: 15px; background: #f9f9f9; border-radius: 6px; border: 1px solid #e0e0e0;">
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px; flex-wrap: wrap;">
          <label style="font-weight: 600; font-size: 13px; white-space: nowrap;">Jahr:</label>
          <select id="year-selector" style="padding: 6px 10px; font-size: 13px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; min-width: 100px;">
            <option value="">Laden...</option>
          </select>
          <div id="year-label" style="padding: 6px 12px; background: #3b82f6; color: white; border-radius: 4px; font-weight: bold; font-size: 13px; min-width: 50px; text-align: center;">1871</div>
          <span id="source-indicator" style="padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; transition: all 0.2s;">—</span>
        </div>
        <input id="year-slider" type="range" min="1871" max="2070" value="1871" style="width: 100%; height: 6px; cursor: pointer; accent-color: #3b82f6;" />
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #999; margin-top: 5px;">
          <span>1871</span><span>2070</span>
        </div>
      </div>

      <div id="demography-stats" style="margin-bottom: 20px;">
        <div style="text-align: center; color: #999; padding: 20px;">Daten werden geladen…</div>
      </div>

      <div id="demography-chart" style="margin: 20px 0; overflow-x: auto;">
        <div style="text-align: center; color: #999; padding: 40px;">Diagramm wird geladen…</div>
      </div>

      <div style="padding: 12px 15px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12px; color: #555; margin-top: 4px; display: grid; grid-template-columns: auto 1fr; gap: 16px; align-items: start;">
        <div style="white-space: nowrap; line-height: 2;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 14px; height: 10px; background: ${COLORS.original.male}; border-radius: 2px;"></span>
            <span style="display: inline-block; width: 14px; height: 10px; background: ${COLORS.original.female}; border-radius: 2px;"></span>
            <span>📋 Original</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 14px; height: 10px; background: ${COLORS.reconstructed.male}; border-radius: 2px;"></span>
            <span style="display: inline-block; width: 14px; height: 10px; background: ${COLORS.reconstructed.female}; border-radius: 2px;"></span>
            <span>🔁 Rekonstruiert</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="display: inline-block; width: 14px; height: 10px; background: ${COLORS.projection.male}; border-radius: 2px;"></span>
            <span style="display: inline-block; width: 14px; height: 10px; background: ${COLORS.projection.female}; border-radius: 2px;"></span>
            <span>📈 Projektion / 🔬 Hypothese</span>
          </div>
        </div>
        <div id="legend-source-note" style="padding: 8px 10px; border-radius: 4px; border: 1px solid #e2e8f0; background: #f8fafc; line-height: 1.8;">
          Lade Quelleninformation…
        </div>
      </div>
    </div>
  `;

  try {
    const demography = await loadDemographyData();

    if (demography.years.length === 0) {
      container.innerHTML += '<p style="color: red; padding: 20px;">Keine demographischen Daten verfügbar.</p>';
      return;
    }

    selectedYear = demography.years[demography.years.length - 1];

    const dropdown = container.querySelector('#year-selector') as HTMLSelectElement;
    const slider   = container.querySelector('#year-slider') as HTMLInputElement;

    dropdown.innerHTML = demography.years
      .map(year => {
        const s = demography.sourceByYear.get(year);
        const tag = s?.isFullyOriginal ? ' ★' : s?.hasProjection ? ' ~' : '';
        return `<option value="${year}">${year}${tag}</option>`;
      })
      .join('');

    slider.min   = demography.years[0].toString();
    slider.max   = demography.years[demography.years.length - 1].toString();
    slider.value = selectedYear.toString();

    dropdown.addEventListener('change', (e) => {
      selectedYear = parseInt((e.target as HTMLSelectElement).value);
      updateChart(container, demography);
    });

    slider.addEventListener('input', (e) => {
      selectedYear = parseInt((e.target as HTMLInputElement).value);
      updateChart(container, demography);
    });

    updateChart(container, demography);
  } catch (error) {
    container.innerHTML += `<p style="color: red; padding: 20px;">Fehler: ${error}</p>`;
  }
}
