# AURENDOR Content OS — Interface Design System

This project-specific system overrides the generic design-search result. It is grounded in AURENDOR FINAL 2026 and the Social Design System v2.

## Product character

Premium, calm, precise, architectural, operational, and quietly futuristic. The console should feel like a trusted command surface—not a marketing dashboard, playful social tool, or generic admin template.

## Palette

| Token | Value | Use |
|---|---|---|
| Deep | `#003F35` | Navigation, primary text, dark canvas |
| Deep 2 | `#00302A` | Elevated dark surfaces |
| Neon | `#0EDB23` | Active state, focus, small charge only |
| Pale | `#77FF70` | Highlights on deep surfaces |
| Paper | `#F4F8F5` | Primary application canvas |
| White | `#FFFFFF` | Cards and crisp highlights |
| Ink | `#0B201B` | Body text on light |
| Ink soft | `#3A5145` | Secondary text |
| Line | `#CFDDD4` | Borders and dividers |
| Warning | `#B7791F` | Attention states paired with icons/labels |
| Error | `#B42318` | Failure states paired with icons/labels |

Neon never carries small body text and never fills large application surfaces. Use it as the 5–10% “charge.”

## Typography

- Product UI/body: system sans fallback for speed and legibility.
- Brand/display labels: Dh Ranclo when the licensed font is packaged.
- Arabic display and previews: Ghroob Arabic ITF.
- Arabic UI fallback: IBM Plex Sans Arabic / Noto Sans Arabic until a webfont build is confirmed.
- Headings are compact and declarative. Metrics use tabular numerals.

## Layout

- 8px spacing baseline.
- Calm 12-column desktop content grid; single-column mobile.
- Persistent sidebar on desktop, compact horizontal header on mobile.
- Cards use 1px visible borders, restrained radii (12–18px), and minimal shadows.
- White/paper dominates. Dark surfaces anchor navigation, creative previews, and high-priority status.
- No decorative glassmorphism, loud gradients, excessive pills, or emoji icons.

## Interaction

- Use one consistent Lucide icon family.
- Clickable controls have pointer cursors, 150–250ms color/border transitions, visible focus rings, and no layout-shifting scale hover.
- Mutations use server actions and return explicit success/error state.
- Approval and publishing actions show their risk and resulting state before submission.
- Global pause is always visible and never color-only.

## Accessibility and responsive behavior

- WCAG AA contrast; minimum 4.5:1 for body text.
- Semantic headings, landmarks, labels, tables, and status text.
- Respect `prefers-reduced-motion`.
- Validate 375, 768, 1024, and 1440px widths with no horizontal scroll.
- Do not hide critical approval/provider state on mobile.

## Motion

Motion communicates state change: subtle 180–260ms fades, border/color transitions, and restrained progress movement. Disable nonessential motion under reduced-motion preferences.

## Anti-patterns

- Rose/blue generic social palette.
- Lora/Raleway wellness styling.
- Neon green paragraphs or large neon panels.
- Charts without definitions, time ranges, or evidence.
- Vanity metrics presented as business outcomes.
- Publishing controls that look identical to harmless edits.
- Raw model traces in the owner approval surface.

