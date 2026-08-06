import { defineConfig, devices } from '@playwright/test';

// URL utilisée pour l'exécution des tests.
const baseURL =
    process.env.E2E_BASE_URL ??
    process.env.VITE_APP_URL ??
    'http://localhost:5173';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    workers: 1,
    retries: 1,

    // Configuration des rappors générés par Playwright.
    reporter: [
        ['list'],
        ['html', { outputFolder: './tests/e2e/reports', open: 'never' }],
    ],
    outputDir: './tests/e2e/test-results',

    // Paramètres des tests.
    use: {
        baseURL,
        headless: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'on-first-retry',
    },

    timeout: 30 * 1000,
    expect: { timeout: 5000 },

    projects: [
        // Réinitialise la base de données à l'état des seeders.
        { name: 'db-reset', testMatch: /global\.setup\.js/ },

        // Gère les états de session pour les différents rôles.
        { name: 'setup', testMatch: /auth\.setup\.js/, dependencies: ['db-reset'] },

        // Exécite la suite de tests sur Chromium.
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup'],
            testMatch: /.*\.spec\.js/,
        },
    ],

    // Démarre automatiquement le serveur lors de l'exécution des tests.
    webServer: {
        command: 'composer dev',
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120 * 1000,
    },
});