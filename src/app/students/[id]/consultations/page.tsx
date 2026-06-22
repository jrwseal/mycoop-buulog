import { createClient } from '@/lib/supabase/server'
import { ConsultationsTab } from '@/components/ConsultationsTab'

export default async function ConsultationsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: student }, { data: consultations }] = await Promise.all([
    supabase.from('students').select('start_date, end_date').eq('id', id).single(),
    supabase.from('consultations').select('*').eq('student_id', id).order('date', { ascending: false }),
  ])

  return (
    <ConsultationsTab
      studentId={id}
      consultations={consultations ?? []}
      startDate={student?.start_date ?? null}
      endDate={student?.end_date ?? null}
    />
  )
}
