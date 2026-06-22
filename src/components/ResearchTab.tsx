'use client'

import { useState, useTransition } from 'react'
import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import {
  createMilestone,
  toggleMilestone,
  deleteMilestone,
  createProgressNote,
  deleteProgressNote,
  uploadFile,
  deleteFile,
  getFileUrl,
} from '@/app/students/[id]/research/actions'
import type { Milestone, ProgressNote, FileUpload } from '@/lib/types'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function fmtDate(d: string | null | undefined) {
  if (!d) return ''
  try {
    return format(parseISO(d), 'd MMM yyyy', { locale: th })
  } catch {
    return d
  }
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ── Milestones ────────────────────────────────────────────────

function MilestoneItem({ m, studentId }: { m: Milestone; studentId: string }) {
  const [pendingDelete, setPendingDelete] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-line px-4 py-3.5 flex items-start gap-3 min-h-[44px]">
      <form action={toggleMilestone} className="shrink-0 mt-0.5">
        <input type="hidden" name="student_id" value={studentId} />
        <input type="hidden" name="milestone_id" value={m.id} />
        <input type="hidden" name="completed" value={m.completed_at ? 'true' : 'false'} />
        <button
          type="submit"
          role="checkbox"
          aria-checked={!!m.completed_at}
          aria-label={m.completed_at ? 'ยกเลิกเสร็จสิ้น' : 'ทำเครื่องหมายว่าเสร็จ'}
          className={[
            'rounded border-2 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
            m.completed_at
              ? 'border-accent bg-accent'
              : 'border-[oklch(72%_0.01_260)] bg-white hover:border-[oklch(50%_0.08_260)]',
          ].join(' ')}
          style={{ width: 18, height: 18 }}
        >
          {m.completed_at && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </form>
      <div className="flex-1 min-w-0">
        <p className={['text-sm font-medium', m.completed_at ? 'line-through text-[oklch(62%_0.01_260)]' : 'text-fg'].join(' ')}>
          {m.title}
        </p>
        {m.description && (
          <p className="text-xs text-fg-2 mt-0.5">{m.description}</p>
        )}
        {m.due_date && (
          <p className="text-xs text-[oklch(52%_0.01_260)] mt-0.5">
            กำหนด: {fmtDate(m.due_date)}
          </p>
        )}
        {m.completed_at && (
          <p className="text-xs text-[oklch(52%_0.08_145)] mt-0.5">
            เสร็จ: {fmtDate(m.completed_at.slice(0, 10))}
          </p>
        )}
      </div>
      <form action={deleteMilestone} className="shrink-0">
        <input type="hidden" name="student_id" value={studentId} />
        <input type="hidden" name="milestone_id" value={m.id} />
        {pendingDelete ? (
          <span className="flex items-center gap-1.5">
            <span className="text-xs text-[oklch(45%_0.18_25)]">ลบ?</span>
            <button
              type="submit"
              className="text-xs font-medium text-[oklch(45%_0.18_25)] hover:text-[oklch(35%_0.2_25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(55%_0.18_25)] rounded transition-colors"
            >
              ใช่
            </button>
            <button
              type="button"
              onClick={() => setPendingDelete(false)}
              className="text-xs text-fg-3 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors"
            >
              ยกเลิก
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setPendingDelete(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-[oklch(58%_0.01_260)] hover:text-[oklch(55%_0.18_25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(55%_0.18_25)] rounded transition-colors"
          >
            ลบ
          </button>
        )}
      </form>
    </div>
  )
}

function MilestoneSection({
  studentId,
  milestones,
}: {
  studentId: string
  milestones: Milestone[]
}) {
  const [adding, setAdding] = useState(false)
  const [, startTransition] = useTransition()
  const done = milestones.filter((m) => m.completed_at).length

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-fg">Milestones</h2>
          {milestones.length > 0 && (
            <p className="text-xs text-[oklch(52%_0.01_260)] mt-0.5">
              {done}/{milestones.length} เสร็จแล้ว
            </p>
          )}
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors"
          >
            + เพิ่ม milestone
          </button>
        )}
      </div>

      {adding && (
        <form
          action={async (fd) => {
            await createMilestone(fd)
            setAdding(false)
          }}
          className="bg-white rounded-xl border border-line p-5 space-y-4 mb-4"
        >
          <input type="hidden" name="student_id" value={studentId} />
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="milestone-title" className="block text-xs font-medium text-fg-label mb-1.5">ชื่อ milestone</label>
              <input
                id="milestone-title"
                name="title"
                type="text"
                required
                placeholder="เช่น ส่ง outline วิจัย"
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm placeholder:text-[oklch(62%_0.01_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              />
            </div>
            <div>
              <label htmlFor="milestone-due-date" className="block text-xs font-medium text-fg-label mb-1.5">กำหนดส่ง (ถ้ามี)</label>
              <input
                id="milestone-due-date"
                name="due_date"
                type="date"
                className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              />
            </div>
          </div>
          <div>
            <label htmlFor="milestone-description" className="block text-xs font-medium text-fg-label mb-1.5">รายละเอียด (ถ้ามี)</label>
            <textarea
              id="milestone-description"
              name="description"
              rows={2}
              placeholder="รายละเอียดเพิ่มเติม..."
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm placeholder:text-[oklch(62%_0.01_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 resize-y"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-[oklch(45%_0.01_260)] hover:text-[oklch(25%_0.02_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors">ยกเลิก</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors">เพิ่ม</button>
          </div>
        </form>
      )}

      {milestones.length === 0 && !adding ? (
        <p className="text-sm text-fg-3 py-4">ยังไม่มี milestone</p>
      ) : (
        <div className="space-y-2">
          {milestones.map((m) => (
            <MilestoneItem key={m.id} m={m} studentId={studentId} />
          ))}
        </div>
      )}
    </section>
  )
}

// ── Progress Notes ────────────────────────────────────────────

function ProgressNoteItem({ n, studentId }: { n: ProgressNote; studentId: string }) {
  const [pendingDelete, setPendingDelete] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-line px-5 py-4 flex gap-4 min-h-[44px]">
      <div className="shrink-0">
        <time className="text-xs font-medium text-[oklch(38%_0.08_260)] tabular-nums">
          {fmtDate(n.date)}
        </time>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[oklch(30%_0.02_260)] whitespace-pre-wrap leading-relaxed">{n.content}</p>
      </div>
      <form action={deleteProgressNote} className="shrink-0">
        <input type="hidden" name="student_id" value={studentId} />
        <input type="hidden" name="note_id" value={n.id} />
        {pendingDelete ? (
          <span className="flex items-center gap-1.5">
            <span className="text-xs text-[oklch(45%_0.18_25)]">ลบ?</span>
            <button
              type="submit"
              className="text-xs font-medium text-[oklch(45%_0.18_25)] hover:text-[oklch(35%_0.2_25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(55%_0.18_25)] rounded transition-colors"
            >
              ใช่
            </button>
            <button
              type="button"
              onClick={() => setPendingDelete(false)}
              className="text-xs text-fg-3 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors"
            >
              ยกเลิก
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setPendingDelete(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-[oklch(58%_0.01_260)] hover:text-[oklch(55%_0.18_25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(55%_0.18_25)] rounded transition-colors"
          >
            ลบ
          </button>
        )}
      </form>
    </div>
  )
}

function ProgressNotesSection({
  studentId,
  notes,
}: {
  studentId: string
  notes: ProgressNote[]
}) {
  const [adding, setAdding] = useState(false)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-fg">บันทึกความก้าวหน้า</h2>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors"
          >
            + เพิ่มบันทึก
          </button>
        )}
      </div>

      {adding && (
        <form
          action={async (fd) => {
            await createProgressNote(fd)
            setAdding(false)
          }}
          className="bg-white rounded-xl border border-line p-5 space-y-4 mb-4"
        >
          <input type="hidden" name="student_id" value={studentId} />
          <div>
            <label htmlFor="progress-date" className="block text-xs font-medium text-fg-label mb-1.5">วันที่</label>
            <input
              id="progress-date"
              name="date"
              type="date"
              required
              defaultValue={today()}
              className="w-full max-w-xs rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            />
          </div>
          <div>
            <label htmlFor="progress-content" className="block text-xs font-medium text-fg-label mb-1.5">เนื้อหา</label>
            <textarea
              id="progress-content"
              name="content"
              required
              rows={4}
              placeholder="สรุปความคืบหน้า..."
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm placeholder:text-[oklch(62%_0.01_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 resize-y"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)} className="px-4 py-2 text-sm text-[oklch(45%_0.01_260)] hover:text-[oklch(25%_0.02_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors">ยกเลิก</button>
            <button type="submit" className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors">บันทึก</button>
          </div>
        </form>
      )}

      {notes.length === 0 && !adding ? (
        <p className="text-sm text-fg-3 py-4">ยังไม่มีบันทึกความก้าวหน้า</p>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <ProgressNoteItem key={n.id} n={n} studentId={studentId} />
          ))}
        </div>
      )}
    </section>
  )
}

// ── File Uploads ──────────────────────────────────────────────

function FileItem({ f, studentId }: { f: FileUpload; studentId: string }) {
  const [pendingDelete, setPendingDelete] = useState(false)

  async function handleDownload() {
    const url = await getFileUrl(f.storage_path)
    const a = document.createElement('a')
    a.href = url
    a.download = f.filename
    a.click()
  }

  return (
    <div className="bg-white rounded-xl border border-line px-4 flex items-center gap-3 min-h-[44px]">
      <span className="text-lg shrink-0" aria-hidden="true">📄</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[oklch(22%_0.02_260)] truncate">{f.filename}</p>
        <p className="text-xs text-fg-3">
          {formatBytes(f.file_size)} · {fmtDate(f.uploaded_at.slice(0, 10))}
        </p>
      </div>
      <button
        onClick={handleDownload}
        className="text-xs text-[oklch(42%_0.08_260)] hover:text-[oklch(32%_0.12_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors"
      >
        ดาวน์โหลด
      </button>
      <form action={deleteFile}>
        <input type="hidden" name="student_id" value={studentId} />
        <input type="hidden" name="file_id" value={f.id} />
        <input type="hidden" name="storage_path" value={f.storage_path} />
        {pendingDelete ? (
          <span className="flex items-center gap-1.5">
            <span className="text-xs text-[oklch(45%_0.18_25)]">ลบ?</span>
            <button
              type="submit"
              className="text-xs font-medium text-[oklch(45%_0.18_25)] hover:text-[oklch(35%_0.2_25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(55%_0.18_25)] rounded transition-colors"
            >
              ใช่
            </button>
            <button
              type="button"
              onClick={() => setPendingDelete(false)}
              className="text-xs text-fg-3 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors"
            >
              ยกเลิก
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setPendingDelete(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-[oklch(58%_0.01_260)] hover:text-[oklch(55%_0.18_25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(55%_0.18_25)] rounded transition-colors"
          >
            ลบ
          </button>
        )}
      </form>
    </div>
  )
}

function FileUploadSection({
  studentId,
  files,
}: {
  studentId: string
  files: FileUpload[]
}) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-fg">เอกสาร / ไฟล์</h2>
      </div>

      <form
        action={async (fd) => {
          setError(null)
          const file = fd.get('file') as File
          if (!file || file.size === 0) return
          if (file.size > 10 * 1024 * 1024) {
            setError('ไฟล์ใหญ่เกิน 10 MB')
            return
          }
          setUploading(true)
          try {
            await uploadFile(fd)
          } catch (e) {
            setError((e as Error).message)
          } finally {
            setUploading(false)
          }
        }}
        className="mb-4"
      >
        <input type="hidden" name="student_id" value={studentId} />
        <label className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[oklch(80%_0.01_260)] bg-white hover:border-[oklch(60%_0.06_260)] hover:bg-[oklch(96%_0.008_260)] transition-colors cursor-pointer p-8 text-center">
          <span className="text-2xl" aria-hidden="true">📎</span>
          <span className="text-sm font-medium text-[oklch(35%_0.02_260)]">
            {uploading ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเลือกไฟล์'}
          </span>
          <span className="text-xs text-fg-3">PDF, DOCX, XLSX, รูปภาพ — สูงสุด 10 MB</span>
          <input
            name="file"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp"
            onChange={(e) => {
              if (e.target.form) e.target.form.requestSubmit()
            }}
            className="sr-only"
          />
        </label>
        {error && (
          <p className="mt-2 text-sm text-[oklch(42%_0.2_25)]">{error}</p>
        )}
      </form>

      {files.length === 0 ? (
        <p className="text-sm text-fg-3">ยังไม่มีไฟล์</p>
      ) : (
        <div className="space-y-2">
          {files.map((f) => (
            <FileItem key={f.id} f={f} studentId={studentId} />
          ))}
        </div>
      )}
    </section>
  )
}

// ── ResearchTab ───────────────────────────────────────────────

interface ResearchTabProps {
  studentId: string
  milestones: Milestone[]
  progressNotes: ProgressNote[]
  files: FileUpload[]
}

export function ResearchTab({ studentId, milestones, progressNotes, files }: ResearchTabProps) {
  return (
    <div className="pt-6 space-y-10">
      <MilestoneSection studentId={studentId} milestones={milestones} />
      <ProgressNotesSection studentId={studentId} notes={progressNotes} />
      <FileUploadSection studentId={studentId} files={files} />
    </div>
  )
}
