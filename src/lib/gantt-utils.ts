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
