/**
 * Central registry of all static file resources (CSV, JSON, etc.) used by the app.
 *
 * Each entry lists candidate URL paths in priority order. The fetch helper tries
 * them in sequence and returns the first successful response. This handles the
 * dev-server path (/rechner/...) and the Vite public-folder fallback (./...).
 *
 * Add new resources here — never hardcode paths in page/component files.
 */

export interface ResourceEntry {
  /** Human-readable label for logs and error messages. */
  label: string;
  /** Candidate URLs tried in order. First 200-OK response wins. */
  urls: string[];
}

export const RESOURCES = {
  /**
   * Demographic age-structure data 1871–2021.
   * Columns: jahr, alter, maennlich, weiblich, gesamt, source
   * source ∈ { 'original', 'reconstructed' }
   */
  demographie_complete: {
    label: 'Demographie 1871–2021 (complete)',
    urls: [
      '/rechner/data/poverty/demographie_1871_2021_complete.csv',
      './data/poverty/demographie_1871_2021_complete.csv',
    ],
  },

  /**
   * Wavelet-smoothed variant of the same demographic data.
   * Uncomment the relevant URL in demography.ts to switch datasets.
   */
  demographie_wavelet: {
    label: 'Demographie 1871–2021 (wavelet)',
    urls: [
      '/rechner/data/poverty/demographie_1871_2021_wavelet.csv',
      './data/poverty/demographie_1871_2021_wavelet.csv',
    ],
  },
} as const satisfies Record<string, ResourceEntry>;

/**
 * Fetches a registered resource by key, trying each candidate URL in order.
 * Throws if all URLs fail.
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
