import { Views } from './views.js';

export const Router = {
    currentRoute: 'dashboard',

    navigate: (route) => {
        Router.currentRoute = route;

        // Update both Desktop Sidebar and Mobile Bottom Nav buttons
        document.querySelectorAll('.nav-btn, [data-nav-route]').forEach(btn => {
            const targetRoute = btn.getAttribute('data-nav-route') ||
                (btn.getAttribute('onclick') && btn.getAttribute('onclick').match(/navigate\('(\w+)'\)/)?.[1]);

            if (targetRoute === route) {
                btn.classList.add('text-primary', 'bg-primary/10', 'font-bold');
                btn.classList.remove('text-gray-500', 'dark:text-gray-400');
            } else if (targetRoute) {
                btn.classList.remove('text-primary', 'bg-primary/10', 'font-bold');
                btn.classList.add('text-gray-500', 'dark:text-gray-400');
            }
        });

        Router.render();
    },

    render: () => {
        const container = document.getElementById('content-area');
        const title = document.getElementById('page-title');

        if (!container || !title) return;

        container.style.opacity = '0';
        container.style.transform = 'translateY(4px)';
        container.style.transition = 'opacity 0.2s ease, transform 0.2s ease';

        setTimeout(() => {
            switch (Router.currentRoute) {
                case 'dashboard':
                    title.textContent = 'Genel Bakış';
                    container.innerHTML = Views.Dashboard();
                    Views.renderCharts();
                    break;

                case 'tasks':
                    title.textContent = 'Görev Yönetimi';
                    container.innerHTML = Views.Tasks();
                    Views.setupTaskEvents();
                    break;

                case 'habits':
                    title.textContent = 'Alışkanlık Takibi';
                    container.innerHTML = Views.Habits();
                    Views.setupHabitEvents();
                    break;

                case 'focus':
                    title.textContent = 'Odak Modu (Pomodoro)';
                    container.innerHTML = Views.Focus();
                    if (window.app && window.app.logic) {
                        window.app.logic.initPomodoro();
                    }
                    break;

                default:
                    title.textContent = 'Genel Bakış';
                    container.innerHTML = Views.Dashboard();
                    Views.renderCharts();
                    break;
            }

            requestAnimationFrame(() => {
                container.style.opacity = '1';
                container.style.transform = 'translateY(0)';
            });
        }, 150);
    }
};
