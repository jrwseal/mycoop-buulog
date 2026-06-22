'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface StudentTabNavProps {
  studentId: string
}

const TABS = [
  { label: 'บันทึกการประชุม', href: (id: string) => `/students/${id}/notes` },
  { label: 'การปรึกษา', href: (id: string) => `/students/${id}/consultations` },
  { label: 'การวิจัย', href: (id: string) => `/students/${id}/research` },
]

export function StudentTabNav({ studentId }: StudentTabNavProps) {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 border-b border-line -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
      {TABS.map((tab) => {
        const href = tab.href(studentId)
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={[
              'shrink-0 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-t',
              active
                ? 'border-accent text-[oklch(38%_0.12_260)]'
                : 'border-transparent text-fg-2 hover:text-[oklch(30%_0.02_260)] hover:border-[oklch(75%_0.01_260)]',
            ].join(' ')}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
