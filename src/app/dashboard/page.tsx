import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DashboardSearch } from '@/components/DashboardSearch'
import { AddStudentForm } from '@/components/AddStudentForm'
import { signOut } from '@/app/login/actions'
import type { StudentWithStats } from '@/lib/types'

const NEEDS_ATTENTION_DAYS = 30

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

  const totalConsultations = consultStats?.length ?? 0
  const totalMilestoneDone = [...milestoneDoneMap.values()].reduce((a, b) => a + b, 0)
  const totalMilestoneTotal = [...milestoneTotalMap.values()].reduce((a, b) => a + b, 0)

  const today = new Date()
  const needsAttention = enriched
    .map((s) => {
      const lastDate = s.last_consultation ? new Date(s.last_consultation) : null
      const daysSince = lastDate
        ? Math.floor((today.getTime() - lastDate.getTime()) / 86_400_000)
        : Infinity
      return { ...s, daysSince }
    })
    .filter((s) => s.daysSince >= NEEDS_ATTENTION_DAYS)
    .sort((a, b) => b.daysSince - a.daysSince)

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-10 bg-accent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <span className="text-base font-bold text-white tracking-tight">
              MyCoop
            </span>
            <Link href="/gantt" className="text-sm text-white/70 hover:text-white transition-colors">
              Gantt
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-4 gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[oklch(18%_0.02_260)]">
              นิสิตสหกิจศึกษา
            </h1>
            <p className="text-sm text-fg-2 mt-0.5">
              {enriched.length} คน
            </p>
          </div>
        </div>

        <AddStudentForm />

        {enriched.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'นิสิตทั้งหมด', value: `${enriched.length} คน` },
              { label: 'ปรึกษารวม', value: `${totalConsultations} ครั้ง` },
              { label: 'Milestone สำเร็จ', value: totalMilestoneTotal > 0 ? `${totalMilestoneDone}/${totalMilestoneTotal}` : '-' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border border-line px-4 py-3">
                <p className="text-xs text-fg-3 mb-1">{label}</p>
                <p className="text-lg font-semibold text-fg tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        )}

        {needsAttention.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-[oklch(42%_0.2_25)] mb-2">
              ต้องติดตาม
            </h2>
            <div className="bg-white rounded-xl border border-[oklch(88%_0.04_25)] divide-y divide-line overflow-hidden">
              {needsAttention.map((s) => (
                <Link
                  key={s.id}
                  href={`/students/${s.id}/consultations`}
                  className="flex items-center justify-between px-4 min-h-[44px] hover:bg-[oklch(98%_0.006_85)] transition-colors"
                >
                  <span className="text-sm font-medium text-fg">{s.name}</span>
                  <span className="text-xs text-[oklch(55%_0.18_25)]">
                    {s.daysSince === Infinity
                      ? 'ยังไม่เคยปรึกษา'
                      : `ปรึกษาล่าสุด ${s.daysSince} วันที่แล้ว`}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

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
