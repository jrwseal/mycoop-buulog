import { createClient } from '@/lib/supabase/server'
import { NotesList } from '@/components/NotesList'

export default async function NotesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: notes } = await supabase
    .from('meeting_notes')
    .select('*')
    .eq('student_id', id)
    .order('date', { ascending: false })

  return <NotesList studentId={id} notes={notes ?? []} />
}
