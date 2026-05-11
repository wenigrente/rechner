const STORAGE_KEY = 'planung-state-v5'; // v5 - correct Zugangsfaktor calculation (§77 SGB VI)

function loadState(): Record<string, number> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        currentYear: parsed.currentYear ?? 2026,
        currentAge: parsed.currentAge ?? 53,
        currentEp: parsed.currentEp ?? 30.0,
        targetRetirementAge: parsed.targetRetirementAge ?? 67,
        regularAge: parsed.regularAge ?? 67,
        avgEpPerYear: parsed.avgEpPerYear ?? 1.0,
        targetMonthlyPension: parsed.targetMonthlyPension ?? 1500,
        baseValue: parsed.baseValue ?? 38.36,
      };
    }
  } catch (e) {
    console.warn('Failed to load planung state:', e);
  }
  return {
    currentYear: 2026,
    currentAge: 53,
    currentEp: 30.0,
    targetRetirementAge: 67,
    regularAge: 67,
    avgEpPerYear: 1.0,
    targetMonthlyPension: 1500,
    baseValue: 38.36,
  };
}

function saveState(state: Record<string, number>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save planung state:', e);
  }
}

export function render(root: HTMLElement): void {
  root.innerHTML = `
    <div class="page-header">
      <h2>Rentenplanung</h2>
      <span class="group-label">Vorausrechnung: Wie viel Rente bekomme ich in Zukunft?</span>
    </div>
    <div style="max-width: 1200px; margin: 0 auto;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <!-- Inputs -->
        <div>
          <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
              <h3 style="margin: 0; color: #333;">Heute (2026)</h3>
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
            
            <!-- Current Age -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                Dein aktuelles Alter (Jahre)
              </label>
              <input type="number" id="current-age" value="53" min="25" max="70" step="1"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
            </div>

            <!-- Current EP -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                Deine aktuellen Entgeltpunkte (EP)
              </label>
              <input type="number" id="current-ep" value="30.0" min="0.1" max="100" step="0.1"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
            </div>

            <!-- Divider -->
            <div style="margin: 2rem 0; padding: 1rem 0; border-top: 2px solid #eee; border-bottom: 2px solid #eee;">
              <h3 style="margin: 0; text-align: center; color: #666;">➜ Zukunft <span id="future-year">(2040)</span></h3>
            </div>

            <!-- Target Retirement Age -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                Geplantes Renteneintrittsalter
              </label>
              <input type="number" id="target-age" value="67" min="60" max="75" step="1"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Regelaltersgrenze: 67 (§ 35 SGB VI)
              </p>
            </div>

            <!-- Regular Age -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                Regelaltersgrenze (für Zugangsfaktor)
              </label>
              <input type="number" id="regular-age" value="67" min="60" max="75" step="1"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                Basis für Zugangsfaktor-Berechnung
              </p>
            </div>

            <!-- Average EP per Year -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                Durchschn. Entgeltpunkte pro Jahr
              </label>
              <input type="number" id="avg-ep-per-year" value="1.0" min="0" max="3.0" step="0.1"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
              <p style="font-size: 0.85rem; color: #999; margin: 0.5rem 0 0 0;">
                0 = Keine neuen EP, 1.0 = Durchschnittsverdienst
              </p>
            </div>

            <!-- Current Base Value -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                Aktueller Rentenwert 2026 (€/EP)
              </label>
              <input type="number" id="base-value" value="38.36" min="30" max="50" step="0.01"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
            </div>

            <!-- Target Monthly Pension -->
            <div style="margin-bottom: 1.5rem;">
              <label style="display: block; font-weight: 600; margin-bottom: 0.5rem; color: #333;">
                Zielrente pro Monat (€)
              </label>
              <input type="number" id="target-pension" value="1500" min="500" max="5000" step="100"
                style="width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 1rem;">
              <p id="target-disabled-hint" style="font-size: 0.8rem; color: #f44336; margin: 0.5rem 0 0 0; display: none; font-weight: 600;">
                ⚠️ Keine Steigerung möglich (EP/Jahr = 0)
              </p>
            </div>
          </div>
        </div>

        <!-- Results -->
        <div>
          <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); padding: 2rem; border-radius: 8px; color: white;">
            <h3 style="margin: 0 0 1.5rem 0;">Deine Planung</h3>
            
            <!-- Years until retirement -->
            <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
              <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">Zeit bis Renteneintritt</p>
              <p id="years-until" style="margin: 0; font-size: 1.8rem; font-weight: bold;">14 Jahre</p>
            </div>

            <!-- Future EP -->
            <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
              <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">Entgeltpunkte <span id="ep-year">2040</span></p>
              <p id="future-ep" style="margin: 0; font-size: 1.8rem; font-weight: bold;">44.0 EP</p>
              <p id="future-ep-detail" style="margin: 0.5rem 0 0 0; font-size: 0.8rem; opacity: 0.8;">30 EP + 14 Jahre × 1,0 EP/Jahr</p>
            </div>

            <!-- Zugangsfaktor -->
            <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
              <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">Zugangsfaktor ZF (§ 77 SGB VI)</p>
              <p id="zf-value" style="margin: 0; font-size: 1.8rem; font-weight: bold;">1.000</p>
              <p id="zf-detail" style="margin: 0.5rem 0 0 0; font-size: 0.8rem; opacity: 0.8;">Regelaltersgrenze erreicht</p>
            </div>

            <!-- Projected Monthly Pension -->
            <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
              <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem; opacity: 0.9;">Projizierte Monatsrente <span id="pension-year">2040</span></p>
              <p id="projected-pension" style="margin: 0; font-size: 1.8rem; font-weight: bold;">1.848€</p>
              <p id="projected-pension-detail" style="margin: 0.5rem 0 0 0; font-size: 0.8rem; opacity: 0.8;">44 EP × 1.000 ZF × 42€ aRW</p>
            </div>

            <!-- Gap Analysis -->
            <div id="gap-box" style="background: rgba(76, 175, 80, 0.2); padding: 1rem; border-radius: 6px; border-left: 4px solid #4caf50; margin-bottom: 1.5rem;">
              <p id="gap-status" style="margin: 0; font-size: 0.95rem; font-weight: 600;">
                ✅ Du erreichst dein Ziel!
              </p>
              <p id="gap-detail" style="margin: 0.5rem 0 0 0; font-size: 0.85rem; opacity: 0.9;">
                Deine projizierte Rente übertrifft dein Ziel um 348€/Monat
              </p>
            </div>

            <!-- Calculation breakdown -->
            <div style="background: rgba(255,255,255,0.1); padding: 1rem; border-radius: 6px; font-size: 0.85rem;">
              <h4 style="margin: 0 0 0.5rem 0;">M = EP × ZF × aRW (§ 64 SGB VI)</h4>
              <div id="calc-breakdown" style="font-family: monospace; line-height: 1.8;">
                <div>EP = <strong>44.0</strong></div>
                <div>ZF = <strong>1.000</strong></div>
                <div>aRW = <strong>42€</strong></div>
                <div style="border-top: 1px solid rgba(0,0,0,0.2); margin-top: 0.5rem; padding-top: 0.5rem;">
                  M = 44 × 1.000 × 42€ = <strong>1.848€/Monat</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div style="margin-top: 2rem; background: #f5f5f5; padding: 2rem; border-radius: 8px;">
        <h3 style="margin: 0 0 1rem 0; color: #333;">§ 64 SGB VI Rentenformel</h3>
        <p style="margin: 0 0 1rem 0; color: #666; line-height: 1.6;">
          <strong>Monatsbetrag M = EP × ZF × RAF × aRW</strong>
        </p>
        <h4 style="margin: 1rem 0 0.5rem 0; color: #333;">Zugangsfaktor ZF (§ 77 SGB VI):</h4>
        <p style="margin: 0; color: #666; line-height: 1.6;">
          ZF = 1.0 + 0.005 × 12 × (Monate Abweichung von Regelaltersgrenze)<br>
          <strong>Jedes Jahr später: +6% (0,5% × 12 Monate)</strong><br>
          <strong>Jedes Jahr früher: -3,6% (0,3% × 12 Monate)</strong>
        </p>
      </div>
    </div>
  `;

  setupCalculator();
}

