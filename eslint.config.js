import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/dist-ssr/**',
      // iPhone app web build (apps/parts-shop/dist-app, gitignored)
      '**/dist-app/**',
      // iPhone app: www/ is a copy of dist-app; ios/ is the Xcode project (its public/ is a copy too)
      'apps/parts-app/www/**',
      'apps/parts-app/ios/**',
      '**/node_modules/**',
      '.impeccable/**',
      '.anthropic-skills/**',
      '**/.turbo/**',
      '**/.wrangler/**',
      // parts-shop build artefacts (gitignored)
      '**/.render-app/**',
      '**/.renders/**',
      '**/.catalog/**',
      '**/public/**',
      'public/**',
      'apps/heat-treatment/public/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: '18.3' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
