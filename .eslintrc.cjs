/**
 * ESLint config
 * - Enforces: no bare `invoke` outside src/api/**
 * - Prefers TypeScript rules
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { browser: true, es2021: true, node: true },
  ignorePatterns: ['dist/', 'node_modules/', 'builds/'],
  overrides: [
    {
      files: ['src/**/*.ts', 'src/**/*.tsx'],
      rules: {
        // Forbid direct Tauri invoke imports outside the API layer
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@tauri-apps/api/tauri',
                message:
                  'Do not import invoke directly. Use functions from src/api/** instead.',
              },
            ],
          },
        ],
      },
    },
    {
      // Allow invoke only inside the API layer
      files: ['src/api/**/*.ts'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
};

