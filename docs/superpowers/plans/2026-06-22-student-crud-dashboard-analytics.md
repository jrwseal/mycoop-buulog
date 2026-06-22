# Student CRUD + Dashboard Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add student CRUD (add/edit/delete from UI) and dashboard analytics (stats strip + needs-attention section) to MyCoop.

**Architecture:** All features use the existing inline-form pattern — no modals, no new pages. Server actions handle mutations; `revalidatePath` refreshes data. Client state for interactive pieces is isolated in dedicated client components (`AddStudentForm`, `StudentHeader`) so server components stay async.

**Tech Stack:** Next.js 16 App Router, Supabase (server client via `@/lib/supabase/server`), Tailwind CSS v4 with `@theme inline` design tokens, TypeScript strict mode.

## Global Constraints

- All colors use design tokens (`text-fg`, `text-fg-2`, `text-fg-3`, `text-fg-label`, `bg-accent`, `border-line`, `border-input`, `bg-surface`, `ring-accent`) or OKLCH literals matching the existing palette.
- Delete confirmation pattern: inline `pendingDelete` state showing "ลบ...? [ใช่] [ยกเลิก]" — no `window.confirm()`.
- Touch targets: `min-h-[44px] min-w-[44px] flex items-center justify-center` on all interactive buttons.
- All form labels use `htmlFor`/`id` pairs.
- No test framework exists — verification steps use `npx tsc --noEmit` + manual browser checks.
- Server actions: `'use server'` directive, import `createClient` from `@/lib/supabase/server`, call `revalidatePath` after mutations.
- After deleting a student, call `redirect('/dashboard')` from `next/navigation`.

---

### Task 1: Dashboard Analytics — Stats Strip + Needs Attention

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Produces: server-rendered stats row and needs-attention section above `DashboardSearch`

- [ ] **Step 1: Add stats computation to dashboard page**

In `src/app/dashboard/page.tsx`, add after the `enriched` array is built:

```tsx
const NEEDS_ATTENTION_DAYS = 30

const totalConsultations = consultStats?.length ?? 0
const totalMilestoneDone = [...milestoneDoneMap.values()].reduce((a, b) => a + b, 0)
const totalMilestoneTotal = [...milestoneTotalMap.values()].reduce((a, b) => a + b, 0)

const today = new Date()
const needsAttention = enriched
  .map((s) => {
    const lastDate = s.last_consultation ? new Date(s.last_consultation) : null
    const daysSince = lastDate
      ? Math.floor((today.getTime() - lastDate.getTime()) / 86_400_000)
      : Infinity
    return { ...s, daysSince }
  })
  .filter((s) => s.daysSince >= NEEDS_ATTENTION_DAYS)
  .sort((a, b) => b.daysSince - a.daysSince)
```

- [ ] **Step 2: Render stats strip in JSX**

Replace the `<div className="flex items-end justify-between mb-6 gap-4">` block with:

```tsx
<div className="flex items-end justify-between mb-6 gap-4">
  <div>
    <h1 className="text-xl font-semibold text-[oklch(18%_0.02_260)]">
      นิสิตสหกิจศึกษา
    </h1>
    <p className="text-sm text-fg-2 mt-0.5">
      {enriched.length} คน
    </p>
  </div>
</div>

{enriched.length > 0 && (
  <div className="grid grid-cols-3 gap-3 mb-6">
    {[
      { label: 'นิสิตทั้งหมด', value: `${enriched.length} คน` },
      { label: 'ปรึกษารวม', value: `${totalConsultations} ครั้ง` },
      { label: 'Milestone สำเร็จ', value: totalMilestoneTotal > 0 ? `${totalMilestoneDone}/${totalMilestoneTotal}` : '-' },
    ].map(({ label, value }) => (
      <div key={label} className="bg-white rounded-xl border border-line px-4 py-3">
        <p className="text-xs text-fg-3 mb-1">{label}</p>
        <p className="text-lg font-semibold text-fg tabular-nums">{value}</p>
      </div>
    ))}
  </div>
)}
```