function setupCalculator(): void {
  const state = loadState();

  const currentAgeInput = document.getElementById('current-age') as HTMLInputElement;
  const currentEpInput = document.getElementById('current-ep') as HTMLInputElement;
  const targetAgeInput = document.getElementById('target-age') as HTMLInputElement;
  const regularAgeInput = document.getElementById('regular-age') as HTMLInputElement;
  const avgEpPerYearInput = document.getElementById('avg-ep-per-year') as HTMLInputElement;
  const baseValueInput = document.getElementById('base-value') as HTMLInputElement;
  const targetPensionInput = document.getElementById('target-pension') as HTMLInputElement;
  const resetBtn = document.getElementById('btn-reset') as HTMLButtonElement;

  currentAgeInput.value = state.currentAge.toString();
  currentEpInput.value = state.currentEp.toString();
  targetAgeInput.value = state.targetRetirementAge.toString();
  regularAgeInput.value = state.regularAge.toString();
  avgEpPerYearInput.value = state.avgEpPerYear.toString();
  baseValueInput.value = state.baseValue.toString();
  targetPensionInput.value = state.targetMonthlyPension.toString();

  const futureYearDisplay = document.getElementById('future-year')!;
  const epYearDisplay = document.getElementById('ep-year')!;
  const pensionYearDisplay = document.getElementById('pension-year')!;
  const yearsUntilDisplay = document.getElementById('years-until')!;
  const futureEpDisplay = document.getElementById('future-ep')!;
  const futureEpDetailDisplay = document.getElementById('future-ep-detail')!;
  const zfValueDisplay = document.getElementById('zf-value')!;
  const zfDetailDisplay = document.getElementById('zf-detail')!;
  const projectedPensionDisplay = document.getElementById('projected-pension')!;
  const projectedPensionDetailDisplay = document.getElementById('projected-pension-detail')!;
  const gapBoxDisplay = document.getElementById('gap-box')!;
  const gapStatusDisplay = document.getElementById('gap-status')!;
  const gapDetailDisplay = document.getElementById('gap-detail')!;
  const calcBreakdownDisplay = document.getElementById('calc-breakdown')!;
  const targetDisabledHint = document.getElementById('target-disabled-hint')!;

  function updateDisplay(): void {
    const currentYear = state.currentYear;
    const currentAge = parseFloat(currentAgeInput.value) ?? 53;
    const currentEp = parseFloat(currentEpInput.value) ?? 30.0;
    const targetAge = parseFloat(targetAgeInput.value) ?? 67;
    const regularAge = parseFloat(regularAgeInput.value) ?? 67;
    const avgEpPerYear = parseFloat(avgEpPerYearInput.value) ?? 1.0;
    const baseValue = parseFloat(baseValueInput.value) ?? 38.36;
    const targetPension = parseFloat(targetPensionInput.value) ?? 1500;

    saveState({ currentYear, currentAge, currentEp, targetRetirementAge: targetAge, regularAge, avgEpPerYear, targetMonthlyPension: targetPension, baseValue });

    const yearsUntilRetirement = Math.max(0, targetAge - currentAge);
    const futureYear = currentYear + yearsUntilRetirement;
    const futureEp = currentEp + (yearsUntilRetirement * avgEpPerYear);

    // Zugangsfaktor (§ 77 SGB VI)
    // ZF = 1.0 + 0.005 × 12 × (Monate Abweichung)
    // = 1.0 + 0.06 × (Jahre Abweichung)
    const monthsDifference = (targetAge - regularAge) * 12;
    let zf: number;
    let zfDetail: string;

    if (monthsDifference === 0) {
      zf = 1.0;
      zfDetail = 'Regelaltersgrenze erreicht';
    } else if (monthsDifference > 0) {
      // Später als Regelaltersgrenze: +0,5% pro Monat
      zf = 1.0 + (monthsDifference * 0.005);
      zfDetail = `${monthsDifference.toFixed(0)} Monate später: +${(monthsDifference * 0.5).toFixed(1)}% Zuschlag`;
    } else {
      // Früher als Regelaltersgrenze: -0,3% pro Monat
      zf = 1.0 + (monthsDifference * 0.003);
      zfDetail = `${Math.abs(monthsDifference).toFixed(0)} Monate früher: ${(monthsDifference * 0.3).toFixed(1)}% Abzug`;
    }

    // aRW bleibt gleich (keine Anpassung pro Jahr in einfacher Planung)
    // In Realität: aRW(2040) = baseValue × (1 + jährliche Anpassung)^Jahre
    // Aber die einfache Annahme: aRW = 42€ (mit einkalkuliertem Zuwachs)
    const arf = 1.0; // Altersrente
    const projectedPension = futureEp * zf * arf * baseValue;

    const isNoEpGrowth = avgEpPerYear === 0;
    targetPensionInput.disabled = isNoEpGrowth;
    targetPensionInput.style.opacity = isNoEpGrowth ? '0.5' : '1';
    targetDisabledHint.style.display = isNoEpGrowth ? 'block' : 'none';

    const gap = isNoEpGrowth ? 0 : (projectedPension - targetPension);
    const neededEp = isNoEpGrowth ? futureEp : (targetPension / (zf * arf * baseValue));
    const epGap = neededEp - futureEp;

    futureYearDisplay.textContent = `(${futureYear})`;
    epYearDisplay.textContent = futureYear.toString();
    pensionYearDisplay.textContent = futureYear.toString();

    yearsUntilDisplay.textContent = `${yearsUntilRetirement} ${yearsUntilRetirement === 1 ? 'Jahr' : 'Jahre'}`;
    futureEpDisplay.textContent = `${futureEp.toFixed(1)} EP`;
    futureEpDetailDisplay.textContent = `${currentEp.toFixed(1)} EP + ${yearsUntilRetirement} Jahre × ${avgEpPerYear.toFixed(1)} EP/Jahr`;
    zfValueDisplay.textContent = `${zf.toFixed(3)}`;
    zfDetailDisplay.textContent = zfDetail;
    projectedPensionDisplay.textContent = `${projectedPension.toFixed(0)}€`;
    projectedPensionDetailDisplay.textContent = `${futureEp.toFixed(1)} EP × ${zf.toFixed(3)} ZF × ${baseValue.toFixed(2)}€ aRW`;

    let gapStatus = '';
    let gapColor = '';

    if (isNoEpGrowth) {
      gapStatus = '⭐ Stabile Planung: Keine EP-Steigerung';
      gapColor = 'rgba(33, 150, 243, 0.2)';
      gapDetailDisplay.textContent = `Deine Rente mit Zugangsfaktor: ${projectedPension.toFixed(0)}€/Monat`;
    } else if (gap >= 500) {
      gapStatus = '⭐ Sehr gutes Ziel erreichbar!';
      gapColor = 'rgba(33, 150, 243, 0.2)';
      gapDetailDisplay.textContent = `Deine projizierte Rente übertrifft dein Ziel um ${gap.toFixed(0)}€/Monat`;
    } else if (gap >= 0) {
      gapStatus = '✅ Du erreichst dein Ziel!';
      gapColor = 'rgba(76, 175, 80, 0.2)';
      gapDetailDisplay.textContent = `Deine projizierte Rente übertrifft dein Ziel um ${gap.toFixed(0)}€/Monat`;
    } else if (gap >= -300) {
      gapStatus = '⚠️ Du benötigst noch etwas mehr';
      gapColor = 'rgba(255, 152, 0, 0.2)';
      gapDetailDisplay.textContent = `Du benötigst ${Math.abs(epGap).toFixed(1)} EP mehr`;
    } else {
      gapStatus = '❌ Ziel verfehlt';
      gapColor = 'rgba(244, 67, 54, 0.2)';
      gapDetailDisplay.textContent = `Du benötigst ${Math.abs(epGap).toFixed(1)} EP mehr`;
    }

    gapBoxDisplay.style.background = gapColor;
    gapStatusDisplay.textContent = gapStatus;

    calcBreakdownDisplay.innerHTML = `
      <div>EP = <strong>${futureEp.toFixed(1)}</strong></div>
      <div>ZF = <strong>${zf.toFixed(3)}</strong></div>
      <div>aRW = <strong>${baseValue.toFixed(2)}€</strong></div>
      <div style="border-top: 1px solid rgba(0,0,0,0.2); margin-top: 0.5rem; padding-top: 0.5rem;">
        M = ${futureEp.toFixed(1)} × ${zf.toFixed(3)} × ${baseValue.toFixed(2)}€ = <strong>${projectedPension.toFixed(0)}€/Monat</strong>
      </div>
      ${isNoEpGrowth ? '' : `<div>Zielrente: <strong>${targetPension.toFixed(0)}€/Monat</strong></div>`}
      <div>Gap: <strong>${isNoEpGrowth ? '0€' : `${gap >= 0 ? '+' : ''}${gap.toFixed(0)}€/Monat`}</strong></div>
    `;
  }

  currentAgeInput.addEventListener('input', updateDisplay);
  currentEpInput.addEventListener('input', updateDisplay);
  targetAgeInput.addEventListener('input', updateDisplay);
  regularAgeInput.addEventListener('input', updateDisplay);
  avgEpPerYearInput.addEventListener('input', updateDisplay);
  baseValueInput.addEventListener('input', updateDisplay);
  targetPensionInput.addEventListener('input', updateDisplay);

  resetBtn.addEventListener('click', () => {
    currentAgeInput.value = '53';
    currentEpInput.value = '30.0';
    targetAgeInput.value = '67';
    regularAgeInput.value = '67';
    avgEpPerYearInput.value = '1.0';
    baseValueInput.value = '38.36';
    targetPensionInput.value = '1500';
    updateDisplay();
  });

  updateDisplay();
}
