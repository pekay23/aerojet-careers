export interface ThemePreset {
  id: string;
  label: string;
  light: Record<string, string>;
  dark: Record<string, string>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "aerojet",
    label: "Aerojet",
    light: {
      /* ── Aerojet Brand Palette (OKLCH) ─────────────────────────────────────────── */
      /* --aero-blue: #003366 → oklch(0.28 0.15 258) */
      /* --aero-sky: #00AEEF → oklch(0.62 0.18 242) */
      /* --aero-light: #2E7EB3 → oklch(0.52 0.12 245) */
      /* --aero-soft-blue: #0066FF → oklch(0.55 0.22 260) */
      /* --aero-slate: #2C3E50 → oklch(0.28 0.06 250) */
      /* --aero-offwhite: #F9F9F9 → oklch(0.98 0 0) */

      /* ── Core Semantic (shadcn/ui compatible) ────────────────────────────────── */
      "--primary": "oklch(0.28 0.15 258)",
      "--primary-foreground": "oklch(1.00 0 0)",
      "--background": "oklch(1.00 0 0)",
      "--foreground": "oklch(0.28 0.06 250)",
      "--card": "oklch(1.00 0 0)",
      "--card-foreground": "oklch(0.28 0.06 250)",
      "--popover": "oklch(1.00 0 0)",
      "--popover-foreground": "oklch(0.28 0.06 250)",
      "--secondary": "oklch(0.96 0.005 250)",
      "--secondary-foreground": "oklch(0.28 0.06 250)",
      "--muted": "oklch(0.96 0.005 250)",
      "--muted-foreground": "oklch(0.50 0.02 250)",
      "--accent": "oklch(0.96 0.005 250)",
      "--accent-foreground": "oklch(0.28 0.06 250)",
      "--destructive": "oklch(0.58 0.18 25)",
      "--destructive-foreground": "oklch(1.00 0 0)",
      "--border": "oklch(0.90 0.01 250)",
      "--input": "oklch(0.90 0.01 250)",
      "--ring": "oklch(0.28 0.15 258)",

      /* ── Sidebar (Admin) ────────────────────────────────────────────────────── */
      "--sidebar": "oklch(0.98 0 0)",
      "--sidebar-foreground": "oklch(0.28 0.06 250)",
      "--sidebar-primary": "oklch(0.28 0.15 258)",
      "--sidebar-primary-foreground": "oklch(1.00 0 0)",
      "--sidebar-accent": "oklch(0.95 0.01 250)",
      "--sidebar-accent-foreground": "oklch(0.28 0.06 250)",
      "--sidebar-border": "oklch(0.90 0.01 250)",
      "--sidebar-ring": "oklch(0.28 0.15 258)",

      /* ── Aerojet Brand Tokens (for direct use) ──────────────────────────────── */
      "--aero-blue": "oklch(0.28 0.15 258)",
      "--aero-sky": "oklch(0.62 0.18 242)",
      "--aero-light": "oklch(0.52 0.12 245)",
      "--aero-soft-blue": "oklch(0.55 0.22 260)",
      "--aero-slate": "oklch(0.28 0.06 250)",
      "--aero-offwhite": "oklch(0.98 0 0)",

      /* ── Public-site Palette ────────────────────────────────────────────────── */
      "--public-primary": "oklch(0.25 0.15 258)",
      "--public-secondary": "oklch(0.55 0.15 245)",
      "--public-dark": "oklch(0.22 0.06 250)",

      /* ── Extended Surfaces ──────────────────────────────────────────────────── */
      "--paper": "oklch(0.96 0.01 85)",
      "--paper-dark": "oklch(0.92 0.015 85)",
      "--ink": "oklch(0.22 0.05 250)",
      "--bg-light": "oklch(0.97 0.002 250)",
      "--bg-dark": "oklch(0.15 0.02 260)",

      /* ── Semantic Status ────────────────────────────────────────────────────── */
      "--success": "oklch(0.55 0.12 145)",
      "--warning": "oklch(0.65 0.12 85)",
      "--danger": "oklch(0.58 0.18 25)",
      "--info": "oklch(0.52 0.12 245)",
      "--success-soft": "oklch(0.93 0.03 145)",
      "--warning-soft": "oklch(0.95 0.03 85)",
      "--danger-soft": "oklch(0.94 0.03 25)",
      "--info-soft": "oklch(0.92 0.03 245)",
    },
    dark: {
      /* ── Aerojet Brand Palette (OKLCH) ──────────────────────────────────────── */
      /* --aero-blue: #003366 → oklch(0.28 0.15 258) */
      /* --aero-sky: #00AEEF → oklch(0.62 0.18 242) */
      /* --aero-light: #2E7EB3 → oklch(0.52 0.12 245) */
      /* --aero-soft-blue: #0066FF → oklch(0.55 0.22 260) */
      /* --aero-slate: #2C3E50 → oklch(0.28 0.06 250) */
      /* --aero-offwhite: #F9F9F9 → oklch(0.98 0 0) */

      /* ── Core Semantic (shadcn/ui compatible) ──────────────────────────────── */
      "--primary": "oklch(0.98 0 0)",
      "--primary-foreground": "oklch(0.22 0.05 258)",
      "--background": "oklch(0.15 0.02 260)",
      "--foreground": "oklch(0.95 0.01 250)",
      "--card": "oklch(0.18 0.02 255)",
      "--card-foreground": "oklch(0.95 0.01 250)",
      "--popover": "oklch(0.15 0.02 260)",
      "--popover-foreground": "oklch(0.95 0.01 250)",
      "--secondary": "oklch(0.22 0.02 255)",
      "--secondary-foreground": "oklch(0.98 0 0)",
      "--muted": "oklch(0.22 0.02 255)",
      "--muted-foreground": "oklch(0.65 0.02 250)",
      "--accent": "oklch(0.22 0.02 255)",
      "--accent-foreground": "oklch(0.98 0 0)",
      "--destructive": "oklch(0.55 0.18 25)",
      "--destructive-foreground": "oklch(1.00 0 0)",
      "--border": "oklch(0.28 0.02 255)",
      "--input": "oklch(0.28 0.02 255)",
      "--ring": "oklch(0.62 0.18 242)",

      /* ── Sidebar (Admin) ───────────────────────────────────────────────────── */
      "--sidebar": "oklch(0.15 0.02 260)",
      "--sidebar-foreground": "oklch(0.95 0.01 250)",
      "--sidebar-primary": "oklch(0.62 0.18 242)",
      "--sidebar-primary-foreground": "oklch(0.15 0.02 260)",
      "--sidebar-accent": "oklch(0.20 0.02 255)",
      "--sidebar-accent-foreground": "oklch(0.98 0 0)",
      "--sidebar-border": "oklch(0.25 0.02 255)",
      "--sidebar-ring": "oklch(0.62 0.18 242)",

      /* ── Aerojet Brand Tokens ──────────────────────────────────────────────── */
      "--aero-blue": "oklch(0.28 0.15 258)",
      "--aero-sky": "oklch(0.62 0.18 242)",
      "--aero-light": "oklch(0.52 0.12 245)",
      "--aero-soft-blue": "oklch(0.55 0.22 260)",
      "--aero-slate": "oklch(0.28 0.06 250)",
      "--aero-offwhite": "oklch(0.98 0 0)",

      /* ── Public-site Palette ───────────────────────────────────────────────── */
      "--public-primary": "oklch(0.25 0.15 258)",
      "--public-secondary": "oklch(0.55 0.15 245)",
      "--public-dark": "oklch(0.22 0.06 250)",

      /* ── Extended Surfaces ─────────────────────────────────────────────────── */
      "--paper": "oklch(0.20 0.02 85)",
      "--paper-dark": "oklch(0.18 0.02 85)",
      "--ink": "oklch(0.95 0.01 250)",
      "--bg-light": "oklch(0.18 0.02 255)",
      "--bg-dark": "oklch(0.12 0.02 260)",

      /* ── Semantic Status ───────────────────────────────────────────────────── */
      "--success": "oklch(0.60 0.12 145)",
      "--warning": "oklch(0.70 0.12 85)",
      "--danger": "oklch(0.60 0.18 25)",
      "--info": "oklch(0.58 0.12 245)",
      "--success-soft": "oklch(0.25 0.04 145)",
      "--warning-soft": "oklch(0.25 0.04 85)",
      "--danger-soft": "oklch(0.25 0.04 25)",
      "--info-soft": "oklch(0.25 0.04 245)",
    }
  },
  {
    id: "aerojet-soft",
    label: "Aerojet Soft",
    light: {
      /* Softer variant with lighter primary */
      "--primary": "oklch(0.52 0.12 245)",
      "--primary-foreground": "oklch(1.00 0 0)",
      "--background": "oklch(1.00 0 0)",
      "--foreground": "oklch(0.28 0.06 250)",
      "--card": "oklch(1.00 0 0)",
      "--card-foreground": "oklch(0.28 0.06 250)",
      "--popover": "oklch(1.00 0 0)",
      "--popover-foreground": "oklch(0.28 0.06 250)",
      "--secondary": "oklch(0.97 0.005 250)",
      "--secondary-foreground": "oklch(0.28 0.06 250)",
      "--muted": "oklch(0.97 0.005 250)",
      "--muted-foreground": "oklch(0.50 0.02 250)",
      "--accent": "oklch(0.97 0.005 250)",
      "--accent-foreground": "oklch(0.28 0.06 250)",
      "--destructive": "oklch(0.58 0.18 25)",
      "--destructive-foreground": "oklch(1.00 0 0)",
      "--border": "oklch(0.92 0.01 250)",
      "--input": "oklch(0.92 0.01 250)",
      "--ring": "oklch(0.52 0.12 245)",

      "--sidebar": "oklch(0.98 0 0)",
      "--sidebar-foreground": "oklch(0.28 0.06 250)",
      "--sidebar-primary": "oklch(0.52 0.12 245)",
      "--sidebar-primary-foreground": "oklch(1.00 0 0)",
      "--sidebar-accent": "oklch(0.96 0.01 250)",
      "--sidebar-accent-foreground": "oklch(0.28 0.06 250)",
      "--sidebar-border": "oklch(0.92 0.01 250)",
      "--sidebar-ring": "oklch(0.52 0.12 245)",

      /* Brand tokens */
      "--aero-blue": "oklch(0.28 0.15 258)",
      "--aero-sky": "oklch(0.62 0.18 242)",
      "--aero-light": "oklch(0.52 0.12 245)",
      "--aero-soft-blue": "oklch(0.55 0.22 260)",
      "--aero-slate": "oklch(0.28 0.06 250)",
      "--aero-offwhite": "oklch(0.98 0 0)",
    },
    dark: {
      "--primary": "oklch(0.62 0.18 242)",
      "--primary-foreground": "oklch(0.15 0.02 260)",
      "--background": "oklch(0.15 0.02 260)",
      "--foreground": "oklch(0.95 0.01 250)",
      "--card": "oklch(0.18 0.02 255)",
      "--card-foreground": "oklch(0.95 0.01 250)",
      "--popover": "oklch(0.15 0.02 260)",
      "--popover-foreground": "oklch(0.95 0.01 250)",
      "--secondary": "oklch(0.22 0.02 255)",
      "--secondary-foreground": "oklch(0.98 0 0)",
      "--muted": "oklch(0.22 0.02 255)",
      "--muted-foreground": "oklch(0.65 0.02 250)",
      "--accent": "oklch(0.22 0.02 255)",
      "--accent-foreground": "oklch(0.98 0 0)",
      "--destructive": "oklch(0.55 0.18 25)",
      "--destructive-foreground": "oklch(1.00 0 0)",
      "--border": "oklch(0.28 0.02 255)",
      "--input": "oklch(0.28 0.02 255)",
      "--ring": "oklch(0.62 0.18 242)",

      "--sidebar": "oklch(0.15 0.02 260)",
      "--sidebar-foreground": "oklch(0.95 0.01 250)",
      "--sidebar-primary": "oklch(0.62 0.18 242)",
      "--sidebar-primary-foreground": "oklch(0.15 0.02 260)",
      "--sidebar-accent": "oklch(0.20 0.02 255)",
      "--sidebar-accent-foreground": "oklch(0.98 0 0)",
      "--sidebar-border": "oklch(0.25 0.02 255)",
      "--sidebar-ring": "oklch(0.62 0.18 242)",

      /* Brand tokens */
      "--aero-blue": "oklch(0.28 0.15 258)",
      "--aero-sky": "oklch(0.62 0.18 242)",
      "--aero-light": "oklch(0.52 0.12 245)",
      "--aero-soft-blue": "oklch(0.55 0.22 260)",
      "--aero-slate": "oklch(0.28 0.06 250)",
      "--aero-offwhite": "oklch(0.98 0 0)",
    }
  }
];