- [ ] **Step 3: Render needs-attention section**

Add between stats strip and the existing empty-state / `DashboardSearch`:

```tsx
{needsAttention.length > 0 && (
  <div className="mb-6">
    <h2 className="text-sm font-semibold text-[oklch(42%_0.2_25)] mb-2">
      ต้องติดตาม
    </h2>
    <div className="bg-white rounded-xl border border-[oklch(88%_0.04_25)] divide-y divide-line overflow-hidden">
      {needsAttention.map((s) => (
        <Link
          key={s.id}
          href={`/students/${s.id}/consultations`}
          className="flex items-center justify-between px-4 min-h-[44px] hover:bg-[oklch(98%_0.006_85)] transition-colors"
        >
          <span className="text-sm font-medium text-fg">{s.name}</span>
          <span className="text-xs text-[oklch(55%_0.18_25)]">
            {s.daysSince === Infinity
              ? 'ยังไม่เคยปรึกษา'
              : `ปรึกษาล่าสุด ${s.daysSince} วันที่แล้ว`}
          </span>
        </Link>
      ))}
    </div>
  </div>
)}
```

Add `Link` import at top: `import Link from 'next/link'` (already imported if present, skip if so).

- [ ] **Step 4: Type-check**

```powershell
cd "C:\Users\jrw-s\OneDrive\เดสก์ท็อป\MyCoop\mycoop"
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Manual verify**

Run `npm run dev`, open `http://localhost:3000/dashboard`. With seed data:
- Stats strip shows 3 tiles with numbers.
- "ต้องติดตาม" section appears for students with no recent consultation.

- [ ] **Step 6: Commit**

```powershell
git add src/app/dashboard/page.tsx
git commit -m "feat: add dashboard stats strip and needs-attention section"
```

---

### Task 2: createStudent Server Action

**Files:**
- Create: `src/app/dashboard/actions.ts`

**Interfaces:**
- Produces: `createStudent(formData: FormData): Promise<void>` — reads `student_id`, `name`, `major`, `company`, `start_date`, `end_date`, `phone`, `line_id` from FormData; inserts into `students` table; calls `revalidatePath('/dashboard')`.

- [ ] **Step 1: Create the actions file**

Create `src/app/dashboard/actions.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStudent(formData: FormData) {
  const supabase = await createClient()

  await supabase.from('students').insert({
    student_id: formData.get('student_id') as string,
    name: formData.get('name') as string,
    major: (formData.get('major') as string) || null,
    company: (formData.get('company') as string) || null,
    start_date: (formData.get('start_date') as string) || null,
    end_date: (formData.get('end_date') as string) || null,
    phone: (formData.get('phone') as string) || null,
    line_id: (formData.get('line_id') as string) || null,
  })

  revalidatePath('/dashboard')
}
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```powershell
git add src/app/dashboard/actions.ts
git commit -m "feat: add createStudent server action"
```

---

### Task 3: AddStudentForm Client Component

**Files:**
- Create: `src/components/AddStudentForm.tsx`

**Interfaces:**
- Consumes: `createStudent` from `@/app/dashboard/actions`
- Produces: `<AddStudentForm />` — renders "+ เพิ่มนิสิต" button; expands to inline form on click; collapses after submit.

- [ ] **Step 1: Create AddStudentForm component**

Create `src/components/AddStudentForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { createStudent } from '@/app/dashboard/actions'

