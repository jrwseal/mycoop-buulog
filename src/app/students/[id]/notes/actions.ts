'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createNote(formData: FormData) {
  const studentId = formData.get('student_id') as string
  const supabase = await createClient()

  await supabase.from('meeting_notes').insert({
    student_id: studentId,
    date: formData.get('date') as string,
    title: formData.get('title') as string,
    content: formData.get('content') as string,
  })

  revalidatePath(`/students/${studentId}/notes`)
}

export async function updateNote(formData: FormData) {
  const studentId = formData.get('student_id') as string
  const noteId = formData.get('note_id') as string
  const supabase = await createClient()

  await supabase.from('meeting_notes').update({
    date: formData.get('date') as string,
    title: formData.get('title') as string,
    content: formData.get('content') as string,
  }).eq('id', noteId)

  revalidatePath(`/students/${studentId}/notes`)
}

export async function deleteNote(formData: FormData) {
  const studentId = formData.get('student_id') as string
  const noteId = formData.get('note_id') as string
  const supabase = await createClient()

  await supabase.from('meeting_notes').delete().eq('id', noteId)
  revalidatePath(`/students/${studentId}/notes`)
}
