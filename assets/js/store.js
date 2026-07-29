import { db } from './firebase.js';
import { Utils } from './utils.js';

const INITIAL_ACHIEVEMENTS = [
    { id: 'first_task', name: 'İlk Adım', desc: 'İlk görevini tamamla', icon: '🎯', unlocked: false },
    { id: 'task_master', name: 'Görev Ustası', desc: '10 görev tamamla', icon: '⚡', unlocked: false },
    { id: 'habit_starter', name: 'Disiplin Yıldızı', desc: 'İlk alışkanlığını oluştur', icon: '🌱', unlocked: false },
    { id: 'streak_3', name: 'Seri Katil', desc: 'Bir alışkanlıkta 3 günlük seri yap', icon: '🔥', unlocked: false },
    { id: 'focus_ninja', name: 'Odak Üstadı', desc: '1 Pomodoro seansı bitir', icon: '🧘', unlocked: false },
    { id: 'level_5', name: 'Yükselen Yıldız', desc: 'Seviye 5\'e ulaş', icon: '👑', unlocked: false }
];

const DEFAULT_DEMO_TASKS = [
    {
        id: 'demo_1',
        title: 'Zenith Arayüzünü Keşfet',
        category: 'personal',
        priority: 'high',
        status: 'todo',
        dueDate: Utils.toISODateString(),
        notes: 'Görev, Alışkanlık ve Odak modlarını incele.',
        subtasks: [
            { id: 's1', text: 'Yeni bir görev ekle', completed: false },
            { id: 's2', text: 'Pomodoro zamanlayıcısını başlat', completed: false }
        ],
        createdAt: new Date().toISOString()
    },
    {
        id: 'demo_2',
        title: 'Haftalık Proje Planlaması',
        category: 'work',
        priority: 'normal',
        status: 'done',
        dueDate: Utils.toISODateString(),
        notes: 'Öncelikli işleri listele ve takvime ekle.',
        subtasks: [],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date().toISOString()
    }
];

const DEFAULT_DEMO_HABITS = [
    {
        id: 'habit_1',
        title: 'Kitap Oku (20 Sayfa)',
        category: 'study',
        frequency: 'daily',
        icon: '📚',
        streak: 2,
        completedDates: [Utils.toISODateString(new Date(Date.now() - 86400000)), Utils.toISODateString()],
        createdAt: new Date().toISOString()
    },
    {
        id: 'habit_2',
        title: '2 Litre Su İç',
        category: 'health',
        frequency: 'daily',
        icon: '💧',
        streak: 1,
        completedDates: [Utils.toISODateString()],
        createdAt: new Date().toISOString()
    }
];

