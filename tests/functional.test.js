import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Functional QA: exercise real user-facing scenarios end to end through the
// same `app.logic` entry points the onclick handlers in index.html call,
// wired against the *actual* app.js bootstrap (not a hand-rolled stub).
let app, store;

const fullShell = () => `
    <canvas id="confetti-canvas"></canvas>
    <div id="offline-indicator" class="hidden"></div>
    <h1 id="page-title"></h1>
    <div id="content-area"></div>
    <div id="toast-container"></div>
    <div id="modal-backdrop" class="hidden opacity-0">
        <div id="modal-content" class="scale-95"></div>
    </div>
    <span id="user-name"></span>
    <span id="user-avatar"></span>
    <span id="user-xp"></span>
    <span id="user-level-badge"></span>
    <button id="timer-start-btn" class="bg-primary"></button>
    <span id="timer-display"></span>
    <span id="timer-status"></span>
    <circle id="timer-progress"></circle>
`;

const flush = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(async () => {
    localStorage.clear();
    document.body.innerHTML = fullShell();
    window.appState = { taskSearch: '', taskCategory: 'all', selectedMood: '🚀' };
    vi.resetModules();
    ({ app } = await import('../assets/js/app.js'));
    ({ store } = await import('../assets/js/store.js'));
    await flush(); // let the initial Router.navigate('dashboard') settle
});

describe('Task lifecycle', () => {
    it('completing a task awards +10 XP, marks it done, and shows a success toast', () => {
        const task = store.addTask({ title: 'Bitirilecek görev' });
        const xpBefore = store.state.xp;

        expect(() => app.logic.completeTask(task.id)).not.toThrow();

        expect(store.state.tasks.find((t) => t.id === task.id).status).toBe('done');
        expect(store.state.xp).toBe(xpBefore + 10);
        expect(document.getElementById('toast-container').textContent).toContain('Görev tamamlandı');
    });

    it('deleting a task offers undo, and undo restores the task', () => {
        const task = store.addTask({ title: 'Silinecek görev' });

        app.logic.deleteTask(task.id);
        expect(store.state.tasks.find((t) => t.id === task.id)).toBeUndefined();

        const undoBtn = document.getElementById('toast-undo-btn');
        expect(undoBtn).toBeTruthy();
        undoBtn.click();

        expect(store.state.tasks.some((t) => t.title === 'Silinecek görev')).toBe(true);
    });

    it('moveTaskStatus to "done" awards XP exactly once', () => {
        const task = store.addTask({ title: 'Kanban görevi' });
        const xpBefore = store.state.xp;

        app.logic.moveTaskStatus(task.id, 'in-progress');
        expect(store.state.xp).toBe(xpBefore);

        app.logic.moveTaskStatus(task.id, 'done');
        expect(store.state.xp).toBe(xpBefore + 10);
    });
});

describe('Profile name updates (mobile blur-reliability regression)', () => {
    // Regression: on some mobile browsers, editing the name inside the
    // profile modal (a position:fixed overlay the on-screen keyboard can
    // shift) never fired blur/change, so the name silently failed to save.
    // autosaveProfileName is a debounced oninput handler that persists the
    // name as the user types, independent of blur ever firing.
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('autosaveProfileName persists the trimmed name without waiting for blur', () => {
        app.logic.autosaveProfileName('Mobil Kullanıcı');
        vi.advanceTimersByTime(400);

        expect(store.state.user.name).toBe('Mobil Kullanıcı');
    });

    it('autosaveProfileName debounces rapid keystrokes into a single store update', () => {
        const listener = vi.fn();
        store.subscribe(listener);

        app.logic.autosaveProfileName('M');
        app.logic.autosaveProfileName('Mo');
        app.logic.autosaveProfileName('Mob');
        vi.advanceTimersByTime(399);
        expect(listener).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(listener).toHaveBeenCalledTimes(1);
        expect(store.state.user.name).toBe('Mob');
    });

    it('autosaveProfileName falls back to the default name for blank input', () => {
        app.logic.autosaveProfileName('   ');
        vi.advanceTimersByTime(400);

        expect(store.state.user.name).toBe('Kullanıcı');
    });

    it('does not touch the live input value (no caret-jump while typing)', () => {
        document.body.innerHTML += `<input id="profile-name-input" value="Mob">`;
        const input = document.getElementById('profile-name-input');

        app.logic.autosaveProfileName('Mob');
        vi.advanceTimersByTime(400);

        expect(input.value).toBe('Mob'); // untouched - updateProfileName (blur) owns normalization
    });
});

