'use client'

import { useState } from 'react'
import { StudentCard } from './StudentCard'
import type { StudentWithStats } from '@/lib/types'

interface DashboardSearchProps {
  students: StudentWithStats[]
}

export function DashboardSearch({ students }: DashboardSearchProps) {
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? students.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          (s.company ?? '').toLowerCase().includes(query.toLowerCase()) ||
          (s.major ?? '').toLowerCase().includes(query.toLowerCase()) ||
          s.student_id.includes(query)
      )
    : students

  return (
    <div>
      <div className="mb-6">
        <div className="relative w-full max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[oklch(60%_0.01_260)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อ รหัสนิสิต บริษัท หรือสาขา..."
            className="w-full rounded-lg border border-input bg-white pl-9 pr-3 py-2 text-sm text-fg placeholder:text-[oklch(60%_0.01_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </div>
        {query.trim() && (
          <p className="mt-2 text-xs text-fg-3">
            แสดง {filtered.length} จาก {students.length} คน
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center py-12 text-fg-3 text-sm">
          ไม่พบนิสิตที่ตรงกับ &ldquo;{query}&rdquo;
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  )
}
