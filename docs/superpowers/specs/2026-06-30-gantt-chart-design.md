# Gantt Chart — Design Spec
Date: 2026-06-30

## Overview

New page `/gantt` showing all students' internship timelines as a horizontal Gantt chart. Supports drag-to-resize bars and a side panel for editing student data. Toggle between internship view and research view.

---

## Architecture

```
/gantt (Server Component)
  └─ fetch: students, milestones, consultations (parallel)
  └─ sort students by start_date ascending
  └─ pass to → GanttChart (Client Component)
       ├─ GanttHeader — month axis labels
       ├─ GanttRow × N — one row per student
       │    ├─ bar div (positioned by date %)
       │    ├─ milestone dots (research toggle)
       │    └─ consultation markers (internship toggle)
       ├─ GanttSidePanel — slide-in edit panel
       └─ drag state (pointer events, top-level handler)
```

**New files:**
```
src/app/gantt/page.tsx       — server component, data fetch
src/app/gantt/actions.ts     — updateStudent, updateStudentDates
src/components/GanttChart.tsx
src/components/GanttSidePanel.tsx
```

**Navigation:** Add "Gantt" link to dashboard header.

---

## Data Fetch (server)

```ts
const [{ data: students }, { data: milestones }, { data: consultations }] =
  await Promise.all([
    supabase.from('students').select('*').order('start_date'),
    supabase.from('milestones').select('student_id, title, due_date, completed_at'),
    supabase.from('consultations').select('student_id, date'),
  ])
```

Students with null start_date/end_date appear at bottom of list.

---

## Timeline Math

- **Range:** `min(start_date) - 1 month` → `max(end_date) + 1 month`
- **Position:** `left = ((date - min) / (max - min)) * 100` (%)
- **X-axis:** Month labels positioned at same % intervals

```ts
function toPercent(date: Date, min: Date, totalMs: number): number {
  return ((date.getTime() - min.getTime()) / totalMs) * 100
}
```

---

## Toggle View

State: `'internship' | 'research'` (default: `'internship'`)

| View | Bar | Markers |
|------|-----|---------|
| ฝึกงาน | start_date → end_date (navy) | consultation date lines (teal) |
| วิจัย | start_date → end_date (navy) | milestone dots (green=done, gray=pending) |

Toggle button in page header, top-right.

---

## Drag Interaction

Three zones per bar (pointer events on bar div):

| Zone | Width | Action |
|------|-------|--------|
| Left edge | 12px | resize start_date |
| Right edge | 12px | resize end_date |
| Middle | remainder | move both dates |

**Flow:**
1. `pointerdown` → capture pointer, record origin X + original dates
2. `pointermove` → `dx` in px → `dx / totalWidth * totalDays` → new dates (preview, no server call)
3. `pointerup` → call `updateStudentDates(id, newStart, newEnd)` → `revalidatePath('/gantt')`

Minimum bar width: 1 day. Clamp dates within timeline range.

---

## Side Panel

Opens on click anywhere on a student row (not drag). Slides in from right, fixed overlay.

**Editable fields:**

| Field | DB column | Input |
|-------|-----------|-------|
| ชื่อ-สกุล | name | text |
| รหัสนิสิต | student_id | text (readonly) |
| ชื่อเล่น | line_id | text |
| บริษัท | company | text |
| สาขา | major | text |
| เบอร์โทร | phone | text |
| Line ID | line_id | text |
| วันเริ่ม | start_date | date |
| วันสิ้นสุด | end_date | date |

**Behavior:**
- Local state while editing (no optimistic update to chart)
- Save button → `updateStudent(id, fields)` → `revalidatePath('/gantt')` → panel closes
- Click outside or ESC → close without saving

---

## Server Actions (`src/app/gantt/actions.ts`)

```ts
export async function updateStudent(id: string, fields: Partial<Student>)
export async function updateStudentDates(id: string, start: string, end: string)
```

Both use service-role client via `createClient()`, revalidate `/gantt`.

---

## Navigation

Add to dashboard header (`src/app/dashboard/page.tsx`):
```tsx
<Link href="/gantt">Gantt</Link>
```

---

## Out of Scope

- Adding new students from Gantt (use dashboard AddStudentForm)
- Export / print view
- Zoom controls (fixed month-level granularity)
- Mobile drag (pointer events cover touch)
