import js from "@eslint/js";
import globals from "globals";
import pluginJest from "eslint-plugin-jest";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Config general para Node.js
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      js,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      ...js.configs.recommended.rules,
      // Desactiva no-unused-vars normal y activa la del plugin
      "no-unused-vars": "off",
      "unused-imports/no-unused-vars": ["warn", { vars: "all", varsIgnorePattern: "^_", args: "after-used", argsIgnorePattern: "^_" }],
      "unused-imports/no-unused-imports": "warn",
    },
  },

  // Configuración específica para tests con Jest
  {
    files: ["**/*.test.js", "**/__tests__/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    plugins: {
      jest: pluginJest,
    },
    rules: {
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
      "jest/no-identical-title": "error",
    },
  },
]);
