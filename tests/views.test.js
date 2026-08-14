import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Utils } from '../assets/js/utils.js';

// Views.js and store.js are both ES module singletons. To get a store/Views
// pair that share the *same* fresh instance per test (mirroring store.test.js's
// isolation strategy), reset the module registry and re-import both together.
let store, Views;

beforeEach(async () => {
    localStorage.clear();
    document.body.innerHTML = '';
    window.appState = { taskSearch: '', taskCategory: 'all', selectedMood: '🚀' };
    vi.resetModules();
    ({ store } = await import('../assets/js/store.js'));
    ({ Views } = await import('../assets/js/views.js'));
});

describe('Views.Dashboard', () => {
    it('renders the welcome banner with the current user name', () => {
        store.updateProfile({ name: 'Anıl' });
        const html = Views.Dashboard();
        expect(html).toContain('Anıl');
    });

    it('sanitizes the user name to prevent stored-XSS in the greeting', () => {
        store.updateProfile({ name: '<img src=x onerror=alert(1)>' });
        const html = Views.Dashboard();
        expect(html).not.toContain('<img src=x onerror=alert(1)>');
        expect(html).toContain('&lt;img');
    });

    it('reflects task/habit stats from store state', () => {
        store.addTask({ title: 'A' });
        store.addHabit({ title: 'B' });
        document.body.innerHTML = `<div id="content-area"></div>`;
        document.getElementById('content-area').innerHTML = Views.Dashboard();

        const total = store.state.tasks.length;
        expect(document.getElementById('content-area').textContent).toContain(String(total));
    });
});

describe('Views.Tasks', () => {
    it('sorts tasks into todo / in-progress / done columns', () => {
        store.state.tasks = [];
        store.addTask({ title: 'Todo görev', status: 'todo' });
        store.addTask({ title: 'Devam görev', status: 'in-progress' });
        store.addTask({ title: 'Biten görev', status: 'done' });

        document.body.innerHTML = Views.Tasks();

        const todoList = document.getElementById('todo-list').textContent;
        const inProgressList = document.getElementById('in-progress-list').textContent;
        const doneList = document.getElementById('done-list').textContent;

        expect(todoList).toContain('Todo görev');
        expect(inProgressList).toContain('Devam görev');
        expect(doneList).toContain('Biten görev');
    });

    it('filters by search query (title or notes, case-insensitive)', () => {
        store.state.tasks = [];
        store.addTask({ title: 'Market alışverişi', notes: '' });
        store.addTask({ title: 'Rapor yaz', notes: 'market ile ilgisi yok' });
        store.addTask({ title: 'Spor yap', notes: '' });

        window.appState.taskSearch = 'market';
        const html = Views.Tasks();

        expect(html).toContain('Market alışverişi');
        expect(html).toContain('Rapor yaz'); // matched via notes
        expect(html).not.toContain('Spor yap');
    });

    it('filters by category', () => {
        store.state.tasks = [];
        store.addTask({ title: 'İş görevi', category: 'work' });
        store.addTask({ title: 'Sağlık görevi', category: 'health' });

        window.appState.taskCategory = 'work';
        const html = Views.Tasks();

        expect(html).toContain('İş görevi');
        expect(html).not.toContain('Sağlık görevi');
    });

    it('sanitizes task title and notes against XSS', () => {
        store.state.tasks = [];
        store.addTask({ title: '<script>alert(1)</script>', notes: '<b>bold</b>' });
        const html = Views.Tasks();

        expect(html).not.toContain('<script>alert(1)</script>');
        expect(html).not.toContain('<b>bold</b>');
    });

    it('shows an empty-state message for a column with no matching tasks', () => {
        store.state.tasks = [];
        const html = Views.Tasks();
        expect(html).toContain('Yapılacak görev yok');
    });
});

describe('Views.Habits', () => {
    it('shows the empty-state prompt when there are no habits', () => {
        const html = Views.Habits();
        expect(html).toContain('Henüz Alışkanlık Eklemedin');
    });

    it('renders a habit card with its streak and sanitized title', () => {
        const habit = store.addHabit({ title: '<i>Su</i> iç' });
        store.toggleHabitDate(habit.id);

        const html = Views.Habits();
        expect(html).toContain('1 Gün Seri');
        expect(html).not.toContain('<i>Su</i> iç');
        expect(html).toContain('&lt;i&gt;Su&lt;/i&gt; iç');
    });

    it('marks today as completed when the habit has today in completedDates', () => {
        const habit = store.addHabit({ title: 'Egzersiz' });
        store.toggleHabitDate(habit.id, Utils.toISODateString());

        const html = Views.Habits();
        expect(html).toContain('✓ Tamamlandı');
    });
});

describe('Views.Calendar', () => {
    it('renders 7 weekday header cells and highlights today', () => {
        const html = Views.Calendar();
        expect(html).toContain('Pzt');
        expect(html).toContain('Paz');
        expect(html).toContain('ring-2 ring-primary');
    });

    it('shows a task-count badge on the day it is due', () => {
        // Demo seed tasks also default to today's date, so start from a clean slate.
        store.state.tasks = [];
        const todayIso = Utils.toISODateString();
        store.addTask({ title: 'Bugünkü görev', dueDate: todayIso });

        const html = Views.Calendar();
        expect(html).toContain('1 Görev');
        expect(html).toContain('Bugünkü görev');
    });
});

