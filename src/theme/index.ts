import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: '"Outfit", "PingFang SC", "Microsoft YaHei", sans-serif' },
        body: { value: '"DM Sans", "PingFang SC", "Microsoft YaHei", sans-serif' },
      },
      colors: {
        brand: {
          50: { value: "#e8f7fc" },
          100: { value: "#c5ebf6" },
          200: { value: "#9eddef" },
          300: { value: "#6ecde6" },
          400: { value: "#42bddc" },
          500: { value: "#22a8cb" },
          600: { value: "#1a8aad" },
          700: { value: "#156d8c" },
          800: { value: "#11526b" },
          900: { value: "#0c3a4d" },
          950: { value: "#082533" },
        },
        /** 页面主背景 — 淡白 */
        canvas: { value: "#fafafa" },
        ocean: {
          50: { value: "#eef9fb" },
          100: { value: "#d4f0f5" },
          200: { value: "#a9e0eb" },
          300: { value: "#7ac9dc" },
          400: { value: "#4aafc9" },
          500: { value: "#2d94b0" },
          600: { value: "#237892" },
          700: { value: "#1d5f75" },
          800: { value: "#184a5c" },
          900: { value: "#123844" },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: {
            value: { _light: "{colors.canvas}", _dark: "{colors.brand.950}" },
          },
          muted: {
            value: { _light: "{colors.white}", _dark: "{colors.brand.900}" },
          },
          elevated: {
            value: { _light: "{colors.white}", _dark: "{colors.brand.900}" },
          },
        },
        fg: {
          DEFAULT: { value: { _light: "{colors.brand.900}", _dark: "{colors.ocean.50}" } },
          muted: { value: { _light: "{colors.brand.700}", _dark: "{colors.ocean.200}" } },
        },
        accent: {
          DEFAULT: { value: "{colors.brand.500}" },
          emphasis: { value: "{colors.brand.600}" },
          subtle: { value: "{colors.brand.100}" },
        },
        border: {
          DEFAULT: { value: { _light: "{colors.brand.200}", _dark: "{colors.brand.800}" } },
        },
        /** 分段切换（公式库 / 自定义等） */
        segment: {
          track: {
            value: { _light: "{colors.brand.100}", _dark: "{colors.brand.900}" },
          },
          indicator: {
            value: { _light: "{colors.brand.600}", _dark: "{colors.brand.500}" },
          },
          fg: {
            DEFAULT: {
              value: { _light: "{colors.brand.800}", _dark: "{colors.ocean.200}" },
            },
            selected: {
              value: { _light: "{colors.white}", _dark: "{colors.brand.950}" },
            },
          },
        },
        /** 公式列表选中行 */
        formula: {
          selected: {
            bg: {
              value: { _light: "#ecfdf5", _dark: "rgba(16, 185, 129, 0.12)" },
            },
            border: {
              value: { _light: "{colors.green.400}", _dark: "{colors.green.400}" },
            },
            fg: {
              value: { _light: "{colors.green.700}", _dark: "{colors.green.300}" },
            },
          },
        },
        /** 公式库列表 / 练习工具卡片 */
        algs: {
          card: {
            bg: {
              value: {
                _light: "rgba(238, 249, 251, 0.55)",
                _dark: "{colors.brand.900}",
              },
            },
            border: {
              value: {
                _light: "rgba(34, 168, 203, 0.35)",
                _dark: "{colors.brand.700}",
              },
            },
            diagram: {
              value: {
                _light: "rgba(255, 255, 255, 0.65)",
                _dark: "{colors.brand.950}",
              },
            },
            hoverBorder: {
              value: {
                _light: "{colors.brand.500}",
                _dark: "{colors.brand.400}",
              },
            },
          },
          section: {
            bg: {
              value: {
                _light: "{colors.canvas}",
                _dark: "{colors.brand.900}",
              },
            },
          },
        },
      },
    },
  },
  globalCss: {
    "html, body": {
      minHeight: "100%",
      background: "bg",
      color: "fg",
    },
    body: {
      fontFamily: "body",
    },
  },
});

export const system = createSystem(defaultConfig, config);
