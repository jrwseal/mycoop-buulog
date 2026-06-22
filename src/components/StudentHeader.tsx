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
