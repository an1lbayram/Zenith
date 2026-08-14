import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Integration layer: Router + UI + Views + store wired together through real
// DOM events, the way the browser actually drives them - as opposed to the
// unit tests (single function) or component tests (single render function).
let store, Router, UI, Views;

const baseShell = () => `
    <nav>
        <button data-nav-route="dashboard" class="nav-btn text-gray-500 dark:text-gray-400">Panel</button>
        <button data-nav-route="tasks" class="nav-btn text-gray-500 dark:text-gray-400">Görevler</button>
        <button data-nav-route="habits" class="nav-btn text-gray-500 dark:text-gray-400">Alışkanlıklar</button>
    </nav>
    <h1 id="page-title"></h1>
    <div id="content-area"></div>
    <div id="toast-container"></div>
    <div id="modal-backdrop" class="hidden opacity-0">
        <div id="modal-content" class="scale-95"></div>
    </div>
`;

const flush = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(async () => {
    localStorage.clear();
    document.body.innerHTML = baseShell();
    window.appState = { taskSearch: '', taskCategory: 'all', selectedMood: '🚀' };
    vi.resetModules();
    ({ store } = await import('../assets/js/store.js'));
    ({ Router } = await import('../assets/js/router.js'));
    ({ UI } = await import('../assets/js/ui.js'));
    ({ Views } = await import('../assets/js/views.js'));
});

describe('Router navigation', () => {
    it('renders the Tasks view, sets the page title, and highlights the active nav button', async () => {
        Router.navigate('tasks');
        await flush(200); // Router.render() defers behind a 150ms transition timeout

        expect(document.getElementById('page-title').textContent).toBe('Görev Yönetimi');
        expect(document.getElementById('content-area').textContent).toContain('YAPILACAKLAR');

        const tasksBtn = document.querySelector('[data-nav-route="tasks"]');
        const dashboardBtn = document.querySelector('[data-nav-route="dashboard"]');
        expect(tasksBtn.className).toContain('text-primary');
        expect(dashboardBtn.className).not.toContain('text-primary');
    });

    it('falls back to the dashboard view for an unknown route', async () => {
        Router.navigate('does-not-exist');
        await flush(200);

        expect(document.getElementById('page-title').textContent).toBe('Genel Bakış');
    });

    it('re-navigating updates the previously active button back to inactive', async () => {
        Router.navigate('tasks');
        await flush(200);
        Router.navigate('habits');
        await flush(200);

        const tasksBtn = document.querySelector('[data-nav-route="tasks"]');
        const habitsBtn = document.querySelector('[data-nav-route="habits"]');
        expect(tasksBtn.className).not.toContain('text-primary');
        expect(habitsBtn.className).toContain('text-primary');
    });
});

describe('UI.showToast', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('appends a sanitized toast and auto-removes it after ~4.3s', () => {
        UI.showToast('<b>Kaydedildi</b>', 'success');

        const container = document.getElementById('toast-container');
        expect(container.children.length).toBe(1);
        expect(container.textContent).toContain('<b>Kaydedildi</b>'); // rendered as escaped text
        expect(container.innerHTML).not.toContain('<b>Kaydedildi</b>');

        vi.advanceTimersByTime(4300);
        expect(container.children.length).toBe(0);
    });

    it('invokes the undo callback and removes the toast immediately when clicked', () => {
        const undo = vi.fn();
        UI.showToast('Görev silindi', 'info', undo);

        const undoBtn = document.getElementById('toast-undo-btn');
        expect(undoBtn).toBeTruthy();
        undoBtn.click();

        expect(undo).toHaveBeenCalledTimes(1);
        expect(document.getElementById('toast-container').children.length).toBe(0);
    });
});

describe('UI.showModal + form submission', () => {
    it('resolves with the submitted form data as an object', async () => {
        const promise = UI.showModal(`
            <form>
                <input name="title" value="Modaldan gelen görev" />
                <button type="submit">Kaydet</button>
            </form>
        `);

        document.querySelector('form').requestSubmit
            ? document.querySelector('form').requestSubmit()
            : document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true }));

        const result = await promise;
        expect(result).toEqual({ title: 'Modaldan gelen görev' });
    });

    it('resolves with null when a .modal-close button is clicked', async () => {
        const promise = UI.showModal(`<button class="modal-close">Kapat</button>`);
        document.querySelector('.modal-close').click();
        const result = await promise;
        expect(result).toBeNull();
    });
});

describe('End-to-end quick-add flow (UI + store + Views)', () => {
    it('submitting the quick-add modal creates a task that shows up in the Tasks view', async () => {
        const created = vi.fn();
        window.addEventListener('taskCreated', created);

        const addPromise = UI.openQuickAdd();
        const form = document.querySelector('#modal-content form');
        form.querySelector('[name="title"]').value = 'Entegrasyon testi görevi';
        form.dispatchEvent(new Event('submit', { cancelable: true }));
        await addPromise;

        expect(store.state.tasks.some((t) => t.title === 'Entegrasyon testi görevi')).toBe(true);
        expect(created).toHaveBeenCalledTimes(1);

        document.getElementById('content-area').innerHTML = Views.Tasks();
        expect(document.getElementById('content-area').textContent).toContain('Entegrasyon testi görevi');

        window.removeEventListener('taskCreated', created);
    });
});
