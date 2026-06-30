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
import { GanttSidePanel } from './GanttSidePanel'

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

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

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

  const handleRowClick = useCallback((student: Student) => {
    if (isDraggingRef.current) return
    setSelectedStudent(student)
  }, [])

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
              onClick={() => handleRowClick(student)}
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
    </div>
  )
}