export function AddStudentForm() {
  const [adding, setAdding] = useState(false)

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors"
      >
        + เพิ่มนิสิต
      </button>
    )
  }

  return (
    <form
      action={async (fd) => {
        await createStudent(fd)
        setAdding(false)
      }}
      className="bg-white rounded-xl border border-line p-5 space-y-4 mb-6"
    >
      <h2 className="text-sm font-semibold text-fg">เพิ่มนิสิตใหม่</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="student-new-student_id" className="block text-xs font-medium text-fg-label mb-1.5">
            รหัสนิสิต <span className="text-[oklch(42%_0.2_25)]">*</span>
          </label>
          <input
            id="student-new-student_id"
            name="student_id"
            type="text"
            required
            placeholder="เช่น 640001234"
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </div>
        <div>
          <label htmlFor="student-new-name" className="block text-xs font-medium text-fg-label mb-1.5">
            ชื่อ-นามสกุล <span className="text-[oklch(42%_0.2_25)]">*</span>
          </label>
          <input
            id="student-new-name"
            name="name"
            type="text"
            required
            placeholder="ชื่อ นามสกุล"
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="student-new-major" className="block text-xs font-medium text-fg-label mb-1.5">
            สาขา
          </label>
          <input
            id="student-new-major"
            name="major"
            type="text"
            placeholder="เช่น วิศวกรรมคอมพิวเตอร์"
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </div>
        <div>
          <label htmlFor="student-new-company" className="block text-xs font-medium text-fg-label mb-1.5">
            บริษัท
          </label>
          <input
            id="student-new-company"
            name="company"
            type="text"
            placeholder="ชื่อบริษัท / หน่วยงาน"
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="student-new-start_date" className="block text-xs font-medium text-fg-label mb-1.5">
            วันเริ่ม
          </label>
          <input
            id="student-new-start_date"
            name="start_date"
            type="date"
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </div>
        <div>
          <label htmlFor="student-new-end_date" className="block text-xs font-medium text-fg-label mb-1.5">
            วันสิ้นสุด
          </label>
          <input
            id="student-new-end_date"
            name="end_date"
            type="date"
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="student-new-phone" className="block text-xs font-medium text-fg-label mb-1.5">
            เบอร์โทร
          </label>
          <input
            id="student-new-phone"
            name="phone"
            type="text"
            placeholder="0812345678"
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </div>
        <div>
          <label htmlFor="student-new-line_id" className="block text-xs font-medium text-fg-label mb-1.5">
            LINE ID
          </label>
          <input
            id="student-new-line_id"
            name="line_id"
            type="text"
            placeholder="@lineid"
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setAdding(false)}
          className="px-4 py-2 text-sm text-[oklch(45%_0.01_260)] hover:text-[oklch(25%_0.02_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded transition-colors"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors"
        >
          บันทึก
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```powershell
git add src/components/AddStudentForm.tsx
git commit -m "feat: add AddStudentForm client component"
```

---

### Task 4: Wire AddStudentForm into Dashboard

**Files:**
- Modify: `src/app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `AddStudentForm` from `@/components/AddStudentForm`

- [ ] **Step 1: Import AddStudentForm and update heading block**

In `src/app/dashboard/page.tsx`, add import:

```tsx
import { AddStudentForm } from '@/components/AddStudentForm'
```

Replace the heading div:

```tsx
<div className="flex items-end justify-between mb-6 gap-4">
  <div>
    <h1 className="text-xl font-semibold text-[oklch(18%_0.02_260)]">
      นิสิตสหกิจศึกษา
    </h1>
    <p className="text-sm text-fg-2 mt-0.5">
      {enriched.length} คน
    </p>
  </div>
  <AddStudentForm />
</div>
```

Move the `AddStudentForm` form render (it renders itself inline when open) — the button sits in the heading row; when `adding` is true it renders the form card above the stats strip. To achieve this, render `<AddStudentForm />` **twice** would be wrong. Instead, restructure so `AddStudentForm` is rendered once, above the stats strip, and the button is part of the heading:

Actually the cleanest approach: `AddStudentForm` renders the button when collapsed and the full form when expanded. Place `<AddStudentForm />` between the heading block and the stats strip:

```tsx
<div className="flex items-end justify-between mb-4 gap-4">
  <div>
    <h1 className="text-xl font-semibold text-[oklch(18%_0.02_260)]">
      นิสิตสหกิจศึกษา
    </h1>
    <p className="text-sm text-fg-2 mt-0.5">
      {enriched.length} คน
    </p>
  </div>
  {/* button rendered by AddStudentForm when collapsed */}
