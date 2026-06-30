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
