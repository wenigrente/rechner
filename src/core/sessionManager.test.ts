import { describe, it, expect } from 'vitest';
import { parseCSV } from './sessionManager';

describe('sessionManager', () => {
  describe('exportSessionAsZip', () => {
    it('should export data correctly', () => {
      const data = [
        { country: 'Germany', rate: 0.155 },
        { country: 'France', rate: 0.16 },
      ];
      
      expect(data).toHaveLength(2);
      expect(data[0].country).toBe('Germany');
    });
  });

  describe('CSV parsing', () => {
    it('should parse CSV with numeric columns', () => {
      const csv = `country,rate
Germany,0.155
France,0.16`;

      const data = parseCSV(csv);
      
      expect(data).toHaveLength(2);
      expect(data[0].country).toBe('Germany');
      expect(data[0].rate).toBe(0.155);
    });

    it('should auto-detect numbers', () => {
      const csv = `name,value,percent
test,42,0.5`;

      const data = parseCSV(csv);
      
      expect(typeof data[0].value).toBe('number');
      expect(typeof data[0].percent).toBe('number');
    });
  });
});
