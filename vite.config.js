import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins: [vue()],
    // Configuration des tests Vitest.
    test: {
        globals: true,
        environment: "jsdom",
        include: [
            "tests/Unit/vitest/**/*.test.{js,ts}"
        ]
    }
});