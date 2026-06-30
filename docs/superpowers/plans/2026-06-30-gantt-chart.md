# Gantt Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/gantt` page showing all students' internship timelines as a draggable Gantt chart with a slide-in side panel for editing student data.

**Architecture:** CSS div-based Gantt using date-to-percentage math; bars positioned with `left`/`width` as `%` of timeline range. GanttChart is a single client component managing toggle, local student state, and drag state via refs. GanttSidePanel is a separate client component for the edit form.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase, Tailwind CSS v4, TypeScript

## Global Constraints

- Use `createClient()` from `@/lib/supabase/server` for all server-side Supabase calls
- All CSS uses existing design tokens: `bg-accent`, `border-line`, `text-fg`, `text-fg-2`, `text-fg-3`, `text-fg-label`, `text-fg-3`, `bg-surface`, `border-input`
- No new npm dependencies
- `revalidatePath` must revalidate both `/gantt` and `/dashboard` after any student update
- Server actions must have `'use server'` directive
- Client components must have `'use client'` directive

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/lib/gantt-utils.ts` | Create | Pure date math: range, percent, px→days, month labels |
| `src/app/gantt/page.tsx` | Create | Server component: fetch students/milestones/consultations, render GanttChart |
| `src/app/gantt/actions.ts` | Create | `updateStudentDates`, `updateStudentFromGantt` server actions |
| `src/components/GanttChart.tsx` | Create | Client: toggle, month header, rows, bars, drag, side panel trigger |
| `src/components/GanttSidePanel.tsx` | Create | Client: slide-in panel, edit form |
| `src/app/dashboard/page.tsx` | Modify | Add "Gantt" nav link in header |

---

## Task 1: Date Math Utilities

**Files:**
- Create: `src/lib/gantt-utils.ts`

**Interfaces:**
- Produces:
  - `TimelineRange { min: Date; max: Date; totalMs: number }`
  - `computeTimelineRange(students: Student[]): TimelineRange`
  - `toPercent(date: Date, range: TimelineRange): number`
  - `pxToDays(px: number, totalPx: number, totalMs: number): number`
  - `getMonthLabels(range: TimelineRange): { label: string; left: number }[]`
  - `addDays(date: Date, days: number): Date`

- [ ] **Step 1: Create `src/lib/gantt-utils.ts`**

```typescript
import type { Student } from './types'

export interface TimelineRange {
  min: Date
  max: Date
  totalMs: number
}

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

export function computeTimelineRange(students: Student[]): TimelineRange {
  const timestamps: number[] = []
  for (const s of students) {
    if (s.start_date) timestamps.push(new Date(s.start_date).getTime())
    if (s.end_date) timestamps.push(new Date(s.end_date).getTime())
  }

  if (timestamps.length === 0) {
    const now = new Date()
    const min = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const max = new Date(now.getFullYear(), now.getMonth() + 7, 1)
    return { min, max, totalMs: max.getTime() - min.getTime() }
  }

  const minDate = new Date(Math.min(...timestamps))
  const maxDate = new Date(Math.max(...timestamps))
  // 1-month padding, snap to 1st of month
  const min = new Date(minDate.getFullYear(), minDate.getMonth() - 1, 1)
  const max = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 1)

  return { min, max, totalMs: max.getTime() - min.getTime() }
}

export function toPercent(date: Date, range: TimelineRange): number {
  return ((date.getTime() - range.min.getTime()) / range.totalMs) * 100
}

export function pxToDays(px: number, totalPx: number, totalMs: number): number {
  return (px / totalPx) * (totalMs / 86_400_000)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000)
}

