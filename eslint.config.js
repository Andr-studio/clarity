import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Configuración para las Firebase Functions (functions)
  {
    files: ["functions/**/*.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  // Configuración para el código del frontend (src)
  {
    files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser, // Especificar el parser de TypeScript
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'react': pluginReact,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...pluginReact.configs.flat.recommended.rules,
      // Puedes añadir o sobreescribir reglas específicas para el frontend aquí
    },
  },
]);
