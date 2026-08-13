import { describe, it, expect } from 'vitest';
import { Utils } from '../assets/js/utils.js';

describe('Utils.sanitize', () => {
    it('escapes the five XSS-relevant characters', () => {
        expect(Utils.sanitize('<script>alert("x")</script>')).toBe(
            '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;'
        );
        expect(Utils.sanitize(`a & b's "quote"`)).toBe('a &amp; b&#039;s &quot;quote&quot;');
    });

    it('returns an empty string for null/undefined', () => {
        expect(Utils.sanitize(null)).toBe('');
        expect(Utils.sanitize(undefined)).toBe('');
    });

    it('coerces non-string input to a string first', () => {
        expect(Utils.sanitize(42)).toBe('42');
    });
});

describe('Utils.generateId', () => {
    it('produces id-prefixed, non-empty, unique values', () => {
        const a = Utils.generateId();
        const b = Utils.generateId();
        expect(a).toMatch(/^id_/);
        expect(a).not.toBe(b);
    });
});

describe('Utils.toISODateString', () => {
    it('formats a given date as YYYY-MM-DD', () => {
        expect(Utils.toISODateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    });
});