</div>
<AddStudentForm />
```

Wait — that doesn't work cleanly because the button should sit in the header row. The cleanest solution: `AddStudentForm` renders a wrapper div. When collapsed it renders only the button (positioned via the parent flex). When expanded it renders the full form card.

Simplest approach that matches existing pattern: put `<AddStudentForm />` inside the heading flex div as the right-side element, and when `adding=true` the component renders a full-width form that breaks out below. Use a fragment + absolute positioning? No — use a simpler approach:

`AddStudentForm` renders: a button (always), and conditionally a form card below. Wrap both in a `<div>` that is positioned in the layout. Place the component in the heading row right side:

```tsx
<div className="flex items-start justify-between mb-6 gap-4">
  <div>
    <h1 className="text-xl font-semibold text-[oklch(18%_0.02_260)]">
      นิสิตสหกิจศึกษา
    </h1>
    <p className="text-sm text-fg-2 mt-0.5">
      {enriched.length} คน
    </p>
  </div>
  <AddStudentForm />
</div>
```

And `AddStudentForm` renders:
- When collapsed: just the `<button>` (no wrapper div needed, can be fragment)  
- When expanded: the `<form>` card only (button disappears)

This is the cleanest — when `adding=false` show button, when `adding=true` show form. The form expands in the document flow wherever the component is rendered.

I'll make the form full-width by rendering it outside the flex container. The best approach: render the button inside the heading div, render the form below the heading div. This means `AddStudentForm` needs to render differently based on state, but the two elements are in different positions in the DOM.

Actually the SIMPLEST approach matching existing patterns (how ConsultationsTab does it): put `<AddStudentForm />` as a separate block, not inside the heading row. The heading row always shows, and `AddStudentForm` renders the button+form below it.

Wait, let me look at how ConsultationsTab does it — the button is in the section heading row, and the form appears inline below. The button IS inside the flex row. When `adding=true`, the button disappears and the form appears.

For our case: the "+ เพิ่มนิสิต" button should appear in the heading row (beside "นิสิตสหกิจศึกษา"). When clicked, the form appears below the heading (above stats).

The cleanest implementation: `AddStudentForm` renders a fragment with the button (always in the right position in the heading row) and the form below. But since it's rendered as a single component inside the heading flex div, the form won't naturally break out below.

**Simpler:** just accept that both button and form sit in the flex row. When `adding=false`: just the button. When `adding=true`: the form (full width, perhaps `w-full` causing the flex to wrap). That's a bit hacky.

**Even simpler:** Don't put `AddStudentForm` inside the flex div. Instead:

```tsx
<div className="flex items-end justify-between mb-4 gap-4">
  <div>
    <h1>...</h1>
    <p>...</p>
  </div>
  {!adding && <button onClick={...}>+ เพิ่มนิสิต</button>}  {/* controlled from outside */}
</div>
{adding && <form>...</form>}
```

But then the state needs to be in `page.tsx` (server component) — can't.

**Best solution:** Extract a `DashboardHeader` client component that handles both the heading and the add form together. This keeps state in one place.

OR: even simpler — just render `AddStudentForm` right after the heading div (not inside it), and `AddStudentForm` renders:
- When collapsed: a button aligned to the right (use `flex justify-end mb-4`)  
- When expanded: the full form

This means the "+ เพิ่มนิสิต" button won't be visually inline with the heading, but it'll be close. This is actually fine and clean.

Actually even better — keep the component simple. `AddStudentForm`:
- always renders a div
- when `!adding`: `<div className="flex justify-end mb-4"><button>+ เพิ่มนิสิต</button></div>`
- when `adding`: `<div className="mb-6"><form>...</form></div>`

And in page.tsx we remove the heading's right side and just put `<AddStudentForm />` after the heading block.

This is clean, simple, and works. Let me update the spec accordingly.

Actually, rethinking: the original plan said "the button sits beside the heading". Looking at the current dashboard, the heading div has `flex items-end justify-between`. The existing code has the heading on the left and nothing on the right. We can just put the `<AddStudentForm />` component's button content in the right side.

OK here's the cleanest way to do this in the plan:

The `AddStudentForm` component renders:
- When collapsed: a `<>` fragment with just `<button>+ เพิ่มนิสิต</button>`
- When expanded: the full `<form>` card

In `page.tsx`, the heading div becomes:
```tsx
<div className="flex items-start justify-between mb-4 gap-4">
  <div>
    <h1>...</h1>
    <p>...</p>
  </div>
  {/* AddStudentForm renders button here when collapsed, form below when expanded */}
