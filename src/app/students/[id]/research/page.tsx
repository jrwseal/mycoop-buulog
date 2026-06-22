import { createClient } from '@/lib/supabase/server'
import { ResearchTab } from '@/components/ResearchTab'

export default async function ResearchPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: milestones }, { data: progressNotes }, { data: files }] = await Promise.all([
    supabase
      .from('milestones')
      .select('*')
      .eq('student_id', id)
      .order('sort_order'),
    supabase
      .from('progress_notes')
      .select('*')
      .eq('student_id', id)
      .order('date', { ascending: false }),
    supabase
      .from('file_uploads')
      .select('*')
      .eq('student_id', id)
      .order('uploaded_at', { ascending: false }),
  ])

  return (
    <ResearchTab
      studentId={id}
      milestones={milestones ?? []}
      progressNotes={progressNotes ?? []}
      files={files ?? []}
    />
  )
}
