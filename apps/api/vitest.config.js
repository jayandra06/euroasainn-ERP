import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            exclude: [
                'node_modules/',
                'dist/',
                '**/*.d.ts',
                '**/*.config.{js,ts}',
                '**/tests/**',
                '**/test/**',
                '**/*.test.{js,ts}',
                '**/*.spec.{js,ts}',
            ],
        },
        testTimeout: 10000,
        hookTimeout: 10000,
        setupFiles: ['./src/tests/setup.ts'],
        // Add Jira reporter if enabled (using custom reporter path)
        reporters: process.env.JIRA_ENABLED === 'true'
            ? ['default', './src/reporters/jira-reporter.ts']
            : ['default'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
//# sourceMappingURL=vitest.config.js.map