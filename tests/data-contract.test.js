import { describe, it, expect, beforeEach, vi } from 'vitest';

// Zenith is a fully client-side static PWA with no backend/REST API - there is
// nothing to hit with Supertest/Postman-style HTTP tests. The closest analog
// to an "API contract" is store.exportData()/importData(): the JSON schema
// users' backup files round-trip through, including across app versions.
// These tests treat that JSON shape as a versioned data contract.
let store;

beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    ({ store } = await import('../assets/js/store.js'));
});

const REQUIRED_TOP_LEVEL_KEYS = [
    'user', 'tasks', 'habits', 'rewards', 'journalEntries',
    'activityLog', 'achievements', 'settings', 'xp', 'level',
];

describe('exportData() schema', () => {
    it('produces valid, parseable JSON', () => {
        expect(() => JSON.parse(store.exportData())).not.toThrow();
    });

    it('includes every required top-level field', () => {
        const data = JSON.parse(store.exportData());
        REQUIRED_TOP_LEVEL_KEYS.forEach((key) => {
            expect(data).toHaveProperty(key);
        });
    });

    it('exports arrays as arrays and objects as objects (type contract)', () => {
        const data = JSON.parse(store.exportData());
        expect(Array.isArray(data.tasks)).toBe(true);
        expect(Array.isArray(data.habits)).toBe(true);
        expect(Array.isArray(data.rewards)).toBe(true);
        expect(Array.isArray(data.activityLog)).toBe(true);
        expect(Array.isArray(data.achievements)).toBe(true);
        expect(typeof data.journalEntries).toBe('object');
        expect(Array.isArray(data.journalEntries)).toBe(false);
        expect(typeof data.xp).toBe('number');
        expect(typeof data.level).toBe('number');
    });

    it('a task in the export matches the documented task shape', () => {
        store.addTask({ title: 'Şema testi', category: 'work', priority: 'high' });
        const data = JSON.parse(store.exportData());
        const task = data.tasks.find((t) => t.title === 'Şema testi');

        expect(task).toMatchObject({
            id: expect.any(String),
            title: 'Şema testi',
            category: 'work',
            priority: 'high',
            status: expect.any(String),
            subtasks: expect.any(Array),
            createdAt: expect.any(String),
        });
    });
});

describe('importData() contract: round-trip fidelity', () => {
    it('round-trips a full export/import cycle byte-for-byte on key fields', () => {
        store.addTask({ title: 'Görev A' });
        store.addHabit({ title: 'Alışkanlık A' });
        store.addReward({ title: 'Ödül A', xpCost: 30 });
        store.saveJournalEntry('2026-01-01', '😊', 'Not A');
        store.updateProfile({ name: 'Kontrat Testi', avatar: '🧪' });

        const exported = store.exportData();

        localStorage.clear();
        vi.resetModules();
        return import('../assets/js/store.js').then(({ store: fresh }) => {
            expect(fresh.importData(exported)).toBe(true);
            expect(fresh.state.user.name).toBe('Kontrat Testi');
            expect(fresh.state.tasks.some((t) => t.title === 'Görev A')).toBe(true);
            expect(fresh.state.habits.some((h) => h.title === 'Alışkanlık A')).toBe(true);
            expect(fresh.state.rewards.some((r) => r.title === 'Ödül A')).toBe(true);
            expect(fresh.state.journalEntries['2026-01-01'].note).toBe('Not A');
        });
    });

    it('accepts a partial payload and merges it (PATCH-like semantics, not PUT)', () => {
        store.addTask({ title: 'Değişmeyecek görev' });
        const tasksBefore = store.state.tasks.length;

        expect(store.importData(JSON.stringify({ xp: 250 }))).toBe(true);

        expect(store.state.xp).toBe(250);
        expect(store.state.tasks.length).toBe(tasksBefore); // untouched fields survive
    });

    it('is forward-compatible with unknown/future fields (does not reject or crash)', () => {
        const payload = JSON.stringify({ xp: 10, futureFieldFromNewerAppVersion: { anything: true } });
        expect(store.importData(payload)).toBe(true);
        expect(store.state.xp).toBe(10);
    });

    it('rejects the payload outright on invalid JSON syntax', () => {
        expect(store.importData('{not valid')).toBe(false);
    });

    it('rejects non-object top-level payloads (string, number, null, array)', () => {
        expect(store.importData(JSON.stringify('hello'))).toBe(false);
        expect(store.importData(JSON.stringify(123))).toBe(false);
        expect(store.importData(JSON.stringify(null))).toBe(false);
        expect(store.importData(JSON.stringify([1, 2]))).toBe(false);
    });

    it('falls back to existing data when a required array field has the wrong type', () => {
        const before = store.state.tasks;
        store.importData(JSON.stringify({ tasks: { not: 'an array' } }));
        expect(store.state.tasks).toBe(before);
    });
});
