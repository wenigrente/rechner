const STORAGE_KEY = 'rentenniveau-rechner-v4';

function loadState(): Record<string, number> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        baseLvl: parsed.baseLvl ?? 1500,
        gamma: parsed.gamma ?? 0.70,
        kappa: parsed.kappa ?? 0.10,
        beta: parsed.beta ?? 0.15,
        pi: parsed.pi ?? 0.20,
        medianIncome: parsed.medianIncome ?? 1500,
      };
    }
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
  return {
    baseLvl: 1500,
    gamma: 0.70,
    kappa: 0.10,
    beta: 0.15,
    pi: 0.20,
    medianIncome: 1500,
  };
}

function saveState(state: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state:', e);
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

            <!-- Durchschnittsrentenniveau (RN) -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                💶 Mittleres Rentenniveau
              </label>
              <div style="display: flex; gap: 0.5rem;">
                <input type="number" id="base-lvl" value="1500" min="500" step="50"
                  style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                <span style="padding: 8px 12px; color: #999; font-weight: 600;">€</span>
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
              <input type="number" id="gamma" value="0.70" min="0" step="0.01"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Wie viel % vom Eingezahlten bekommt er zurück? (2024: ~70%, 2040: ~50%)
              </p>
            </div>


            <!-- Kappa -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                κ (Kappa) — Kapitaldeckung (Generationenkapital)
              </label>
              <input type="number" id="kappa" value="0.10" min="0" step="0.01"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Staatliche Kapitaldeckung zur Stützung der Umlagerente
              </p>
            </div>
            
            <!-- Alpha (calculated, info only) -->
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f0f0f0; border-radius: 4px; border-left: 4px solid #1e3c72;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                α (Alpha) — Anteil Umlagerente (berechnet)
              </label>
              <div id="alpha-display" style="font-size: 1.3rem; font-weight: bold; color: #1e3c72;">
                87.5%
              </div>
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Wie viel des Renteneinkommens kommt aus Umlageverfahren? (α = γ / (γ + κ))
              </p>
            </div>

            <!-- Beta -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                β (Beta) — Betriebliche Altersvorsorge
              </label>
              <input type="number" id="beta" value="0.15" min="0" step="0.01"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Firmenrente, Pensionsrückstellungen
              </p>
            </div>

            <!-- Pi -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                π (Pi) — Privates Vermögen
              </label>
              <input type="number" id="pi" value="0.20" min="0" step="0.01"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Ersparnisse, Immobilien, Kapitalerträge
              </p>
            </div>

            <!-- Median Income -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                📊 Rentenmedian (Vergleichswert)
              </label>
              <div style="display: flex; gap: 0.5rem;">
                <input type="number" id="median-income" value="1500" min="500" step="50"
                  style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                <span style="padding: 8px 12px; color: #999; font-weight: 600;">€</span>
              </div>
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Durchschnittliche Rente in Deutschland zum Vergleich
              </p>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div>
          <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 2rem; border-radius: 8px; color: white;">
            <h3 style="margin: 0 0 1.5rem 0;">Ergebnis</h3>

            <!-- Monthly Income -->
            <div style="background: rgba(255,255,255,0.15); padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
              <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">Monatliches Renteneinkommen</p>
              <p id="monthly-income" style="margin: 0; font-size: 2.5rem; font-weight: bold;">1.575€</p>
              <p id="median-comparison" style="margin: 0.5rem 0 0 0; font-size: 0.85rem; opacity: 0.9;">
                +5.0% über Median (1.500€)
              </p>
            </div>

            <!-- Visualization -->
            <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
              <h4 style="margin: 0 0 1rem 0;">Zusammensetzung</h4>
              <div id="bar-chart" style="display: flex; height: 40px; border-radius: 4px; overflow: hidden; margin-bottom: 1rem;">
                <!-- Bars will be inserted here -->
              </div>
              <div id="breakdown" style="font-size: 0.85rem; line-height: 2;">
                <!-- Breakdown items -->
              </div>
            </div>

            <!-- Staatlicher Anteil -->
            <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 6px;">
              <p style="margin: 0 0 0.5rem 0; font-size: 0.85rem; opacity: 0.9;">Staatlicher Anteil (γ + κ)</p>
              <p id="staatlich" style="margin: 0; font-size: 1.5rem; font-weight: bold;">1.200€ (76.2%)</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div style="margin-top: 2rem; background: #f5f5f5; padding: 2rem; border-radius: 8px;">
        <h3 style="margin: 0 0 1rem 0; color: #333;">Formel</h3>
        <p style="margin: 0 0 1rem 0; color: #666; line-height: 1.6; font-family: monospace; font-size: 1.05rem;">
          <strong>Renteneinkommen = RN × [α×γ + (1-α)×κ + β + π]</strong>
        </p>
        <p style="margin: 0; color: #999; font-size: 0.9rem;">
          mit: α = γ / (γ + κ) | RN = Durchschnittsrentenniveau | γ = Umlage | κ = Kapitaldeckung | β = Betriebliche AV | π = Privates Vermögen
        </p>
      </div>
    </div>
  `;

  setupCalculator();
}

function setupCalculator(): void {
  const state = loadState();

  const baseLvlInput = document.getElementById('base-lvl') as HTMLInputElement;
  const gammaInput = document.getElementById('gamma') as HTMLInputElement;
  const kappaInput = document.getElementById('kappa') as HTMLInputElement;
  const betaInput = document.getElementById('beta') as HTMLInputElement;
  const piInput = document.getElementById('pi') as HTMLInputElement;
  const medianIncomeInput = document.getElementById('median-income') as HTMLInputElement;
  const resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;

  baseLvlInput.value = state.baseLvl.toString();
  gammaInput.value = state.gamma.toFixed(2);
  kappaInput.value = state.kappa.toFixed(2);
  betaInput.value = state.beta.toFixed(2);
  piInput.value = state.pi.toFixed(2);
  medianIncomeInput.value = state.medianIncome.toString();

  const alphaDisplay = document.getElementById('alpha-display')!;
  const monthlyIncomeDisplay = document.getElementById('monthly-income')!;
  const medianComparisonDisplay = document.getElementById('median-comparison')!;
  const barChartDisplay = document.getElementById('bar-chart')!;
  const breakdownDisplay = document.getElementById('breakdown')!;
  const staatlichDisplay = document.getElementById('staatlich')!;

  function updateDisplay(): void {
    const baseLvl = parseFloat(baseLvlInput.value) ?? 1500;
    const gamma = parseFloat(gammaInput.value) ?? 0.70;
    const kappa = parseFloat(kappaInput.value) ?? 0.10;
    const beta = parseFloat(betaInput.value) ?? 0.15;
    const pi = parseFloat(piInput.value) ?? 0.20;
    const medianIncome = parseFloat(medianIncomeInput.value) ?? 1500;

    saveState({ baseLvl, gamma, kappa, beta, pi, medianIncome });

    // Calculate alpha
    const alpha = gamma / (gamma + kappa);
    
    // Calculate components in € (relative to baseLvl)
    const alphaGamma = alpha * gamma;
    const oneMinusAlphaKappa = (1 - alpha) * kappa;
    const staatlich = alphaGamma + oneMinusAlphaKappa;
    const total = alphaGamma + oneMinusAlphaKappa + beta + pi;

    // Monthly income
    const monthlyIncome = baseLvl * total;

    // Percentages for bar chart
    const alphaGammaPercent = (alphaGamma / total) * 100;
    const oneMinusAlphaKappaPercent = (oneMinusAlphaKappa / total) * 100;
    const betaPercent = (beta / total) * 100;
    const piPercent = (pi / total) * 100;

    // Update alpha display
    alphaDisplay.textContent = `${(alpha * 100).toFixed(1)}%`;

    // Update monthly income
    monthlyIncomeDisplay.textContent = `${monthlyIncome.toFixed(0)}€`;

    // Median comparison
    const percentDiff = ((monthlyIncome - medianIncome) / medianIncome) * 100;
    medianComparisonDisplay.textContent = percentDiff >= 0 
      ? `+${percentDiff.toFixed(1)}% über Median (${medianIncome.toFixed(0)}€)`
      : `${percentDiff.toFixed(1)}% unter Median (${medianIncome.toFixed(0)}€)`;

    // Bar chart
    barChartDisplay.innerHTML = `
      <div style="flex: ${alphaGammaPercent}; background: #7cb9e8; border-right: 2px solid white;" title="γ Umlage"></div>
      <div style="flex: ${oneMinusAlphaKappaPercent}; background: #5b9bd5; border-right: 2px solid white;" title="κ Kapitaldeckung"></div>
      <div style="flex: ${betaPercent}; background: #70ad47; border-right: 2px solid white;" title="β Betriebliche AV"></div>
      <div style="flex: ${piPercent}; background: #ffc000;" title="π Privates Vermögen"></div>
    `;

    // Breakdown
    breakdownDisplay.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 16px; height: 16px; background: #7cb9e8; border-radius: 2px;"></div>
          <span>γ (Umlage)</span>
        </div>
        <strong>${(baseLvl * alphaGamma).toFixed(0)}€ (${alphaGammaPercent.toFixed(1)}%)</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 16px; height: 16px; background: #5b9bd5; border-radius: 2px;"></div>
          <span>κ (Kapitaldeckung)</span>
        </div>
        <strong>${(baseLvl * oneMinusAlphaKappa).toFixed(0)}€ (${oneMinusAlphaKappaPercent.toFixed(1)}%)</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 16px; height: 16px; background: #70ad47; border-radius: 2px;"></div>
          <span>β (Betriebliche AV)</span>
        </div>
        <strong>${(baseLvl * beta).toFixed(0)}€ (${betaPercent.toFixed(1)}%)</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <div style="width: 16px; height: 16px; background: #ffc000; border-radius: 2px;"></div>
          <span>π (Privates Vermögen)</span>
        </div>
        <strong>${(baseLvl * pi).toFixed(0)}€ (${piPercent.toFixed(1)}%)</strong>
      </div>
    `;

    // Staatlicher Anteil
    const staatlichPercent = (staatlich / total) * 100;
    staatlichDisplay.textContent = `${(baseLvl * staatlich).toFixed(0)}€ (${staatlichPercent.toFixed(1)}%)`;
  }

  baseLvlInput.addEventListener('input', updateDisplay);
  gammaInput.addEventListener('input', updateDisplay);
  kappaInput.addEventListener('input', updateDisplay);
  betaInput.addEventListener('input', updateDisplay);
  piInput.addEventListener('input', updateDisplay);
  medianIncomeInput.addEventListener('input', updateDisplay);

  resetBtn.addEventListener('click', () => {
    baseLvlInput.value = '1500';
    gammaInput.value = '0.70';
    kappaInput.value = '0.10';
    betaInput.value = '0.15';
    piInput.value = '0.20';
    medianIncomeInput.value = '1500';
    updateDisplay();
  });

  updateDisplay();
}
