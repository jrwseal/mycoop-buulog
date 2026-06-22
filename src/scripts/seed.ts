import * as XLSX from 'xlsx'
import * as path from 'path'
import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'

// Load .env.local manually (tsx doesn't auto-load it)
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

const THAI_MONTHS: Record<string, number> = {
  'มกราคม': 1, 'กุมภาพันธ์': 2, 'มีนาคม': 3, 'เมษายน': 4,
  'พฤษภาคม': 5, 'มิถุนายน': 6, 'กรกฎาคม': 7, 'สิงหาคม': 8,
  'กันยายน': 9, 'ตุลาคม': 10, 'พฤศจิกายน': 11, 'ธันวาคม': 12,
}

function parseThaiDate(raw: string | undefined | null): string | null {
  if (!raw) return null
  const str = String(raw).trim()
  // Format: "DD เดือน พ.ศ.YYYY" e.g. "01 พฤษภาคม 2569"
  const match = str.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/)
  if (!match) return null
  const day = match[1].padStart(2, '0')
  const month = THAI_MONTHS[match[2]]
  if (!month) return null
  const yearBE = parseInt(match[3])
  const yearCE = yearBE - 543
  return `${yearCE}-${String(month).padStart(2, '0')}-${day}`
}

async function seed() {
  // Find the Excel file
  const dir = path.join(process.cwd(), '..')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.xlsx'))
  if (files.length === 0) {
    console.error('No .xlsx file found in', dir)
    process.exit(1)
  }
  const filePath = path.join(dir, files[0])
  console.log('Reading:', filePath)

  const workbook = XLSX.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

  const students = rows.map((row) => ({
    student_id: String(row['รหัสนิสิต'] || '').trim(),
    name: String(row['ชื่อ-สกุล'] || '').trim(),
    line_id: String(row['Line ID'] || '').trim() || null,
    phone: String(row['เบอร์โทรศัพท์'] || '').trim() || null,
    major: String(row['สาขา/แขนง'] || '').trim() || null,
    company: String(row['ชื่อบริษัท'] || '').trim() || null,
    start_date: parseThaiDate(row['วันเริ่มฝึกงาน']),
    end_date: parseThaiDate(row['วันสิ้นสุดฝึกงาน']),
  })).filter(s => s.student_id && s.name)

  console.log(`Upserting ${students.length} students...`)

  const { data, error } = await supabase
    .from('students')
    .upsert(students, { onConflict: 'student_id' })
    .select()

  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }

  console.log(`Done! Inserted/updated ${data?.length ?? 0} students.`)
}

seed().catch(console.error)