</div>
```

But if AddStudentForm renders the form too (outside the flex div), it can't be done from inside the flex div.

I think the cleanest approach for the plan is:
1. `AddStudentForm` renders just the button when collapsed, and the full form (full-width card) when expanded
2. In page.tsx, render `AddStudentForm` after the heading block (not inside it)
3. The button inside AddStudentForm uses `flex justify-end` to align right

Let me just write this clearly in the plan. Here's what I'll do:

`AddStudentForm` (revised):
- `adding=false`: renders `<div className="flex justify-end mb-2"><button>...</button></div>`  
- `adding=true`: renders `<form className="bg-white rounded-xl border border-line p-5 space-y-4 mb-6">...</form>`

`page.tsx` renders:
```tsx
<div className="flex items-end justify-between mb-4 gap-4">
  <div>
    <h1>นิสิตสหกิจศึกษา</h1>
    <p>{enriched.length} คน</p>
  </div>
</div>
<AddStudentForm />
{/* stats strip */}
{/* needs attention */}
{/* student grid or empty state */}
```

This is clean and simple.

Let me just write the plan with this approach. I'll update Task 3 and Task 4 accordingly.

Actually, I've been overthinking this. Let me just write the plan with a simple, clear approach:

- The heading row has the button on the right (using flex justify-between)
- The AddStudentForm renders a fragment: when `adding=false` just the button, when `adding=true` just the form
- In `page.tsx`, the heading div has the form on the right, and `<AddStudentForm />` is rendered inside `{!adding && ...}` — but we can't control `adding` from server component

OK final answer for the plan: **Render `<AddStudentForm />` after the heading block, not inside the flex div.** The `AddStudentForm` component handles its own alignment internally.

Let me just write the plan document now with this approach clearly described. I'll update Task 3 to reflect this.

Actually, I already wrote the component code in Task 3 and it already handles this correctly — when `adding=false` it renders the button, when `adding=true` it renders the form. The issue is where to put it in `page.tsx`.

For Task 4, I'll show:
1. Remove the now-unused heading section right side (it's currently empty anyway)
2. Add `<AddStudentForm />` right after the heading block (before stats strip)
3. This makes the button appear below/after the heading when collapsed, or shows the form when expanded

Wait, looking at the current `page.tsx`, the heading div (`flex items-end justify-between mb-6 gap-4`) currently has nothing on the right side. So I can put `AddStudentForm` inside the right side of the flex! When collapsed it renders a button (which fits in the flex). When expanded... it renders a form that would be squished inside the flex.

You know what, let me just separate concerns completely:

Option A (I'll go with this): Put `AddStudentForm` in the heading flex row. `AddStudentForm` renders button when collapsed. When expanded, it renders in a `fixed` or `absolute` positioned overlay? No, that's too complex.

Option B (simplest): The button is OUTSIDE the component. The dashboard page has the button in the heading row (via a `DashboardHeader` client component that wraps everything). But this is too much.

Option C (what I'll actually do): Accept that the button won't be in the same line as the heading. Instead:
- Heading row (server rendered): shows title + count
- Below heading: `<AddStudentForm />` which shows button (right-aligned) when collapsed, form when expanded
- This is exactly how `ConsultationsTab` does it but at the page level

This is fine. The UX is still clear. Let me go with Option C and just write the plan.

Now let me just write the whole plan document properly. I'll keep Task 3 as written (component code is good) but revise where it's placed in page.tsx.
</thinking>

- [ ] **Step 1: Import AddStudentForm and wire into dashboard page**

In `src/app/dashboard/page.tsx`, add import:

```tsx
import { AddStudentForm } from '@/components/AddStudentForm'
```

Replace the existing heading block with:

```tsx
<div className="flex items-end justify-between mb-4 gap-4">
  <div>
    <h1 className="text-xl font-semibold text-[oklch(18%_0.02_260)]">
      นิสิตสหกิจศึกษา
    </h1>
    <p className="text-sm text-fg-2 mt-0.5">
      {enriched.length} คน
    </p>
  </div>
