import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        /* Custom Colors from DESIGN.md — themeable via CSS variables.
           Token names preserved; values flip between dark/light themes. */
        void: "hsl(var(--void))",
        "deep-teal": "hsl(var(--deep-teal))",
        "dark-forest": "hsl(var(--dark-forest))",
        forest: "hsl(var(--forest))",
        "neon-green": "hsl(var(--neon-green))",
        aloe: "hsl(var(--aloe))",
        pistachio: "hsl(var(--pistachio))",
        "shade-30": "hsl(var(--shade-30))",
        "shade-50": "hsl(var(--shade-50))",
        "shade-60": "hsl(var(--shade-60))",
        "shade-70": "hsl(var(--shade-70))",
        /* Theme-aware overlay color: white in dark, black in light.
           Use as bg-overlay/[0.06], border-overlay/10, etc. */
        overlay: "hsl(var(--overlay) / <alpha-value>)",
        "overlay-inverse": "hsl(var(--overlay-inverse) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Helvetica", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Helvetica", "Arial", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pill: "9999px",
      },
      boxShadow: {
        card:
          "rgba(0,0,0,0.1) 0px 0px 0px 1px, rgba(0,0,0,0.1) 0px 2px 2px, rgba(0,0,0,0.1) 0px 4px 4px, rgba(0,0,0,0.1) 0px 8px 8px, rgba(255,255,255,0.03) 0px 1px 0px inset",
        "card-elevated":
          "rgba(0,0,0,0.15) 0px 0px 0px 1px, rgba(0,0,0,0.15) 0px 4px 4px, rgba(0,0,0,0.15) 0px 8px 8px, rgba(0,0,0,0.15) 0px 16px 16px, rgba(255,255,255,0.05) 0px 1px 0px inset",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
