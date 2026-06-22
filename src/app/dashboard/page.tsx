import { createClient } from '@/lib/supabase/server'
import { StudentCard } from '@/components/StudentCard'
import { DashboardSearch } from '@/components/DashboardSearch'
import { signOut } from '@/app/login/actions'
import type { StudentWithStats } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [{ data: students }, { data: consultStats }, { data: milestoneStats }] = await Promise.all([
    supabase.from('students').select('*').order('name'),
    supabase.from('consultations').select('student_id, date').order('date', { ascending: false }),
    supabase.from('milestones').select('student_id, completed_at'),
  ])

  const lastConsultMap = new Map<string, string>()
  consultStats?.forEach((c) => {
    if (!lastConsultMap.has(c.student_id)) {
      lastConsultMap.set(c.student_id, c.date)
    }
  })

  const milestoneTotalMap = new Map<string, number>()
  const milestoneDoneMap = new Map<string, number>()
  milestoneStats?.forEach((m) => {
    milestoneTotalMap.set(m.student_id, (milestoneTotalMap.get(m.student_id) ?? 0) + 1)
    if (m.completed_at) {
      milestoneDoneMap.set(m.student_id, (milestoneDoneMap.get(m.student_id) ?? 0) + 1)
    }
  })

  const enriched: StudentWithStats[] = (students ?? []).map((s) => ({
    ...s,
    last_consultation: lastConsultMap.get(s.id) ?? null,
    milestone_total: milestoneTotalMap.get(s.id) ?? 0,
    milestone_done: milestoneDoneMap.get(s.id) ?? 0,
  }))

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 bg-surface border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <span className="text-base font-bold text-fg tracking-tight">
            MyCoop
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-fg-2 hover:text-[oklch(30%_0.02_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded transition-colors"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[oklch(18%_0.02_260)]">
              นิสิตสหกิจศึกษา
            </h1>
            <p className="text-sm text-fg-2 mt-0.5">
              {enriched.length} คน
            </p>
          </div>
        </div>

        {enriched.length === 0 ? (
          <div className="text-center py-24 text-fg-3">
            <p className="text-lg font-medium mb-2">ยังไม่มีนิสิต</p>
            <p className="text-sm">ยังไม่มีข้อมูลนิสิตในระบบ</p>
            {process.env.NODE_ENV === 'development' && (
              <p className="mt-3 text-xs font-mono bg-[oklch(92%_0.008_260)] inline-block px-2.5 py-1 rounded">
                npx tsx src/scripts/seed.ts
              </p>
            )}
          </div>
        ) : (
          <DashboardSearch students={enriched} />
        )}
      </main>
    </div>
  )
}
