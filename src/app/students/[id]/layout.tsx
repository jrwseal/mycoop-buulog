import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StudentTabNav } from '@/components/StudentTabNav'
import { StudentHeader } from '@/components/StudentHeader'

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (!student) notFound()

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 bg-surface border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm text-[oklch(48%_0.06_260)] hover:text-[oklch(38%_0.1_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors"
          >
            ← Dashboard
          </Link>
          <span className="text-[oklch(75%_0.01_260)]">/</span>
          <span className="text-sm font-medium text-[oklch(25%_0.02_260)] truncate">
            {student.name}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <StudentHeader student={student} />
        <StudentTabNav studentId={id} />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        {children}
      </div>
    </div>
  )
}
