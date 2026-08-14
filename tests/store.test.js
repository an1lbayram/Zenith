import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Utils } from '../assets/js/utils.js';

// store.js exports a module-level singleton (`export const store = new Store()`),
// mirroring the real app's one-instance-per-page-load lifecycle. To get an
// isolated instance per test we clear localStorage and force a fresh module
// evaluation via vi.resetModules() + a dynamic re-import.
let store;

beforeEach(async () => {
    localStorage.clear();
    vi.resetModules();
    ({ store } = await import('../assets/js/store.js'));
});

const daysAgo = (n) => Utils.toISODateString(new Date(Date.now() - n * 86400000));

describe('fresh state defaults (new-user regression coverage)', () => {
    it('starts a brand-new user at 0 XP / Level 1, not pre-leveled', () => {
        expect(store.state.xp).toBe(0);
        expect(store.state.level).toBe(1);
    });

    it('ships with no habits, so no fake active streaks', () => {
        expect(store.state.habits).toEqual([]);
    });

    it('ships demo tasks as todo, not pre-completed', () => {
        expect(store.state.tasks.length).toBeGreaterThan(0);
        store.state.tasks.forEach((t) => {
            expect(t.status).toBe('todo');
            expect(t.completedAt).toBeUndefined();
        });
    });

    it('unlocks no achievements before the user does anything', () => {
        expect(store.state.achievements.every((a) => !a.unlocked)).toBe(true);
    });

    it('starts with an empty journal and activity log', () => {
        expect(store.state.journalEntries).toEqual({});
        expect(store.state.activityLog).toEqual([]);
    });
});

describe('profile updates (regression: name/avatar edit)', () => {
    it('updateProfile merges into user state and notifies listeners', () => {
        const listener = vi.fn();
        store.subscribe(listener);

        store.updateProfile({ name: 'Anıl', avatar: '🚀' });

        expect(store.state.user.name).toBe('Anıl');
        expect(store.state.user.avatar).toBe('🚀');
        expect(listener).toHaveBeenCalled();
    });

    it('updating only the name leaves the avatar untouched', () => {
        store.updateProfile({ name: 'Yeni İsim' });
        expect(store.state.user.avatar).toBe('⚡');
    });
});

describe('task actions', () => {
    it('addTask prepends a new task with defaults filled in', () => {
        const before = store.state.tasks.length;
        const task = store.addTask({ title: 'Test görevi' });

        expect(store.state.tasks.length).toBe(before + 1);
        expect(store.state.tasks[0].id).toBe(task.id);
        expect(task.status).toBe('todo');
        expect(task.category).toBe('personal');
    });

    it('updateTask sets completedAt only on the todo -> done transition', () => {
        const task = store.addTask({ title: 'X' });
        store.updateTask(task.id, { status: 'done' });

        const updated = store.state.tasks.find((t) => t.id === task.id);
        expect(updated.status).toBe('done');
        expect(updated.completedAt).toBeTruthy();
    });

    it('deleteTask removes the task and returns it', () => {
        const task = store.addTask({ title: 'Silinecek' });
        const removed = store.deleteTask(task.id);

        expect(removed.id).toBe(task.id);
        expect(store.state.tasks.find((t) => t.id === task.id)).toBeUndefined();
    });

    it('toggleSubtask flips a subtask completed flag', () => {
        const task = store.addTask({
            title: 'Alt görevli',
            subtasks: [{ id: 'sub1', text: 'adım 1', completed: false }],
        });

        store.toggleSubtask(task.id, 'sub1');
        expect(store.state.tasks.find((t) => t.id === task.id).subtasks[0].completed).toBe(true);

        store.toggleSubtask(task.id, 'sub1');
        expect(store.state.tasks.find((t) => t.id === task.id).subtasks[0].completed).toBe(false);
    });
});

