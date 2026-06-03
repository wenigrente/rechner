import * as d3 from 'd3';
import { fetchResource } from '../../core/resources';

// source values in the CSV (column 6):
// 'original'      → Volkszählungen / amtliche Statistiken
// 'reconstructed' → interpolierte Werte für Lückenjahre
// 'projection'    → Vorausberechnung (Statistisches Bundesamt)
type DataSource = 'original' | 'reconstructed' | 'projection';

function parseSource(raw: string): DataSource {
  if (raw === 'original') return 'original';
  if (raw === 'reconstructed') return 'reconstructed';
  return 'projection'; // any other value (e.g. 'projection', 'projection_G2L2W1')
}

// Color pairs [male, female] per source type
const COLORS: Record<DataSource, { male: string; female: string }> = {
  original:      { male: '#3b82f6', female: '#ec4899' }, // saturated blue / pink
  reconstructed: { male: '#93c5fd', female: '#f9a8d4' }, // light tint blue / pink
  projection:    { male: '#a78bfa', female: '#fbbf24' }, // violet / amber
};

const BAR_OPACITY = 0.85;

interface DemographyData {
  jahr: number;
  alter: number;
  maennlich: number;
  weiblich: number;
  gesamt: number;
  source: DataSource;
  sourceRaw: string;
}

interface SourceSummary {
  original: number;
  reconstructed: number;
  projection: number;
  projectionLabel: string;
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

async function loadDemographyData(): Promise<ParsedDemography> {
  if (demographyCache) return demographyCache;

  // Switch key to 'demographie_wavelet' to use the smoothed dataset instead.
  const csv = await fetchResource('demographie_complete');

  const lines = csv.trim().split('\n');
  const dataByYear = new Map<number, DemographyData[]>();
  const yearsSet = new Set<number>();
  let maxValue = 0;

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim());
    if (parts.length < 5) continue;

    const jahr = parseInt(parts[0]);
    const alter = parseInt(parts[1]);
    const maennlich = parseInt(parts[2]) || 0;
    const weiblich = parseInt(parts[3]) || 0;
    const gesamt = parseInt(parts[4]) || 0;
    const sourceRaw = parts[5] ?? '';
    const source = parseSource(sourceRaw);

    if (isNaN(jahr) || isNaN(alter)) continue;

    yearsSet.add(jahr);
    maxValue = Math.max(maxValue, maennlich, weiblich);
    if (!dataByYear.has(jahr)) dataByYear.set(jahr, []);
    dataByYear.get(jahr)!.push({ jahr, alter, maennlich, weiblich, gesamt, source, sourceRaw });
  }

  const years = Array.from(yearsSet).sort((a, b) => a - b);
  if (years.length === 0) throw new Error('No valid demographic data found in CSV');

  const sourceByYear = new Map<number, SourceSummary>();
  for (const [year, rows] of dataByYear) {
    const orig  = rows.filter(r => r.source === 'original').length;
    const recon = rows.filter(r => r.source === 'reconstructed').length;
    const proj  = rows.filter(r => r.source === 'projection').length;
    const projLabel = rows.find(r => r.source === 'projection')?.sourceRaw ?? '';
    sourceByYear.set(year, {
      original: orig,
      reconstructed: recon,
      projection: proj,
      projectionLabel: projLabel,
      isFullyOriginal: recon === 0 && proj === 0,
      hasProjection: proj > 0,
    });
  }

  demographyCache = { years, dataByYear, maxValue, sourceByYear };
  console.log(`✓ Loaded ${years.length} years of demographic data (up to ${years[years.length - 1]})`);
  return demographyCache;
}

