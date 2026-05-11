export function render(root: HTMLElement): void {
  const session = globalThis.__session?.current;

  if (!session || session.tables.size === 0) {
    root.innerHTML = `
      <div class="page-header">
        <h2>Visualisierungen</h2>
      </div>
      <div class="panel">
        <p style="color: #999; text-align: center; padding: 40px;">
          Keine Daten zum Visualisieren.
        </p>
      </div>
    `;
    return;
  }

  root.innerHTML = `
    <div class="page-header">
      <h2>Visualisierungen</h2>
      <span class="group-label">Armutsdaten visualisiert</span>
    </div>
    <div style="max-width: 1400px; margin: 0 auto;">
      <div id="chart-eu-poverty" style="margin-bottom: 3rem;"></div>
      <div id="chart-cohort-risk" style="margin-bottom: 3rem;"></div>
      <div id="chart-germany-trend" style="margin-bottom: 3rem;"></div>
    </div>
  `;

  // Render charts
  renderEUPovertyChart(session);
  renderCohortRiskChart(session);
  renderGermanyTrendChart(session);
}

function renderEUPovertyChart(session: any): void {
  const table = session.tables.get('eu_poverty_comparison');
  if (!table || !table.data) return;

  const container = document.getElementById('chart-eu-poverty');
  if (!container) return;

  // Prepare data - top 10 countries
  const data = table.data.slice(0, 10);

  const chartHTML = `
    <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h3 style="margin: 0 0 1.5rem 0; color: #333;">Top 10 EU-Länder nach Armutsquote (2024)</h3>
      <svg viewBox="0 0 1000 400" style="width: 100%; height: auto;">
        <!-- Y-axis -->
        <line x1="80" y1="20" x2="80" y2="320" stroke="#ddd" stroke-width="2"/>
        <!-- X-axis -->
        <line x1="80" y1="320" x2="950" y2="320" stroke="#ddd" stroke-width="2"/>
        
        <!-- Y-axis labels -->
        ${[0, 5, 10, 15, 20, 25].map(val => `
          <text x="70" y="${320 - (val * 280 / 25)}" text-anchor="end" font-size="12" fill="#666">${val}%</text>
        `).join('')}
        
        <!-- Bars -->
        ${data.map((row: any, idx: number) => {
          const barHeight = (row.poverty_rate / 25) * 280;
          const x = 100 + idx * 85;
          const isGermany = row.country === 'Deutschland';
          const color = isGermany ? '#ff6b6b' : '#4caf50';
          
          return `
            <rect x="${x}" y="${320 - barHeight}" width="70" height="${barHeight}" 
                  fill="${color}" opacity="0.8" rx="4"/>
            <text x="${x + 35}" y="340" text-anchor="middle" font-size="11" fill="#333">
              ${row.country.substring(0, 6)}
            </text>
            <text x="${x + 35}" y="${320 - barHeight - 8}" text-anchor="middle" font-size="12" font-weight="bold" fill="#333">
              ${row.poverty_rate}%
            </text>
          `;
        }).join('')}
      </svg>
      <p style="margin: 1.5rem 0 0 0; font-size: 0.85rem; color: #999;">
        <strong style="color: #ff6b6b;">Rot</strong> = Deutschland (Platz 9 mit 15,5%)
      </p>
    </div>
  `;

  container.innerHTML = chartHTML;
}

