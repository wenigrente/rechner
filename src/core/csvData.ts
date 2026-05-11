// Generated from public/data/poverty/*.csv files
// Data is embedded for reliability in both dev and production

export const POVERTY_CSVS = {
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
1959,1959,2024,12-14,28-31,40-45,Bereits im Rentenalter - 40% vulnerable
1964,1964,2029,16-18,32-35,48-53,Nur 5 Jahre bis Rente - kritische Gruppe
1969,1969,2036,20-22,35-38,55-60,Zeitbombe - Mehrheit unter 2500 Euro
1974,1974,2041,22-24,37-40,59-64,Kohorte der Lohnstagnation
1979,1979,2046,24-26,39-42,63-68,Prekäre Erwerbstätigkeiten verbreitet
1984,1984,2051,26-28,41-44,67-72,Generation Hartz IV
1989,1989,2056,28-30,43-46,71-76,Digitalisierung + Flexibilisierung`,
} as const;
