import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import { StatusDot } from './StatusDot'
import type { StudentWithStats } from '@/lib/types'

interface StudentCardProps {
  student: StudentWithStats
}

function formatThaiDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    return format(parseISO(dateStr), 'd MMM yyyy', { locale: th })
  } catch {
    return dateStr
  }
}

export function StudentCard({ student }: StudentCardProps) {
  const milestoneTotal = student.milestone_total ?? 0
  const milestoneDone = student.milestone_done ?? 0
  const progressPct = milestoneTotal > 0 ? (milestoneDone / milestoneTotal) * 100 : 0

  return (
    <Link
      href={`/students/${student.id}`}
      className="group block rounded-xl border border-line bg-white p-5 hover:border-[oklch(70%_0.06_260)] hover:shadow-sm transition-[border-color,box-shadow] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-mono text-fg-3 mb-0.5">
            {student.student_id}
          </p>
          <h3 className="font-semibold text-[oklch(18%_0.02_260)] leading-snug truncate">
            {student.name}
          </h3>
        </div>
        <StatusDot lastConsultation={student.last_consultation} />
      </div>

      <p className="text-sm text-fg-label truncate mb-3" title={student.company ?? ''}>
        {student.company ?? <span className="italic text-[oklch(60%_0.01_260)]">ไม่ระบุบริษัท</span>}
      </p>

      <div className="flex items-center gap-2 mb-3">
        {student.major && (
          <span className="inline-flex text-xs px-2 py-0.5 rounded-full bg-[oklch(94%_0.015_260)] text-[oklch(38%_0.1_260)] font-medium truncate max-w-[200px]">
            {student.major}
          </span>
        )}
      </div>

      {(student.start_date || student.end_date) && (
        <p className="text-xs text-fg-3 mb-3">
          {formatThaiDate(student.start_date)} – {formatThaiDate(student.end_date)}
        </p>
      )}

      {milestoneTotal > 0 && (
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-fg-2">ความคืบหน้า</span>
            <span className="text-xs font-medium text-[oklch(38%_0.08_260)]">
              {milestoneDone}/{milestoneTotal}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[oklch(92%_0.008_260)] overflow-hidden">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </Link>
  )
}
