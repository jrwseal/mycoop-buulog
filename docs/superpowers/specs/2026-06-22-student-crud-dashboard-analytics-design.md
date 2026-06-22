# Student CRUD + Dashboard Analytics — Design Spec
Date: 2026-06-22

## Overview

Add two feature areas to MyCoop:

1. **Student CRUD** — professors can add, edit, and delete students directly from the UI without touching the database or seed script.
2. **Dashboard Analytics** — stats strip and "needs attention" section surface actionable data on the dashboard.

Both follow the existing inline-form pattern (no new pages, no modals, no drawers).

---

## Feature 1: Dashboard Analytics

### Stats Strip

Rendered directly below the "นิสิตสหกิจศึกษา" heading, above the student grid. Three stat tiles in a row:

| Tile | Value | Source |
|---|---|---|
| นิสิตทั้งหมด | count of students | `students` table |
| ปรึกษารวม | total consultation records | `consultations` table |
| Milestone สำเร็จ | done / total | `milestones` table |

Computed server-side in `dashboard/page.tsx` from existing queries (milestoneStats, consultStats already fetched). No extra DB calls needed.

### Needs Attention Section

Shown between the stats strip and the student card grid, but **only when at least one student qualifies** (≥30 days since last consultation, or never consulted).

- Title: "ต้องติดตาม"
- Each row: student name + "ปรึกษาล่าสุด X วันที่แล้ว" or "ยังไม่เคยปรึกษา" — entire row is a link to `/students/[id]/consultations`
- Sorted: longest gap first
- Threshold: 30 days (hardcoded constant, easy to change later)

Computed server-side in `dashboard/page.tsx` from `enriched` array. No extra DB calls.

---

## Feature 2: Student CRUD

### Add Student

**Entry point:** "+ เพิ่มนิสิต" button in the dashboard header (beside "นิสิตสหกิจศึกษา" heading).

**Behavior:** Clicking sets `adding` state → inline form appears between header and stats strip, same visual style as `ConsultationsTab` add form (white card, border-line, p-5, space-y-4). State lives in a new `AddStudentForm` client component embedded in `page.tsx` (which stays a server component).

**Fields (2-column grid where logical):**

| Field | Name attr | Type | Required |
|---|---|---|---|
| รหัสนิสิต | student_id | text | yes |
| ชื่อ-นามสกุล | name | text | yes |
| สาขา | major | text | no |
| บริษัท | company | text | no |
| วันเริ่ม | start_date | date | no |
| วันสิ้นสุด | end_date | date | no |
| เบอร์โทร | phone | text | no |
| LINE ID | line_id | text | no |

All labels have matching `id`/`htmlFor` pairs (prefix: `student-new-`).

**Action:** `src/app/dashboard/actions.ts` → `createStudent` server action inserts into `students` table with `revalidatePath('/dashboard')`.

**After submit:** form collapses, dashboard revalidates, new student card appears.

### Edit Student

**Entry point:** "แก้ไขข้อมูล" button on `StudentLayout` header (beside student name).

**Behavior:** `editing` state on layout → replaces the info block (name, company, major, phone, line_id badges) with an inline edit form. Same fields as add form, pre-filled with current values (prefix: `student-edit-`).

**Action:** `src/app/students/[id]/actions.ts` → `updateStudent` server action updates row, `revalidatePath('/students/[id]')` and `revalidatePath('/dashboard')`.

**After submit:** form collapses, updated info renders.

### Delete Student

**Entry point:** "ลบนิสิต" button on `StudentLayout` header.

**Behavior:** `pendingDelete` state → inline confirm replaces button:
> "ลบนิสิตนี้? ข้อมูลทั้งหมดจะถูกลบ" · [ยืนยัน] [ยกเลิก]

**Action:** `deleteStudent` server action in `src/app/students/[id]/actions.ts`. Deletes student row — all related rows (consultations, meeting_notes, milestones, progress_notes, file_uploads) cascade-deleted via FK `ON DELETE CASCADE` already defined in `supabase/schema.sql`. After delete: `redirect('/dashboard')`.

**Confirm button:** `min-h-[44px]`, red text (`oklch(42% 0.2 25)`), consistent with existing delete pattern.

---

## Files Affected

| File | Change |
|---|---|
| `src/app/dashboard/page.tsx` | Add stats computation, needs-attention filter, render `AddStudentForm` |
| `src/components/AddStudentForm.tsx` | New client component — `adding` state + inline add form |
| `src/app/dashboard/actions.ts` | New file — `createStudent` server action |
| `src/app/students/[id]/layout.tsx` | Add `editing` + `pendingDelete` state, edit form, delete confirm |
| `src/app/students/[id]/actions.ts` | New file — `updateStudent`, `deleteStudent` server actions |

`layout.tsx` currently a server component — needs `'use client'` for state, OR extract a `StudentHeader` client component that wraps only the interactive parts (preferred: keeps layout server-rendered, isolates client boundary).

---

## Architecture Notes

- **`StudentHeader` client component** — extracted from layout, owns `editing`/`pendingDelete` state. Layout stays async server component, passes `student` data as prop to `StudentHeader`.
- **Cascade deletes** — verify `ON DELETE CASCADE` exists on all FK references to `students.id` in schema before shipping. If missing, add migration.
- **No optimistic UI** — server actions + `revalidatePath` is sufficient; add-student flow is infrequent.

---

## Out of Scope

- Student photo/avatar upload
- Multi-professor / multi-tenant support
- Bulk import (CSV)
- Soft delete / archive
