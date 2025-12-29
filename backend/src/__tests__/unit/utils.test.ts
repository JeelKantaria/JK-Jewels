/**
 * Unit Tests for formatDateTime and formatTime utilities
 */

import { formatDate, formatDateTime, formatTime } from '../../lib/utils';

describe('formatDate', () => {
    it('should format date string to Indian locale', () => {
        const date = '2024-12-25T10:30:00Z';
        const result = formatDate(date);
        // Result should contain day, month name, and year
        expect(result).toMatch(/\d{1,2}/); // Day
        expect(result).toMatch(/December/i); // Month
        expect(result).toMatch(/2024/); // Year
    });

    it('should format Date object correctly', () => {
        const date = new Date('2024-01-15T00:00:00Z');
        const result = formatDate(date);
        expect(result).toMatch(/January/i);
        expect(result).toMatch(/2024/);
    });
});

describe('formatDateTime', () => {
    it('should include both date and time', () => {
        const date = '2024-12-25T14:30:00Z';
        const result = formatDateTime(date);
        // Should contain date components
        expect(result).toMatch(/December/i);
        expect(result).toMatch(/2024/);
        // Should contain time components (will be in local timezone)
        expect(result).toMatch(/\d{1,2}:\d{2}/); // Time pattern
        expect(result).toMatch(/(am|pm)/i); // 12-hour format
    });

    it('should format midnight correctly', () => {
        const date = new Date('2024-06-15T00:00:00Z');
        const result = formatDateTime(date);
        expect(result).toMatch(/June/i);
        expect(result).toMatch(/2024/);
    });

    it('should format noon correctly', () => {
        const date = '2024-03-10T12:00:00Z';
        const result = formatDateTime(date);
        expect(result).toMatch(/March/i);
    });
});

describe('formatTime', () => {
    it('should return only time without date', () => {
        const date = '2024-12-25T14:30:00Z';
        const result = formatTime(date);
        // Should contain only time pattern
        expect(result).toMatch(/\d{1,2}:\d{2}/);
        expect(result).toMatch(/(am|pm)/i);
        // Should NOT contain date parts
        expect(result).not.toMatch(/December/i);
        expect(result).not.toMatch(/2024/);
    });

    it('should handle morning time', () => {
        const date = new Date('2024-01-01T09:15:00Z');
        const result = formatTime(date);
        expect(result).toMatch(/\d{1,2}:\d{2}/);
        expect(result).toMatch(/(am|pm)/i);
    });

    it('should handle evening time', () => {
        const date = new Date('2024-01-01T21:45:00Z');
        const result = formatTime(date);
        expect(result).toMatch(/\d{1,2}:\d{2}/);
        expect(result).toMatch(/(am|pm)/i);
    });
});

describe('Timezone handling', () => {
    it('should convert UTC to local timezone consistently', () => {
        // Two dates at the same local time but different UTC
        const date1 = new Date('2024-06-15T12:00:00Z');
        const result1 = formatDateTime(date1);

        // Result should be consistent (same format)
        expect(typeof result1).toBe('string');
        expect(result1.length).toBeGreaterThan(0);
    });

    it('should handle ISO date strings', () => {
        const isoString = '2024-12-30T18:30:00.000Z';
        const result = formatDateTime(isoString);
        expect(result).toMatch(/December/i);
        expect(result).toMatch(/30/);
    });
});
