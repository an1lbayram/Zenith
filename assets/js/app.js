import { store } from './store.js';
import { UI } from './ui.js';
import { Router } from './router.js';
import { Utils } from './utils.js';

// PWA Install Prompt State
let deferredInstallPrompt = null;
const isIOSDevice = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);
const isStandaloneMode = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// App Global State
window.appState = {
    taskSearch: '',
    taskCategory: 'all',
    selectedMood: '🚀'
};

const app = {
    router: Router,
    ui: UI,
    logic: {
        draggedId: null,

        // Profile Handlers
        updateProfileName: (value) => {
            const trimmed = (value || '').trim().slice(0, 24);
            const finalName = trimmed || 'Kullanıcı';
            store.updateProfile({ name: finalName });
            const input = document.getElementById('profile-name-input');
            if (input) input.value = finalName;
            UI.showToast('İsim güncellendi!', 'success');
        },

        // Debounced autosave fired on every keystroke (see profile-name-input's
        // oninput in ui.js), not just on blur/onchange. Mobile browsers -
        // especially inside a position:fixed modal that the on-screen
        // keyboard shifts around - don't reliably fire blur/change, which
        // made name edits appear to silently not save on mobile. This saves
        // continuously so the result never depends on blur firing at all.
        // Deliberately does NOT touch input.value (would reset the caret
        // mid-typing) or show a toast (would fire on every keystroke).
        _autosaveProfileName: Utils.debounce((value) => {
            const trimmed = (value || '').trim().slice(0, 24);
            store.updateProfile({ name: trimmed || 'Kullanıcı' });
        }, 400),
        autosaveProfileName(value) {
            this._autosaveProfileName(value);
        },

        setProfileAvatar: (emoji) => {
            store.updateProfile({ avatar: emoji });
            const preview = document.getElementById('profile-avatar-emoji');
            if (preview) preview.textContent = emoji;
            const picker = document.getElementById('avatar-picker');
            if (picker) picker.classList.add('hidden');
            UI.showToast('Avatar güncellendi!', 'success');
        },

        // Task Filters & Search
        onTaskSearch: (val) => {
            window.appState.taskSearch = val;
            Router.render();
        },

        setTaskCategory: (cat) => {
            window.appState.taskCategory = cat;
            Router.render();
        },

        // Drag and Drop Status Change
        onDrop: (e, status) => {
            e.preventDefault();
            if (app.logic.draggedId) {
                store.updateTask(app.logic.draggedId, { status });
                if (status === 'done') {
                    store.addXP(10);
                    app.gamification.fireConfetti();
                    if (store.state.settings.soundEnabled) Utils.playChime('success');
                }
            }
        },

        moveTaskStatus: (id, status) => {
            store.updateTask(id, { status });
            if (status === 'done') {
                store.addXP(10);
                app.gamification.fireConfetti();
                if (store.state.settings.soundEnabled) Utils.playChime('success');
            }
        },

        completeTask: (id) => {
            store.updateTask(id, { status: 'done' });
            store.addXP(10);
            app.gamification.fireConfetti();
            if (store.state.settings.soundEnabled) Utils.playChime('success');
            UI.showToast('Görev tamamlandı! +10 XP 🎯', 'success');
        },

        deleteTask: (id) => {
            const task = store.deleteTask(id);
            UI.showToast('Görev silindi', 'info', () => {
                store.addTask(task);
                UI.showToast('İşlem geri alındı', 'success');
            });
        },

        toggleSubtask: (taskId, subtaskId) => {
            store.toggleSubtask(taskId, subtaskId);
            UI.openEditTaskModal(taskId);
        },

        addSubtaskPrompt: (taskId) => {
            const text = prompt('Alt görev tanımı:');
            if (text && text.trim()) {
                const task = store.state.tasks.find(t => t.id === taskId);
                if (task) {
                    const subtasks = task.subtasks || [];
                    subtasks.push({ id: Utils.generateId(), text: text.trim(), completed: false });
                    store.updateTask(taskId, { subtasks });
                    UI.openEditTaskModal(taskId);
                }
            }
        },

        // Habit Handlers
        deleteHabit: (id) => {
            if (confirm('Bu alışkanlığı silmek istediğinize emin misiniz?')) {
                store.deleteHabit(id);
                UI.showToast('Alışkanlık silindi', 'info');
            }
        },

        toggleHabitDate: (id, dateStr) => {
            store.toggleHabitDate(id, dateStr);
        },

        // Reward Shop Handlers
        buyReward: (id, xpCost, rewardTitle) => {
            const success = store.spendXP(xpCost, rewardTitle);
            if (success) {
                app.gamification.fireConfetti();
                UI.showToast(`Tebrikler! "${rewardTitle}" ödülünü aldınız! 🎁`, 'success');
                Router.render();
            } else {
                UI.showToast('Yetersiz XP!', 'error');
            }
        },

        deleteReward: (id) => {
            store.deleteReward(id);
            UI.showToast('Ödül silindi', 'info');
            Router.render();
        },

        // Daily Journal Handlers
        selectMood: (moodIcon) => {
            window.appState.selectedMood = moodIcon;
            document.querySelectorAll('.mood-btn').forEach(btn => {
                if (btn.dataset.mood === moodIcon) {
                    btn.classList.add('bg-primary/10', 'border-primary', 'text-primary', 'font-bold');
                } else {
                    btn.classList.remove('bg-primary/10', 'border-primary', 'text-primary', 'font-bold');
                }
            });
        },

        saveJournal: () => {
            const noteEl = document.getElementById('journal-note-input');
            const note = noteEl ? noteEl.value : '';
            const mood = window.appState.selectedMood || '🚀';
            const todayStr = Utils.toISODateString();

            store.saveJournalEntry(todayStr, mood, note);
            app.gamification.fireConfetti();
            UI.showToast('Günün notu kaydedildi! +10 XP 🎯', 'success');
            Router.render();
        },

        // Quick Templates
        applyTemplate: (type) => {
            const templates = {
                workout: { title: 'Spor Salonu Egzersizi', category: 'health', priority: 'high', notes: 'Isınma 10 dk, Göğüs/Ön kol, Soğuma' },
                study: { title: 'Ders & Konu Çalışması', category: 'study', priority: 'normal', notes: '2 Pomodoro odaklanma seansı' },
                shopping: { title: 'Haftalık Alışveriş', category: 'personal', priority: 'normal', notes: 'Sebze, Süt ürünleri, Ev ihtiyaçları' },
                meeting: { title: 'Haftalık Ekip Toplantısı', category: 'work', priority: 'urgent', notes: 'Raporlar ve gelecek hafta hedefleri' }
            };

            const t = templates[type];
            if (t) {
                const titleInput = document.querySelector('[name="title"]');
                const categoryInput = document.querySelector('[name="category"]');
                const priorityInput = document.querySelector('[name="priority"]');
                const notesInput = document.querySelector('[name="notes"]');

                if (titleInput) titleInput.value = t.title;
                if (categoryInput) categoryInput.value = t.category;
                if (priorityInput) priorityInput.value = t.priority;
                if (notesInput) notesInput.value = t.notes;
            }
        },

        // Backup & Export Handlers
        exportData: () => {
            const dataStr = store.exportData();
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zenith_backup_${Utils.toISODateString()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            UI.showToast('Yedek dosyası indirildi! 💾', 'success');
        },

        importDataPrompt: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    const success = store.importData(event.target.result);
                    if (success) {
                        UI.showToast('Veriler başarıyla içeri aktarıldı!', 'success');
                        Router.render();
                    } else {
                        UI.showToast('Hata: Geçersiz yedek dosyası!', 'error');
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        },

        resetAllData: () => {
            if (confirm('TÜM GÖREV VE ALIŞKANLIKLAR SİLİNECEK! Emin misiniz?')) {
                store.resetData();
            }
        },

        // Pomodoro State & Ambient Sound
        timerInterval: null,
        timeLeft: 25 * 60,
        totalDuration: 25 * 60,
        isRunning: false,
        modeName: 'Pomodoro',
        ambientSound: 'none',

        initPomodoro: () => {
            app.logic.updateTimerDisplay();
        },

        setAmbientSound: (soundType) => {
            app.logic.ambientSound = soundType;
            if (app.logic.isRunning) {
                Utils.playAmbientSound(soundType);
            }
        },

        toggleTimer: () => {
            if (app.logic.isRunning) {
                app.logic.pauseTimer();
            } else {
                app.logic.startTimer();
            }
        },

        startTimer: () => {
            if (app.logic.isRunning) return;
            app.logic.isRunning = true;

            const startBtn = document.getElementById('timer-start-btn');
            if (startBtn) {
                startBtn.textContent = 'DURDUR';
                startBtn.classList.replace('bg-primary', 'bg-amber-500');
            }

            if (app.logic.ambientSound && app.logic.ambientSound !== 'none') {
                Utils.playAmbientSound(app.logic.ambientSound);
            }

            app.logic.timerInterval = setInterval(() => {
                app.logic.timeLeft--;
                app.logic.updateTimerDisplay();

                if (app.logic.timeLeft <= 0) {
                    clearInterval(app.logic.timerInterval);
                    app.logic.timerInterval = null;
                    app.logic.isRunning = false;
                    Utils.stopAmbientSound();

                    if (startBtn) {
                        startBtn.textContent = 'BAŞLAT';
                        startBtn.classList.replace('bg-amber-500', 'bg-primary');
                    }

                    if (store.state.settings.soundEnabled) Utils.playChime('timerEnd');
                    Utils.sendNotification(`${app.logic.modeName} Tamamlandı! 🎉`, 'Tebrikler! Odaklanma seansınızı başarıyla bitirdiniz.');

                    UI.showToast(`${app.logic.modeName} Süresi Doldu! 🎉 (+25 XP)`, 'levelUp');
                    app.gamification.fireConfetti();
                    store.addXP(25);
                    store.logActivity('pomodoro');
                }
            }, 1000);
        },

        pauseTimer: () => {
            clearInterval(app.logic.timerInterval);
            app.logic.timerInterval = null;
            app.logic.isRunning = false;
            Utils.stopAmbientSound();

            const startBtn = document.getElementById('timer-start-btn');
            if (startBtn) {
                startBtn.textContent = 'DEVAM ET';
                startBtn.classList.replace('bg-amber-500', 'bg-primary');
            }
        },

        resetTimer: () => {
            clearInterval(app.logic.timerInterval);
            app.logic.timerInterval = null;
            app.logic.isRunning = false;
            app.logic.timeLeft = app.logic.totalDuration;
            Utils.stopAmbientSound();

            const startBtn = document.getElementById('timer-start-btn');
            if (startBtn) {
                startBtn.textContent = 'BAŞLAT';
                startBtn.className = 'flex-1 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-xl shadow-primary/30 hover:scale-105 transition-all';
            }

            app.logic.updateTimerDisplay();
        },

        setTimerMode: (minutes, modeLabel = 'Pomodoro') => {
            app.logic.resetTimer();
            app.logic.modeName = modeLabel;
            app.logic.totalDuration = minutes * 60;
            app.logic.timeLeft = minutes * 60;
            const statusEl = document.getElementById('timer-status');
            if (statusEl) statusEl.textContent = modeLabel.toUpperCase();
            app.logic.updateTimerDisplay();
        },

        updateTimerDisplay: () => {
            const display = document.getElementById('timer-display');
            const circle = document.getElementById('timer-progress');

            const m = Math.floor(app.logic.timeLeft / 60);
            const s = app.logic.timeLeft % 60;
            const formatted = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

            if (display) display.textContent = formatted;

            if (circle) {
                const circumference = 722;
                const offset = circumference - (circumference * app.logic.timeLeft) / app.logic.totalDuration;
                circle.style.strokeDashoffset = offset;
            }
        }
    },

    gamification: {
        fireConfetti: () => {
            const canvas = document.getElementById('confetti-canvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const particles = [];
            const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

            for (let i = 0; i < 90; i++) {
                particles.push({
                    x: canvas.width / 2,
                    y: canvas.height / 3,
                    vx: (Math.random() - 0.5) * 14,
                    vy: (Math.random() - 0.7) * 12,
                    size: Math.random() * 6 + 3,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 90
                });
            }

            const animate = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                let active = false;
                particles.forEach(p => {
                    if (p.life > 0) {
                        active = true;
                        p.x += p.vx;
                        p.y += p.vy;
                        p.vy += 0.25;
                        p.life--;
                        ctx.fillStyle = p.color;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                if (active) requestAnimationFrame(animate);
                else ctx.clearRect(0, 0, canvas.width, canvas.height);
            };
            animate();
        }
    },

    pwa: {
        install: async () => {
            const btn = document.getElementById('install-app-btn');
            if (deferredInstallPrompt) {
                deferredInstallPrompt.prompt();
                const { outcome } = await deferredInstallPrompt.userChoice;
                deferredInstallPrompt = null;
                if (btn) btn.classList.add('hidden');
                if (outcome !== 'accepted') UI.showToast('Yükleme iptal edildi', 'info');
            } else if (isIOSDevice()) {
                UI.openIOSInstallGuide();
            }
        }
    }
};

window.app = app;

// Global Event Listeners
window.addEventListener('taskCreated', () => {
    app.gamification.fireConfetti();
});

window.addEventListener('levelUp', (e) => {
    UI.showToast(`TEBRİKLER! SEVİYE ${e.detail.level} OLDUNUZ! 🎉`, 'levelUp');
    app.gamification.fireConfetti();
});

window.addEventListener('achievementUnlocked', (e) => {
    UI.showToast(`ROZET KAZANILDI: ${e.detail.name} ${e.detail.icon}!`, 'levelUp');
    app.gamification.fireConfetti();
});

// Store State Listener
store.subscribe((state) => {
    const nameEl = document.getElementById('user-name');
    const avatarEl = document.getElementById('user-avatar');
    const xpEl = document.getElementById('user-xp');
    const badgeEl = document.getElementById('user-level-badge');

    if (nameEl) nameEl.textContent = state.user.name || 'Kullanıcı';
    if (avatarEl) avatarEl.textContent = state.user.avatar || '⚡';
    if (xpEl) xpEl.textContent = `${state.xp} XP`;
    if (badgeEl) badgeEl.textContent = `Lvl ${state.level}`;

    // Focus is excluded: its countdown updates its own DOM imperatively
    // (updateTimerDisplay) for smooth per-second ticking, and a full re-render
    // here would reset that display without restarting the interval.
    const reactiveRoutes = ['tasks', 'dashboard', 'shop', 'habits', 'calendar', 'journal'];
    if (reactiveRoutes.includes(Router.currentRoute)) {
        Router.render();
    }
});

// Initial Setup
if (store.state.settings.darkMode) document.documentElement.classList.add('dark');
UI.setTheme(store.state.settings.theme || 'emerald');

// Start Router
Router.navigate('dashboard');

// Offline Detector
window.addEventListener('online', () => {
    const el = document.getElementById('offline-indicator');
    if (el) el.classList.add('hidden');
});
window.addEventListener('offline', () => {
    const el = document.getElementById('offline-indicator');
    if (el) el.classList.remove('hidden');
});

// PWA Install Button
const installBtn = document.getElementById('install-app-btn');
if (installBtn && !isStandaloneMode()) {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        installBtn.classList.remove('hidden');
        installBtn.classList.add('flex');
    });

    // beforeinstallprompt never fires on iOS Safari; show manual guide instead
    if (isIOSDevice()) {
        installBtn.classList.remove('hidden');
        installBtn.classList.add('flex');
    }
}

window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    if (installBtn) installBtn.classList.add('hidden');
    UI.showToast('Zenith başarıyla yüklendi! 🎉', 'success');
});

// Service Worker Registration & Auto-Update
if ('serviceWorker' in navigator) {
    // The new SW activates immediately (skipWaiting + clients.claim in sw.js),
    // which fires 'controllerchange' here — reload once so the already-open
    // installed app picks up the fresh assets without a manual refresh.
    let swRefreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (swRefreshing) return;
        swRefreshing = true;
        window.location.reload();
    });

    window.addEventListener('load', async () => {
        try {
            const reg = await navigator.serviceWorker.register('./sw.js');
            console.info('ServiceWorker registered cleanly:', reg.scope);

            // Proactively look for a newer version whenever connectivity
            // returns or the installed app regains focus.
            window.addEventListener('online', () => reg.update());
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') reg.update();
            });
            setInterval(() => reg.update(), 30 * 60 * 1000);
        } catch (err) {
            console.warn('ServiceWorker registration error:', err);
        }
    });
}

export { app };
