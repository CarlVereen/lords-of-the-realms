import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/*.d.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Determinism guard: the shared simulation must never read non-deterministic
    // sources. All randomness must come from the seeded PRNG (@lor/shared).
    files: ['packages/shared/src/sim/**/*.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Non-deterministic. Use the seeded PRNG from @lor/shared (createRng).',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Non-deterministic. Simulation code must not read wall-clock time.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date']",
          message: 'Non-deterministic. Simulation code must not read wall-clock time.',
        },
      ],
    },
  },
);
