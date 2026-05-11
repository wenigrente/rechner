import { describe, it, expect } from 'vitest';
import { convertToCSV, parseCSV } from './sessionManager';

describe('sessionManager', () => {
  it('should parse and convert CSV correctly', () => {
    const data = [
      { country: 'Germany', rate: 0.15 },
      { country: 'France', rate: 0.13 }
    ];

    const csv = convertToCSV(data);
    const parsed = parseCSV(csv);

    expect(parsed).toEqual(data);
  });

  it('should handle empty data', () => {
    const csv = convertToCSV([]);
    expect(csv).toBe('');
  });
});