export function getMonthLabels(range: TimelineRange): { label: string; left: number }[] {
  const labels: { label: string; left: number }[] = []
  const cursor = new Date(range.min.getFullYear(), range.min.getMonth(), 1)
  while (cursor.getTime() <= range.max.getTime()) {
    labels.push({
      label: `${THAI_MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`,
      left: toPercent(cursor, range),
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return labels
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd mycoop && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/gantt-utils.ts
git commit -m "feat: gantt date math utilities"
```

---

## Task 2: Server Page + Actions

**Files:**
- Create: `src/app/gantt/page.tsx`
- Create: `src/app/gantt/actions.ts`

**Interfaces:**
- Consumes: `createClient` from `@/lib/supabase/server`, `Student` from `@/lib/types`, `GanttChart` from `@/components/GanttChart`, `signOut` from `@/app/login/actions`
- Produces:
  - `updateStudentDates(id: string, startDate: string, endDate: string): Promise<void>`
  - `updateStudentFromGantt(formData: FormData): Promise<void>`

- [ ] **Step 1: Create `src/app/gantt/actions.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateStudentDates(id: string, startDate: string, endDate: string) {
  const supabase = await createClient()
  await supabase.from('students').update({
    start_date: startDate,
    end_date: endDate,
  }).eq('id', id)
  revalidatePath('/gantt')
  revalidatePath('/dashboard')
}

export async function updateStudentFromGantt(formData: FormData) {
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
  revalidatePath('/gantt')
  revalidatePath('/dashboard')
}
```

- [ ] **Step 2: Create `src/app/gantt/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { GanttChart } from '@/components/GanttChart'
import Link from 'next/link'
import { signOut } from '@/app/login/actions'

export default async function GanttPage() {
  const supabase = await createClient()

  const [{ data: students }, { data: milestones }, { data: consultations }] =
    await Promise.all([
      supabase.from('students').select('*').order('start_date', { ascending: true, nullsFirst: false }),
      supabase.from('milestones').select('student_id, title, due_date, completed_at'),
      supabase.from('consultations').select('student_id, date'),
    ])

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <span className="text-base font-bold text-white tracking-tight">MyCoop</span>
            <Link
              href="/dashboard"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-accent rounded transition-colors"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-xl font-semibold text-[oklch(18%_0.02_260)] mb-5">
          Gantt Chart
        </h1>
        <GanttChart
          students={students ?? []}
          milestones={milestones ?? []}
          consultations={consultations ?? []}
        />
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (GanttChart doesn't exist yet — expect only "Cannot find module" for `@/components/GanttChart`, which is fine at this stage)

- [ ] **Step 4: Commit**

```bash
git add src/app/gantt/page.tsx src/app/gantt/actions.ts
git commit -m "feat: gantt server page and actions"
```

---

## Task 3: GanttChart Static Layout

Static render: month header + student rows + bars + toggle. No drag, no panel yet.

**Files:**
- Create: `src/components/GanttChart.tsx`

**Interfaces:**
- Consumes:
  - `Student` from `@/lib/types`
  - `computeTimelineRange`, `toPercent`, `getMonthLabels` from `@/lib/gantt-utils`
- Produces: `GanttChart({ students, milestones, consultations })` — used by `src/app/gantt/page.tsx`

- [ ] **Step 1: Create `src/components/GanttChart.tsx` (static layout)**

```typescript
'use client'

import { useState } from 'react'
import type { Student } from '@/lib/types'
import { computeTimelineRange, toPercent, getMonthLabels } from '@/lib/gantt-utils'

type View = 'internship' | 'research'

interface Milestone {
  student_id: string
  title: string
  due_date: string | null
  completed_at: string | null
}

interface Consultation {
  student_id: string
  date: string
}

interface Props {
  students: Student[]
  milestones: Milestone[]
  consultations: Consultation[]
}

export function GanttChart({ students, milestones, consultations }: Props) {
  const [view, setView] = useState<View>('internship')
  const [localStudents] = useState<Student[]>(students)

  const range = computeTimelineRange(localStudents)
  const monthLabels = getMonthLabels(range)

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-1 mb-5 bg-white border border-line rounded-lg p-1 w-fit">
        {(['internship', 'research'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              view === v
                ? 'bg-accent text-white font-medium'
                : 'text-fg-2 hover:text-fg'
            }`}
          >
            {v === 'internship' ? 'ฝึกงาน' : 'วิจัย'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-line overflow-hidden">
        {/* Month header */}
        <div className="flex border-b border-line">
          <div className="shrink-0 w-44 px-4 py-2 text-xs font-medium text-fg-3 border-r border-line">
            นิสิต
          </div>
          <div className="flex-1 relative h-8">
            {monthLabels.map(({ label, left }) => (
              <div
                key={label}
                className="absolute top-2 text-xs text-fg-3 whitespace-nowrap pointer-events-none"
                style={{ left: `${left}%` }}
              >
                {label}
              </div>
            ))}
            {monthLabels.map(({ label, left }) => (
              <div
                key={`grid-${label}`}
                className="absolute top-0 bottom-0 w-px bg-line pointer-events-none"
                style={{ left: `${left}%` }}
              />
            ))}
          </div>
        </div>

        {/* Rows */}
        {localStudents.map(student => {
          const hasBar = !!(student.start_date && student.end_date)
          const barLeft = hasBar ? toPercent(new Date(student.start_date!), range) : 0
          const barRight = hasBar ? toPercent(new Date(student.end_date!), range) : 0
          const barWidth = Math.max(0, barRight - barLeft)

          const studentMilestones = milestones.filter(m => m.student_id === student.id)
          const studentConsultations = consultations.filter(c => c.student_id === student.id)

          return (
            <div
              key={student.id}
              className="flex border-b border-line last:border-0 hover:bg-[oklch(98%_0.005_260)]"
            >
              {/* Label column */}
              <div className="shrink-0 w-44 px-4 py-3 border-r border-line">
                <p className="text-sm font-medium text-fg truncate">{student.name}</p>
                {student.company && (
                  <p className="text-xs text-fg-3 truncate">{student.company}</p>
                )}
              </div>

              {/* Timeline area */}
              <div className="flex-1 relative h-12">
                {hasBar && (
                  <>
                    {/* Bar */}
                    <div
                      className="absolute top-3 h-6 bg-accent rounded-full"
                      style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                    />

                    {/* Internship markers: consultation dates */}
                    {view === 'internship' && studentConsultations.map((c, i) => (
                      <div
                        key={i}
                        className="absolute top-2 bottom-2 w-0.5 bg-[oklch(60%_0.15_200)] rounded-full pointer-events-none"
                        style={{ left: `${toPercent(new Date(c.date), range)}%` }}
                        title={c.date}
                      />
                    ))}

                    {/* Research markers: milestone dots */}
                    {view === 'research' && studentMilestones
                      .filter(m => m.due_date)
                      .map((m, i) => (
                        <div
                          key={i}
                          className={`absolute top-[14px] w-3 h-3 rounded-full border-2 border-white -translate-x-1.5 pointer-events-none ${
                            m.completed_at
                              ? 'bg-[oklch(58%_0.18_140)]'
                              : 'bg-[oklch(72%_0.02_260)]'
                          }`}
                          style={{ left: `${toPercent(new Date(m.due_date!), range)}%` }}
                          title={m.title}
                        />
                      ))
                    }
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Start dev server and open `/gantt`**

```bash
npm run dev
```

Open `http://localhost:3000/gantt`. Verify:
- Month headers visible
- Each student row shows a navy bar spanning their internship dates
- Toggle switches between ฝึกงาน (shows consultation lines) and วิจัย (shows milestone dots)
- Rows sorted by start_date

- [ ] **Step 4: Commit**

```bash
git add src/components/GanttChart.tsx
git commit -m "feat: gantt static layout with toggle and markers"
```

---

## Task 4: Drag to Resize / Move Bars

Add pointer event handlers to bar zones. During drag, update local student state for visual preview. On release, persist to Supabase via `updateStudentDates`.

**Files:**
- Modify: `src/components/GanttChart.tsx`

**Interfaces:**
- Consumes: `pxToDays`, `addDays` from `@/lib/gantt-utils`; `updateStudentDates` from `@/app/gantt/actions`

- [ ] **Step 1: Replace `src/components/GanttChart.tsx` with drag-enabled version**

```typescript
'use client'

import { useState, useRef, useCallback } from 'react'
import type { Student } from '@/lib/types'
import {
  computeTimelineRange,
  toPercent,
  getMonthLabels,
  pxToDays,
  addDays,
  type TimelineRange,
} from '@/lib/gantt-utils'
import { updateStudentDates } from '@/app/gantt/actions'

type View = 'internship' | 'research'
type DragZone = 'start' | 'end' | 'move'

interface Milestone {
  student_id: string
  title: string
  due_date: string | null
  completed_at: string | null
}

interface Consultation {
  student_id: string
  date: string
}

interface Props {
  students: Student[]
  milestones: Milestone[]
  consultations: Consultation[]
}

interface DragState {
  studentId: string
  zone: DragZone
  startX: number
  origStart: Date
  origEnd: Date
  chartWidthPx: number
  rangeTotalMs: number
}

export function GanttChart({ students, milestones, consultations }: Props) {
  const [view, setView] = useState<View>('internship')
  const [localStudents, setLocalStudents] = useState<Student[]>(students)

  const chartAreaRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const isDraggingRef = useRef(false)

  const range = computeTimelineRange(localStudents)
  const monthLabels = getMonthLabels(range)

  const handlePointerDown = useCallback((
    e: React.PointerEvent<HTMLDivElement>,
    student: Student,
    zone: DragZone,
  ) => {
    if (!student.start_date || !student.end_date) return
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    isDraggingRef.current = false
    dragRef.current = {
      studentId: student.id,
      zone,
      startX: e.clientX,
      origStart: new Date(student.start_date),
      origEnd: new Date(student.end_date),
      chartWidthPx: chartAreaRef.current?.getBoundingClientRect().width ?? 1,
      rangeTotalMs: range.totalMs,
    }
  }, [range.totalMs])

  const handlePointerMove = useCallback((
    e: React.PointerEvent<HTMLDivElement>,
    studentId: string,
  ) => {
    const drag = dragRef.current
    if (!drag || drag.studentId !== studentId) return

    const dx = e.clientX - drag.startX
    if (Math.abs(dx) > 3) isDraggingRef.current = true
    if (!isDraggingRef.current) return

    const deltaDays = pxToDays(dx, drag.chartWidthPx, drag.rangeTotalMs)

    setLocalStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s
      let newStart = drag.origStart
      let newEnd = drag.origEnd

      if (drag.zone === 'move') {
        newStart = addDays(drag.origStart, deltaDays)
        newEnd = addDays(drag.origEnd, deltaDays)
      } else if (drag.zone === 'start') {
        newStart = addDays(drag.origStart, deltaDays)
        if (newStart >= newEnd) newStart = addDays(newEnd, -1)
      } else {
        newEnd = addDays(drag.origEnd, deltaDays)
        if (newEnd <= newStart) newEnd = addDays(newStart, 1)
      }

      return {
        ...s,
        start_date: newStart.toISOString().slice(0, 10),
        end_date: newEnd.toISOString().slice(0, 10),
      }
    }))
  }, [])

  const handlePointerUp = useCallback(async (
    _e: React.PointerEvent<HTMLDivElement>,
    studentId: string,
  ) => {
    const drag = dragRef.current
    if (!drag || drag.studentId !== studentId) return
    dragRef.current = null

    if (!isDraggingRef.current) return
    isDraggingRef.current = false

    const student = localStudents.find(s => s.id === studentId)
    if (!student?.start_date || !student?.end_date) return
    await updateStudentDates(studentId, student.start_date, student.end_date)
  }, [localStudents])

  return (
    <div>
      {/* Toggle */}
      <div className="flex gap-1 mb-5 bg-white border border-line rounded-lg p-1 w-fit">
        {(['internship', 'research'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              view === v
                ? 'bg-accent text-white font-medium'
                : 'text-fg-2 hover:text-fg'
            }`}
          >
            {v === 'internship' ? 'ฝึกงาน' : 'วิจัย'}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-line overflow-hidden">
        {/* Month header */}
        <div className="flex border-b border-line">
          <div className="shrink-0 w-44 px-4 py-2 text-xs font-medium text-fg-3 border-r border-line">
            นิสิต
          </div>
          <div ref={chartAreaRef} className="flex-1 relative h-8">
            {monthLabels.map(({ label, left }) => (
              <div
                key={label}
                className="absolute top-2 text-xs text-fg-3 whitespace-nowrap pointer-events-none"
                style={{ left: `${left}%` }}
              >
                {label}
              </div>
            ))}
            {monthLabels.map(({ label, left }) => (
              <div
                key={`grid-${label}`}
                className="absolute top-0 bottom-0 w-px bg-line pointer-events-none"
                style={{ left: `${left}%` }}
              />
            ))}
          </div>
        </div>

        {/* Rows */}
        {localStudents.map(student => {
          const hasBar = !!(student.start_date && student.end_date)
          const barLeft = hasBar ? toPercent(new Date(student.start_date!), range) : 0
          const barRight = hasBar ? toPercent(new Date(student.end_date!), range) : 0
          const barWidth = Math.max(0, barRight - barLeft)

          const studentMilestones = milestones.filter(m => m.student_id === student.id)
          const studentConsultations = consultations.filter(c => c.student_id === student.id)

          return (
            <div
              key={student.id}
              className="flex border-b border-line last:border-0 hover:bg-[oklch(98%_0.005_260)] cursor-pointer"
            >
              {/* Label column */}
              <div className="shrink-0 w-44 px-4 py-3 border-r border-line">
                <p className="text-sm font-medium text-fg truncate">{student.name}</p>
                {student.company && (
                  <p className="text-xs text-fg-3 truncate">{student.company}</p>
                )}
              </div>

              {/* Timeline area */}
              <div className="flex-1 relative h-12">
                {hasBar && (
                  <>
                    {/* Bar */}
                    <div
                      className="absolute top-3 h-6 bg-accent rounded-full select-none"
                      style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                    >
                      {/* Left resize handle */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize rounded-l-full"
                        onPointerDown={e => handlePointerDown(e, student, 'start')}
                        onPointerMove={e => handlePointerMove(e, student.id)}
                        onPointerUp={e => handlePointerUp(e, student.id)}
                        onClick={e => e.stopPropagation()}
                      />
                      {/* Move handle */}
                      <div
                        className="absolute left-3 right-3 top-0 bottom-0 cursor-grab active:cursor-grabbing"
                        onPointerDown={e => handlePointerDown(e, student, 'move')}
                        onPointerMove={e => handlePointerMove(e, student.id)}
                        onPointerUp={e => handlePointerUp(e, student.id)}
                        onClick={e => e.stopPropagation()}
                      />
                      {/* Right resize handle */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize rounded-r-full"
                        onPointerDown={e => handlePointerDown(e, student, 'end')}
                        onPointerMove={e => handlePointerMove(e, student.id)}
                        onPointerUp={e => handlePointerUp(e, student.id)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>

                    {/* Internship view: consultation date lines */}
                    {view === 'internship' && studentConsultations.map((c, i) => (
                      <div
                        key={i}
                        className="absolute top-2 bottom-2 w-0.5 bg-[oklch(60%_0.15_200)] rounded-full pointer-events-none"
                        style={{ left: `${toPercent(new Date(c.date), range)}%` }}
                        title={c.date}
                      />
                    ))}

                    {/* Research view: milestone dots */}
                    {view === 'research' && studentMilestones
                      .filter(m => m.due_date)
                      .map((m, i) => (
                        <div
                          key={i}
                          className={`absolute top-[14px] w-3 h-3 rounded-full border-2 border-white -translate-x-1.5 pointer-events-none ${
                            m.completed_at
                              ? 'bg-[oklch(58%_0.18_140)]'
                              : 'bg-[oklch(72%_0.02_260)]'
                          }`}
                          style={{ left: `${toPercent(new Date(m.due_date!), range)}%` }}
                          title={m.title}
                        />
                      ))
                    }
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Test drag in browser**

Open `http://localhost:3000/gantt`. Verify:
- Hovering left/right edge of bar shows `ew-resize` cursor
- Hovering middle shows `grab` cursor
- Dragging left/right edge resizes bar visually
- Dragging middle moves entire bar
- After drag release, dates saved to Supabase (reload page to confirm)

- [ ] **Step 4: Commit**

```bash
git add src/components/GanttChart.tsx
git commit -m "feat: gantt drag to resize and move bars"
```

---

## Task 5: Side Panel + Row Click

Add GanttSidePanel component and wire row clicks to open it.

**Files:**
- Create: `src/components/GanttSidePanel.tsx`
- Modify: `src/components/GanttChart.tsx`

**Interfaces:**
- Consumes: `updateStudentFromGantt` from `@/app/gantt/actions`; `Student` from `@/lib/types`
- Produces: `GanttSidePanel({ student, onClose, onSaved })` — used by GanttChart

- [ ] **Step 1: Create `src/components/GanttSidePanel.tsx`**

```typescript
'use client'

import { useEffect } from 'react'
import type { Student } from '@/lib/types'
import { updateStudentFromGantt } from '@/app/gantt/actions'

interface Props {
  student: Student
  onClose: () => void
  onSaved: (updated: Student) => void
}

const FIELDS: {
  label: string
  name: keyof FormFields
  type: string
  required?: boolean
  disabled?: boolean
}[] = [
  { label: 'ชื่อ-นามสกุล *', name: 'name', type: 'text', required: true },
  { label: 'รหัสนิสิต', name: 'student_id_display', type: 'text', disabled: true },
  { label: 'บริษัท', name: 'company', type: 'text' },
  { label: 'สาขา', name: 'major', type: 'text' },
  { label: 'เบอร์โทร', name: 'phone', type: 'text' },
  { label: 'LINE ID', name: 'line_id', type: 'text' },
  { label: 'วันเริ่ม', name: 'start_date', type: 'date' },
  { label: 'วันสิ้นสุด', name: 'end_date', type: 'date' },
]

type FormFields = {
  name: string
  student_id_display: string
  company: string
  major: string
  phone: string
  line_id: string
  start_date: string
  end_date: string
}

function getDefault(student: Student, name: keyof FormFields): string {
  if (name === 'student_id_display') return student.student_id
  const v = student[name as keyof Student]
  return v != null ? String(v) : ''
}

export function GanttSidePanel({ student, onClose, onSaved }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-20 bg-black/20"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 z-30 w-80 bg-white shadow-xl border-l border-line flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-line shrink-0">
          <h2 className="text-sm font-semibold text-fg">แก้ไขนิสิต</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-fg-3 hover:text-fg rounded-md hover:bg-[oklch(95%_0.005_260)] transition-colors focus:outline-none"
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          action={async (fd) => {
            await updateStudentFromGantt(fd)
            const updated: Student = {
              ...student,
              name: fd.get('name') as string,
              major: (fd.get('major') as string) || null,
              company: (fd.get('company') as string) || null,
              start_date: (fd.get('start_date') as string) || null,
              end_date: (fd.get('end_date') as string) || null,
              phone: (fd.get('phone') as string) || null,
              line_id: (fd.get('line_id') as string) || null,
            }
            onSaved(updated)
          }}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        >
          <input type="hidden" name="id" value={student.id} />
          <input type="hidden" name="student_id_field" value={student.student_id} />

          {FIELDS.map(f => (
            <div key={f.name}>
              <label className="block text-xs font-medium text-fg-label mb-1.5">
                {f.label}
              </label>
              <input
                name={f.disabled ? undefined : f.name}
                type={f.type}
                required={f.required}
                defaultValue={getDefault(student, f.name)}
                disabled={f.disabled}
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:bg-[oklch(95%_0.005_260)] disabled:text-fg-3 disabled:cursor-not-allowed"
              />
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-fg-2 hover:text-fg border border-line rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Wire panel into GanttChart**

Add `selectedStudent` state and row click handler to `src/components/GanttChart.tsx`. Insert after the `isDraggingRef` ref declaration and before the `range` computation:

```typescript
// Add import at top of file:
import { GanttSidePanel } from './GanttSidePanel'

// Add state inside GanttChart function (after isDraggingRef):
const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

// Add click handler (after handlePointerUp):
const handleRowClick = useCallback((student: Student) => {
  if (isDraggingRef.current) return
  setSelectedStudent(student)
}, [])
```

Add `onClick` to each row div and update `localStudents` on save:

```typescript
// Row div: add onClick
<div
  key={student.id}
  className="flex border-b border-line last:border-0 hover:bg-[oklch(98%_0.005_260)] cursor-pointer"
  onClick={() => handleRowClick(student)}
>

// After closing </div> of the chart container, add:
{selectedStudent && (
  <GanttSidePanel
    student={selectedStudent}
    onClose={() => setSelectedStudent(null)}
    onSaved={(updated) => {
      setLocalStudents(prev => prev.map(s => s.id === updated.id ? updated : s))
      setSelectedStudent(null)
    }}
  />
)}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Test in browser**

Open `http://localhost:3000/gantt`. Verify:
- Clicking any row (not dragging) opens side panel
- Panel shows correct student data
- ESC closes panel
- Clicking backdrop closes panel
- Editing and saving updates the row label immediately
- After save, reload confirms Supabase was updated

- [ ] **Step 5: Commit**

```bash
git add src/components/GanttSidePanel.tsx src/components/GanttChart.tsx
git commit -m "feat: gantt side panel for editing student data"
```

---

## Task 6: Navigation Link + Deploy

Add "Gantt" link to dashboard header and push to production.

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Add Gantt link to dashboard header**

In `src/app/dashboard/page.tsx`, locate the header section:

```typescript
// Before (existing):
<span className="text-base font-bold text-white tracking-tight">
  MyCoop
</span>
<form action={signOut}>

// After:
<div className="flex items-center gap-5">
  <span className="text-base font-bold text-white tracking-tight">
    MyCoop
  </span>
  <Link href="/gantt" className="text-sm text-white/70 hover:text-white transition-colors">
    Gantt
  </Link>
</div>
<form action={signOut}>
```

Also add the import at top if not present:
```typescript
import Link from 'next/link'
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Final browser test**

Open `http://localhost:3000/dashboard`. Verify:
- "Gantt" link appears in header
- Clicking navigates to `/gantt`
- All Gantt features work: toggle, drag, side panel

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add Gantt nav link to dashboard header"
```

- [ ] **Step 5: Push and deploy**

```bash
git push origin master
npx vercel --prod
```

Expected: build succeeds, production URL printed