describe('habit actions', () => {
    it('addHabit creates a zero-streak habit with no completed dates', () => {
        const habit = store.addHabit({ title: 'Su iç' });
        expect(habit.streak).toBe(0);
        expect(habit.completedDates).toEqual([]);
        expect(store.state.habits[0].id).toBe(habit.id);
    });

    it('toggleHabitDate marks today done, awards 15 XP, and sets streak to 1', () => {
        const habit = store.addHabit({ title: 'Kitap oku' });
        const xpBefore = store.state.xp;

        store.toggleHabitDate(habit.id);

        const updated = store.state.habits.find((h) => h.id === habit.id);
        expect(updated.completedDates).toContain(Utils.toISODateString());
        expect(updated.streak).toBe(1);
        expect(store.state.xp).toBe(xpBefore + 15);
    });

    it('toggling the same date again un-marks it without refunding XP', () => {
        const habit = store.addHabit({ title: 'Kitap oku' });
        store.toggleHabitDate(habit.id);
        const xpAfterComplete = store.state.xp;

        store.toggleHabitDate(habit.id);

        const updated = store.state.habits.find((h) => h.id === habit.id);
        expect(updated.completedDates).toEqual([]);
        expect(updated.streak).toBe(0);
        expect(store.state.xp).toBe(xpAfterComplete);
    });

    it('deleteHabit removes the habit and returns it', () => {
        const habit = store.addHabit({ title: 'Silinecek alışkanlık' });
        const removed = store.deleteHabit(habit.id);

        expect(removed.id).toBe(habit.id);
        expect(store.state.habits).toEqual([]);
    });
});

describe('calculateStreak', () => {
    it('returns 0 for no completed dates', () => {
        expect(store.calculateStreak([])).toBe(0);
    });

    it('counts consecutive days ending today', () => {
        const dates = [daysAgo(0), daysAgo(1), daysAgo(2)];
        expect(store.calculateStreak(dates)).toBe(3);
    });

    it('still counts a streak ending yesterday (grace period before today)', () => {
        const dates = [daysAgo(1), daysAgo(2)];
        expect(store.calculateStreak(dates)).toBe(2);
    });

    it('resets to 0 once the gap is more than a day old', () => {
        const dates = [daysAgo(3)];
        expect(store.calculateStreak(dates)).toBe(0);
    });

    it('stops counting at the first gap', () => {
        const dates = [daysAgo(0), daysAgo(2)]; // yesterday missing
        expect(store.calculateStreak(dates)).toBe(1);
    });
});

describe('XP and leveling', () => {
    it('addXP accumulates and levels up at 100 XP thresholds', () => {
        store.addXP(50);
        expect(store.state.xp).toBe(50);
        expect(store.state.level).toBe(1);

        store.addXP(60);
        expect(store.state.xp).toBe(110);
        expect(store.state.level).toBe(2);
    });

    it('spendXP refuses to go negative and only deducts on success', () => {
        store.addXP(30);
        expect(store.spendXP(100)).toBe(false);
        expect(store.state.xp).toBe(30);

        expect(store.spendXP(20)).toBe(true);
        expect(store.state.xp).toBe(10);
    });
});

describe('checkAchievements', () => {
    it('does not unlock habit_starter until the user actually creates a habit', () => {
        // Regression: demo/default state used to ship with pre-existing habits,
        // which made this achievement fire before the user did anything.
        store.addXP(1); // any store action that triggers checkAchievements
        expect(store.state.achievements.find((a) => a.id === 'habit_starter').unlocked).toBe(false);

        store.addHabit({ title: 'İlk alışkanlık' });
        expect(store.state.achievements.find((a) => a.id === 'habit_starter').unlocked).toBe(true);
    });

    it('unlocks first_task on the first completed task', () => {
        const task = store.addTask({ title: 'X' });
        store.updateTask(task.id, { status: 'done' });
        expect(store.state.achievements.find((a) => a.id === 'first_task').unlocked).toBe(true);
    });

    it('unlocks task_master after 10 completed tasks', () => {
        for (let i = 0; i < 10; i++) {
            const task = store.addTask({ title: `Görev ${i}` });
            store.updateTask(task.id, { status: 'done' });
        }
        expect(store.state.achievements.find((a) => a.id === 'task_master').unlocked).toBe(true);
    });

    it('unlocks level_5 once XP crosses the level-5 threshold', () => {
        store.addXP(400);
        expect(store.state.level).toBe(5);
        expect(store.state.achievements.find((a) => a.id === 'level_5').unlocked).toBe(true);
    });

    it('unlocks streak_3 once a habit reaches a 3-day streak', () => {
        const habit = store.addHabit({ title: 'Seri testi' });
        store.toggleHabitDate(habit.id, daysAgo(0));
        store.toggleHabitDate(habit.id, daysAgo(1));
        store.toggleHabitDate(habit.id, daysAgo(2));

        expect(store.state.achievements.find((a) => a.id === 'streak_3').unlocked).toBe(true);
    });
});

