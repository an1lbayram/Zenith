import { Utils } from './utils.js';
import { store } from './store.js';

export const UI = {
    // Theme Management
    setTheme: (themeName) => {
        document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, '');
        document.documentElement.classList.add(`theme-${themeName}`);
        store.state.settings.theme = themeName;
        store.saveToStorage();
    },

    toggleDarkMode: () => {
        document.documentElement.classList.toggle('dark');
        store.state.settings.darkMode = document.documentElement.classList.contains('dark');
        store.saveToStorage();
    },

    // Toast Notification System
    showToast: (msg, type = 'info', undoAction = null) => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');

        let bgClass = 'bg-slate-900 dark:bg-slate-800 border-slate-700';
        let iconHtml = 'ℹ️';

        if (type === 'success') {
            bgClass = 'bg-emerald-600 border-emerald-500';
            iconHtml = '✅';
        } else if (type === 'error') {
            bgClass = 'bg-rose-600 border-rose-500';
            iconHtml = '⚠️';
        } else if (type === 'levelUp') {
            bgClass = 'bg-gradient-to-r from-amber-500 to-purple-600 border-amber-400';
            iconHtml = '🎉';
        }

        toast.className = `${bgClass} text-white px-5 py-3 rounded-2xl shadow-2xl border flex items-center justify-between gap-4 toast-enter pointer-events-auto min-w-[280px] max-w-md backdrop-blur-md`;

        let html = `
            <div class="flex items-center gap-2.5">
                <span class="text-lg">${iconHtml}</span>
                <span class="text-sm font-medium leading-snug">${Utils.sanitize(msg)}</span>
            </div>
        `;
        if (undoAction) {
            html += `<button id="toast-undo-btn" class="ml-2 text-yellow-300 font-bold hover:underline text-xs tracking-wider uppercase bg-white/10 px-2.5 py-1 rounded-lg">GERİ AL</button>`;
        }
        toast.innerHTML = html;

        container.appendChild(toast);

        if (undoAction) {
            const undoBtn = toast.querySelector('#toast-undo-btn');
            if (undoBtn) {
                undoBtn.onclick = () => {
                    undoAction();
                    toast.remove();
                };
            }
        }

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(16px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    },

    // Promise-based Modal System
    showModal: (contentHtml) => {
        return new Promise((resolve) => {
            const backdrop = document.getElementById('modal-backdrop');
            const content = document.getElementById('modal-content');
            if (!backdrop || !content) return resolve(null);

            content.innerHTML = contentHtml;
            backdrop.classList.remove('hidden');

            requestAnimationFrame(() => {
                backdrop.classList.remove('opacity-0');
                content.classList.remove('scale-95');
            });

            const close = (data) => {
                backdrop.classList.add('opacity-0');
                content.classList.add('scale-95');
                setTimeout(() => {
                    backdrop.classList.add('hidden');
                    resolve(data);
                }, 200);
            };

            const closeBtns = content.querySelectorAll('.modal-close');
            closeBtns.forEach(btn => btn.onclick = () => close(null));

            backdrop.onclick = (e) => {
                if (e.target === backdrop) close(null);
            };

            const form = content.querySelector('form');
            if (form) {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData);
                    close(data);
                };
            }
        });
    },

    // Quick Add Task Modal
    openQuickAdd: async () => {
        const todayIso = Utils.toISODateString();
        const result = await UI.showModal(`
            <div class="p-6">
                <div class="flex justify-between items-center mb-5">
                    <div class="flex items-center gap-2">
                        <span class="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">+</span>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Yeni Görev</h3>
                    </div>
                    <button class="modal-close p-1 text-gray-400 hover:text-rose-500 rounded-lg transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Görev Başlığı</label>
                        <input type="text" name="title" required class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none transition-all text-gray-800 dark:text-white" placeholder="Ne yapılması gerekiyor?">
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Kategori</label>
                            <select name="category" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white font-medium">
                                <option value="work">💼 İş</option>
                                <option value="personal">👤 Kişisel</option>
                                <option value="study">📚 Eğitim</option>
                                <option value="health">🏃 Sağlık</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Öncelik</label>
                            <select name="priority" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white font-medium">
                                <option value="normal">Normal 🔹</option>
                                <option value="high">Yüksek 🔥</option>
                                <option value="urgent">Acil 🚨</option>
                                <option value="low">Düşük 🟢</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Teslim Tarihi</label>
                        <input type="date" name="dueDate" value="${todayIso}" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white font-medium">
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Notlar / Açıklama</label>
                        <textarea name="notes" rows="2" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white" placeholder="Ek detaylar..."></textarea>
                    </div>

                    <div class="pt-1">
                        <span class="block text-xs font-semibold text-gray-400 mb-2">Hızlı Şablonlar:</span>
                        <div class="flex gap-2 overflow-x-auto pb-1">
                            <button type="button" onclick="app.logic.applyTemplate('workout')" class="px-3 py-1.5 text-xs rounded-xl bg-blue-500/10 text-blue-500 dark:bg-blue-500/20 dark:text-blue-300 font-medium hover:bg-blue-500/20 transition-colors whitespace-nowrap">💪 Spor Salonu</button>
                            <button type="button" onclick="app.logic.applyTemplate('study')" class="px-3 py-1.5 text-xs rounded-xl bg-purple-500/10 text-purple-500 dark:bg-purple-500/20 dark:text-purple-300 font-medium hover:bg-purple-500/20 transition-colors whitespace-nowrap">📚 Ders Çalışma</button>
                            <button type="button" onclick="app.logic.applyTemplate('shopping')" class="px-3 py-1.5 text-xs rounded-xl bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20 dark:text-emerald-300 font-medium hover:bg-emerald-500/20 transition-colors whitespace-nowrap">🛒 Alışveriş</button>
                            <button type="button" onclick="app.logic.applyTemplate('meeting')" class="px-3 py-1.5 text-xs rounded-xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 dark:text-amber-300 font-medium hover:bg-amber-500/20 transition-colors whitespace-nowrap">📅 Toplantı</button>
                        </div>
                    </div>

                    <button type="submit" class="w-full py-3.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] mt-2">
                        Görev Oluştur
                    </button>
                </form>
            </div>
        `);

        if (result && result.title) {
            store.addTask(result);
            UI.showToast('Görev başarıyla eklendi!', 'success');
            window.dispatchEvent(new CustomEvent('taskCreated'));
        }
    },

    // Add Habit Modal
    openAddHabitModal: async () => {
        const result = await UI.showModal(`
            <div class="p-6">
                <div class="flex justify-between items-center mb-5">
                    <div class="flex items-center gap-2">
                        <span class="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-lg">🌱</span>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Yeni Alışkanlık</h3>
                    </div>
                    <button class="modal-close p-1 text-gray-400 hover:text-rose-500 rounded-lg transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Alışkanlık Adı</label>
                        <input type="text" name="title" required class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none text-gray-800 dark:text-white" placeholder="Örn: 2 Litre Su İç, 15 Dk Yürüyüş">
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">İkon / Emoji</label>
                            <select name="icon" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white text-lg">
                                <option value="💧">💧 Su</option>
                                <option value="📚">📚 Okuma</option>
                                <option value="🏃">🏃 Egzersiz</option>
                                <option value="🧘">🧘 Meditasyon</option>
                                <option value="💻">💻 Kodlama</option>
                                <option value="🍎">🍎 Beslenme</option>
                                <option value="😴">😴 Uyku Düzeni</option>
                                <option value="🎨">🎨 Yaratıcılık</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Sıklık</label>
                            <select name="frequency" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white font-medium">
                                <option value="daily">Her Gün</option>
                                <option value="weekdays">Hafta İçi</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Kategori</label>
                        <select name="category" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white font-medium">
                            <option value="health">🏃 Sağlık</option>
                            <option value="personal">👤 Kişisel Gelişim</option>
                            <option value="study">📚 Eğitim / Zihin</option>
                            <option value="work">💼 Üretkenlik</option>
                        </select>
                    </div>

                    <button type="submit" class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] mt-2">
                        Alışkanlık Ekle (+15 XP Hedefi)
                    </button>
                </form>
            </div>
        `);

        if (result && result.title) {
            store.addHabit(result);
            UI.showToast('Yeni alışkanlık başarıyla oluşturuldu! 🌱', 'success');
        }
    },

    // Add Reward Modal (New)
    openAddRewardModal: async () => {
        const result = await UI.showModal(`
            <div class="p-6">
                <div class="flex justify-between items-center mb-5">
                    <div class="flex items-center gap-2">
                        <span class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-lg">🎁</span>
                        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Yeni Ödül Tanımla</h3>
                    </div>
                    <button class="modal-close p-1 text-gray-400 hover:text-rose-500 rounded-lg transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Ödül Başlığı</label>
                        <input type="text" name="title" required class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-amber-500 outline-none text-gray-800 dark:text-white" placeholder="Örn: 1 Saat Oyun Oyna, Dondurma Ye">
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">XP Maliyeti</label>
                            <input type="number" name="xpCost" value="50" min="10" step="10" required class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white font-bold">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">İkon / Emoji</label>
                            <select name="icon" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white text-lg">
                                <option value="🎮">🎮 Oyun</option>
                                <option value="☕">☕ Kahve</option>
                                <option value="🎬">🎬 Dizi / Film</option>
                                <option value="🏖️">🏖️ Tatil / Mola</option>
                                <option value="🍕">🍕 Yemek / Tatlı</option>
                                <option value="🛍️">🛍️ Alışveriş</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" class="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl shadow-lg shadow-amber-500/30 transition-all transform hover:scale-[1.01] active:scale-[0.99] mt-2">
                        Ödülü Markete Ekle
                    </button>
                </form>
            </div>
        `);

        if (result && result.title) {
            store.addReward(result);
            UI.showToast('Yeni ödül markete eklendi! 🎁', 'success');
        }
    },

    // Edit Task Modal
    openEditTaskModal: async (taskId) => {
        const task = store.state.tasks.find(t => t.id === taskId);
        if (!task) return;

        const subtaskHtml = (task.subtasks || []).map((sub, i) => `
            <div class="flex items-center gap-2 mb-2">
                <input type="checkbox" ${sub.completed ? 'checked' : ''} onchange="app.logic.toggleSubtask('${task.id}', '${sub.id}')" class="w-4 h-4 text-primary rounded border-gray-300">
                <span class="text-sm flex-1 text-gray-700 dark:text-gray-300 ${sub.completed ? 'line-through opacity-60' : ''}">${Utils.sanitize(sub.text)}</span>
            </div>
        `).join('');

        const result = await UI.showModal(`
            <div class="p-6">
                <div class="flex justify-between items-center mb-5">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">Görevi Düzenle</h3>
                    <button class="modal-close p-1 text-gray-400 hover:text-rose-500 rounded-lg">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <form class="space-y-4">
                    <div>
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Başlık</label>
                        <input type="text" name="title" value="${Utils.sanitize(task.title)}" required class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white font-medium">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Kategori</label>
                            <select name="category" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white">
                                <option value="work" ${task.category === 'work' ? 'selected' : ''}>💼 İş</option>
                                <option value="personal" ${task.category === 'personal' ? 'selected' : ''}>👤 Kişisel</option>
                                <option value="study" ${task.category === 'study' ? 'selected' : ''}>📚 Eğitim</option>
                                <option value="health" ${task.category === 'health' ? 'selected' : ''}>🏃 Sağlık</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Öncelik</label>
                            <select name="priority" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white">
                                <option value="normal" ${task.priority === 'normal' ? 'selected' : ''}>Normal 🔹</option>
                                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>Yüksek 🔥</option>
                                <option value="urgent" ${task.priority === 'urgent' ? 'selected' : ''}>Acil 🚨</option>
                                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Düşük 🟢</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Teslim Tarihi</label>
                        <input type="date" name="dueDate" value="${task.dueDate || ''}" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white">
                    </div>

                    <div>
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notlar</label>
                        <textarea name="notes" rows="2" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 outline-none text-gray-800 dark:text-white">${Utils.sanitize(task.notes || '')}</textarea>
                    </div>

                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Alt Görevler</label>
                            <button type="button" onclick="app.logic.addSubtaskPrompt('${task.id}')" class="text-xs text-primary font-bold hover:underline">+ Alt Görev Ekle</button>
                        </div>
                        <div id="subtasks-container" class="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-900/40 p-3 rounded-xl">
                            ${subtaskHtml || '<p class="text-xs text-gray-400 italic">Henüz alt görev eklenmedi.</p>'}
                        </div>
                    </div>

                    <div class="flex gap-3 pt-2">
                        <button type="submit" class="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:scale-[1.01]">Kaydet</button>
                    </div>
                </form>
            </div>
        `);

        if (result) {
            store.updateTask(taskId, result);
            UI.showToast('Görev güncellendi', 'success');
        }
    },

    // User Profile & Achievements Modal
    openProfileModal: async () => {
        const user = store.state.user;
        const achievements = store.state.achievements;
        const unlockedCount = achievements.filter(a => a.unlocked).length;

        const achievementListHtml = achievements.map(ach => `
            <div class="flex items-center gap-3 p-3 rounded-xl ${ach.unlocked ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-gray-100 dark:bg-gray-800/60 opacity-60'}">
                <span class="text-2xl">${ach.icon}</span>
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-sm text-gray-800 dark:text-white">${ach.name}</span>
                        ${ach.unlocked ? '<span class="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full">KAZANILDI</span>' : ''}
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${ach.desc}</p>
                </div>
            </div>
        `).join('');

        await UI.showModal(`
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">Profil ve Başarımlar</h3>
                    <button class="modal-close p-1 text-gray-400 hover:text-rose-500 rounded-lg">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div class="glass-panel p-4 rounded-2xl flex items-center gap-4 mb-6">
                    <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-primary/30">
                        ${user.avatar}
                    </div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <input type="text" id="profile-name-input" value="${Utils.sanitize(user.name)}" onchange="store.updateProfile({name: this.value})" class="font-bold text-lg text-gray-900 dark:text-white bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-primary outline-none">
                        </div>
                        <p class="text-xs text-primary font-bold mt-1">Seviye ${store.state.level} (${store.state.xp} total XP)</p>
                    </div>
                </div>

                <div class="mb-6">
                    <div class="flex justify-between text-xs font-bold text-gray-500 mb-1">
                        <span>Seviye İlerlemesi</span>
                        <span>${store.state.xp % 100} / 100 XP</span>
                    </div>
                    <div class="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div class="h-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-500" style="width: ${(store.state.xp % 100)}%"></div>
                    </div>
                </div>

                <div class="mb-3 flex justify-between items-center">
                    <h4 class="font-bold text-sm text-gray-800 dark:text-white uppercase tracking-wider">Rozetler (${unlockedCount}/${achievements.length})</h4>
                </div>

                <div class="space-y-2.5 max-h-56 overflow-y-auto pr-1 mb-6">
                    ${achievementListHtml}
                </div>

                <div class="border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-wrap gap-2">
                    <button type="button" onclick="app.logic.exportData()" class="px-3 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200">💾 Verileri Dışa Aktar</button>
                    <button type="button" onclick="app.logic.importDataPrompt()" class="px-3 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200">📥 İçeri Aktar</button>
                    <button type="button" onclick="app.logic.resetAllData()" class="px-3 py-2 text-xs font-bold rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 ml-auto">⚠️ Sıfırla</button>
                </div>
            </div>
        `);
    }
};
