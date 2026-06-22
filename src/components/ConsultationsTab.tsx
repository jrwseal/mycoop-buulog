'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import { HeatmapCalendar } from './HeatmapCalendar'
import { createConsultation, deleteConsultation } from '@/app/students/[id]/consultations/actions'
import type { Consultation } from '@/lib/types'

interface ConsultationsTabProps {
  studentId: string
  consultations: Consultation[]
  startDate: string | null
  endDate: string | null
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function ConsultationItem({ c, studentId }: { c: Consultation; studentId: string }) {
  const [pendingDelete, setPendingDelete] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-line px-5 py-3.5 flex items-start gap-4 min-h-[44px]">
      <time className="text-sm font-medium text-[oklch(38%_0.08_260)] shrink-0 tabular-nums self-center">
        {(() => {
          try {
            return format(parseISO(c.date), 'd MMM yyyy', { locale: th })
          } catch {
            return c.date
          }
        })()}
      </time>
      <div className="flex-1 min-w-0">
        {c.duration_minutes && (
          <span className="text-xs text-[oklch(52%_0.01_260)] mr-2">
            {c.duration_minutes} นาที
          </span>
        )}
        {c.note && (
          <p className="text-sm text-[oklch(35%_0.02_260)] mt-0.5">{c.note}</p>
        )}
      </div>
      <form action={deleteConsultation}>
        <input type="hidden" name="student_id" value={studentId} />
        <input type="hidden" name="consult_id" value={c.id} />
        {pendingDelete ? (
          <span className="flex items-center gap-1.5 min-h-[44px]">
            <span className="text-xs text-[oklch(45%_0.18_25)]">ลบ?</span>
            <button
              type="submit"
              className="text-xs font-medium text-[oklch(45%_0.18_25)] hover:text-[oklch(35%_0.2_25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(55%_0.18_25)] rounded transition-colors"
            >
              ใช่
            </button>
            <button
              type="button"
              onClick={() => setPendingDelete(false)}
              className="text-xs text-fg-3 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors"
            >
              ยกเลิก
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setPendingDelete(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-[oklch(58%_0.01_260)] hover:text-[oklch(55%_0.18_25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(55%_0.18_25)] rounded transition-colors"
          >
            ลบ
          </button>
        )}
      </form>
    </div>
  )
}

export function ConsultationsTab({
  studentId,
  consultations,
  startDate,
  endDate,
}: ConsultationsTabProps) {
  const [adding, setAdding] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const consultDates = consultations.map((c) => c.date)

  return (
    <div className="pt-6 space-y-8">
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-fg">
            สถิติการปรึกษา
          </h2>
          <span className="text-sm text-fg-2">
            รวม {consultations.length} ครั้ง
          </span>
        </div>
        <div className="bg-white rounded-xl border border-line p-5 relative">
          <HeatmapCalendar
            consultationDates={consultDates}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-fg">
            บันทึกการปรึกษา
          </h2>
          {!adding && (
            <button
              onClick={() => setAdding(true)}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors"
            >
              + บันทึกการปรึกษา
            </button>
          )}
        </div>

        {adding && (
          <form
            action={async (fd) => {
              await createConsultation(fd)
              setAdding(false)
            }}
            className="bg-white rounded-xl border border-line p-5 space-y-4 mb-4"
          >
            <input type="hidden" name="student_id" value={studentId} />
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="consult-date" className="block text-xs font-medium text-fg-label mb-1.5">
                  วันที่
                </label>
                <input
                  id="consult-date"
                  name="date"
                  type="date"
                  required
                  defaultValue={today()}
                  className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                />
              </div>
              <div>
                <label htmlFor="consult-duration" className="block text-xs font-medium text-fg-label mb-1.5">
                  ระยะเวลา (นาที)
                </label>
                <input
                  id="consult-duration"
                  name="duration"
                  type="number"
                  min="1"
                  max="480"
                  placeholder="เช่น 30"
                  className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm placeholder:text-[oklch(62%_0.01_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                />
              </div>
            </div>
            <div>
              <label htmlFor="consult-note" className="block text-xs font-medium text-fg-label mb-1.5">
                บันทึก (ถ้ามี)
              </label>
              <textarea
                id="consult-note"
                name="note"
                rows={3}
                placeholder="สรุปเนื้อหาที่ปรึกษา..."
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm placeholder:text-[oklch(62%_0.01_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 resize-y"
              />
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
        )}

        {consultations.length === 0 && !adding ? (
          <div className="text-center py-12 text-fg-3">
            <p className="font-medium mb-1">ยังไม่มีการปรึกษา</p>
            <p className="text-sm">กด &ldquo;+ บันทึกการปรึกษา&rdquo; เพื่อเริ่ม</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {(showAll ? consultations : consultations.slice(0, 10)).map((c) => (
                <ConsultationItem key={c.id} c={c} studentId={studentId} />
              ))}
            </div>
            {consultations.length > 10 && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="mt-2 text-sm text-[oklch(48%_0.06_260)] hover:text-[oklch(38%_0.1_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors"
              >
                {showAll
                  ? 'แสดงน้อยลง'
                  : `แสดงทั้งหมด (${consultations.length} รายการ)`}
              </button>
            )}
          </>
        )}
      </section>
    </div>
  )
}
