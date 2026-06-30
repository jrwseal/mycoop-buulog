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
