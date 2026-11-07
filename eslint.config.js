import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['dist', 'node_modules', 'coverage'],
  },
  {
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use Rng from dynamics/rng.ts instead of Math.random()' },
        { object: 'Date', property: 'now', message: 'Use game clock instead of Date.now()' },
      ],
    },
  }
);
