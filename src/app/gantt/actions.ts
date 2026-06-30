'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateStudentDates(id: string, startDate: string, endDate: string) {
  const supabase = await createClient()
  await supabase.from('students').update({
    start_date: startDate,
    end_date: endDate,
  }).eq('id', id)
  revalidatePath('/gantt')
  revalidatePath('/dashboard')
}

export async function updateStudentFromGantt(formData: FormData) {
  const id = formData.get('id') as string
  const supabase = await createClient()
  await supabase.from('students').update({
    student_id: formData.get('student_id_field') as string,
    name: formData.get('name') as string,
    major: (formData.get('major') as string) || null,
    company: (formData.get('company') as string) || null,
    start_date: (formData.get('start_date') as string) || null,
    end_date: (formData.get('end_date') as string) || null,
    phone: (formData.get('phone') as string) || null,
    line_id: (formData.get('line_id') as string) || null,
  }).eq('id', id)
  revalidatePath('/gantt')
  revalidatePath('/dashboard')
}
