import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // dist + copies git du repo (worktrees .kilo) exclus du lint.
  globalIgnores(['dist', '.kilo/**']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // Le dossier `.kilo/worktrees/*` (copie du repo) fait hésiter le
      // parser TS entre deux tsconfig : on force la racine du projet.
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
      globals: globals.browser,
    },
    rules: {
      // Règles expérimentales react-hooks (v7) / ESLint 10 : le code
      // historique les viole massivement (effets qui font du setState,
      // composants créés pendant le rendu, erreurs re-lancées sans cause).
      // Gardées en warning pour rester visibles sans bloquer le lint sur
      // des modules hors périmètre (portail client).
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/incompatible-library': 'warn',
      'react-hooks/immutability': 'warn',
      'preserve-caught-error': 'warn',
      // `any` du code hérité : toléré en warning (visible pour les
      // nouveaux ajouts, ne bloque pas sur l'existant).
      '@typescript-eslint/no-explicit-any': 'warn',
      // react-refresh est un confort de dev : les exports mixtes
      // (hook + composant d'un contexte, Toast…) ne doivent pas bloquer.
      'react-refresh/only-export-components': 'warn',
      // `_` = paramètre/variable volontairement non utilisé (ex. routes) ;
      // `catch (error)` sans consigne explicite est toléré.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },
])