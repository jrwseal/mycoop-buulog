'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createConsultation(formData: FormData) {
  const studentId = formData.get('student_id') as string
  const supabase = await createClient()

  await supabase.from('consultations').insert({
    student_id: studentId,
    date: formData.get('date') as string,
    duration_minutes: formData.get('duration') ? Number(formData.get('duration')) : null,
    note: (formData.get('note') as string) || null,
  })

  revalidatePath(`/students/${studentId}/consultations`)
}

export async function deleteConsultation(formData: FormData) {
  const studentId = formData.get('student_id') as string
  const consultId = formData.get('consult_id') as string
  const supabase = await createClient()

  await supabase.from('consultations').delete().eq('id', consultId)
  revalidatePath(`/students/${studentId}/consultations`)
}