describe('reward shop actions', () => {
    it('addReward prepends a reward with sane defaults', () => {
        const before = store.state.rewards.length;
        const reward = store.addReward({ title: 'Özel Ödül' });

        expect(store.state.rewards.length).toBe(before + 1);
        expect(store.state.rewards[0].id).toBe(reward.id);
        expect(reward.xpCost).toBe(50);
        expect(reward.icon).toBe('🎁');
    });

    it('addReward coerces a numeric-string xpCost and falls back to 50 when invalid', () => {
        expect(store.addReward({ title: 'A', xpCost: '75' }).xpCost).toBe(75);
        expect(store.addReward({ title: 'B', xpCost: 'not-a-number' }).xpCost).toBe(50);
    });

    it('deleteReward removes only the targeted reward', () => {
        const reward = store.addReward({ title: 'Silinecek' });
        store.deleteReward(reward.id);
        expect(store.state.rewards.find((r) => r.id === reward.id)).toBeUndefined();
    });

    it('spendXP deducts XP exactly at the boundary (xp === cost)', () => {
        store.addXP(50);
        expect(store.spendXP(50)).toBe(true);
        expect(store.state.xp).toBe(0);
    });
});

describe('daily journal', () => {
    it('saveJournalEntry stores the entry keyed by date and awards 10 XP', () => {
        const xpBefore = store.state.xp;
        store.saveJournalEntry('2026-01-05', '🚀', 'Harika bir gündü');

        expect(store.state.journalEntries['2026-01-05']).toEqual({
            dateStr: '2026-01-05',
            mood: '🚀',
            note: 'Harika bir gündü',
        });
        expect(store.state.xp).toBe(xpBefore + 10);
    });

    it('saving again for the same date overwrites rather than duplicating', () => {
        store.saveJournalEntry('2026-01-05', '😊', 'İlk not');
        store.saveJournalEntry('2026-01-05', '😓', 'Güncellenmiş not');

        expect(Object.keys(store.state.journalEntries)).toHaveLength(1);
        expect(store.state.journalEntries['2026-01-05'].mood).toBe('😓');
        expect(store.state.journalEntries['2026-01-05'].note).toBe('Güncellenmiş not');
    });
});

describe('activity log', () => {
    it('logActivity records type, date, and timestamp', () => {
        store.logActivity('pomodoro');
        expect(store.state.activityLog[0]).toMatchObject({ type: 'pomodoro' });
        expect(store.state.activityLog[0].dateStr).toBe(Utils.toISODateString());
        expect(typeof store.state.activityLog[0].timestamp).toBe('number');
    });

    it('caps the activity log at 300 entries, dropping the oldest', () => {
        for (let i = 0; i < 305; i++) {
            store.logActivity('task_complete');
        }
        expect(store.state.activityLog.length).toBe(300);
    });
});

describe('persistence', () => {
    it('notify() persists state to localStorage under the versioned key', () => {
        store.addTask({ title: 'Kalıcı görev' });
        const saved = JSON.parse(localStorage.getItem('zenith_state_v3'));
        expect(saved.tasks.some((t) => t.title === 'Kalıcı görev')).toBe(true);
    });

    it('loadFromStorage falls back to defaults when tasks in storage are corrupt (not an array)', async () => {
        localStorage.setItem('zenith_state_v3', JSON.stringify({ tasks: 'not-an-array', xp: 5 }));
        vi.resetModules();
        const { store: reloaded } = await import('../assets/js/store.js');

        expect(Array.isArray(reloaded.state.tasks)).toBe(true);
        expect(reloaded.state.xp).toBe(5);
    });

    it('loadFromStorage survives unparseable JSON without throwing', async () => {
        localStorage.setItem('zenith_state_v3', '{ not valid json');
        vi.resetModules();
        const { store: reloaded } = await import('../assets/js/store.js');

        expect(reloaded.state.xp).toBe(0);
        expect(Array.isArray(reloaded.state.tasks)).toBe(true);
    });
});

describe('export / import', () => {
    it('round-trips state through exportData/importData', () => {
        store.addTask({ title: 'Yedeklenecek görev' });
        store.updateProfile({ name: 'Yedek Kullanıcı' });

        const json = store.exportData();

        localStorage.clear();
        vi.resetModules();
        return import('../assets/js/store.js').then(({ store: freshStore }) => {
            const ok = freshStore.importData(json);
            expect(ok).toBe(true);
            expect(freshStore.state.user.name).toBe('Yedek Kullanıcı');
            expect(freshStore.state.tasks.some((t) => t.title === 'Yedeklenecek görev')).toBe(true);
        });
    });

    it('importData rejects invalid JSON without throwing', () => {
        expect(store.importData('{ bozuk json')).toBe(false);
    });
});
