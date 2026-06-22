# MyCoop UI Audit — Recommended Actions

**Score: 11/20 — Acceptable (significant work needed)**
**Date: 2026-06-22**

---

## Priority Queue

### [P1] `/impeccable colorize` — Design Token System
Extract 40+ hardcoded OKLCH values into CSS custom properties.

Define in `globals.css`:
```css
@theme inline {
  --color-accent: oklch(40% 0.12 260);
  --color-accent-hover: oklch(35% 0.12 260);
  --color-surface: oklch(97% 0.006 85);
  --color-card: oklch(100% 0 0);
  --color-border: oklch(88% 0.008 260);
  --color-border-input: oklch(82% 0.01 260);
  --color-text-primary: oklch(20% 0.02 260);
  --color-text-secondary: oklch(50% 0.01 260);
  --color-text-muted: oklch(55% 0.01 260);
  --color-error: oklch(55% 0.2 25);
  --color-error-surface: oklch(97% 0.04 25);
  --color-error-border: oklch(82% 0.08 25);
}
```
Replace every inline `oklch(...)` across all components. Unblocks dark mode. Eliminates 40+ duplicate values.

---

### [P1] `/impeccable harden` — Accessibility Fixes

**Form label associations** (`NotesList.tsx`, `ConsultationsTab.tsx`, `ResearchTab.tsx`):
- Add `id` to every input/textarea/select
- Add matching `htmlFor` to every `<label>`
- Pattern: `login/page.tsx` already correct — follow that

**Milestone toggle** (`ResearchTab.tsx:131`):
- Add `role="checkbox"` and `aria-checked={!!m.completed_at}` to the toggle button

**StatusDot** (`StatusDot.tsx`):
- Add `<span className="sr-only">` with text description alongside each dot
- e.g. `"ปรึกษาล่าสุด 5 วันที่แล้ว"` or `"ยังไม่มีการปรึกษา"`

**NoteCard expand toggle** (`NotesList.tsx:162`):
- Add `aria-expanded={expanded}` to the toggle button

**`window.confirm()` replacement** (5 locations across `NotesList.tsx`, `ConsultationsTab.tsx`, `ResearchTab.tsx`):
- Replace with inline confirmation row: show "คุณแน่ใจ? [ยืนยัน] [ยกเลิก]" inline on first click

---

### [P1] `/impeccable adapt` — Touch Targets

**HeatmapCalendar cells** (`HeatmapCalendar.tsx:138`):
- Cells are 13×13px — 31px below 44px minimum (WCAG 2.5.5)
- Add `aria-label` to each cell with date + count
- Add keyboard navigation (Tab between cells, Enter/Space to interact)
- Consider increasing `cellSize` to 16px minimum

**Edit/Delete buttons** (`NotesList.tsx:132-148`, `ConsultationsTab.tsx:163`, `ResearchTab.tsx:166`):
- Buttons render ~26-28px — expand hit area to 44px minimum
- Use `min-h-[44px] min-w-[44px]` or the `-m-2 p-2 relative` hit area expansion trick

**Consultations truncated at 10** (`ConsultationsTab.tsx:138`):
- `consultations.slice(0, 10)` silently hides older records
- Add "แสดงทั้งหมด (N รายการ)" toggle or remove the slice

---

### [P2] `/impeccable clarify` — Copy Fixes

**Seed command in production** (`dashboard/page.tsx:81`):
- Remove `npx tsx src/scripts/seed.ts` from the empty state shown to professors
- Replace with appropriate user-facing guidance or gate behind `NODE_ENV === 'development'`

---

### [P3] `/impeccable polish` — Final Pass

| Location | Fix |
|----------|-----|
| `HeatmapCalendar.tsx:151` | `@motion-reduce:transition-none` → `motion-reduce:transition-none` (invalid prefix — reduced motion not respected) |
| `StudentCard.tsx:28` | `transition-all` → `transition-[border-color,box-shadow]` |
| `HeatmapCalendar.tsx:125` | Add `aria-hidden="true"` to opacity-0 day labels (currently read by screen readers) |
| All delete buttons | Standardize error/danger colors to OKLCH — replace `red-50`, `red-400`, `red-600` with `--color-error` tokens |

---

## Dimension Scores

| Dimension | Score | Root Cause |
|-----------|-------|------------|
| Accessibility | 1/4 | No label associations, color-only status, inaccessible calendar |
| Performance | 3/4 | Broken motion-reduce prefix, `transition-all` |
| Theming | 1/4 | Zero token system — 40+ hardcoded OKLCH values |
| Responsive | 2/4 | Touch targets consistently too small |
| Anti-Patterns | 4/4 | Clean — no banned patterns |
| **Total** | **11/20** | |
