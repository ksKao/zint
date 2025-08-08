import css from "@eslint/css";
import js from "@eslint/js";
import json from "@eslint/json";
import pluginQuery from "@tanstack/eslint-plugin-query";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },
  // @ts-expect-error https://github.com/eslint/eslint/issues/19570
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  ...pluginQuery.configs["flat/recommended"],
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: ["css/recommended"],
  },
  {
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
    },
  },
]);
