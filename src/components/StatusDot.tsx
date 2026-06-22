import { differenceInDays, parseISO } from 'date-fns'

interface StatusDotProps {
  lastConsultation: string | null | undefined
}

export function StatusDot({ lastConsultation }: StatusDotProps) {
  if (!lastConsultation) {
    return (
      <span className="inline-flex items-center">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 rounded-full bg-[oklch(75%_0.01_260)] ring-2 ring-white"
        />
        <span className="sr-only">ยังไม่มีการปรึกษา</span>
      </span>
    )
  }

  const days = differenceInDays(new Date(), parseISO(lastConsultation))

  if (days < 7) {
    return (
      <span className="inline-flex items-center">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 rounded-full bg-[oklch(62%_0.17_145)] ring-2 ring-white"
        />
        <span className="sr-only">ปรึกษาล่าสุด {days} วันที่แล้ว</span>
      </span>
    )
  }
  if (days < 14) {
    return (
      <span className="inline-flex items-center">
        <span
          aria-hidden="true"
          className="inline-block h-2.5 w-2.5 rounded-full bg-[oklch(75%_0.18_85)] ring-2 ring-white"
        />
        <span className="sr-only">ปรึกษาล่าสุด {days} วันที่แล้ว</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center">
      <span
        aria-hidden="true"
        className="inline-block h-2.5 w-2.5 rounded-full bg-[oklch(60%_0.2_25)] ring-2 ring-white"
      />
      <span className="sr-only">ปรึกษาล่าสุด {days} วันที่แล้ว</span>
    </span>
  )
}
