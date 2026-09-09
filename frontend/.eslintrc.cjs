// Configuracao do ESLint para o frontend (React 18 + TypeScript + Vite).
// Requer as devDependencies declaradas no package.json (eslint, typescript-eslint,
// eslint-plugin-react-hooks, eslint-plugin-react-refresh, eslint-config-prettier).
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    // Desliga regras de estilo que conflitam com o Prettier (deve vir por ultimo).
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: ['dist', 'node_modules', '*.config.js', '*.config.d.ts', 'vite.config.ts'],
  plugins: ['@typescript-eslint', 'react-refresh'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
};