describe('Views.Shop', () => {
    it('renders default rewards with the current XP balance', () => {
        const html = Views.Shop();
        expect(html).toContain('Mevcut XP');
        expect(html).toContain(String(store.state.xp));
    });

    it('marks affordable rewards as buyable and expensive ones as disabled', () => {
        store.state.rewards = [
            { id: 'cheap', title: 'Ucuz', xpCost: 10, icon: '🎁' },
            { id: 'expensive', title: 'Pahalı', xpCost: 99999, icon: '🎁' },
        ];
        store.state.xp = 20;

        const html = Views.Shop();
        expect(html).toContain('Yetersiz XP');
        expect(html).toContain('Satın Al / Harca');
    });

    it('sanitizes reward title and id when injected into data attributes', () => {
        store.state.rewards = [{ id: 'r"1', title: '"><script>x</script>', xpCost: 10, icon: '🎁' }];
        const html = Views.Shop();
        expect(html).not.toContain('<script>x</script>');
    });
});

describe('Views.Journal', () => {
    it("shows today's mood selector with the currently selected mood highlighted", () => {
        store.saveJournalEntry(Utils.toISODateString(), '😊', 'Bugün güzel geçti');
        const html = Views.Journal();
        expect(html).toContain('Bugün güzel geçti');
        expect(html).toContain('bg-primary/10 border-primary text-primary font-bold');
    });

    it('sanitizes journal notes against XSS', () => {
        store.saveJournalEntry(Utils.toISODateString(), '😊', '<script>alert(1)</script>');
        const html = Views.Journal();
        expect(html).not.toContain('<script>alert(1)</script>');
    });

    it('lists past entries sorted newest first', () => {
        store.saveJournalEntry('2026-01-01', '😊', 'Eski not');
        store.saveJournalEntry('2026-02-01', '🚀', 'Yeni not');

        const html = Views.Journal();
        expect(html.indexOf('Yeni not')).toBeLessThan(html.indexOf('Eski not'));
    });
});

describe('Views.Focus', () => {
    it('renders the default 25:00 timer display and all 20 ambient sound options', () => {
        const html = Views.Focus();
        expect(html).toContain('25:00');
        // 20 ambient tracks + the "Sessiz" (silent/none) option
        const optionCount = (html.match(/<option value="[^"]*">/g) || []).length;
        expect(optionCount).toBeGreaterThanOrEqual(21);
    });

    it('excludes completed tasks from the task-link selector', () => {
        store.state.tasks = [];
        store.addTask({ title: 'Aktif görev', status: 'todo' });
        const doneTask = store.addTask({ title: 'Biten görev' });
        store.updateTask(doneTask.id, { status: 'done' });

        const html = Views.Focus();
        expect(html).toContain('Aktif görev');
        expect(html).not.toContain('Biten görev');
    });
});

describe('Views.renderCharts', () => {
    it('draws a pie slice per task category into #pie-chart / #pie-legend', () => {
        document.body.innerHTML = `
            <svg id="pie-chart"></svg>
            <div id="pie-legend"></div>
            <div id="heatmap-container"></div>
        `;
        store.state.tasks = [];
        store.addTask({ title: 'A', category: 'work' });
        store.addTask({ title: 'B', category: 'health' });

        Views.renderCharts();

        const svg = document.getElementById('pie-chart');
        expect(svg.querySelectorAll('path').length).toBe(2);
        expect(document.getElementById('pie-legend').textContent).toContain('work');
        expect(document.getElementById('pie-legend').textContent).toContain('health');
    });

    it('shows a "no data" legend when there are no tasks', () => {
        document.body.innerHTML = `
            <svg id="pie-chart"></svg>
            <div id="pie-legend"></div>
            <div id="heatmap-container"></div>
        `;
        store.state.tasks = [];
        Views.renderCharts();
        expect(document.getElementById('pie-legend').textContent).toContain('Veri bulunmuyor');
    });

    it('renders 84 heatmap cells (12 weeks x 7 days)', () => {
        document.body.innerHTML = `
            <svg id="pie-chart"></svg>
            <div id="pie-legend"></div>
            <div id="heatmap-container"></div>
        `;
        Views.renderCharts();
        const cells = document.getElementById('heatmap-container').querySelectorAll('[title]');
        expect(cells.length).toBe(84);
    });
});

describe('Views.setupTaskEvents (drag and drop wiring)', () => {
    it('sets app.logic.draggedId on dragstart and clears it on dragend', () => {
        window.app = { logic: { draggedId: null } };
        const task = store.addTask({ title: 'Sürüklenecek' });
        document.body.innerHTML = Views.Tasks();
        Views.setupTaskEvents();

        const item = document.querySelector(`.task-item[data-id="${task.id}"]`);
        item.dispatchEvent(new Event('dragstart', { bubbles: true }));
        expect(window.app.logic.draggedId).toBe(task.id);

        item.dispatchEvent(new Event('dragend', { bubbles: true }));
        expect(window.app.logic.draggedId).toBeNull();

        delete window.app;
    });
});

describe('Views.setupShopEvents (delegated click wiring)', () => {
    it('routes buy/delete clicks to app.logic with the reward id and xp cost', () => {
        const buyReward = vi.fn();
        const deleteReward = vi.fn();
        window.app = { logic: { buyReward, deleteReward } };

        store.state.rewards = [{ id: 'rw1', title: 'Test Ödül', xpCost: 30, icon: '🎁' }];
        store.state.xp = 100;
        document.body.innerHTML = Views.Shop();
        Views.setupShopEvents();

        document.querySelector('[data-action="buy-reward"]').dispatchEvent(new Event('click', { bubbles: true }));
        expect(buyReward).toHaveBeenCalledWith('rw1', 30, 'Test Ödül');

        document.querySelector('[data-action="delete-reward"]').dispatchEvent(new Event('click', { bubbles: true }));
        expect(deleteReward).toHaveBeenCalledWith('rw1');

        delete window.app;
    });
});
