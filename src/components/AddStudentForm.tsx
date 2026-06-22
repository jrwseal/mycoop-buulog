'use client'

import { useState } from 'react'
import { createStudent } from '@/app/dashboard/actions'

export function AddStudentForm() {
  const [adding, setAdding] = useState(false)

  if (!adding) {
    return (
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setAdding(true)}
          className="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors"
        >
          + เพิ่มนิสิต
        </button>
      </div>
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