class Store {
    constructor() {
        this.state = {
            user: {
                name: 'Kullanıcı',
                avatar: '⚡'
            },
            tasks: [...DEFAULT_DEMO_TASKS],
            habits: [...DEFAULT_DEMO_HABITS],
            activityLog: [
                { id: 'act_1', type: 'task_complete', dateStr: Utils.toISODateString(), timestamp: Date.now() }
            ],
            achievements: [...INITIAL_ACHIEVEMENTS],
            settings: {
                theme: 'emerald',
                darkMode: false,
                soundEnabled: true
            },
            xp: 20,
            level: 1
        };

        this.listeners = [];
        this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('zenith_state_v2');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = {
                    ...this.state,
                    ...parsed,
                    user: { ...this.state.user, ...(parsed.user || {}) },
                    settings: { ...this.state.settings, ...(parsed.settings || {}) },
                    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [...DEFAULT_DEMO_TASKS],
                    habits: Array.isArray(parsed.habits) ? parsed.habits : [...DEFAULT_DEMO_HABITS],
                    activityLog: Array.isArray(parsed.activityLog) ? parsed.activityLog : [],
                    achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [...INITIAL_ACHIEVEMENTS]
                };
            }
        } catch (e) {
            console.warn('Storage load fallback:', e);
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('zenith_state_v2', JSON.stringify(this.state));
        } catch (e) {
            console.error('Storage save error:', e);
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.saveToStorage();
        this.listeners.forEach(l => {
            try {
                l(this.state);
            } catch (err) {
                console.error('Listener notification error:', err);
            }
        });
    }

    // User Profile Actions
    updateProfile(updates) {
        this.state.user = { ...this.state.user, ...updates };
        this.notify();
    }

    // Task Actions
    addTask(taskData) {
        const newTask = {
            id: Utils.generateId(),
            title: taskData.title || 'Yeni Görev',
            category: taskData.category || 'personal',
            priority: taskData.priority || 'normal',
            status: taskData.status || 'todo',
            dueDate: taskData.dueDate || '',
            notes: taskData.notes || '',
            subtasks: Array.isArray(taskData.subtasks) ? taskData.subtasks : [],
            createdAt: new Date().toISOString()
        };

        this.state.tasks.unshift(newTask);
        this.notify();
        this.checkAchievements();
        this.syncFirebase('tasks', 'add', newTask);
        return newTask;
    }

    updateTask(id, updates) {
        const index = this.state.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            const oldStatus = this.state.tasks[index].status;
            const updated = { ...this.state.tasks[index], ...updates };

            if (updates.status === 'done' && oldStatus !== 'done') {
                updated.completedAt = new Date().toISOString();
                this.logActivity('task_complete');
            }

            this.state.tasks[index] = updated;
            this.notify();
            this.checkAchievements();
            this.syncFirebase('tasks', 'update', updated);
        }
    }

    deleteTask(id) {
        const task = this.state.tasks.find(t => t.id === id);
        this.state.tasks = this.state.tasks.filter(t => t.id !== id);
        this.notify();
        this.syncFirebase('tasks', 'delete', { id });
        return task;
    }

    toggleSubtask(taskId, subtaskId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (task && Array.isArray(task.subtasks)) {
            const sub = task.subtasks.find(s => s.id === subtaskId);
            if (sub) {
                sub.completed = !sub.completed;
                this.notify();
            }
        }
    }

    // Habit Actions
    addHabit(habitData) {
        const newHabit = {
            id: Utils.generateId(),
            title: habitData.title || 'Yeni Alışkanlık',
            category: habitData.category || 'personal',
            frequency: habitData.frequency || 'daily',
            icon: habitData.icon || '🔥',
            streak: 0,
            completedDates: [],
            createdAt: new Date().toISOString()
        };

        this.state.habits.unshift(newHabit);
        this.notify();
        this.checkAchievements();
        return newHabit;
    }

    deleteHabit(id) {
        const habit = this.state.habits.find(h => h.id === id);
        this.state.habits = this.state.habits.filter(h => h.id !== id);
        this.notify();
        return habit;
    }

    toggleHabitDate(id, dateStr = Utils.toISODateString()) {
        const habit = this.state.habits.find(h => h.id === id);
        if (!habit) return;

        const dates = habit.completedDates || [];
        const existsIndex = dates.indexOf(dateStr);

        if (existsIndex !== -1) {
            // Uncheck
            dates.splice(existsIndex, 1);
        } else {
            // Check
            dates.push(dateStr);
            this.addXP(15);
            this.logActivity('habit_complete');
            if (this.state.settings.soundEnabled) Utils.playChime('success');
        }

        // Recalculate Streak
        habit.streak = this.calculateStreak(dates);
        habit.completedDates = dates;

        this.notify();
        this.checkAchievements();
    }

    calculateStreak(datesArray = []) {
        if (!datesArray.length) return 0;
        const sorted = [...datesArray].sort((a, b) => new Date(b) - new Date(a));

        let streak = 0;
        let checkDate = new Date();

        // Check if today or yesterday is completed
        const todayStr = Utils.toISODateString(checkDate);
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayStr = Utils.toISODateString(checkDate);

        if (!sorted.includes(todayStr) && !sorted.includes(yesterdayStr)) {
            return 0;
        }

        let curr = sorted.includes(todayStr) ? new Date() : checkDate;

        while (true) {
            const dateStr = Utils.toISODateString(curr);
            if (sorted.includes(dateStr)) {
                streak++;
                curr.setDate(curr.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }

    // Activity Log Helper
    logActivity(type) {
        const logEntry = {
            id: Utils.generateId(),
            type,
            dateStr: Utils.toISODateString(),
            timestamp: Date.now()
        };
        this.state.activityLog.unshift(logEntry);
        // Keep last 300 activities
        if (this.state.activityLog.length > 300) {
            this.state.activityLog = this.state.activityLog.slice(0, 300);
        }
    }

    // XP and Gamification
    addXP(amount) {
        this.state.xp += amount;
        const newLevel = Math.floor(this.state.xp / 100) + 1;
        if (newLevel > this.state.level) {
            this.state.level = newLevel;
            if (this.state.settings.soundEnabled) Utils.playChime('levelUp');
            window.dispatchEvent(new CustomEvent('levelUp', { detail: { level: newLevel } }));
        }
        this.notify();
        this.checkAchievements();
    }

    checkAchievements() {
        const completedTasksCount = this.state.tasks.filter(t => t.status === 'done').length;
        const maxStreak = Math.max(0, ...this.state.habits.map(h => h.streak || 0));

        let changed = false;
        this.state.achievements.forEach(ach => {
            if (ach.unlocked) return;

            let condition = false;
            if (ach.id === 'first_task' && completedTasksCount >= 1) condition = true;
            if (ach.id === 'task_master' && completedTasksCount >= 10) condition = true;
            if (ach.id === 'habit_starter' && this.state.habits.length >= 1) condition = true;
            if (ach.id === 'streak_3' && maxStreak >= 3) condition = true;
            if (ach.id === 'level_5' && this.state.level >= 5) condition = true;

            if (condition) {
                ach.unlocked = true;
                changed = true;
                window.dispatchEvent(new CustomEvent('achievementUnlocked', { detail: ach }));
            }
        });

        if (changed) this.notify();
    }

    // Export & Import Data Backup
    exportData() {
        return JSON.stringify(this.state, null, 2);
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data && typeof data === 'object') {
                this.state = { ...this.state, ...data };
                this.notify();
                return true;
            }
        } catch (e) {
            console.error('Import error:', e);
        }
        return false;
    }

    resetData() {
        localStorage.removeItem('zenith_state_v2');
        location.reload();
    }

    // Firebase Sync Stub
    async syncFirebase(collectionName, action, data) {
        if (!db || !this.state.user) return;
        // Simple firestore sync when user configures API keys
    }
}

export const store = new Store();