</div>
<AddStudentForm />
```

The `<AddStudentForm />` renders a right-aligned button when collapsed, or the full form card when expanded. Place it between the heading block and the stats strip (stats strip renders after it via the `enriched.length > 0` check which is already there).

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Manual verify**

Open `http://localhost:3000/dashboard`. "+ เพิ่มนิสิต" button is visible. Clicking it expands the form. Filling required fields and submitting adds a new student card (page revalidates). Clicking "ยกเลิก" collapses the form.

- [ ] **Step 4: Commit**

```powershell
git add src/app/dashboard/page.tsx
git commit -m "feat: wire AddStudentForm into dashboard page"
```

---

### Task 5: Student Edit + Delete Server Actions

**Files:**
- Create: `src/app/students/[id]/actions.ts`

**Interfaces:**
- Produces:
  - `updateStudent(formData: FormData): Promise<void>` — reads `student_id_field`, `name`, `major`, `company`, `start_date`, `end_date`, `phone`, `line_id`, `id` from FormData; updates students row; revalidates `/students/[id]` and `/dashboard`.
  - `deleteStudent(formData: FormData): Promise<void>` — reads `id` from FormData; deletes students row (cascade handles related rows); redirects to `/dashboard`.

- [ ] **Step 1: Create the actions file**

Create `src/app/students/[id]/actions.ts`:

```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateStudent(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()

  await supabase.from('students').update({
    student_id: formData.get('student_id_field') as string,
    name: formData.get('name') as string,
    major: (formData.get('major') as string) || null,
    company: (formData.get('company') as string) || null,
    start_date: (formData.get('start_date') as string) || null,
    end_date: (formData.get('end_date') as string) || null,
    phone: (formData.get('phone') as string) || null,
    line_id: (formData.get('line_id') as string) || null,
  }).eq('id', id)

  revalidatePath(`/students/${id}`)
  revalidatePath('/dashboard')
}

export async function deleteStudent(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()

  await supabase.from('students').delete().eq('id', id)

  redirect('/dashboard')
}
```

Note: FormData field is named `student_id_field` (not `student_id`) to avoid collision with the hidden `id` field holding the UUID.

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```powershell
git add "src/app/students/[id]/actions.ts"
git commit -m "feat: add updateStudent and deleteStudent server actions"
```

---

### Task 6: StudentHeader Client Component

**Files:**
- Create: `src/components/StudentHeader.tsx`

**Interfaces:**
- Consumes: `updateStudent`, `deleteStudent` from `@/app/students/[id]/actions`; `Student` type from `@/lib/types`
- Produces: `<StudentHeader student={Student} />` — renders student info block with edit/delete controls; owns `editing` and `pendingDelete` state.

- [ ] **Step 1: Create StudentHeader component**

