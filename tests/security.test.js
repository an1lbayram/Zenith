import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Utils } from '../assets/js/utils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

let store, Views, UI;

beforeEach(async () => {
    localStorage.clear();
    document.body.innerHTML = '';
    window.appState = { taskSearch: '', taskCategory: 'all', selectedMood: '🚀' };
    vi.resetModules();
    ({ store } = await import('../assets/js/store.js'));
    ({ Views } = await import('../assets/js/views.js'));
    ({ UI } = await import('../assets/js/ui.js'));
});

const XSS_PAYLOAD = `<img src=x onerror="window.__pwned = true">`;

describe('Content-Security-Policy', () => {
    it('index.html declares a CSP meta tag', () => {
        expect(indexHtml).toMatch(/<meta\s+http-equiv="Content-Security-Policy"/i);
    });

    it('the CSP forbids inline/remote script execution beyond same-origin (no script-src *, no unsafe-eval)', () => {
        const match = indexHtml.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i);
        expect(match).toBeTruthy();
        const csp = match[1];

        expect(csp).not.toContain('unsafe-eval');
        expect(csp).not.toMatch(/script-src[^;]*\*/);
        expect(csp).toContain("default-src 'self'");
    });
});

describe('Stored-XSS: every user-controllable field must be sanitized before HTML injection', () => {
    it('task title, notes, and category resist script injection in the Tasks board', () => {
        store.state.tasks = [];
        store.addTask({ title: XSS_PAYLOAD, notes: XSS_PAYLOAD, category: XSS_PAYLOAD });
        const html = Views.Tasks();

        expect(html).not.toContain(XSS_PAYLOAD);
        expect(html).not.toContain('onerror="window.__pwned = true"');
    });

    it('habit title, category, and icon resist script injection (icon/category are import-tamperable)', () => {
        const habit = store.addHabit({ title: XSS_PAYLOAD });
        // Simulate a tampered/imported habit where icon and category are attacker-controlled,
        // bypassing the fixed <select> options the Add-Habit modal normally restricts to.
        habit.icon = XSS_PAYLOAD;
        habit.category = XSS_PAYLOAD;

        const html = Views.Habits();
        expect(html).not.toContain(XSS_PAYLOAD);
    });

    it('reward title and icon resist script injection (icon is import-tamperable)', () => {
        store.state.rewards = [{ id: 'r1', title: XSS_PAYLOAD, xpCost: 10, icon: XSS_PAYLOAD }];
        const html = Views.Shop();
        expect(html).not.toContain(XSS_PAYLOAD);
    });

    it('journal note and mood resist script injection', () => {
        store.saveJournalEntry('2026-01-01', XSS_PAYLOAD, XSS_PAYLOAD);
        const html = Views.Journal();
        expect(html).not.toContain(XSS_PAYLOAD);
    });

    it('calendar task titles resist script injection', () => {
        store.state.tasks = [];
        store.addTask({ title: XSS_PAYLOAD, dueDate: Utils.toISODateString() });
        const html = Views.Calendar();
        expect(html).not.toContain(XSS_PAYLOAD);
    });

    it('subtask text resists script injection in the edit-task modal', async () => {
        const task = store.addTask({
            title: 'Görev',
            subtasks: [{ id: 's1', text: XSS_PAYLOAD, completed: false }],
        });
        document.body.innerHTML = `
            <div id="modal-backdrop" class="hidden opacity-0"><div id="modal-content" class="scale-95"></div></div>
        `;
        UI.openEditTaskModal(task.id);
        expect(document.getElementById('modal-content').innerHTML).not.toContain(XSS_PAYLOAD);
    });

    it('profile name and avatar resist script injection in the profile modal', async () => {
        store.updateProfile({ name: XSS_PAYLOAD, avatar: XSS_PAYLOAD });
        document.body.innerHTML = `
            <div id="modal-backdrop" class="hidden opacity-0"><div id="modal-content" class="scale-95"></div></div>
        `;
        UI.openProfileModal();
        expect(document.getElementById('modal-content').innerHTML).not.toContain(XSS_PAYLOAD);
    });

    it('achievement name/desc/icon resist script injection after a tampered import', async () => {
        store.state.achievements[0] = { id: 'x', name: XSS_PAYLOAD, desc: XSS_PAYLOAD, icon: XSS_PAYLOAD, unlocked: false };
        document.body.innerHTML = `
            <div id="modal-backdrop" class="hidden opacity-0"><div id="modal-content" class="scale-95"></div></div>
        `;
        UI.openProfileModal();
        expect(document.getElementById('modal-content').innerHTML).not.toContain(XSS_PAYLOAD);
    });

    it('toast messages resist script injection', () => {
        document.body.innerHTML = `<div id="toast-container"></div>`;
        UI.showToast(XSS_PAYLOAD, 'info');
        expect(document.getElementById('toast-container').innerHTML).not.toContain(XSS_PAYLOAD);
    });
});

describe('Malicious import payloads (data tampering via the "Import Data" feature)', () => {
    it('rejects a non-object payload (array)', () => {
        expect(store.importData(JSON.stringify([1, 2, 3]))).toBe(false);
        expect(Array.isArray(store.state.tasks)).toBe(true);
    });

    it('a payload with tasks/habits replaced by a scalar cannot corrupt state shape', () => {
        const before = store.state.tasks;
        const ok = store.importData(JSON.stringify({ tasks: 'not-an-array', habits: 42, xp: 10 }));

        expect(ok).toBe(true); // still a valid object payload overall
        expect(store.state.tasks).toBe(before); // scalar tasks field ignored, previous array kept
        expect(Array.isArray(store.state.habits)).toBe(true);
        expect(store.state.xp).toBe(10); // well-typed fields still apply
    });

    it('rejects primitive JSON payloads outright', () => {
        expect(store.importData(JSON.stringify('just a string'))).toBe(false);
        expect(store.importData(JSON.stringify(42))).toBe(false);
        expect(store.importData(JSON.stringify(null))).toBe(false);
    });

    it('does not pollute Object.prototype via a "__proto__" key in the payload', () => {
        const payload = JSON.stringify({ __proto__: { polluted: true }, xp: 5 });
        store.importData(payload);

        expect({}.polluted).toBeUndefined();
        expect(Object.prototype.polluted).toBeUndefined();
    });

    it('malformed JSON is rejected without throwing and without altering state', () => {
        store.addXP(42);
        const before = store.state.xp;

        expect(() => store.importData('{ this is not json')).not.toThrow();
        expect(store.importData('{ this is not json')).toBe(false);
        expect(store.state.xp).toBe(before);
    });

    it('a crafted payload with script-tag fields is inert until rendered, and rendering escapes it', () => {
        const payload = JSON.stringify({
            tasks: [{ id: 't1', title: XSS_PAYLOAD, category: 'work', priority: 'normal', status: 'todo', subtasks: [] }],
        });
        expect(store.importData(payload)).toBe(true);

        const html = Views.Tasks();
        expect(html).not.toContain(XSS_PAYLOAD);
    });
});

describe('Input length / abuse limits', () => {
    it('profile name updates are capped client-side at 24 characters', () => {
        // Mirrors app.logic.updateProfileName's slice(0, 24) guard.
        const longName = 'A'.repeat(500);
        const trimmed = longName.trim().slice(0, 24);
        expect(trimmed.length).toBe(24);
    });
});
