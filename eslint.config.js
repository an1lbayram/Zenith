import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,

    // Browser app code (ES modules, loaded via <script type="module">)
    {
        files: ['assets/js/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                app: 'writable', // window.app, assigned in app.js and read by inline onclick handlers in index.html
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
            // Utils.stopAmbientSound intentionally no-ops when a node is
            // already stopped/disconnected/closed - that's expected, not a
            // bug to silence with a dead "// ignore" comment.
            'no-empty': ['error', { allowEmptyCatch: true }],
        },
    },

    // Service worker (its own global scope, not browser `window`)
    {
        files: ['sw.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'script',
            globals: { ...globals.serviceworker },
        },
    },

    // Node-side tooling: vitest/playwright configs, the static test server
    {
        files: ['*.config.js', 'scripts/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.node },
        },
    },

    // Vitest unit/component/integration/security/SEO/data-contract specs
    {
        files: ['tests/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.browser, ...globals.node },
        },
    },

    // Playwright E2E specs
    {
        files: ['e2e/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: { ...globals.browser, ...globals.node },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            // Playwright's fixture injection requires the literal `{}`
            // destructuring pattern as the hook's first parameter (it's how
            // Playwright parses which fixtures a test/hook needs) - renaming
            // it to a plain unused identifier breaks fixture resolution.
            'no-empty-pattern': 'off',
        },
    },

    {
        ignores: [
            'node_modules/**',
            'assets/css/tailwind.css',
            'playwright-report/**',
            'test-results/**',
            'coverage/**',
            'e2e/visual.spec.js-snapshots/**',
        ],
    },
];
