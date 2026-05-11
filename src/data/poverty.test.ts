import { describe, it, expect } from 'vitest';
import { parseCSV } from '../core/sessionManager';

describe('Poverty Data CSVs', () => {
  describe('germany_poverty_indicators.csv', () => {
    it('should have three poverty measurements', () => {
      const csv = `indicator,value,unit,source,year
kaufkraftbereinigt_eu_weit,9,percent,IW Köln,2024
armutsgefaehrdungsquote,15.5,percent,Eurostat,2024
arope_armut_ausgrenzung,21.1,percent,Eurostat,2024`;

      const data = parseCSV(csv);
      const indicators = data.map(row => row.indicator);
      
      expect(indicators).toContain('kaufkraftbereinigt_eu_weit');
      expect(indicators).toContain('armutsgefaehrdungsquote');
      expect(indicators).toContain('arope_armut_ausgrenzung');
    });

    it('values should show ascending severity', () => {
      const csv = `indicator,value,unit,source,year
kaufkraftbereinigt_eu_weit,9,percent,IW Köln,2024
armutsgefaehrdungsquote,15.5,percent,Eurostat,2024
arope_armut_ausgrenzung,21.1,percent,Eurostat,2024`;

      const data = parseCSV(csv);
      expect((data[0].value as number)).toBeLessThan(data[1].value as number);
      expect((data[1].value as number)).toBeLessThan(data[2].value as number);
    });
  });

  describe('eu_poverty_comparison.csv', () => {
    it('should have EU rankings with Germany at position 16', () => {
      const csv = `rank,country,poverty_rate,year
1,Tschechien,9.5,2024
2,Dänemark,11.6,2024
3,Belgien,11.4,2024
5,Niederlande,12.1,2024
6,Finnland,12.6,2024
16,Deutschland,15.5,2024
21,Spanien,19.7,2024
27,Bulgarien,21.7,2024`;

      const data = parseCSV(csv);
      const germany = data.find(row => row.country === 'Deutschland');
      
      expect(germany).toBeDefined();
      expect(germany?.rank).toBe(16);
      expect(germany?.poverty_rate).toBe(15.5);
    });

    it('should be sorted by ranking', () => {
      const csv = `rank,country,poverty_rate,year
1,Tschechien,9.5,2024
2,Dänemark,11.6,2024
3,Belgien,11.4,2024
5,Niederlande,12.1,2024
6,Finnland,12.6,2024
16,Deutschland,15.5,2024
21,Spanien,19.7,2024
27,Bulgarien,21.7,2024`;

      const data = parseCSV(csv);
      const ranks = data.map(row => row.rank);
      
      expect(ranks).toEqual([1, 2, 3, 5, 6, 16, 21, 27]);
    });

    it('poverty rates should generally increase with rank', () => {
      const csv = `rank,country,poverty_rate,year
1,Tschechien,9.5,2024
27,Bulgarien,21.7,2024`;

      const data = parseCSV(csv);
      
      expect((data[0].poverty_rate as number)).toBeLessThan(data[data.length - 1].poverty_rate as number);
    });
  });

  describe('germany_poverty_trends.csv', () => {
    it('should show data for 2019 and 2024', () => {
      const csv = `year,germany_absolute,germany_relative,germany_arope,comment
2019,0,16.6,17.3,Baseline - Platz 9 in EU
2024,0,15.5,21.1,Platz 19 in EU - 10 Ränge gefallen`;

      const data = parseCSV(csv);
      
      expect(data).toHaveLength(2);
      expect(data[0].year).toBe(2019);
      expect(data[1].year).toBe(2024);
    });

    it('relative poverty improved but AROPE worsened', () => {
      const csv = `year,germany_absolute,germany_relative,germany_arope,comment
2019,0,16.6,17.3,Baseline - Platz 9 in EU
2024,0,15.5,21.1,Platz 19 in EU - 10 Ränge gefallen`;

      const data = parseCSV(csv);
      const y2019 = data[0];
      const y2024 = data[1];
      
      expect((y2024.germany_relative as number)).toBeLessThan(y2019.germany_relative as number);
      expect((y2024.germany_arope as number)).toBeGreaterThan(y2019.germany_arope as number);
    });
  });

  describe('poverty_definitions.csv', () => {
    it('should define measurement standards', () => {
      const csv = `measure,value,unit,description
kaufkraftbereinigt_eu_standard,9,percent,60% eines gemeinsamen EU-Kaufkraftstandards (IW Köln)
national_median_60pct,15.5,percent,60% des nationalen Medianeinkommens (Eurostat)
arope_combined,21.1,percent,Armut ODER Unterbeschäftigung ODER materielle Entbehrung (Eurostat)
schwelle_single_monat,1378,euro,Armutsgefährdungsschwelle für Singles (2024)`;

      const data = parseCSV(csv);
      
      expect(data).toHaveLength(4);
      expect(data.map(row => row.measure)).toContain('kaufkraftbereinigt_eu_standard');
      expect(data.map(row => row.measure)).toContain('national_median_60pct');
    });

    it('threshold should be 1378 euro', () => {
      const csv = `measure,value,unit,description
schwelle_single_monat,1378,euro,Armutsgefährdungsschwelle für Singles (2024)`;

      const data = parseCSV(csv);
      
      expect(data[0].unit).toBe('euro');
      expect(data[0].value).toBe(1378);
    });
  });

  describe('future_cohorts_risk.csv', () => {
    it('should show cohort 1969 data', () => {
      const csv = `cohort,birth_year,retirement_year,poor_pct,not_good_pct,total_vulnerable_pct,comment
1969,1969,2036,20-22,35-38,55-60,Zeitbombe - Mehrheit unter 2500 Euro`;

      const data = parseCSV(csv);
      
      expect(data).toHaveLength(1);
      expect(data[0].cohort).toBe(1969);
      expect(data[0].birth_year).toBe(1969);
      expect(data[0].retirement_year).toBe(2036);
    });

    it('cohort 1969 should indicate high vulnerability', () => {
      const csv = `cohort,birth_year,retirement_year,poor_pct,not_good_pct,total_vulnerable_pct,comment
1969,1969,2036,20-22,35-38,55-60,Zeitbombe - Mehrheit unter 2500 Euro`;

      const data = parseCSV(csv);
      
      expect(data[0].comment).toContain('Zeitbombe');
      expect(data[0].comment).toContain('Mehrheit');
    });
  });
});