Create `src/components/StudentHeader.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { updateStudent, deleteStudent } from '@/app/students/[id]/actions'
import type { Student } from '@/lib/types'

export function StudentHeader({ student }: { student: Student }) {
  const [editing, setEditing] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)

  if (editing) {
    return (
      <form
        action={async (fd) => {
          await updateStudent(fd)
          setEditing(false)
        }}
        className="mb-6 bg-white rounded-xl border border-line p-5 space-y-4"
      >
        <input type="hidden" name="id" value={student.id} />
        <h2 className="text-sm font-semibold text-fg">แก้ไขข้อมูลนิสิต</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="student-edit-student_id" className="block text-xs font-medium text-fg-label mb-1.5">
              รหัสนิสิต <span className="text-[oklch(42%_0.2_25)]">*</span>
            </label>
            <input
              id="student-edit-student_id"
              name="student_id_field"
              type="text"
              required
              defaultValue={student.student_id}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label htmlFor="student-edit-name" className="block text-xs font-medium text-fg-label mb-1.5">
              ชื่อ-นามสกุล <span className="text-[oklch(42%_0.2_25)]">*</span>
            </label>
            <input
              id="student-edit-name"
              name="name"
              type="text"
              required
              defaultValue={student.name}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="student-edit-major" className="block text-xs font-medium text-fg-label mb-1.5">สาขา</label>
            <input
              id="student-edit-major"
              name="major"
              type="text"
              defaultValue={student.major ?? ''}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label htmlFor="student-edit-company" className="block text-xs font-medium text-fg-label mb-1.5">บริษัท</label>
            <input
              id="student-edit-company"
              name="company"
              type="text"
              defaultValue={student.company ?? ''}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="student-edit-start_date" className="block text-xs font-medium text-fg-label mb-1.5">วันเริ่ม</label>
            <input
              id="student-edit-start_date"
              name="start_date"
              type="date"
              defaultValue={student.start_date ?? ''}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label htmlFor="student-edit-end_date" className="block text-xs font-medium text-fg-label mb-1.5">วันสิ้นสุด</label>
            <input
              id="student-edit-end_date"
              name="end_date"
              type="date"
              defaultValue={student.end_date ?? ''}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="student-edit-phone" className="block text-xs font-medium text-fg-label mb-1.5">เบอร์โทร</label>
            <input
              id="student-edit-phone"
              name="phone"
              type="text"
              defaultValue={student.phone ?? ''}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label htmlFor="student-edit-line_id" className="block text-xs font-medium text-fg-label mb-1.5">LINE ID</label>
            <input
              id="student-edit-line_id"
              name="line_id"
              type="text"
              defaultValue={student.line_id ?? ''}
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="px-4 py-2 text-sm text-[oklch(45%_0.01_260)] hover:text-[oklch(25%_0.02_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors"
          >
            บันทึก
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-[oklch(52%_0.01_260)] mb-0.5">
            {student.student_id}
          </p>
          <h1 className="text-2xl font-semibold text-[oklch(16%_0.02_260)] leading-tight">
            {student.name}
          </h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-sm text-fg-3 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors"
          >
            แก้ไข
          </button>
          <form action={deleteStudent}>
            <input type="hidden" name="id" value={student.id} />
            {pendingDelete ? (
              <span className="flex items-center gap-1.5 min-h-[44px]">
                <span className="text-xs text-[oklch(45%_0.18_25)]">ลบนิสิตนี้?</span>
                <button
                  type="submit"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-medium text-[oklch(42%_0.2_25)] hover:text-[oklch(32%_0.2_25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(55%_0.18_25)] rounded transition-colors"
                >
                  ยืนยัน
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-fg-3 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors"
                >
                  ยกเลิก
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setPendingDelete(true)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-sm text-fg-3 hover:text-[oklch(42%_0.2_25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(55%_0.18_25)] rounded transition-colors"
              >
                ลบ
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-sm text-fg-label">
        {student.company && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-line">
            <span className="text-[oklch(52%_0.01_260)]">🏢</span>
            {student.company}
          </span>
        )}
        {student.major && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[oklch(94%_0.015_260)] border border-[oklch(85%_0.02_260)] text-[oklch(35%_0.1_260)]">
            {student.major}
          </span>
        )}
        {student.phone && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-line">
            📞 {student.phone}
          </span>
        )}
        {student.line_id && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-line">
            💬 {student.line_id}
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```powershell
git add src/components/StudentHeader.tsx
git commit -m "feat: add StudentHeader client component with edit and delete"
```

---

### Task 7: Wire StudentHeader into Student Layout

**Files:**
- Modify: `src/app/students/[id]/layout.tsx`

**Interfaces:**
- Consumes: `StudentHeader` from `@/components/StudentHeader`

- [ ] **Step 1: Replace inline student info block with StudentHeader**

In `src/app/students/[id]/layout.tsx`, add import:

```tsx
import { StudentHeader } from '@/components/StudentHeader'
```

Replace the `<div className="mb-6">` block (lines containing the student info: student_id mono text, h1 name, flex-wrap badges) with:

```tsx
<StudentHeader student={student} />
```

The full updated `layout.tsx` return block becomes:

```tsx
return (
  <div className="min-h-screen bg-surface">
    <header className="sticky top-0 z-10 bg-surface border-b border-line">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-[oklch(48%_0.06_260)] hover:text-[oklch(38%_0.1_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors"
        >
          ← Dashboard
        </Link>
        <span className="text-[oklch(75%_0.01_260)]">/</span>
        <span className="text-sm font-medium text-[oklch(25%_0.02_260)] truncate">
          {student.name}
        </span>
      </div>
    </header>

    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-4">
      <StudentHeader student={student} />
      <StudentTabNav studentId={id} />
    </div>

    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
      {children}
    </div>
  </div>
)
```

- [ ] **Step 2: Type-check**

```powershell
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 3: Manual verify**

Open any student detail page (`http://localhost:3000/students/[id]`).
- "แก้ไข" button visible — click opens inline edit form pre-filled with current data. Submit updates the student info. "ยกเลิก" closes without changes.
- "ลบ" button visible — click shows "ลบนิสิตนี้? [ยืนยัน] [ยกเลิก]" inline. Confirming deletes the student and redirects to dashboard. The student card is gone from the dashboard.

- [ ] **Step 4: Commit**

```powershell
git add "src/app/students/[id]/layout.tsx"
git commit -m "feat: replace student info block with StudentHeader, wire edit/delete"
```

---

### Task 8: Push and Deploy

- [ ] **Step 1: Push to GitHub**

```powershell
git push
```

- [ ] **Step 2: Deploy to Vercel production**

```powershell
cd "C:\Users\jrw-s\OneDrive\เดสก์ท็อป\MyCoop\mycoop"
vercel --prod
```

Expected: build succeeds, aliased to `https://mycoop.vercel.app`.

- [ ] **Step 3: Smoke test on production**

Open `https://mycoop.vercel.app`:
1. Dashboard shows stats strip and (if applicable) needs-attention section.
2. "+ เพิ่มนิสิต" adds a new student — appears in dashboard card grid.
3. Student detail page shows "แก้ไข" / "ลบ" buttons that work correctly.

---

## Self-Review Checklist

- [x] Stats strip: covered in Task 1
- [x] Needs-attention section (30-day threshold): covered in Task 1
- [x] `createStudent` action: covered in Task 2
- [x] `AddStudentForm` component: covered in Task 3
- [x] Dashboard wiring: covered in Task 4
- [x] `updateStudent` / `deleteStudent` actions: covered in Task 5
- [x] `StudentHeader` component with editing + pendingDelete: covered in Task 6
- [x] Layout wiring: covered in Task 7
- [x] Cascade delete: schema already has `ON DELETE CASCADE` on all FK refs — no migration needed
- [x] FormData field `student_id_field` (not `student_id`) to avoid UUID/text collision: consistent across Tasks 5 and 6
- [x] No placeholders, no TBDs
- [x] Type signatures consistent: `updateStudent(formData: FormData)` in Task 5 matches import in Task 6; `deleteStudent(formData: FormData)` same
