import { store } from './store.js';
import { Utils } from './utils.js';

export const Views = {
    // ----------------------------------------------------
    // DASHBOARD VIEW
    // ----------------------------------------------------
    Dashboard: () => {
        const tasks = store.state.tasks || [];
        const habits = store.state.habits || [];
        const user = store.state.user || { name: 'Kullanıcı' };

        const stats = {
            total: tasks.length,
            completed: tasks.filter(t => t.status === 'done').length,
            pending: tasks.filter(t => t.status !== 'done').length,
            habitsCount: habits.length,
            activeStreaks: habits.filter(h => h.streak > 0).length
        };

        const todayStr = Utils.toISODateString();
        const habitsDoneToday = habits.filter(h => (h.completedDates || []).includes(todayStr)).length;

        return `
            <!-- Welcome Header Banner -->
            <div class="glass-panel p-6 rounded-3xl mb-8 relative overflow-hidden bg-gradient-to-r from-primary/10 via-blue-500/5 to-purple-500/10 border border-primary/20">
                <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Hoş geldin, ${Utils.sanitize(user.name)}! 👋
                        </h2>
                        <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Bugün tamamlanmayı bekleyen <span class="font-bold text-primary">${stats.pending} görev</span> ve <span class="font-bold text-emerald-500">${habits.length - habitsDoneToday} alışkanlık</span> var.
                        </p>
                    </div>
                    <div class="flex items-center gap-3">
                        <button onclick="app.ui.openQuickAdd()" class="px-5 py-2.5 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:scale-105 transition-transform flex items-center gap-2">
                            <span>+</span> Görev Ekle
                        </button>
                        <button onclick="app.ui.openAddHabitModal()" class="px-5 py-2.5 rounded-2xl bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 hover:scale-105 transition-transform flex items-center gap-2">
                            <span>🌱</span> Alışkanlık Ekle
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform">
                    <div class="flex justify-between items-center text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        <span>Toplam Görev</span>
                        <span class="p-2 rounded-xl bg-blue-500/10 text-blue-500">📋</span>
                    </div>
                    <div class="text-3xl font-black text-gray-900 dark:text-white mt-3">${stats.total}</div>
                    <div class="text-xs text-gray-400 mt-1">${stats.completed} tamamlandı</div>
                </div>

                <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform">
                    <div class="flex justify-between items-center text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        <span>Bekleyen</span>
                        <span class="p-2 rounded-xl bg-amber-500/10 text-amber-500">⏳</span>
                    </div>
                    <div class="text-3xl font-black text-amber-500 mt-3">${stats.pending}</div>
                    <div class="text-xs text-gray-400 mt-1">Öncelikli işler</div>
                </div>

                <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform">
                    <div class="flex justify-between items-center text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        <span>Aktif Seri</span>
                        <span class="p-2 rounded-xl bg-rose-500/10 text-rose-500">🔥</span>
                    </div>
                    <div class="text-3xl font-black text-rose-500 mt-3">${stats.activeStreaks}</div>
                    <div class="text-xs text-gray-400 mt-1">Sürdürülen alışkanlık</div>
                </div>

                <div class="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:scale-[1.02] transition-transform">
                    <div class="flex justify-between items-center text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        <span>Seviye & XP</span>
                        <span class="p-2 rounded-xl bg-purple-500/10 text-purple-500">👑</span>
                    </div>
                    <div class="text-3xl font-black text-primary mt-3">Lvl ${store.state.level}</div>
                    <div class="text-xs text-gray-400 mt-1">${store.state.xp} XP toplam</div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <!-- Activity Heatmap -->
                <div class="glass-panel p-6 rounded-3xl flex flex-col">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                            <span>📊</span> Aktivite Haritası
                        </h3>
                        <span class="text-xs text-gray-400">Son 12 Hafta</span>
                    </div>
                    <div id="heatmap-container" class="w-full overflow-x-auto py-2"></div>
                </div>

                <!-- Category Pie Chart -->
                <div class="glass-panel p-6 rounded-3xl flex flex-col">
                    <h3 class="font-bold text-lg mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                        <span>🎯</span> Kategori Dağılımı
                    </h3>
                    <div class="flex justify-center my-auto py-2">
                        <svg id="pie-chart" width="180" height="180" viewBox="0 0 100 100" class="transform -rotate-90"></svg>
                    </div>
                    <div id="pie-legend" class="flex flex-wrap justify-center gap-3 mt-4"></div>
                </div>
            </div>
        `;
    },

    // ----------------------------------------------------
    // TASKS VIEW
    // ----------------------------------------------------
    Tasks: () => {
        const tasks = store.state.tasks || [];
        const searchQuery = (window.appState && window.appState.taskSearch) || '';
        const catFilter = (window.appState && window.appState.taskCategory) || 'all';

        let filtered = tasks.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (t.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCat = catFilter === 'all' || t.category === catFilter;
            return matchesSearch && matchesCat;
        });

        const todo = filtered.filter(t => t.status === 'todo');
        const inProgress = filtered.filter(t => t.status === 'in-progress');
        const done = filtered.filter(t => t.status === 'done');

        const renderTaskItem = (t) => {
            const priorityColors = {
                urgent: 'bg-rose-500 text-rose-500 border-rose-500',
                high: 'bg-amber-500 text-amber-500 border-amber-500',
                normal: 'bg-blue-500 text-blue-500 border-blue-500',
                low: 'bg-emerald-500 text-emerald-500 border-emerald-500'
            };

            const catEmojis = { work: '💼', personal: '👤', study: '📚', health: '🏃' };
            const subtasks = t.subtasks || [];
            const subCompleted = subtasks.filter(s => s.completed).length;

            return `
                <div class="task-item bg-white dark:bg-gray-800/90 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 mb-3 cursor-grab hover:shadow-md transition-all group relative overflow-hidden" draggable="true" data-id="${t.id}">
                    <div class="absolute left-0 top-0 bottom-0 w-1.5 ${priorityColors[t.priority] || priorityColors.normal}"></div>
                    
                    <div class="flex items-start justify-between pl-2 gap-2">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 flex-wrap mb-1">
                                <span class="text-xs font-bold px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                    ${catEmojis[t.category] || '📌'} ${t.category}
                                </span>
                                ${t.dueDate ? `<span class="text-[11px] font-semibold text-gray-400">📅 ${Utils.formatDate(t.dueDate)}</span>` : ''}
                            </div>
                            <h4 class="font-bold text-gray-900 dark:text-white text-base leading-snug ${t.status === 'done' ? 'line-through text-gray-400 dark:text-gray-500' : ''}">
                                ${Utils.sanitize(t.title)}
                            </h4>
                            ${t.notes ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">${Utils.sanitize(t.notes)}</p>` : ''}

                            ${subtasks.length > 0 ? `
                                <div class="mt-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <span class="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden inline-block">
                                        <span class="h-full bg-primary block" style="width: ${(subCompleted / subtasks.length) * 100}%"></span>
                                    </span>
                                    <span>${subCompleted}/${subtasks.length} Alt görev</span>
                                </div>
                            ` : ''}
                        </div>

                        <!-- Action buttons -->
                        <div class="flex items-center gap-1 opacity-90 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="app.ui.openEditTaskModal('${t.id}')" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-primary transition-colors" title="Düzenle">
                                ✏️
                            </button>
                            <button onclick="app.logic.deleteTask('${t.id}')" class="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/30 text-gray-400 hover:text-rose-500 transition-colors" title="Sil">
                                🗑️
                            </button>
                        </div>
                    </div>

                    <!-- Quick status switch bar -->
                    <div class="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex gap-2">
                        ${t.status !== 'todo' ? `
                            <button onclick="app.logic.moveTaskStatus('${t.id}', 'todo')" class="flex-1 py-1 text-[11px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200">
                                ◀ Yapılacak
                            </button>
                        ` : ''}
                        ${t.status !== 'in-progress' ? `
                            <button onclick="app.logic.moveTaskStatus('${t.id}', 'in-progress')" class="flex-1 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100">
                                ⏳ Devam Eden
                            </button>
                        ` : ''}
                        ${t.status !== 'done' ? `
                            <button onclick="app.logic.completeTask('${t.id}')" class="flex-1 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg hover:bg-emerald-100">
                                ✅ Tamamla (+10 XP)
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        };

        return `
            <!-- Search & Filter Bar -->
            <div class="glass-panel p-4 rounded-2xl mb-6 flex flex-col md:flex-row gap-3 justify-between items-center">
                <div class="relative w-full md:w-72">
                    <input type="text" id="task-search-input" value="${Utils.sanitize(searchQuery)}" oninput="app.logic.onTaskSearch(this.value)" placeholder="Görevlerde ara..." class="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 text-sm outline-none focus:ring-2 focus:ring-primary text-gray-800 dark:text-white">
                    <span class="absolute left-3 top-2.5 text-gray-400 text-xs">🔍</span>
                </div>

                <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
                    <button onclick="app.logic.setTaskCategory('all')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${catFilter === 'all' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}">Tümü</button>
                    <button onclick="app.logic.setTaskCategory('work')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${catFilter === 'work' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}">💼 İş</button>
                    <button onclick="app.logic.setTaskCategory('personal')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${catFilter === 'personal' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}">👤 Kişisel</button>
                    <button onclick="app.logic.setTaskCategory('study')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${catFilter === 'study' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}">📚 Eğitim</button>
                    <button onclick="app.logic.setTaskCategory('health')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${catFilter === 'health' ? 'bg-primary text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}">🏃 Sağlık</button>
                </div>
            </div>

            <!-- Kanban Columns -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                <!-- Todo Column -->
                <div class="flex flex-col min-h-[350px]">
                    <div class="flex justify-between items-center mb-3 px-1">
                        <h3 class="font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2 text-sm">
                            <span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> YAPILACAKLAR
                            <span class="px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-500 text-xs">${todo.length}</span>
                        </h3>
                    </div>
                    <div id="todo-list" class="flex-1 bg-gray-50/60 dark:bg-gray-900/40 rounded-3xl p-4 border border-dashed border-gray-300 dark:border-gray-700/70" ondragover="event.preventDefault()" ondrop="app.logic.onDrop(event, 'todo')">
                        ${todo.map(renderTaskItem).join('')}
                        ${todo.length === 0 ? '<div class="text-center text-gray-400 text-xs py-12">Yapılacak görev yok! ✨</div>' : ''}
                    </div>
                </div>

                <!-- In Progress Column -->
                <div class="flex flex-col min-h-[350px]">
                    <div class="flex justify-between items-center mb-3 px-1">
                        <h3 class="font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2 text-sm">
                            <span class="w-2.5 h-2.5 rounded-full bg-blue-400"></span> DEVAM EDENLER
                            <span class="px-2 py-0.5 rounded-full bg-blue-400/10 text-blue-500 text-xs">${inProgress.length}</span>
                        </h3>
                    </div>
                    <div id="in-progress-list" class="flex-1 bg-gray-50/60 dark:bg-gray-900/40 rounded-3xl p-4 border border-dashed border-gray-300 dark:border-gray-700/70" ondragover="event.preventDefault()" ondrop="app.logic.onDrop(event, 'in-progress')">
                        ${inProgress.map(renderTaskItem).join('')}
                        ${inProgress.length === 0 ? '<div class="text-center text-gray-400 text-xs py-12">Şu an odaklanılan görev yok</div>' : ''}
                    </div>
                </div>

                <!-- Done Column -->
                <div class="flex flex-col min-h-[350px]">
                    <div class="flex justify-between items-center mb-3 px-1">
                        <h3 class="font-bold text-gray-600 dark:text-gray-300 flex items-center gap-2 text-sm">
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> TAMAMLANANLAR
                            <span class="px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-500 text-xs">${done.length}</span>
                        </h3>
                    </div>
                    <div id="done-list" class="flex-1 bg-gray-50/60 dark:bg-gray-900/40 rounded-3xl p-4 border border-dashed border-gray-300 dark:border-gray-700/70" ondragover="event.preventDefault()" ondrop="app.logic.onDrop(event, 'done')">
                        ${done.map(renderTaskItem).join('')}
                        ${done.length === 0 ? '<div class="text-center text-gray-400 text-xs py-12">Tamamlanan görev yok</div>' : ''}
                    </div>
                </div>
            </div>
        `;
    },

    // ----------------------------------------------------
    // HABITS VIEW
    // ----------------------------------------------------
    Habits: () => {
        const habits = store.state.habits || [];
        const todayStr = Utils.toISODateString();

        // Calculate past 7 days dates
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push({
                dateStr: Utils.toISODateString(d),
                dayLabel: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
                isToday: i === 0
            });
        }

        const renderHabitCard = (h) => {
            const completedDates = h.completedDates || [];
            const isCompletedToday = completedDates.includes(todayStr);

            return `
                <div class="glass-panel p-5 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700/80">
                    <div class="flex items-start justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                                ${h.icon || '🌱'}
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-900 dark:text-white text-base">${Utils.sanitize(h.title)}</h4>
                                <span class="text-xs text-gray-400 uppercase tracking-wider">${h.category}</span>
                            </div>
                        </div>
                        <button onclick="app.logic.deleteHabit('${h.id}')" class="text-gray-400 hover:text-rose-500 p-1">
                            🗑️
                        </button>
                    </div>

                    <!-- Streak & Info -->
                    <div class="my-4 flex items-center justify-between">
                        <div class="flex items-center gap-1 text-rose-500 font-extrabold text-lg">
                            <span>🔥</span> ${h.streak || 0} Gün Seri
                        </div>
                        <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                            +15 XP / Gün
                        </span>
                    </div>

                    <!-- Weekly Checkboxes Grid -->
                    <div class="grid grid-cols-7 gap-1.5 py-2 border-t border-b border-gray-100 dark:border-gray-700/50 my-2">
                        ${last7Days.map(day => {
                            const isDone = completedDates.includes(day.dateStr);
                            return `
                                <div class="flex flex-col items-center gap-1">
                                    <span class="text-[10px] font-semibold text-gray-400 ${day.isToday ? 'text-primary font-bold' : ''}">${day.dayLabel}</span>
                                    <button onclick="app.logic.toggleHabitDate('${h.id}', '${day.dateStr}')" class="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-transform active:scale-95 ${isDone ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200'}">
                                        ${isDone ? '✓' : ''}
                                    </button>
                                </div>
                            `;
                        }).join('')}
                    </div>

                    <!-- Main Daily Check-in Button -->
                    <button onclick="app.logic.toggleHabitDate('${h.id}', '${todayStr}')" class="w-full py-3 mt-2 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${isCompletedToday ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-primary/10 text-primary hover:bg-primary hover:text-white'}">
                        <span>${isCompletedToday ? '✓ Tamamlandı' : 'Bugün Tamamla'}</span>
                    </button>
                </div>
            `;
        };

        return `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white">Alışkanlık Takibi</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Günlük serilerini koru, alışkanlıklarını hayatına entegre et.</p>
                </div>
                <button onclick="app.ui.openAddHabitModal()" class="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2">
                    <span>+</span> Yeni Alışkanlık
                </button>
            </div>

            ${habits.length === 0 ? `
                <div class="glass-panel p-12 rounded-3xl text-center">
                    <div class="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl mx-auto mb-4">🌱</div>
                    <h4 class="text-xl font-bold text-gray-800 dark:text-white">Henüz Alışkanlık Eklemedin</h4>
                    <p class="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Her gün düzenli yapmayı hedeflediğin su içme, kitap okuma veya sporu takibe başla!</p>
                    <button onclick="app.ui.openAddHabitModal()" class="mt-4 px-6 py-3 bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 hover:scale-105 transition-all">İlk Alışkanlığını Ekle</button>
                </div>
            ` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${habits.map(renderHabitCard).join('')}
                </div>
            `}
        `;
    },

    // ----------------------------------------------------
    // FOCUS (POMODORO) VIEW
    // ----------------------------------------------------
    Focus: () => {
        return `
            <div class="flex flex-col items-center justify-center min-h-[500px]">
                <div class="glass-panel p-8 md:p-12 rounded-3xl flex flex-col items-center max-w-md w-full shadow-2xl relative">
                    <!-- SVG Timer Circle -->
                    <div class="relative w-64 h-64 mb-8">
                        <svg class="w-full h-full transform -rotate-90">
                            <circle cx="128" cy="128" r="115" stroke="currentColor" stroke-width="10" fill="transparent" class="text-gray-200 dark:text-gray-700/60" />
                            <circle id="timer-progress" cx="128" cy="128" r="115" stroke="currentColor" stroke-width="10" fill="transparent" class="text-primary timer-circle" stroke-dasharray="722" stroke-dashoffset="0" stroke-linecap="round" />
                        </svg>
                        <div class="absolute inset-0 flex flex-col items-center justify-center">
                            <span id="timer-display" class="text-5xl font-black text-gray-900 dark:text-white font-mono tracking-tight">25:00</span>
                            <span id="timer-status" class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">ODAK SEANSI</span>
                        </div>
                    </div>

                    <!-- Controls -->
                    <div class="flex gap-4 w-full">
                        <button id="timer-start-btn" onclick="app.logic.toggleTimer()" class="flex-1 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-xl shadow-primary/30 hover:scale-105 transition-all">
                            BAŞLAT
                        </button>
                        <button onclick="app.logic.resetTimer()" class="py-3.5 px-5 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 transition-colors">
                            SIFIRLA
                        </button>
                    </div>

                    <!-- Presets -->
                    <div class="flex gap-2 mt-8 w-full">
                        <button onclick="app.logic.setTimerMode(25, 'Pomodoro')" class="flex-1 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors">25 Dk Odak</button>
                        <button onclick="app.logic.setTimerMode(5, 'Kısa Mola')" class="flex-1 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 transition-colors">5 Dk Mola</button>
                        <button onclick="app.logic.setTimerMode(15, 'Uzun Mola')" class="flex-1 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 transition-colors">15 Dk Mola</button>
                    </div>
                </div>
            </div>
        `;
    },

    // ----------------------------------------------------
    // RENDER CHARTS & HEATMAP
    // ----------------------------------------------------
    renderCharts: () => {
        // Pie Chart
        const tasks = store.state.tasks || [];
        const categories = {};
        tasks.forEach(t => categories[t.category] = (categories[t.category] || 0) + 1);

        const total = tasks.length || 1;
        let currentAngle = 0;
        const colors = { work: '#3b82f6', personal: '#10b981', study: '#8b5cf6', health: '#ef4444' };

        const svg = document.getElementById('pie-chart');
        const legend = document.getElementById('pie-legend');
        if (svg && legend) {
            svg.innerHTML = '';
            legend.innerHTML = '';

            if (tasks.length === 0) {
                legend.innerHTML = '<span class="text-xs text-gray-400">Veri bulunmuyor</span>';
            } else {
                Object.entries(categories).forEach(([cat, count]) => {
                    const percentage = count / total;
                    const angle = percentage * 360;

                    const x1 = 50 + 50 * Math.cos(Math.PI * currentAngle / 180);
                    const y1 = 50 + 50 * Math.sin(Math.PI * currentAngle / 180);
                    const x2 = 50 + 50 * Math.cos(Math.PI * (currentAngle + angle) / 180);
                    const y2 = 50 + 50 * Math.sin(Math.PI * (currentAngle + angle) / 180);

                    const largeArc = angle > 180 ? 1 : 0;
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    path.setAttribute("d", `M50,50 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} Z`);
                    path.setAttribute("fill", colors[cat] || '#94a3b8');
                    svg.appendChild(path);

                    currentAngle += angle;

                    legend.innerHTML += `
                        <div class="flex items-center gap-1.5 text-xs font-semibold">
                            <span class="w-3 h-3 rounded-full" style="background:${colors[cat] || '#94a3b8'}"></span>
                            <span class="capitalize text-gray-700 dark:text-gray-300">${cat} (%${Math.round(percentage * 100)})</span>
                        </div>
                    `;
                });
            }
        }

        // Real Activity Heatmap Calculation
        const heatmap = document.getElementById('heatmap-container');
        if (heatmap) {
            const logs = store.state.activityLog || [];
            const logCounts = {};
            logs.forEach(l => {
                logCounts[l.dateStr] = (logCounts[l.dateStr] || 0) + 1;
            });

            // Generate 12 weeks grid
            let heatmapHtml = '<div class="flex gap-1.5 justify-center">';
            const today = new Date();

            for (let w = 11; w >= 0; w--) {
                heatmapHtml += '<div class="flex flex-col gap-1.5">';
                for (let d = 0; d < 7; d++) {
                    const cellDate = new Date(today);
                    cellDate.setDate(cellDate.getDate() - (w * 7 + (6 - d)));
                    const dateStr = Utils.toISODateString(cellDate);
                    const count = logCounts[dateStr] || 0;

                    let bgClass = 'bg-gray-200 dark:bg-gray-700/50';
                    if (count >= 4) bgClass = 'bg-primary shadow-sm shadow-primary/50';
                    else if (count >= 2) bgClass = 'bg-primary/70';
                    else if (count === 1) bgClass = 'bg-primary/40';

                    heatmapHtml += `<div title="${dateStr}: ${count} aktivite" class="w-3.5 h-3.5 rounded-md ${bgClass} transition-transform hover:scale-125 cursor-pointer"></div>`;
                }
                heatmapHtml += '</div>';
            }
            heatmapHtml += '</div>';
            heatmap.innerHTML = heatmapHtml;
        }
    },

    setupTaskEvents: () => {
        const draggables = document.querySelectorAll('.task-item');
        draggables.forEach(draggable => {
            draggable.addEventListener('dragstart', () => {
                draggable.classList.add('opacity-40');
                if (window.app && window.app.logic) {
                    window.app.logic.draggedId = draggable.dataset.id;
                }
            });
            draggable.addEventListener('dragend', () => {
                draggable.classList.remove('opacity-40');
                if (window.app && window.app.logic) {
                    window.app.logic.draggedId = null;
                }
            });
        });
    },

    setupHabitEvents: () => {}
};