export const DEFAULT_PRESET_ID = "aerojet";

export const DEFAULT_THEME: Record<string, string> = THEME_PRESETS.find(p => p.id === DEFAULT_PRESET_ID)?.light || {};
export const DEFAULT_DARK_THEME: Record<string, string> = THEME_PRESETS.find(p => p.id === DEFAULT_PRESET_ID)?.dark || {};

export interface ThemeToken {
  cssVar: string;
  label: string;
  defaultValue: string;
}

export interface ThemeGroup {
  id: string;
  label: string;
  description: string;
  tokens: ThemeToken[];
}

export const THEME_GROUPS: ThemeGroup[] = [
  {
    id: "brand",
    label: "Brand Identity",
    description: "Core Aerojet brand colors",
    tokens: [
      { cssVar: "--aero-blue", label: "Aero Blue (Primary)", defaultValue: "oklch(0.28 0.15 258)" },
      { cssVar: "--aero-sky", label: "Aero Sky (Accent)", defaultValue: "oklch(0.62 0.18 242)" },
      { cssVar: "--aero-light", label: "Aero Light", defaultValue: "oklch(0.52 0.12 245)" },
      { cssVar: "--aero-soft-blue", label: "Aero Soft Blue", defaultValue: "oklch(0.55 0.22 260)" },
      { cssVar: "--aero-slate", label: "Aero Slate", defaultValue: "oklch(0.28 0.06 250)" },
      { cssVar: "--aero-offwhite", label: "Aero Off-White", defaultValue: "oklch(0.98 0 0)" },
    ],
  },
  {
    id: "core",
    label: "Core Semantic",
    description: "Main interaction and UI colors (shadcn/ui compatible)",
    tokens: [
      { cssVar: "--primary", label: "Brand Primary", defaultValue: "oklch(0.28 0.15 258)" },
      { cssVar: "--primary-foreground", label: "Primary Text", defaultValue: "oklch(1.00 0 0)" },
      { cssVar: "--accent", label: "Interactive Accent", defaultValue: "oklch(0.96 0.005 250)" },
      { cssVar: "--accent-foreground", label: "Accent Text", defaultValue: "oklch(0.28 0.06 250)" },
    ],
  },
  {
    id: "foundation",
    label: "Foundation",
    description: "Backgrounds, surfaces and borders",
    tokens: [
      { cssVar: "--background", label: "Page Background", defaultValue: "oklch(1.00 0 0)" },
      { cssVar: "--foreground", label: "General Text", defaultValue: "oklch(0.28 0.06 250)" },
      { cssVar: "--card", label: "Surface Layer", defaultValue: "oklch(1.00 0 0)" },
      { cssVar: "--card-foreground", label: "Surface Text", defaultValue: "oklch(0.28 0.06 250)" },
      { cssVar: "--border", label: "Global Border", defaultValue: "oklch(0.90 0.01 250)" },
      { cssVar: "--input", label: "Form Input Border", defaultValue: "oklch(0.90 0.01 250)" },
    ],
  },
  {
    id: "status",
    label: "Status Colors",
    description: "Semantic status and feedback colors",
    tokens: [
      { cssVar: "--success", label: "Success", defaultValue: "oklch(0.55 0.12 145)" },
      { cssVar: "--success-soft", label: "Success Soft", defaultValue: "oklch(0.93 0.03 145)" },
      { cssVar: "--warning", label: "Warning", defaultValue: "oklch(0.65 0.12 85)" },
      { cssVar: "--warning-soft", label: "Warning Soft", defaultValue: "oklch(0.95 0.03 85)" },
      { cssVar: "--danger", label: "Danger/Error", defaultValue: "oklch(0.58 0.18 25)" },
      { cssVar: "--danger-soft", label: "Danger Soft", defaultValue: "oklch(0.94 0.03 25)" },
      { cssVar: "--info", label: "Info", defaultValue: "oklch(0.52 0.12 245)" },
      { cssVar: "--info-soft", label: "Info Soft", defaultValue: "oklch(0.92 0.03 245)" },
    ],
  },
  {
    id: "sidebar",
    label: "Sidebar (Admin)",
    description: "Admin sidebar specific tokens",
    tokens: [
      { cssVar: "--sidebar", label: "Sidebar Background", defaultValue: "oklch(0.98 0 0)" },
      { cssVar: "--sidebar-foreground", label: "Sidebar Text", defaultValue: "oklch(0.28 0.06 250)" },
      { cssVar: "--sidebar-primary", label: "Sidebar Primary", defaultValue: "oklch(0.28 0.15 258)" },
      { cssVar: "--sidebar-primary-foreground", label: "Sidebar Primary Text", defaultValue: "oklch(1.00 0 0)" },
      { cssVar: "--sidebar-accent", label: "Sidebar Accent", defaultValue: "oklch(0.95 0.01 250)" },
      { cssVar: "--sidebar-accent-foreground", label: "Sidebar Accent Text", defaultValue: "oklch(0.28 0.06 250)" },
      { cssVar: "--sidebar-border", label: "Sidebar Border", defaultValue: "oklch(0.90 0.01 250)" },
      { cssVar: "--sidebar-ring", label: "Sidebar Focus Ring", defaultValue: "oklch(0.28 0.15 258)" },
    ],
  },
  {
    id: "extended",
    label: "Extended Surfaces",
    description: "Additional surface variants for content areas",
    tokens: [
      { cssVar: "--paper", label: "Paper", defaultValue: "oklch(0.96 0.01 85)" },
      { cssVar: "--paper-dark", label: "Paper Dark", defaultValue: "oklch(0.92 0.015 85)" },
      { cssVar: "--ink", label: "Ink", defaultValue: "oklch(0.22 0.05 250)" },
      { cssVar: "--bg-light", label: "Light Section BG", defaultValue: "oklch(0.97 0.002 250)" },
      { cssVar: "--bg-dark", label: "Dark Section BG", defaultValue: "oklch(0.15 0.02 260)" },
    ],
  },
];