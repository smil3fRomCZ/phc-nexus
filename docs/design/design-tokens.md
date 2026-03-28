# PHC Nexus Design Tokens

Status: Active v1.0
Date: 2026-03-28
Owners: Frontend Lead, Tech Lead

## Purpose

Tento dokument převádí design systém do implementovatelných tokenů pro:

- CSS custom properties
- Tailwind theme mapping
- komponenty v Reactu

Pravidlo:

- produktové UI nesmí používat ad hoc vizuální hodnoty mimo tento token set

## Token Layers

Používat tři vrstvy:

1. Raw tokens
   základní barvy, spacing, radius, shadow

2. Semantic tokens
   významové aliasy jako `surface-panel`, `text-muted`, `status-success-bg`

3. Component tokens
   komponentově specifické aliasy jako `table-row-hover`, `button-primary-bg`

## Raw Tokens

### Raw Colors

```css
:root {
  --raw-orange-500: #f5a623;
  --raw-orange-400: #ffd080;
  --raw-orange-600: #e09000;

  --raw-navy-900: #172b4d;
  --raw-slate-800: #42526e;
  --raw-slate-700: #6b778c;
  --raw-slate-600: #97a0af;
  --raw-slate-500: #b3bac5;
  --raw-slate-300: #dfe1e6;
  --raw-slate-200: #ebecf0;
  --raw-slate-100: #f4f5f7;
  --raw-slate-050: #fafbfc;
  --raw-white: #ffffff;

  --raw-green-100: #e3fcef;
  --raw-green-700: #006644;
  --raw-yellow-100: #fff0b3;
  --raw-yellow-700: #974f0c;
  --raw-red-100: #ffebe6;
  --raw-red-700: #bf2600;
  --raw-blue-100: #deebff;
  --raw-blue-700: #0747a6;
  --raw-purple-100: #eae6ff;
  --raw-purple-700: #5243aa;
}
```

### Raw Spacing

```css
/* Base: 1rem = 16px */
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
}
```

### Raw Radius

```css
:root {
  --radius-sm: 0.25rem;  /* 4px */
  --radius-md: 0.5rem;   /* 8px */
  --radius-lg: 0.75rem;  /* 12px */
  --radius-xl: 1rem;     /* 16px */
  --radius-pill: 999px;
}
```

### Raw Shadow

```css
:root {
  --shadow-sm: 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.05);
  --shadow-md: 0 0.25rem 0.375rem rgba(0, 0, 0, 0.07);
  --shadow-lg: 0 0.5rem 1.5rem rgba(23, 43, 77, 0.12);
}
```

### Raw Typography

```css
:root {
  --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;

  --font-size-xs: 0.6875rem;   /* 11px */
  --font-size-sm: 0.75rem;     /* 12px */
  --font-size-base: 0.875rem;  /* 14px */
  --font-size-md: 1rem;        /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  --font-size-xl: 1.375rem;    /* 22px */
  --font-size-2xl: 1.75rem;    /* 28px */

  --line-height-tight: 1.2;
  --line-height-snug: 1.35;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.6;
}
```

## Semantic Tokens

### Brand

```css
:root {
  --color-brand-primary: var(--raw-orange-500);
  --color-brand-primary-hover: var(--raw-orange-600);
  --color-brand-primary-soft: #fff8eb;
  --color-brand-primary-muted: var(--raw-orange-400);
}
```

### Text

```css
:root {
  --color-text-strong: var(--raw-navy-900);
  --color-text-default: var(--raw-slate-800);
  --color-text-muted: var(--raw-slate-700);
  --color-text-subtle: var(--raw-slate-600);
  --color-text-disabled: var(--raw-slate-500);
  --color-text-on-brand: var(--raw-white);
}
```

### Surfaces

```css
:root {
  --color-surface-canvas: var(--raw-slate-100);
  --color-surface-panel: var(--raw-white);
  --color-surface-panel-subtle: var(--raw-slate-050);
  --color-surface-panel-muted: #f7f8fa;
  --color-surface-selected: var(--color-brand-primary-soft);
}
```

### Borders

```css
:root {
  --color-border-subtle: var(--raw-slate-200);
  --color-border-default: var(--raw-slate-300);
  --color-border-strong: #c1c7d0;
  --color-border-focus: var(--color-brand-primary);
}
```

### Status

```css
:root {
  --color-status-neutral-bg: var(--raw-slate-300);
  --color-status-neutral-fg: var(--raw-slate-800);

  --color-status-info-bg: var(--raw-blue-100);
  --color-status-info-fg: var(--raw-blue-700);

  --color-status-success-bg: var(--raw-green-100);
  --color-status-success-fg: var(--raw-green-700);

  --color-status-warning-bg: var(--raw-yellow-100);
  --color-status-warning-fg: var(--raw-yellow-700);

  --color-status-danger-bg: var(--raw-red-100);
  --color-status-danger-fg: var(--raw-red-700);

  --color-status-review-bg: var(--raw-purple-100);
  --color-status-review-fg: var(--raw-purple-700);
}
```

### Focus

```css
:root {
  --focus-ring: 0 0 0 3px rgba(245, 166, 35, 0.22);
}
```

## Component Tokens

### Shell

```css
:root {
  --shell-topbar-height: 3rem;      /* 48px */
  --shell-sidebar-width: 17.5rem;   /* 280px */
  --shell-page-max-width: 100rem;   /* 1600px */
  --shell-page-padding-x: 3rem;     /* 48px */
  --shell-page-padding-y: 2rem;     /* 32px */
}
```

