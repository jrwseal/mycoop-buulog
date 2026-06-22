'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function researchPath(studentId: string) {
  return `/students/${studentId}/research`
}

// Milestones
export async function createMilestone(formData: FormData) {
  const studentId = formData.get('student_id') as string
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('milestones')
    .select('sort_order')
    .eq('student_id', studentId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (existing?.sort_order ?? -1) + 1

  await supabase.from('milestones').insert({
    student_id: studentId,
    title: formData.get('title') as string,
    description: (formData.get('description') as string) || null,
    due_date: (formData.get('due_date') as string) || null,
    sort_order: nextOrder,
  })

  revalidatePath(researchPath(studentId))
}

export async function toggleMilestone(formData: FormData) {
  const studentId = formData.get('student_id') as string
  const milestoneId = formData.get('milestone_id') as string
  const completed = formData.get('completed') === 'true'
  const supabase = await createClient()

  await supabase
    .from('milestones')
    .update({ completed_at: completed ? null : new Date().toISOString() })
    .eq('id', milestoneId)

  revalidatePath(researchPath(studentId))
}

export async function deleteMilestone(formData: FormData) {
  const studentId = formData.get('student_id') as string
  const milestoneId = formData.get('milestone_id') as string
  const supabase = await createClient()

  await supabase.from('milestones').delete().eq('id', milestoneId)
  revalidatePath(researchPath(studentId))
}

// Progress notes
export async function createProgressNote(formData: FormData) {
  const studentId = formData.get('student_id') as string
  const supabase = await createClient()

  await supabase.from('progress_notes').insert({
    student_id: studentId,
    date: formData.get('date') as string,
    content: formData.get('content') as string,
  })

  revalidatePath(researchPath(studentId))
}

export async function deleteProgressNote(formData: FormData) {
  const studentId = formData.get('student_id') as string
  const noteId = formData.get('note_id') as string
  const supabase = await createClient()

  await supabase.from('progress_notes').delete().eq('id', noteId)
  revalidatePath(researchPath(studentId))
}

// File uploads
export async function uploadFile(formData: FormData) {
  const studentId = formData.get('student_id') as string
  const file = formData.get('file') as File
  if (!file || file.size === 0) return

  const supabase = await createClient()
  const storagePath = `${studentId}/${Date.now()}_${file.name}`

  const { error } = await supabase.storage
    .from('student-files')
    .upload(storagePath, file, { upsert: false })

  if (error) throw new Error(error.message)

  await supabase.from('file_uploads').insert({
    student_id: studentId,
    filename: file.name,
    storage_path: storagePath,
    file_size: file.size,
  })

  revalidatePath(researchPath(studentId))
}

export async function deleteFile(formData: FormData) {
  const studentId = formData.get('student_id') as string
  const fileId = formData.get('file_id') as string
  const storagePath = formData.get('storage_path') as string
  const supabase = await createClient()

  await supabase.storage.from('student-files').remove([storagePath])
  await supabase.from('file_uploads').delete().eq('id', fileId)
  revalidatePath(researchPath(studentId))
}

export async function getFileUrl(storagePath: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase.storage
    .from('student-files')
    .createSignedUrl(storagePath, 3600)
  return data?.signedUrl ?? ''
}