function renderD3Pyramid(
  container: HTMLElement,
  data: DemographyData[],
  year: number,
  maxValue: number,
): void {
  const chartContainer = container.querySelector('#demography-chart') as HTMLDivElement;
  if (!chartContainer) return;
  chartContainer.innerHTML = '';

  const margin = { top: 30, right: 20, bottom: 30, left: 40 };
  const width = 700 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  const sortedData = [...data].sort((a, b) => a.alter - b.alter);

  const svg = d3.select(chartContainer)
    .append('svg')
    .attr('viewBox', `0 0 700 400`)
    .attr('width', '100%')
    .attr('height', '400')
    .style('max-width', '100%');

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  const xScale = d3.scaleLinear().domain([-maxValue, maxValue]).range([0, width]);
  const yScale = d3.scaleBand()
    .domain(sortedData.map(d => d.alter.toString()))
    .range([height, 0])
    .padding(0.05);

  const xAxis = d3.axisBottom(xScale)
    .tickFormat((d: any) => {
      const abs = Math.abs(d);
      if (abs >= 1_000_000) return `${(abs / 1_000_000).toFixed(0)}M`;
      if (abs >= 1_000) return `${(abs / 1_000).toFixed(0)}k`;
      return d;
    })
    .tickSize(-height);

  const yAxis = d3.axisLeft(yScale)
    .tickValues(sortedData.filter((_, i) => i % 5 === 0).map(d => d.alter.toString()));

  g.append('g').attr('transform', `translate(0,${height})`).call(xAxis)
    .style('font-size', '11px').select('.domain').remove();
  g.selectAll('.tick line').style('stroke', '#f0f0f0');
  g.append('g').call(yAxis).style('font-size', '10px').select('.domain').remove();

  g.append('line')
    .attr('x1', xScale(0)).attr('x2', xScale(0))
    .attr('y1', 0).attr('y2', height)
    .style('stroke', '#ccc').style('stroke-width', '1px').style('stroke-dasharray', '4,4');

  const tooltipLabel = (d: DemographyData): string => {
    if (d.source === 'original') return '📋 Originaldaten';
    if (d.source === 'reconstructed') return '🔁 Rekonstruiert';
    return `📈 Projektion (${d.sourceRaw})`;
  };

  g.selectAll('.bar-male')
    .data(sortedData).enter().append('rect')
    .attr('class', 'bar-male')
    .attr('x', d => xScale(-d.maennlich))
    .attr('y', d => yScale(d.alter.toString()) || 0)
    .attr('width', d => xScale(0) - xScale(-d.maennlich))
    .attr('height', yScale.bandwidth())
    .style('fill', d => COLORS[d.source].male)
    .style('opacity', BAR_OPACITY)
    .on('mouseover', function(event: MouseEvent, d: DemographyData) {
      d3.select(this).style('opacity', 1);
      showTooltip(event, `Alter ${d.alter} | Männlich: ${formatNumber(d.maennlich)}\n${tooltipLabel(d)}`);
    })
    .on('mousemove', (event: MouseEvent) => moveTooltip(event))
    .on('mouseout', function() { d3.select(this).style('opacity', BAR_OPACITY); hideTooltip(); });

  g.selectAll('.bar-female')
    .data(sortedData).enter().append('rect')
    .attr('class', 'bar-female')
    .attr('x', xScale(0))
    .attr('y', d => yScale(d.alter.toString()) || 0)
    .attr('width', d => xScale(d.weiblich) - xScale(0))
    .attr('height', yScale.bandwidth())
    .style('fill', d => COLORS[d.source].female)
    .style('opacity', BAR_OPACITY)
    .on('mouseover', function(event: MouseEvent, d: DemographyData) {
      d3.select(this).style('opacity', 1);
      showTooltip(event, `Alter ${d.alter} | Weiblich: ${formatNumber(d.weiblich)}\n${tooltipLabel(d)}`);
    })
    .on('mousemove', (event: MouseEvent) => moveTooltip(event))
    .on('mouseout', function() { d3.select(this).style('opacity', BAR_OPACITY); hideTooltip(); });

  svg.append('text')
    .attr('x', 350).attr('y', 20).attr('text-anchor', 'middle')
    .style('font-size', '16px').style('font-weight', 'bold').style('fill', '#333')
    .text(`Bevölkerungspyramide Deutschland ${year}`);
}

// Tooltip helpers
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
  const t = getTooltip();
  t.textContent = text;
  t.style.display = 'block';
  moveTooltip(event);
}

function moveTooltip(event: MouseEvent): void {
  const t = getTooltip();
  t.style.left = `${event.clientX + 14}px`;
  t.style.top = `${event.clientY - 30}px`;
}

function hideTooltip(): void {
  if (tooltip) tooltip.style.display = 'none';
}

