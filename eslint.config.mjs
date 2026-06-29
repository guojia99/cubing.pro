import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/views/Wca/**/*.{ts,tsx}", "src/services/cubing-pro/wca/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "prefer-const": "off",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    files: [
      "src/views/GroupCompetitions/**/*.{ts,tsx}",
      "src/views/Competition/**/*.{ts,tsx}",
      "src/views/admin/**/*.{ts,tsx}",
      "src/components/Data/**/*.{ts,tsx}",
      "src/components/Buttons/**/*.{ts,tsx}",
      "src/components/Markdown/Markdown.tsx",
      "src/components/Markdown/editer.tsx",
      "src/services/cubing-pro/events/**/*.{ts,tsx}",
      "src/services/cubing-pro/comps/**/*.{ts,tsx}",
      "src/services/cubing-pro/players/**/*.{ts,tsx}",
      "src/services/cubing-pro/pktimer/**/*.{ts,tsx}",
      "src/services/cubing-pro/statistics/**/*.d.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "prefer-const": "off",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];

export default eslintConfig;