### Navigation

```css
:root {
  --nav-item-height: 2rem;      /* 32px */
  --nav-item-radius: var(--radius-sm);
  --nav-item-hover-bg: var(--color-surface-panel-muted);
  --nav-item-active-bg: var(--color-brand-primary-soft);
  --nav-item-active-fg: var(--color-brand-primary-hover);
  --nav-item-active-border: var(--color-brand-primary);
}
```

### Buttons

```css
:root {
  --button-height-sm: 2rem;      /* 32px */
  --button-height-md: 2.25rem;   /* 36px */
  --button-height-lg: 2.5rem;    /* 40px */

  --button-radius: var(--radius-md);

  --button-primary-bg: var(--color-brand-primary);
  --button-primary-bg-hover: var(--color-brand-primary-hover);
  --button-primary-fg: var(--color-text-on-brand);

  --button-secondary-bg: var(--color-surface-panel);
  --button-secondary-bg-hover: var(--color-surface-panel-subtle);
  --button-secondary-fg: var(--color-text-strong);
  --button-secondary-border: var(--color-border-default);

  --button-danger-bg: var(--color-status-danger-bg);
  --button-danger-fg: var(--color-status-danger-fg);
}
```

### Inputs

```css
:root {
  --input-height: 2.25rem;   /* 36px */
  --input-radius: var(--radius-md);
  --input-bg: var(--color-surface-panel);
  --input-fg: var(--color-text-default);
  --input-border: var(--color-border-default);
  --input-border-hover: var(--color-border-strong);
  --input-border-focus: var(--color-border-focus);
  --input-placeholder: var(--color-text-subtle);
}
```

### Metadata Strip

```css
:root {
  --meta-strip-bg: var(--color-surface-panel-subtle);
  --meta-strip-border: var(--color-border-subtle);
  --meta-strip-radius: var(--radius-md);
}
```

### Table

```css
:root {
  --table-header-bg: var(--color-brand-primary);
  --table-header-fg: var(--color-text-on-brand);
  --table-row-hover-bg: var(--color-brand-primary-soft);
  --table-row-alt-bg: var(--color-surface-panel-subtle);
  --table-border: var(--color-border-subtle);
  --table-cell-padding-y: 0.5rem;    /* 8px */
  --table-cell-padding-x: 0.625rem;  /* 10px */
}
```

### Cards

```css
:root {
  --card-bg: var(--color-surface-panel);
  --card-border: var(--color-border-default);
  --card-radius: var(--radius-md);
  --card-hover-border: var(--color-brand-primary-muted);
  --card-hover-shadow: var(--shadow-md);
}
```

### Banner

```css
:root {
  --banner-info-bg: #fffdf5;
  --banner-info-border: var(--color-brand-primary);
  --banner-warning-bg: var(--color-status-warning-bg);
  --banner-danger-bg: var(--color-status-danger-bg);
}
```

### Empty State

```css
:root {
  --empty-border: var(--color-border-default);
  --empty-fg: var(--color-text-subtle);
  --empty-radius: var(--radius-md);
}
```

### Form Field States

```css
:root {
  --input-border-error: var(--color-status-danger-fg);
  --input-bg-disabled: var(--color-surface-panel-subtle);
  --input-fg-disabled: var(--color-text-subtle);
  --input-border-disabled: var(--color-border-subtle);
}
```

### Skeleton

```css
:root {
  --skeleton-bg: var(--color-surface-panel-muted);
  --skeleton-radius: var(--radius-md);
}
```

### Transitions

```css
:root {
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}
```

## Tailwind Mapping

Tailwind konfigurace má být navázaná na CSS variables, ne na samostatné hardcoded palety.

Směr:

```ts
colors: {
  brand: {
    primary: "var(--color-brand-primary)",
    "primary-hover": "var(--color-brand-primary-hover)",
    soft: "var(--color-brand-primary-soft)",
  },
  text: {
    strong: "var(--color-text-strong)",
    DEFAULT: "var(--color-text-default)",
    muted: "var(--color-text-muted)",
    subtle: "var(--color-text-subtle)",
  },
  surface: {
    canvas: "var(--color-surface-canvas)",
    panel: "var(--color-surface-panel)",
    subtle: "var(--color-surface-panel-subtle)",
  },
  border: {
    subtle: "var(--color-border-subtle)",
    DEFAULT: "var(--color-border-default)",
    strong: "var(--color-border-strong)",
  },
}
```

## Token Governance

Každý nový token musí odpovědět na:

- je to znovupoužitelná hodnota, nebo jednorázový případ?
- je to raw, semantic, nebo component token?
- nejde stejný problém vyřešit existujícím tokenem?

Nepovolovat:

- nový hex kód jen kvůli jedné stránce
- další odstín oranžové bez skutečné potřeby
- nový shadow styl bez systémového důvodu

## MVP Token Checklist

Všechny tokeny jsou implementovány v `resources/css/app.css`:

- [x] brand tokens
- [x] text tokens
- [x] surface tokens
- [x] border tokens
- [x] status tokens
- [x] spacing scale (Tailwind default)
- [x] radius scale
- [x] button tokens
- [x] input tokens + form field states (error, disabled)
- [x] table tokens
- [x] card tokens
- [x] empty state tokens
- [x] skeleton tokens
- [x] transition tokens
- [x] shell tokens (topbar, sidebar, page)
- [x] focus ring
