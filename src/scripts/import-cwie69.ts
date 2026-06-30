import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
  for (const line of lines) {
    const [key, ...vals] = line.split('=')
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim()
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function parseTimestamp(raw: string): string {
  // Format: "6/25/2026 10:08:03" → "2026-06-25"
  const d = new Date(raw)
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function buildContent(row: Record<string, string>): string {
  const parts: string[] = []
  const nickname = (row['ชื่อเล่น'] || '').trim()
  const project = (row['ลองเล่าโปรเจคที่น้องกำลังทำหรือสนใจจะทำให้พี่ฟังหน่อยคับ'] || '').trim()
  const measure = (row['น้องๆ มีไอเดียในการวัดผลโปรเจคหรือยังค้าบ ถ้ามีแล้ว คิดว่าจะวัดอย่างไรบ้าง'] || '').trim()
  const challenge = (row['ความท้าทายของโปรเจคนี้คืออะไรคับ สิ่งที่น้องๆคิดว่า อาจทำให้โปรเจคนี้ไม่ได้ผลตามที่น้องๆตั้งเป้าไว้'] || '').trim()
  const extra = (row['มีอะไรอยากแชร์ให้พี่ฟังเพิ่มเติมมั้ยคับ'] || '').trim()

  if (nickname) parts.push(`**ชื่อเล่น:** ${nickname}`)
  if (project) parts.push(`**โปรเจค:**\n${project}`)
  if (measure) parts.push(`**การวัดผล:**\n${measure}`)
  if (challenge) parts.push(`**ความท้าทาย:**\n${challenge}`)
  if (extra) parts.push(`**เพิ่มเติม:**\n${extra}`)

  return parts.join('\n\n')
}

async function run() {
  // Find the CWIE69 file in parent directory
  const dir = path.join(process.cwd(), '..')
  const files = fs.readdirSync(dir).filter(f => f.includes('CWIE69') && f.endsWith('.xlsx'))
  if (files.length === 0) {
    console.error('No CWIE69 .xlsx file found in', dir)
    process.exit(1)
  }
  const filePath = path.join(dir, files[0])
  console.log('Reading:', filePath)

  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
  console.log(`Found ${rows.length} form responses`)

  // Fetch all students to map student_id → internal UUID
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, student_id')

  if (studentsError) {
    console.error('Error fetching students:', studentsError.message)
    process.exit(1)
  }

  const studentMap = new Map<string, string>()
  students?.forEach(s => studentMap.set(s.student_id, s.id))
  console.log(`Found ${studentMap.size} students in DB`)

  const notes: { student_id: string; date: string; content: string }[] = []
  const skipped: string[] = []

  for (const row of rows) {
    const sid = String(row['รหัสนิสิต'] || '').trim()
    if (!sid) continue

    const internalId = studentMap.get(sid)
    if (!internalId) {
      skipped.push(sid)
      continue
    }

    const date = parseTimestamp(String(row['Timestamp'] || ''))
    const content = buildContent(row)
    if (!content) continue

    notes.push({ student_id: internalId, date, content })
  }

  if (skipped.length > 0) {
    console.warn(`Skipped (no matching student): ${skipped.join(', ')}`)
  }

  if (notes.length === 0) {
    console.log('No notes to insert.')
    return
  }

  console.log(`Inserting ${notes.length} progress notes...`)
  const { error } = await supabase.from('progress_notes').insert(notes)

  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }

  console.log('Done!')
}

run().catch(console.error)