function renderCohortRiskChart(session: any): void {
  const table = session.tables.get('future_cohorts_risk');
  if (!table || !table.data) return;

  const container = document.getElementById('chart-cohort-risk');
  if (!container) return;

  const data = table.data;

  const chartHTML = `
    <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h3 style="margin: 0 0 1.5rem 0; color: #333;">Altersarmuts-Risiko nach Kohorte (1959-1989)</h3>
      <svg viewBox="0 0 1000 400" style="width: 100%; height: auto;">
        <!-- Y-axis -->
        <line x1="80" y1="20" x2="80" y2="320" stroke="#ddd" stroke-width="2"/>
        <!-- X-axis -->
        <line x1="80" y1="320" x2="950" y2="320" stroke="#ddd" stroke-width="2"/>
        
        <!-- Y-axis labels -->
        ${[0, 20, 40, 60, 80].map(val => `
          <text x="70" y="${320 - (val * 280 / 80)}" text-anchor="end" font-size="12" fill="#666">${val}%</text>
        `).join('')}
        
        <!-- Line chart -->
        ${data.map((row: any, idx: number) => {
          const startPct = parseInt(row.total_vulnerable_pct.split('-')[0]);
          const x = 100 + idx * 120;
          const y = 320 - (startPct * 280 / 80);
          return `<circle cx="${x}" cy="${y}" r="6" fill="#ff6b6b"/>`;
        }).join('')}
        
        ${data.map((row: any, idx: number) => {
          if (idx === 0) return '';
          const prevRow = data[idx - 1];
          const prevPct = parseInt(prevRow.total_vulnerable_pct.split('-')[0]);
          const currPct = parseInt(row.total_vulnerable_pct.split('-')[0]);
          const x1 = 100 + (idx - 1) * 120;
          const y1 = 320 - (prevPct * 280 / 80);
          const x2 = 100 + idx * 120;
          const y2 = 320 - (currPct * 280 / 80);
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ff6b6b" stroke-width="3"/>`;
        }).join('')}
        
        <!-- X-axis labels -->
        ${data.map((row: any, idx: number) => {
          const x = 100 + idx * 120;
          return `
            <text x="${x}" y="345" text-anchor="middle" font-size="11" fill="#333">
              ${row.birth_year}
            </text>
            <text x="${x}" y="365" text-anchor="middle" font-size="10" fill="#999">
              ${row.total_vulnerable_pct}%
            </text>
          `;
        }).join('')}
      </svg>
      <p style="margin: 1.5rem 0 0 0; font-size: 0.85rem; color: #999;">
        Vulnerable = Arm ODER nicht gute finanzielle Lage ODER materielle Entbehrung
      </p>
    </div>
  `;

  container.innerHTML = chartHTML;
}

function renderGermanyTrendChart(session: any): void {
  const table = session.tables.get('germany_poverty_trends');
  if (!table || !table.data) return;

  const container = document.getElementById('chart-germany-trend');
  if (!container) return;

  const data = table.data;

  const chartHTML = `
    <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h3 style="margin: 0 0 1.5rem 0; color: #333;">Deutschland: Armutstrend 2019-2024</h3>
      <svg viewBox="0 0 800 350" style="width: 100%; height: auto;">
        <!-- Grid -->
        <line x1="80" y1="20" x2="80" y2="280" stroke="#ddd" stroke-width="2"/>
        <line x1="80" y1="280" x2="750" y2="280" stroke="#ddd" stroke-width="2"/>
        
        <!-- Y-axis labels -->
        ${[0, 5, 10, 15, 20, 25].map(val => `
          <text x="70" y="${280 - (val * 240 / 25)}" text-anchor="end" font-size="11" fill="#666">${val}%</text>
        `).join('')}
        
        <!-- Bars -->
        ${data.map((row: any, idx: number) => {
          const x = 120 + idx * 200;
          const rel = row.germany_relative;
          const arope = row.germany_arope;
          
          const relHeight = (rel / 25) * 240;
          const aropeHeight = (arope / 25) * 240;
          
          return `
            <!-- Relative poverty -->
            <rect x="${x}" y="${280 - relHeight}" width="70" height="${relHeight}" 
                  fill="#2196f3" opacity="0.7" rx="3"/>
            <text x="${x + 35}" y="${280 - relHeight - 5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">
              ${rel}%
            </text>
            
            <!-- AROPE -->
            <rect x="${x + 80}" y="${280 - aropeHeight}" width="70" height="${aropeHeight}" 
                  fill="#ff9800" opacity="0.7" rx="3"/>
            <text x="${x + 115}" y="${280 - aropeHeight - 5}" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">
              ${arope}%
            </text>
            
            <text x="${x + 57.5}" y="310" text-anchor="middle" font-size="12" fill="#333">
              ${row.year}
            </text>
          `;
        }).join('')}
      </svg>
      <div style="margin-top: 1.5rem; display: flex; gap: 2rem; font-size: 0.9rem;">
        <div><span style="display: inline-block; width: 16px; height: 16px; background: #2196f3; margin-right: 8px; border-radius: 2px;"></span>Relative Armut (60% Median)</div>
        <div><span style="display: inline-block; width: 16px; height: 16px; background: #ff9800; margin-right: 8px; border-radius: 2px;"></span>AROPE (Armut, Unterbeschäftigung, materielle Entbehrung)</div>
      </div>
    </div>
  `;

  container.innerHTML = chartHTML;
}
