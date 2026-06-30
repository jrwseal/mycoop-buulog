import { createClient } from '@/lib/supabase/server'
import { GanttChart } from '@/components/GanttChart'
import Link from 'next/link'
import { signOut } from '@/app/login/actions'

export default async function GanttPage() {
  const supabase = await createClient()

  const [{ data: students }, { data: milestones }, { data: consultations }] =
    await Promise.all([
      supabase.from('students').select('*').order('start_date', { ascending: true, nullsFirst: false }),
      supabase.from('milestones').select('student_id, title, due_date, completed_at'),
      supabase.from('consultations').select('student_id, date'),
    ])

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 bg-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <span className="text-base font-bold text-white tracking-tight">MyCoop</span>
            <Link
              href="/dashboard"
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-white/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-accent rounded transition-colors"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-xl font-semibold text-[oklch(18%_0.02_260)] mb-5">
          Gantt Chart
        </h1>
        <GanttChart
          students={students ?? []}
          milestones={milestones ?? []}
          consultations={consultations ?? []}
        />
      </main>
    </div>
  )
}
