module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/test'],
    testMatch: ['**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: 'test/tsconfig.json',
        }],
    },
    setupFilesAfterEnv: ['<rootDir>/test/jest.setup.ts'],
    // Allow per-file @jest-environment docblock overrides
    // (use @jest-environment node for Worker-context tests)
};
