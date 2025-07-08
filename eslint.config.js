// AIDEV-NOTE: ESLint config for React 19 with performance and code quality rules
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    // AIDEV-NOTE: Ignore build and dependency directories
    ignores: ['dist', 'build', 'node_modules']
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      
      // AIDEV-NOTE: Allow underscore prefix for unused vars (common pattern)
      'no-unused-vars': ['error', { 
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      
      // AIDEV-NOTE: React Refresh with special exports allowed
      'react-refresh/only-export-components': ['warn', { 
        allowConstantExport: true,
        allowExportNames: ['loader', 'action', 'ErrorBoundary'] 
      }],
      
      // AIDEV-NOTE: Performance-focused React hooks rules
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      
      // AIDEV-NOTE: Code quality and modern JS practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-arrow-callback': 'error',
      
      // AIDEV-NOTE: JSX consistency rules
      'jsx-quotes': ['error', 'prefer-double'],
    },
  },
]
