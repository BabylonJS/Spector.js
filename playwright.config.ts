import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30000,
    expect: {
        timeout: 10000,
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
        timeout: 60000,
    },
});
