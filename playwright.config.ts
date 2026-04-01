import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './test/e2e',
    timeout: 60000,
    expect: {
        timeout: 15000,
    },
    fullyParallel: true,
    retries: 1,
    reporter: 'list',
    use: {
        baseURL: 'http://localhost:1337',
        trace: 'on-first-retry',
        // WebGL requires a real GPU or software rendering
        launchOptions: {
            args: ['--use-gl=angle', '--use-angle=swiftshader'],
        },
    },
    projects: [
        {
            name: 'chromium',
            use: {
                browserName: 'chromium',
            },
        },
    ],
    webServer: {
        command: 'npm run start',
        port: 1337,
        reuseExistingServer: true,
        timeout: 120000,
    },
});
