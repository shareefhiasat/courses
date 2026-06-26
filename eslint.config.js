/**
 * Backend ESLint config
 *
 * Run: npx eslint backend/ --config eslint.config.js
 */

export default [
  { ignores: ['node_modules', 'client/', 'docs/', 'help-docs/', 'scripts/archive/', 'backend/db/prismaClient.js'] },
  {
    files: ['backend/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        fetch: 'readonly',
      },
    },
    rules: {
      // Prevent creating new PrismaClient instances — use the shared singleton
      // from db/prismaClient.js instead.
      'no-restricted-syntax': ['error', {
        selector: "NewExpression[callee.name='PrismaClient']",
        message: "Do not create a new PrismaClient(). Import the shared singleton: `import prisma from '../db/prismaClient.js'`",
      }, {
        selector: "NewExpression[callee.object.name='Prisma']",
        message: "Do not create a new Prisma.PrismaClient(). Import the shared singleton: `import prisma from '../db/prismaClient.js'`",
      }],
    },
  },
];
