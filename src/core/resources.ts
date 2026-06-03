/**
 * Central registry of all static file resources (CSV, JSON, etc.) used by the app.
 *
 * SOURCE OF TRUTH
 * ---------------
 * All data files live in:   data/poverty/
 * Never edit files in:      public/data/poverty/   ← build artifact, auto-copied by CI
 *
 * The CI workflow (.github/workflows/deploy.yml) runs
 *   cp data/poverty/*.csv public/data/poverty/
 * before the Vite build, so everything in data/ ends up in dist/ automatically.
 *
 * HOW TO ADD A NEW RESOURCE
 * -------------------------
 * 1. Put the file in data/poverty/ (or a sibling folder).
 * 2. Add an entry to RESOURCES below with the correct runtime URL path (/rechner/data/...).
 * 3. Done — CI picks it up on next push.
 *
 * RUNTIME URL PATHS
 * -----------------
 * Vite base: /rechner/   →  files land at  /rechner/data/poverty/<name>
 * The fallback path (./data/...) covers the local dev server.
 */

export interface ResourceEntry {
  /** Human-readable label used in log messages and error output. */
  label: string;
  /**
   * Candidate URLs tried in priority order.
   * First 200-OK response wins.
   * [0] = GitHub Pages / production
   * [1] = Vite dev server fallback
   */
  urls: string[];
}

export const RESOURCES = {
  /**
   * Demographic age-structure data 1871–2021.
   * Source file: data/poverty/demographie_1871_2021_complete.csv
   * Columns: jahr, alter, maennlich, weiblich, gesamt, source
   * source ∈ { 'original', 'reconstructed' }
   */
  demographie_complete: {
    label: 'Demographie 1871–2021 (complete)',
    urls: [
      // '/rechner/data/poverty/demographie_1871_2021_complete.csv',
      // './data/poverty/demographie_1871_2021_complete.csv',
      '/rechner/data/poverty/demographie_1871_2070_complete.csv',
      './data/poverty/demographie_1871_2070_complete.csv',
    ],
  },

  /**
   * Wavelet-smoothed variant of the same demographic data.
   * Source file: data/poverty/demographie_1871_2021_wavelet.csv
   * Use in demography.ts by switching fetchResource('demographie_complete')
   * to fetchResource('demographie_wavelet').
   */
  demographie_wavelet: {
    label: 'Demographie 1871–2021 (wavelet)',
    urls: [
      // '/rechner/data/poverty/demographie_1871_2021_wavelet.csv',
      // './data/poverty/demographie_1871_2021_wavelet.csv',
      '/rechner/data/poverty/demographie_1871_2070_complete.csv',
      './data/poverty/demographie_1871_2070_complete.csv',
    ],
  },
} as const satisfies Record<string, ResourceEntry>;

/**
 * Fetches a registered resource by key, trying each candidate URL in order.
 * Throws with a clear message listing all attempted paths if all fail.
 */
export async function fetchResource(key: keyof typeof RESOURCES): Promise<string> {
  const entry = RESOURCES[key];

  for (const url of entry.urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log(`[resources] Loaded "${entry.label}" from ${url}`);
        return response.text();
      }
    } catch {
      // try next candidate
    }
  }

  throw new Error(
    `[resources] Failed to load "${entry.label}". Tried:\n` +
      entry.urls.map(u => `  • ${u}`).join('\n'),
  );
}
