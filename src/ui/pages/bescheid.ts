const STORAGE_KEY = 'bescheid-state';

function loadState(): Record<string, number> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ep: parsed.ep ?? 45.0,
        entranceAge: parsed.entranceAge ?? 67,
        regularAge: parsed.regularAge ?? 67,
        baseValue: parsed.baseValue ?? 38.36,
        rentType: parsed.rentType ?? 1.0,
      };
    }
  } catch (e) {
    console.warn('Failed to load bescheid state:', e);
  }
  return {
    ep: 45.0,
    entranceAge: 67,
    regularAge: 67,
    baseValue: 38.36,
    rentType: 1.0,
  };
}

function saveState(state: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save bescheid state:', e);
  }
}

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-header">
      <h2>Rentenversicherungsbescheid (§ 64 SGB VI)</h2>
      <span class="group-label">M = EP × ZF × RAF × aRW</span>
    </div>
    <div style="max-width: 1100px; margin: 0 auto;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <!-- Inputs -->
        <div>
          <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h3 style="margin: 0; color: #333;">Rentendaten eingeben</h3>
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
            
            <!-- Entgeltpunkte (EP) -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                EP — Entgeltpunkte (§§ 63, 70 SGB VI)
              </label>
              <input type="number" id="ep" value="45.0" min="0.1" max="100" step="0.1"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Aus Rentenversicherungsbescheid. Z.B. 45 = Durchschnitt, 36 = 80% (unterdurchschnittlich), 54 = 120%
              </p>
            </div>

            <!-- Renteneintrittsalter -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                Renteneintrittsalter (Jahre und Monate)
              </label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                <div>
                  <label style="font-size: 0.85rem; color: #666; display: block; margin-bottom: 0.25rem;">Jahre</label>
                  <input type="number" id="entrance-years" value="67" min="60" max="75" step="1"
                    style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                </div>
                <div>
                  <label style="font-size: 0.85rem; color: #666; display: block; margin-bottom: 0.25rem;">Monate</label>
                  <input type="number" id="entrance-months" value="0" min="0" max="11" step="1"
                    style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                </div>
              </div>
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Regelaltersgrenze: 67 (§ 35 SGB VI für Jahrgang 1964+)
              </p>
            </div>

            <!-- Regelaltersgrenze -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                Regelaltersgrenze (Jahre)
              </label>
              <input type="number" id="regular-age" value="67" min="60" max="75" step="1"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                67 für Jahrgang 1964+, früher je nach Jahrgang (§ 35 SGB VI)
              </p>
            </div>

            <!-- Rentenart -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                Rentenart (RAF — § 67 SGB VI)
              </label>
              <select id="rent-type" style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
                <option value="1.0">Altersrente / Volle Erwerbsminderung (RAF = 1.0)</option>
                <option value="0.5">Teilw. Erwerbsminderung (RAF = 0.5)</option>
                <option value="0.6">Große Witwenrente (RAF = 0.6)</option>
                <option value="0.25">Kleine Witwenrente (RAF = 0.25)</option>
                <option value="0.1">Halbwaisenrente (RAF = 0.1)</option>
                <option value="0.2">Vollwaisenrente (RAF = 0.2)</option>
              </select>
            </div>

            <!-- Basiswert (aRW) -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                aRW — Aktueller Rentenwert (€/EP)
              </label>
              <input type="number" id="base-value" value="38.36" min="10" max="100" step="0.01"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                2024: 38,36€/EP, jährlich angepasst nach § 68 SGB VI
              </p>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div>
          <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 2rem; border-radius: 8px; color: white;">
            <h3 style="margin: 0 0 1.5rem 0;">Rentenberechnung (§ 64 SGB VI)</h3>
            
            <!-- Zugangsfaktor -->
            <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
              <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">ZF — Zugangsfaktor (§ 77 SGB VI)</p>
              <p id="zf-value" style="margin: 0; font-size: 1.8rem; font-weight: bold;">1.00</p>
              <p id="zf-explanation" style="margin: 0.5rem 0 0 0; font-size: 0.8rem; opacity: 0.8;">Regelaltersgrenze</p>
            </div>

            <!-- Monthly pension -->
            <div style="background: rgba(255,255,255,0.15); padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
              <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">Monatliche Rente (brutto)</p>
              <p id="monthly-pension" style="margin: 0; font-size: 2.5rem; font-weight: bold;">1.728€</p>
              <p id="annual-pension" style="margin: 0.5rem 0 0 0; font-size: 0.85rem; opacity: 0.8;">Jährlich: 20.736€</p>
            </div>

            <!-- Breakdown -->
            <div style="background: rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 6px; margin-bottom: 1.5rem;">
              <h4 style="margin: 0 0 1rem 0; font-size: 0.95rem;">M = EP × ZF × RAF × aRW</h4>
              <div id="breakdown" style="font-size: 0.85rem; line-height: 2; font-family: monospace;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span>EP</span>
                  <strong id="calc-ep">45.0</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span>× ZF</span>
                  <strong id="calc-zf">1.00</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span>× RAF</span>
                  <strong id="calc-raf">1.0</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                  <span>× aRW</span>
                  <strong id="calc-arw">38,36€</strong>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 0.5rem;">
                  <span><strong>= M (€/Monat)</strong></span>
                  <strong id="calc-result" style="font-size: 1.1rem;">1.728€</strong>
                </div>
              </div>
            </div>

            <!-- Assumptions -->
            <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 6px; font-size: 0.85rem;">
              <p style="margin: 0 0 0.5rem 0; font-weight: 600;">⚠️ Hinweise:</p>
              <ul style="margin: 0; padding-left: 1.5rem; line-height: 1.6;">
                <li>Bruttorente ohne Steuern/Sozialversicherung</li>
                <li>Basiert auf § 64 SGB VI und aktuellen Sätzen (2024)</li>
                <li>Zukünftige Anpassungen nach § 68 SGB VI nicht berücksichtigt</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div style="margin-top: 2rem; background: #f5f5f5; padding: 2rem; border-radius: 8px;">
        <h3 style="margin: 0 0 1rem 0; color: #333;">§ 64 SGB VI — Die Rentenformel</h3>
        <p style="margin: 0 0 1rem 0; color: #666; line-height: 1.6;">
          <strong>Monatsbetrag M = Entgeltpunkte (EP) × Zugangsfaktor (ZF) × Rentenartfaktor (RAF) × Aktueller Rentenwert (aRW)</strong>
        </p>
        <h4 style="margin: 1rem 0 0.5rem 0; color: #333;">Zugangsfaktor (§ 77 SGB VI):</h4>
        <p style="margin: 0; color: #666; line-height: 1.6;">
          ZF = 1.0 + 0.006 × (Monate Abweichung von Regelaltersgrenze)<br>
          Frührentner: -0,3% pro Monat | Späteintritt: +0,5% pro Monat
        </p>
      </div>
    </div>
  `;

  setupCalculator();
}

function setupCalculator(): void {
  const state = loadState();

  const epInput = document.getElementById('ep') as HTMLInputElement;
  const entranceYearsInput = document.getElementById('entrance-years') as HTMLInputElement;
  const entranceMonthsInput = document.getElementById('entrance-months') as HTMLInputElement;
  const regularAgeInput = document.getElementById('regular-age') as HTMLInputElement;
  const rentTypeSelect = document.getElementById('rent-type') as HTMLSelectElement;
  const baseValueInput = document.getElementById('base-value') as HTMLInputElement;
  const resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;

  // Set initial values from storage
  epInput.value = state.ep.toString();
  const entranceYears = Math.floor(state.entranceAge);
  const entranceMonths = Math.round((state.entranceAge - entranceYears) * 12);
  entranceYearsInput.value = entranceYears.toString();
  entranceMonthsInput.value = entranceMonths.toString();
  regularAgeInput.value = state.regularAge.toString();
  rentTypeSelect.value = state.rentType.toString();
  baseValueInput.value = state.baseValue.toString();

  const zfValueDisplay = document.getElementById('zf-value')!;
  const zfExplanationDisplay = document.getElementById('zf-explanation')!;
  const monthlyPensionDisplay = document.getElementById('monthly-pension')!;
  const annualPensionDisplay = document.getElementById('annual-pension')!;
  const calcEpDisplay = document.getElementById('calc-ep')!;
  const calcZfDisplay = document.getElementById('calc-zf')!;
  const calcRafDisplay = document.getElementById('calc-raf')!;
  const calcArwDisplay = document.getElementById('calc-arw')!;
  const calcResultDisplay = document.getElementById('calc-result')!;

  function updateDisplay(): void {
    const ep = parseFloat(epInput.value) || 45.0;
    const entranceYears = parseFloat(entranceYearsInput.value) || 67;
    const entranceMonths = parseFloat(entranceMonthsInput.value) || 0;
    const regularAge = parseFloat(regularAgeInput.value) || 67;
    const raf = parseFloat(rentTypeSelect.value) || 1.0;
    const baseValue = parseFloat(baseValueInput.value) || 38.36;

    const entranceAge = entranceYears + entranceMonths / 12;

    // Save state
    saveState({ ep, entranceAge, regularAge, baseValue, rentType: raf });

    // Calculate ZF (Zugangsfaktor) according to § 77 SGB VI
    // ZF = 1.0 + 0.006 × (Monate Abweichung)
    // Früher: -0,3% pro Monat, Später: +0,5% pro Monat
    const monthsDifference = (entranceAge - regularAge) * 12;
    let zf: number;
    let zfExplanation: string;

    if (monthsDifference === 0) {
      zf = 1.0;
      zfExplanation = 'Regelaltersgrenze';
    } else if (monthsDifference < 0) {
      // Frührentner: -0,3% pro Monat
      zf = 1.0 + (monthsDifference * 0.003);
      zfExplanation = `${Math.abs(monthsDifference).toFixed(0)} Monate früher: ${(monthsDifference * 0.3).toFixed(1)}% Abzug`;
    } else {
      // Späteintritt: +0,5% pro Monat
      zf = 1.0 + (monthsDifference * 0.005);
      zfExplanation = `${monthsDifference.toFixed(0)} Monate später: +${(monthsDifference * 0.5).toFixed(1)}% Zuschlag`;
    }

    // Monatliche Rente = EP × ZF × RAF × aRW
    const monthlyPension = ep * zf * raf * baseValue;
    const annualPension = monthlyPension * 12;

    // Update displays
    zfValueDisplay.textContent = `${zf.toFixed(3)}`;
    zfExplanationDisplay.textContent = zfExplanation;
    monthlyPensionDisplay.textContent = `${monthlyPension.toFixed(0)}€`;
    annualPensionDisplay.textContent = `Jährlich: ${annualPension.toFixed(0)}€`;
    calcEpDisplay.textContent = `${ep.toFixed(1)}`;
    calcZfDisplay.textContent = `${zf.toFixed(3)}`;
    calcRafDisplay.textContent = `${raf.toFixed(1)}`;
    calcArwDisplay.textContent = `${baseValue.toFixed(2)}€`;
    calcResultDisplay.textContent = `${monthlyPension.toFixed(0)}€`;
  }

  epInput.addEventListener('input', updateDisplay);
  entranceYearsInput.addEventListener('input', updateDisplay);
  entranceMonthsInput.addEventListener('input', updateDisplay);
  regularAgeInput.addEventListener('input', updateDisplay);
  rentTypeSelect.addEventListener('change', updateDisplay);
  baseValueInput.addEventListener('input', updateDisplay);

  resetBtn.addEventListener('click', () => {
    epInput.value = '45.0';
    entranceYearsInput.value = '67';
    entranceMonthsInput.value = '0';
    regularAgeInput.value = '67';
    rentTypeSelect.value = '1.0';
    baseValueInput.value = '38.36';
    updateDisplay();
  });

  // Initial display
  updateDisplay();
}
