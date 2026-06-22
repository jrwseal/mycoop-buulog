'use client'

import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import { createNote, updateNote, deleteNote } from '@/app/students/[id]/notes/actions'
import type { MeetingNote } from '@/lib/types'

interface NotesListProps {
  studentId: string
  notes: MeetingNote[]
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function NoteForm({
  studentId,
  initial,
  onCancel,
}: {
  studentId: string
  initial?: MeetingNote
  onCancel: () => void
}) {
  const action = initial ? updateNote : createNote
  const prefix = initial ? `note-${initial.id}` : 'note-new'

  return (
    <form action={action} className="bg-white rounded-xl border border-line p-5 space-y-4">
      <input type="hidden" name="student_id" value={studentId} />
      {initial && <input type="hidden" name="note_id" value={initial.id} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`${prefix}-date`} className="block text-xs font-medium text-fg-label mb-1.5">
            วันที่
          </label>
          <input
            id={`${prefix}-date`}
            name="date"
            type="date"
            required
            defaultValue={initial?.date ?? today()}
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </div>
        <div>
          <label htmlFor={`${prefix}-title`} className="block text-xs font-medium text-fg-label mb-1.5">
            หัวข้อ
          </label>
          <input
            id={`${prefix}-title`}
            name="title"
            type="text"
            required
            defaultValue={initial?.title ?? ''}
            placeholder="หัวข้อการประชุม"
            className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-fg placeholder:text-[oklch(62%_0.01_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${prefix}-content`} className="block text-xs font-medium text-fg-label mb-1.5">
          เนื้อหา
        </label>
        <textarea
          id={`${prefix}-content`}
          name="content"
          required
          rows={5}
          defaultValue={initial?.content ?? ''}
          placeholder="บันทึกรายละเอียดการประชุม..."
          className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-fg placeholder:text-[oklch(62%_0.01_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 resize-y"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-[oklch(45%_0.01_260)] hover:text-[oklch(25%_0.02_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded transition-colors"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors"
        >
          {initial ? 'บันทึก' : 'เพิ่มบันทึก'}
        </button>
      </div>
    </form>
  )
}

function NoteCard({
  note,
  studentId,
}: {
  note: MeetingNote
  studentId: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(false)

  if (editing) {
    return (
      <NoteForm
        studentId={studentId}
        initial={note}
        onCancel={() => setEditing(false)}
      />
    )
  }

  const dateLabel = (() => {
    try {
      return format(parseISO(note.date), 'd MMMM yyyy', { locale: th })
    } catch {
      return note.date
    }
  })()

  const showExpand = note.content.split('\n').length > 3 || note.content.length > 200

  return (
    <div className="bg-white rounded-xl border border-line p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <time className="text-xs text-[oklch(52%_0.01_260)]">{dateLabel}</time>
          <h3 className="font-medium text-[oklch(18%_0.02_260)] mt-0.5">{note.title}</h3>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-[oklch(52%_0.01_260)] hover:text-[oklch(32%_0.02_260)] hover:bg-[oklch(94%_0.008_260)] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            แก้ไข
          </button>
          <form action={deleteNote}>
            <input type="hidden" name="student_id" value={studentId} />
            <input type="hidden" name="note_id" value={note.id} />
            {pendingDelete ? (
              <span className="flex items-center gap-1.5 min-h-[44px] px-1">
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
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-fg-3 hover:text-[oklch(55%_0.18_25)] rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(55%_0.18_25)]"
              >
                ลบ
              </button>
            )}
          </form>
        </div>
      </div>

      <div
        className={[
          'text-sm text-[oklch(32%_0.02_260)] whitespace-pre-wrap leading-relaxed',
          !expanded ? 'line-clamp-3' : '',
        ].join(' ')}
      >
        {note.content}
      </div>
      {showExpand && (
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="mt-2 text-xs text-[oklch(48%_0.06_260)] hover:text-[oklch(38%_0.1_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded transition-colors"
        >
          {expanded ? 'ย่อ' : 'ดูเพิ่มเติม'}
        </button>
      )}
    </div>
  )
}

export function NotesList({ studentId, notes }: NotesListProps) {
  const [adding, setAdding] = useState(false)

  return (
    <div className="pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-fg">
          บันทึกการประชุม
        </h2>
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
        <NoteForm studentId={studentId} onCancel={() => setAdding(false)} />
      )}

      {notes.length === 0 && !adding ? (
        <div className="text-center py-16 text-fg-3">
          <p className="font-medium mb-1">ยังไม่มีบันทึก</p>
          <p className="text-sm">กด &ldquo;+ เพิ่มบันทึก&rdquo; เพื่อเพิ่มบันทึกแรก</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} studentId={studentId} />
          ))}
        </div>
      )}
    </div>
  )
}
