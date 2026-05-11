const STORAGE_KEY = 'calculator-state';

function loadState(): Record<string, number> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load calculator state:', e);
  }
  return {
    baseLevel: 1000,
    gamma: 70,
    alpha: 60,
    kappa: 10,
    beta: 15,
    pi: 20,
  };
}

function saveState(state: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save calculator state:', e);
  }
}

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-header">
      <h2>Rentenniveau-Rechner</h2>
      <span class="group-label">Berechne dein realistisches Renteneinkommen</span>
    </div>
    <div style="max-width: 1200px; margin: 0 auto;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <!-- Inputs -->
        <div>
          <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h3 style="margin: 0; color: #333;">Parameter eingeben</h3>
              <button id="btn-reset" style="
                padding: 6px 12px;
                background: #f44336;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 0.85rem;
                font-weight: 500;
              ">🔄 Zurücksetzen</button>
            </div>
            
            <!-- Base pension level -->
            <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 2px solid #eee;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                💶 Mittleres Rentenniveau
              </label>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span style="font-weight: 600;">€</span>
                <input type="number" id="base-level" value="1000" min="500" max="5000" step="100"
                  style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
              </div>
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Durchschnittliches Renteneinkommen als Basis (2024: ca. 1.000€ für Einzelperson)
              </p>
            </div>

            <!-- Gamma -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                γ (Gamma) — Leistungsquote der Umlagerente
              </label>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input type="range" id="gamma" min="20" max="100" value="70" step="1"
                  style="flex: 1; cursor: pointer;">
                <span id="gamma-display" style="min-width: 70px; text-align: right; font-weight: bold; color: #2196f3;">70%</span>
              </div>
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Wie viel % vom Eingezahlten bekommt er zurück? (2024: ~70%, 2040: ~50%)
              </p>
            </div>

            <!-- Alpha -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                α (Alpha) — Anteil Umlagerente (Gesetzliche Rente)
              </label>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input type="range" id="alpha" min="0" max="100" value="60" 
                  style="flex: 1; cursor: pointer;">
                <span id="alpha-display" style="min-width: 50px; text-align: right; font-weight: bold; color: #2196f3;">60%</span>
              </div>
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Wie viel des Renteneinkommens kommt aus Umlageverfahren?
              </p>
            </div>

            <!-- Kappa -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                κ (Kappa) — Kapitaldeckung (Generationenkapital)
              </label>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input type="range" id="kappa" min="0" max="50" value="10" 
                  style="flex: 1; cursor: pointer;">
                <span id="kappa-display" style="min-width: 50px; text-align: right; font-weight: bold; color: #9c27b0;">10%</span>
              </div>
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Staatliche Kapitaldeckung zur Stützung der Umlagerente
              </p>
            </div>

            <!-- Beta -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                β (Beta) — Betriebliche Altersvorsorge
              </label>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input type="range" id="beta" min="0" max="50" value="15" 
                  style="flex: 1; cursor: pointer;">
                <span id="beta-display" style="min-width: 50px; text-align: right; font-weight: bold; color: #4caf50;">15%</span>
              </div>
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Firmenrente, Pensionsrückstellungen
              </p>
            </div>

            <!-- Pi -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                π (Pi) — Privates Vermögen
              </label>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <input type="range" id="pi" min="0" max="50" value="20" 
                  style="flex: 1; cursor: pointer;">
                <span id="pi-display" style="min-width: 50px; text-align: right; font-weight: bold; color: #ff9800;">20%</span>
              </div>
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Ersparnisse, Immobilien, Kapitalerträge
              </p>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div>
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; border-radius: 8px; color: white;">
            <h3 style="margin: 0 0 1.5rem 0;">Ergebnis</h3>
            
            <!-- Main result: Monthly pension -->
            <div style="background: rgba(255,255,255,0.15); padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
              <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">Monatliches Renteneinkommen</p>
              <p id="monthly-pension" style="margin: 0; font-size: 2.5rem; font-weight: bold;">1.500€</p>
              <p id="pension-status" style="margin: 0.5rem 0 0 0; font-size: 0.85rem; opacity: 0.8;">Normal</p>
            </div>

            <!-- Breakdown -->
            <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
              <h4 style="margin: 0 0 1rem 0; font-size: 0.95rem;">Zusammensetzung</h4>
              <div id="breakdown" style="font-size: 0.9rem; line-height: 2;">
                <!-- Will be filled by JavaScript -->
              </div>
            </div>

            <!-- Multiplier -->
            <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
              <p style="margin: 0 0 0.5rem 0; font-size: 0.85rem; opacity: 0.9;">Faktor zum Basiseinkommen</p>
              <p id="factor" style="margin: 0; font-size: 1.8rem; font-weight: bold;">1.5x</p>
            </div>

            <!-- Status -->
            <div id="status-box" style="background: rgba(76, 175, 80, 0.2); padding: 1rem; border-radius: 6px; border-left: 4px solid #4caf50;">
              <p style="margin: 0; font-size: 0.9rem; font-weight: 600;">
                ✅ Gutes Rentenniveau (1.0x - 1.9x)
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div style="margin-top: 2rem; background: #f5f5f5; padding: 2rem; border-radius: 8px;">
        <h3 style="margin: 0 0 1rem 0; color: #333;">Wie funktioniert der Rechner?</h3>
        <p style="margin: 0 0 1rem 0; color: #666; line-height: 1.6;">
          <strong>Formel:</strong> Renteneinkommen = Basislevel × Faktor
        </p>
        <p style="margin: 0 0 1rem 0; color: #666; line-height: 1.6;">
          <strong>Faktor = (α × γ) + ((1 - α) × κ) + β + π</strong>
        </p>
        <ul style="margin: 0; color: #666; line-height: 1.8; padding-left: 1.5rem;">
          <li><strong>α × γ:</strong> Umlagerente mit Leistungsquote (z.B. 60% × 70% = 42%)</li>
          <li><strong>(1 - α) × κ:</strong> Staatliche Kapitaldeckung (z.B. 40% × 10% = 4%)</li>
          <li><strong>β:</strong> Betriebliche AV zusätzlich (z.B. +15%)</li>
          <li><strong>π:</strong> Privates Vermögen zusätzlich (z.B. +20%)</li>
        </ul>
        <p style="margin: 1.5rem 0 0 0; color: #666; line-height: 1.6;">
          <strong>Bewertung:</strong> 
          <span style="color: #4caf50;">1.0-1.9x = Gut</span> | 
          <span style="color: #ff9800;">2.0-2.9x = Sehr gut</span> | 
          <span style="color: #2196f3;">3.0x+ = Exzellent</span> | 
          <span style="color: #f44336;">&lt;1.0x = Kritisch</span>
        </p>
      </div>
    </div>
  `;

  setupCalculator();
}

function setupCalculator(): void {
  const state = loadState();

  const baseLevelInput = document.getElementById('base-level') as HTMLInputElement;
  const gammaInput = document.getElementById('gamma') as HTMLInputElement;
  const alphaInput = document.getElementById('alpha') as HTMLInputElement;
  const kappaInput = document.getElementById('kappa') as HTMLInputElement;
  const betaInput = document.getElementById('beta') as HTMLInputElement;
  const piInput = document.getElementById('pi') as HTMLInputElement;
  const resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;

  // Set initial values from storage
  baseLevelInput.value = state.baseLevel.toString();
  gammaInput.value = state.gamma.toString();
  alphaInput.value = state.alpha.toString();
  kappaInput.value = state.kappa.toString();
  betaInput.value = state.beta.toString();
  piInput.value = state.pi.toString();

  const gammaDisplay = document.getElementById('gamma-display')!;
  const alphaDisplay = document.getElementById('alpha-display')!;
  const kappaDisplay = document.getElementById('kappa-display')!;
  const betaDisplay = document.getElementById('beta-display')!;
  const piDisplay = document.getElementById('pi-display')!;

  const monthlyPension = document.getElementById('monthly-pension')!;
  const pensionStatus = document.getElementById('pension-status')!;
  const breakdown = document.getElementById('breakdown')!;
  const factorDisplay = document.getElementById('factor')!;
  const statusBox = document.getElementById('status-box')!;

  function updateDisplay(): void {
    const baseLevel = parseFloat(baseLevelInput.value) || 1000;
    const gamma = parseFloat(gammaInput.value);
    const alpha = parseFloat(alphaInput.value);
    const kappa = parseFloat(kappaInput.value);
    const beta = parseFloat(betaInput.value);
    const pi = parseFloat(piInput.value);

    // Save state
    saveState({ baseLevel, gamma, alpha, kappa, beta, pi });

    // Update slider displays
    gammaDisplay.textContent = `${gamma.toFixed(0)}%`;
    alphaDisplay.textContent = `${alpha.toFixed(0)}%`;
    kappaDisplay.textContent = `${kappa.toFixed(0)}%`;
    betaDisplay.textContent = `${beta.toFixed(0)}%`;
    piDisplay.textContent = `${pi.toFixed(0)}%`;

    // Calculate components (as percentages of 100)
    const umlagePart = (alpha / 100) * (gamma / 100) * 100; // α × γ
    const capitalPart = ((100 - alpha) / 100) * (kappa / 100) * 100; // (1-α) × κ
    const betaPart = beta; // β (direct addition)
    const piPart = pi; // π (direct addition)

    // Total factor (divide by 100 to get multiplier)
    const totalFactor = (umlagePart + capitalPart + betaPart + piPart) / 100;

    // Calculate monthly pension
    const monthly = baseLevel * totalFactor;

    // Update displays
    monthlyPension.textContent = `${monthly.toFixed(0)}€`;
    factorDisplay.textContent = `${totalFactor.toFixed(2)}x`;

    // Update breakdown
    breakdown.innerHTML = `
      <div style="display: flex; justify-content: space-between;">
        <span>α × γ (Umlage)</span>
        <strong>${umlagePart.toFixed(1)}%</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>(1-α) × κ (Kapitaldeckung)</span>
        <strong>${capitalPart.toFixed(1)}%</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>β (Betriebliche AV)</span>
        <strong>${betaPart.toFixed(1)}%</strong>
      </div>
      <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 0.5rem;">
        <span>π (Privates Vermögen)</span>
        <strong>${piPart.toFixed(1)}%</strong>
      </div>
    `;

    // Status based on factor
    let status = '';
    let statusColor = '';
    if (totalFactor < 1.0) {
      status = '⚠️ Kritisch (< 1.0x)';
      statusColor = 'rgba(244, 67, 54, 0.2)';
    } else if (totalFactor < 2.0) {
      status = '✅ Gut (1.0x - 1.9x)';
      statusColor = 'rgba(76, 175, 80, 0.2)';
    } else if (totalFactor < 3.0) {
      status = '🎯 Sehr gut (2.0x - 2.9x)';
      statusColor = 'rgba(255, 152, 0, 0.2)';
    } else {
      status = '⭐ Exzellent (3.0x+)';
      statusColor = 'rgba(33, 150, 243, 0.2)';
    }

    pensionStatus.textContent = status;
    statusBox.style.background = statusColor;
    statusBox.innerHTML = `<p style="margin: 0; font-size: 0.9rem; font-weight: 600;">${status}</p>`;
  }

  baseLevelInput.addEventListener('input', updateDisplay);
  gammaInput.addEventListener('input', updateDisplay);
  alphaInput.addEventListener('input', updateDisplay);
  kappaInput.addEventListener('input', updateDisplay);
  betaInput.addEventListener('input', updateDisplay);
  piInput.addEventListener('input', updateDisplay);

  resetBtn.addEventListener('click', () => {
    baseLevelInput.value = '1000';
    gammaInput.value = '70';
    alphaInput.value = '60';
    kappaInput.value = '10';
    betaInput.value = '15';
    piInput.value = '20';
    updateDisplay();
  });

  // Initial display
  updateDisplay();
}
