import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

    it('leaves plain text untouched', () => {
        expect(Utils.sanitize('Haftalık Proje Planlaması')).toBe('Haftalık Proje Planlaması');
    });

    it('escapes ampersands before other entities, avoiding double-encoding', () => {
        // If & were escaped after < / >, "&lt;" would become "&amp;lt;".
        expect(Utils.sanitize('<')).toBe('&lt;');
        expect(Utils.sanitize('&lt;')).toBe('&amp;lt;');
    });

    it('neutralizes an img-onerror XSS payload', () => {
        const payload = `<img src=x onerror="alert(1)">`;
        const out = Utils.sanitize(payload);
        expect(out).not.toContain('<img');
        expect(out).not.toContain('>');
    });
});

describe('Utils.generateId', () => {
    it('produces id-prefixed, non-empty, unique values', () => {
        const a = Utils.generateId();
        const b = Utils.generateId();
        expect(a).toMatch(/^id_/);
        expect(a).not.toBe(b);
    });

    it('generates a batch of ids with no collisions', () => {
        const ids = new Set(Array.from({ length: 200 }, () => Utils.generateId()));
        expect(ids.size).toBe(200);
    });
});

describe('Utils.toISODateString', () => {
    it('formats a given date as YYYY-MM-DD', () => {
        expect(Utils.toISODateString(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    it('zero-pads single-digit months and days', () => {
        expect(Utils.toISODateString(new Date(2026, 2, 3))).toBe('2026-03-03');
    });

    it('defaults to "today" when called with no argument', () => {
        const now = new Date();
        const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        expect(Utils.toISODateString()).toBe(expected);
    });
});

describe('Utils.formatDate', () => {
    it('returns an empty string for falsy input', () => {
        expect(Utils.formatDate('')).toBe('');
        expect(Utils.formatDate(null)).toBe('');
        expect(Utils.formatDate(undefined)).toBe('');
    });

    it('returns an empty string for an unparseable date', () => {
        expect(Utils.formatDate('not-a-date')).toBe('');
    });

    it('labels today as "Bugün"', () => {
        expect(Utils.formatDate(new Date())).toBe('Bugün');
    });

    it('labels tomorrow as "Yarın"', () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        expect(Utils.formatDate(tomorrow)).toBe('Yarın');
    });

    it('labels yesterday as "Dün"', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(Utils.formatDate(yesterday)).toBe('Dün');
    });

    it('falls back to a localized short date for other days', () => {
        const farFuture = new Date();
        farFuture.setDate(farFuture.getDate() + 10);
        const result = Utils.formatDate(farFuture);
        expect(result).not.toBe('');
        expect(['Bugün', 'Yarın', 'Dün']).not.toContain(result);
    });
});

describe('Utils.debounce', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('only invokes the wrapped function once after the wait elapses', () => {
        const fn = vi.fn();
        const debounced = Utils.debounce(fn, 200);

        debounced();
        debounced();
        debounced();
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(199);
        expect(fn).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes through the latest call arguments', () => {
        const fn = vi.fn();
        const debounced = Utils.debounce(fn, 100);

        debounced('first');
        debounced('second');
        vi.advanceTimersByTime(100);

        expect(fn).toHaveBeenCalledWith('second');
    });

    it('defaults to a 250ms wait when none is given', () => {
        const fn = vi.fn();
        const debounced = Utils.debounce(fn);

        debounced();
        vi.advanceTimersByTime(249);
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});

describe('Utils.playChime', () => {
    it('does not throw when AudioContext is unavailable (jsdom has none)', () => {
        expect(() => Utils.playChime('success')).not.toThrow();
        expect(() => Utils.playChime('levelUp')).not.toThrow();
        expect(() => Utils.playChime('timerEnd')).not.toThrow();
        expect(() => Utils.playChime('purchase')).not.toThrow();
        expect(() => Utils.playChime('unknown-type')).not.toThrow();
    });
});

describe('Utils.sendNotification', () => {
    it('does not throw and skips silently when permission is denied', () => {
        expect(() => Utils.sendNotification('title', 'body')).not.toThrow();
    });
});
