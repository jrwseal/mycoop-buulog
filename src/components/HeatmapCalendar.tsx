'use client'

import { useMemo, useState } from 'react'
import {
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  isBefore,
  isAfter,
  startOfDay,
} from 'date-fns'
import { th } from 'date-fns/locale'

interface HeatmapCalendarProps {
  consultationDates: string[]
  startDate: string | null
  endDate: string | null
}

const LEVEL_COLORS = [
  'bg-[oklch(92%_0.005_85)]',
  'bg-[oklch(78%_0.08_260)]',
  'bg-[oklch(58%_0.12_260)]',
  'bg-accent',
]

function getLevel(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  return 3
}

const DAY_LABELS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

export function HeatmapCalendar({
  consultationDates,
  startDate,
  endDate,
}: HeatmapCalendarProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number; x: number; y: number } | null>(null)

  const { weeks, monthLabels } = useMemo(() => {
    const rangeStart = startDate ? parseISO(startDate) : new Date(new Date().getFullYear(), 0, 1)
    const rangeEnd = endDate
      ? isBefore(parseISO(endDate), new Date())
        ? parseISO(endDate)
        : new Date()
      : new Date()

    const gridStart = startOfWeek(rangeStart, { weekStartsOn: 0 })
    const gridEnd = endOfWeek(rangeEnd, { weekStartsOn: 0 })

    const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

    const countMap = new Map<string, number>()
    consultationDates.forEach((d) => {
      const key = d.slice(0, 10)
      countMap.set(key, (countMap.get(key) ?? 0) + 1)
    })

    const weeksArr: Array<Array<{ date: Date; count: number; inRange: boolean }>> = []
    let week: Array<{ date: Date; count: number; inRange: boolean }> = []

    days.forEach((day) => {
      const key = format(day, 'yyyy-MM-dd')
      const inRange =
        !isBefore(startOfDay(day), startOfDay(rangeStart)) &&
        !isAfter(startOfDay(day), startOfDay(rangeEnd))
      week.push({ date: day, count: countMap.get(key) ?? 0, inRange })
      if (week.length === 7) {
        weeksArr.push(week)
        week = []
      }
    })
    if (week.length > 0) weeksArr.push(week)

    const months: Array<{ label: string; weekIndex: number }> = []
    let lastMonth = -1
    weeksArr.forEach((w, wi) => {
      const m = w[0].date.getMonth()
      if (m !== lastMonth) {
        months.push({
          label: format(w[0].date, 'MMM', { locale: th }),
          weekIndex: wi,
        })
        lastMonth = m
      }
    })

    return { weeks: weeksArr, monthLabels: months }
  }, [consultationDates, startDate, endDate])

  const cellSize = 16
  const cellGap = 3
  const step = cellSize + cellGap
  const totalWidth = weeks.length * step

  const totalConsultations = consultationDates.length

  return (
    <div
      role="img"
      tabIndex={0}
      aria-label={`ปฏิทินการปรึกษา รวม ${totalConsultations} ครั้ง`}
      className="overflow-x-auto pb-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <div style={{ minWidth: Math.max(totalWidth + 28, 300) }}>
        <div className="flex">
          <div className="w-7 shrink-0" />
          <div className="relative h-5 flex-1">
            {monthLabels.map((m) => (
              <span
                key={`${m.label}-${m.weekIndex}`}
                className="absolute text-[10px] text-[oklch(52%_0.01_260)]"
                style={{ left: m.weekIndex * step }}
              >
                {m.label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex gap-0.5">
          <div className="flex flex-col gap-[3px] shrink-0 w-7 justify-center pt-0">
            {DAY_LABELS.map((d, i) => (
              <div
                key={i}
                style={{ height: cellSize, fontSize: 9 }}
                className={[
                  'flex items-center text-[oklch(58%_0.01_260)]',
                  i % 2 === 0 ? 'opacity-0' : '',
                ].join(' ')}
                aria-hidden={i % 2 === 0 ? 'true' : undefined}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]" onMouseLeave={() => setTooltip(null)}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, di) => {
                  const dateStr = format(cell.date, 'yyyy-MM-dd')
                  const level = cell.inRange ? getLevel(cell.count) : -1
                  return (
                    <div
                      key={di}
                      style={{ width: cellSize, height: cellSize }}
                      className={[
                        'rounded-sm transition-opacity',
                        level === -1
                          ? 'bg-transparent'
                          : LEVEL_COLORS[level],
                        cell.inRange && cell.count > 0 ? 'cursor-pointer hover:opacity-75' : '',
                        'motion-reduce:transition-none',
                      ].join(' ')}
                      onMouseEnter={(e) => {
                        if (!cell.inRange) return
                        setTooltip({
                          date: dateStr,
                          count: cell.count,
                          x: wi * step + 28,
                          y: di * step + 20,
                        })
                      }}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-20 rounded-lg bg-[oklch(15%_0.02_260)] text-white text-xs px-2.5 py-1.5 shadow-lg"
            style={{ left: tooltip.x, top: tooltip.y - 36 }}
          >
            {format(parseISO(tooltip.date), 'd MMM yyyy', { locale: th })}
            {' — '}
            {tooltip.count === 0 ? 'ไม่มีการปรึกษา' : `${tooltip.count} ครั้ง`}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3 justify-end">
          <span className="text-[10px] text-fg-3">น้อย</span>
          {LEVEL_COLORS.map((c, i) => (
            <div key={i} style={{ width: cellSize, height: cellSize }} className={`rounded-sm ${c}`} />
          ))}
          <span className="text-[10px] text-fg-3">มาก</span>
        </div>
      </div>
    </div>
  )
}
