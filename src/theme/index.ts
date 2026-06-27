import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: '"Outfit", "PingFang SC", "Microsoft YaHei", sans-serif' },
        body: { value: '"DM Sans", "PingFang SC", "Microsoft YaHei", sans-serif' },
      },
      colors: {
        /** Legacy raw scales — internal / recipe reference only */
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
          DEFAULT: { value: "var(--background)" },
          muted: { value: "var(--muted)" },
          elevated: { value: "var(--card)" },
          subtle: {
            value: "color-mix(in srgb, var(--foreground) 4%, var(--card))",
          },
        },
        fg: {
          DEFAULT: { value: "var(--foreground)" },
          muted: { value: "var(--muted-foreground)" },
          faint: { value: "var(--faint-foreground)" },
        },
        accent: {
          DEFAULT: { value: "var(--accent)" },
          fg: { value: "var(--accent-foreground)" },
          soft: { value: "var(--accent-soft)" },
          emphasis: {
            value: "color-mix(in srgb, var(--accent) 88%, black)",
          },
          hover: {
            value: "color-mix(in srgb, var(--accent) 88%, white)",
          },
        },
        border: {
          DEFAULT: { value: "var(--border-default)" },
          strong: { value: "var(--border-strong)" },
        },
        signal: {
          success: { value: "var(--signal-success)" },
          warning: { value: "var(--signal-warning)" },
          info: { value: "var(--signal-info)" },
          destructive: { value: "var(--destructive)" },
          destructiveFg: { value: "var(--destructive-foreground)" },
        },
        /** colorPalette="brand" Button / Badge recipe tokens */
        brand: {
          contrast: { value: "var(--accent-foreground)" },
          fg: { value: "var(--foreground)" },
          subtle: { value: "var(--accent-soft)" },
          muted: { value: "var(--muted)" },
          emphasized: { value: "var(--border-strong)" },
          solid: { value: "var(--accent)" },
          focusRing: { value: "var(--ring)" },
          border: { value: "var(--accent)" },
        },
        /** Segment toggle (formula library etc.) */
        segment: {
          track: { value: "var(--muted)" },
          indicator: { value: "var(--accent)" },
          fg: {
            DEFAULT: { value: "var(--muted-foreground)" },
            selected: { value: "var(--accent-foreground)" },
          },
        },
        /** Formula list selected row */
        formula: {
          selected: {
            bg: {
              value:
                "color-mix(in srgb, var(--signal-success) 14%, transparent)",
            },
            border: { value: "var(--signal-success)" },
            fg: { value: "var(--signal-success)" },
          },
        },
        /** Welcome / sponsorship modules */
        welcome: {
          coffee: {
            pageBg: {
              value:
                "linear-gradient(180deg, color-mix(in srgb, var(--signal-warning) 8%, var(--background)) 0%, var(--card) 100%)",
            },
            wechatQr: {
              value:
                "color-mix(in srgb, var(--signal-success) 12%, var(--card))",
            },
            alipayQr: {
              value: "color-mix(in srgb, var(--accent) 12%, var(--card))",
            },
          },
          ad: {
            contactBg: {
              value:
                "linear-gradient(135deg, var(--card) 0%, color-mix(in srgb, var(--accent) 8%, var(--muted)) 100%)",
            },
          },
        },
        /** Formula library cards */
        algs: {
          card: {
            bg: {
              value: "color-mix(in srgb, var(--accent) 8%, var(--card))",
            },
            border: {
              value: "color-mix(in srgb, var(--accent) 35%, transparent)",
            },
            diagram: {
              value: "color-mix(in srgb, var(--card) 65%, transparent)",
            },
            hoverBorder: { value: "var(--accent)" },
          },
          section: {
            bg: { value: "var(--background)" },
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