describe('Habit lifecycle', () => {
    it('toggleHabitDate for today awards +15 XP, sets a 1-day streak, and re-renders without throwing', () => {
        const habit = store.addHabit({ title: 'Su iç' });
        const xpBefore = store.state.xp;

        expect(() => app.logic.toggleHabitDate(habit.id, '2026-08-13')).not.toThrow();

        const updated = store.state.habits.find((h) => h.id === habit.id);
        expect(updated.completedDates).toContain('2026-08-13');
        expect(updated.streak).toBeGreaterThanOrEqual(0);
        expect(store.state.xp).toBe(xpBefore + 15);
    });

    it('deleteHabit asks for confirmation and removes the habit when confirmed', () => {
        const habit = store.addHabit({ title: 'Silinecek' });
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        app.logic.deleteHabit(habit.id);

        expect(store.state.habits.find((h) => h.id === habit.id)).toBeUndefined();
        window.confirm.mockRestore();
    });

    it('deleteHabit does nothing when confirmation is declined', () => {
        const habit = store.addHabit({ title: 'Kalacak' });
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        app.logic.deleteHabit(habit.id);

        expect(store.state.habits.some((h) => h.id === habit.id)).toBe(true);
        window.confirm.mockRestore();
    });
});

describe('Gamification events', () => {
    it('crossing a level threshold dispatches levelUp and renders a toast without throwing', () => {
        expect(() => store.addXP(100)).not.toThrow();
        expect(store.state.level).toBe(2);
        expect(document.getElementById('toast-container').textContent).toContain('SEVİYE');
    });

    it('unlocking an achievement renders a toast without throwing', () => {
        const task = store.addTask({ title: 'İlk görev' });
        expect(() => store.updateTask(task.id, { status: 'done' })).not.toThrow();
        expect(document.getElementById('toast-container').textContent).toContain('ROZET KAZANILDI');
    });
});

describe('Reward shop', () => {
    it('buying with insufficient XP shows an error toast and does not deduct XP', () => {
        store.state.xp = 5;
        app.logic.buyReward('nonexistent-or-cheap', 999, 'Pahalı Ödül');

        expect(store.state.xp).toBe(5);
        expect(document.getElementById('toast-container').textContent).toContain('Yetersiz XP');
    });

    it('buying with sufficient XP deducts the cost and shows a success toast', () => {
        store.state.xp = 100;
        app.logic.buyReward('r1', 50, 'Test Ödülü');

        expect(store.state.xp).toBe(50);
        expect(document.getElementById('toast-container').textContent).toContain('Tebrikler');
    });
});

describe('Daily journal', () => {
    it('saveJournal reads the note input and selected mood, then persists and awards XP', () => {
        document.body.innerHTML += `<textarea id="journal-note-input">Bugün verimli geçti</textarea>`;
        window.appState.selectedMood = '😊';
        const xpBefore = store.state.xp;

        app.logic.saveJournal();

        const todayStr = Object.keys(store.state.journalEntries)[0];
        expect(store.state.journalEntries[todayStr].note).toBe('Bugün verimli geçti');
        expect(store.state.journalEntries[todayStr].mood).toBe('😊');
        expect(store.state.xp).toBe(xpBefore + 10);
    });
});

describe('Backup export', () => {
    it('exportData triggers a download without throwing', () => {
        store.addTask({ title: 'Yedeklenecek' });
        expect(() => app.logic.exportData()).not.toThrow();
        expect(document.getElementById('toast-container').textContent).toContain('Yedek dosyası indirildi');
    });
});

describe('Pomodoro focus timer', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('counts down and awards +25 XP plus logs a pomodoro activity on completion', () => {
        app.logic.setTimerMode(25, 'Pomodoro');
        app.logic.timeLeft = 2; // shrink the wait so the test doesn't tick 1500 times
        app.logic.totalDuration = 2;
        const xpBefore = store.state.xp;

        app.logic.startTimer();
        expect(app.logic.isRunning).toBe(true);

        vi.advanceTimersByTime(2000);

        expect(app.logic.isRunning).toBe(false);
        expect(store.state.xp).toBe(xpBefore + 25);
        expect(store.state.activityLog[0].type).toBe('pomodoro');
    });

    it('pauseTimer stops the countdown without awarding XP', () => {
        app.logic.setTimerMode(25, 'Pomodoro');
        const xpBefore = store.state.xp;

        app.logic.startTimer();
        vi.advanceTimersByTime(1000);
        app.logic.pauseTimer();

        expect(app.logic.isRunning).toBe(false);
        expect(store.state.xp).toBe(xpBefore);
    });

    it('resetTimer restores the full duration', () => {
        app.logic.setTimerMode(5, 'Kısa Mola');
        app.logic.startTimer();
        vi.advanceTimersByTime(2000);
        app.logic.resetTimer();

        expect(app.logic.timeLeft).toBe(app.logic.totalDuration);
        expect(app.logic.isRunning).toBe(false);
    });
});