function renderStatistics(container: HTMLElement, data: DemographyData[], src: SourceSummary): void {
  const statsContainer = container.querySelector('#demography-stats') as HTMLDivElement;
  if (!statsContainer) return;

  const totalMales = data.reduce((sum, d) => sum + d.maennlich, 0);
  const totalFemales = data.reduce((sum, d) => sum + d.weiblich, 0);
  const totalPopulation = totalMales + totalFemales;
  const malePercent = ((totalMales / totalPopulation) * 100).toFixed(1);
  const femalePercent = ((totalFemales / totalPopulation) * 100).toFixed(1);

  let sourceCard: string;
  if (src.hasProjection) {
    sourceCard = `<div style="padding: 12px; background: #f5f3ff; border-radius: 4px; border-left: 3px solid #8b5cf6;">
      <div style="font-size: 11px; color: #666; margin-bottom: 3px;">Datenquelle</div>
      <div style="font-size: 13px; font-weight: bold; color: #5b21b6;">📈 Projektion</div>
      <div style="font-size: 10px; color: #6b7280;">${src.projectionLabel}</div>
    </div>`;
  } else if (src.isFullyOriginal) {
    sourceCard = `<div style="padding: 12px; background: #f0fdf4; border-radius: 4px; border-left: 3px solid #10b981;">
      <div style="font-size: 11px; color: #666; margin-bottom: 3px;">Datenquelle</div>
      <div style="font-size: 13px; font-weight: bold; color: #065f46;">📋 Originaldaten</div>
      <div style="font-size: 10px; color: #6b7280;">Volkszählung / Statistisches Amt</div>
    </div>`;
  } else {
    sourceCard = `<div style="padding: 12px; background: #fef9ec; border-radius: 4px; border-left: 3px solid #f59e0b;">
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
        <div style="font-size: 10px; color: #999;">${malePercent}%</div>
      </div>
      <div style="padding: 12px; background: #fdf2f8; border-radius: 4px; border-left: 3px solid #ec4899;">
        <div style="font-size: 11px; color: #666; margin-bottom: 3px;">Weiblich</div>
        <div style="font-size: 16px; font-weight: bold; color: #ec4899;">${formatNumber(totalFemales)}</div>
        <div style="font-size: 10px; color: #999;">${femalePercent}%</div>
      </div>
      <div style="padding: 12px; background: #f0fdf4; border-radius: 4px; border-left: 3px solid #10b981;">
        <div style="font-size: 11px; color: #666; margin-bottom: 3px;">Gesamt</div>
        <div style="font-size: 16px; font-weight: bold; color: #10b981;">${formatNumber(totalPopulation)}</div>
        <div style="font-size: 10px; color: #999;">100%</div>
      </div>
      ${sourceCard}
    </div>
  `;
}

function updateLegend(container: HTMLElement, src: SourceSummary): void {
  const el = container.querySelector('#legend-source-note') as HTMLElement;
  if (!el) return;

  if (src.hasProjection) {
    el.style.background = '#f5f3ff';
    el.style.borderColor = '#c4b5fd';
    el.innerHTML = `<strong>📈 Projektion</strong> (violett/amber) — Vorausberechnung des Statistischen Bundesamts (${src.projectionLabel}).`;
  } else if (src.isFullyOriginal) {
    el.style.background = '#f0fdf4';
    el.style.borderColor = '#86efac';
    el.innerHTML = `<strong>📋 Originaldaten</strong> (satte Farbe) — Volkszählungen &amp; amtliche Statistiken.`;
  } else {
    el.style.background = '#fef9ec';
    el.style.borderColor = '#fcd34d';
    el.innerHTML = `<strong>📋 Originaldaten</strong> (satte Farbe) — ${src.original} Altersgruppen.<br>
      <strong>🔁 Rekonstruiert</strong> (helle Farbe) — ${src.reconstructed} Altersgruppen.`;
  }
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(0) + 'k';
  return num.toString();
}

function updateChart(container: HTMLElement, demography: ParsedDemography): void {
  if (!selectedYear || !demography.dataByYear.has(selectedYear)) return;

  const yearData = demography.dataByYear.get(selectedYear)!;
  const src = demography.sourceByYear.get(selectedYear)!;

  renderStatistics(container, yearData, src);
  renderD3Pyramid(container, yearData, selectedYear, demography.maxValue);
  updateLegend(container, src);

  const sourceIndicator = container.querySelector('#source-indicator') as HTMLSpanElement;
  if (sourceIndicator) {
    if (src.hasProjection) {
      sourceIndicator.textContent = '📈 Projektion';
      sourceIndicator.style.background = '#ede9fe';
      sourceIndicator.style.color = '#5b21b6';
      sourceIndicator.style.border = '1px solid #c4b5fd';
    } else if (src.isFullyOriginal) {
      sourceIndicator.textContent = '📋 Originaldaten';
      sourceIndicator.style.background = '#dcfce7';
      sourceIndicator.style.color = '#065f46';
      sourceIndicator.style.border = '1px solid #86efac';
    } else {
      sourceIndicator.textContent = '🔁 Rekonstruiert';
      sourceIndicator.style.background = '#fef9ec';
      sourceIndicator.style.color = '#92400e';
      sourceIndicator.style.border = '1px solid #fcd34d';
    }
  }

  const dropdown = container.querySelector('#year-selector') as HTMLSelectElement;
  const slider = container.querySelector('#year-slider') as HTMLInputElement;
  const yearLabel = container.querySelector('#year-label') as HTMLDivElement;

  if (dropdown) dropdown.value = selectedYear.toString();
  if (slider) slider.value = selectedYear.toString();
  if (yearLabel) yearLabel.textContent = selectedYear.toString();
}

export async function render(container: HTMLElement): Promise<void> {
  container.innerHTML = `
    <div style="padding: 20px;">
      <h1 style="margin: 0 0 8px 0; font-size: 22px;">Bevölkerungsdemographie</h1>
      <p style="margin: 0 0 20px 0; color: #666; font-size: 13px;">
        Interaktive Bevölkerungspyramide mit Altersverteilung nach Geschlecht, 1871–2070.
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
            <span>📈 Projektion</span>
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
    const slider = container.querySelector('#year-slider') as HTMLInputElement;

    dropdown.innerHTML = demography.years
      .map(year => {
        const s = demography.sourceByYear.get(year);
        const tag = s?.isFullyOriginal ? ' ★' : s?.hasProjection ? ' ~' : '';
        return `<option value="${year}">${year}${tag}</option>`;
      })
      .join('');

    slider.min = demography.years[0].toString();
    slider.max = demography.years[demography.years.length - 1].toString();
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
