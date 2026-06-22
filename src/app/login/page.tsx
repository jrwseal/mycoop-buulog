import { signIn } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-fg tracking-tight">
            MyCoop
          </h1>
          <p className="mt-1 text-sm text-fg-2">
            ระบบติดตามนิสิตสหกิจศึกษา
          </p>
        </div>

        <div className="bg-white border border-line rounded-2xl p-8 shadow-sm">
        <form action={signIn} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[oklch(30%_0.02_260)] mb-1.5"
            >
              อีเมล
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-fg placeholder:text-[oklch(65%_0.01_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              placeholder="professor@university.ac.th"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[oklch(30%_0.02_260)] mb-1.5"
            >
              รหัสผ่าน
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm text-fg placeholder:text-[oklch(65%_0.01_260)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-[oklch(42%_0.2_25)] bg-[oklch(97%_0.04_25)] border border-[oklch(82%_0.08_25)] rounded-lg px-3 py-2">
              {decodeURIComponent(error)}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 transition-colors"
          >
            เข้าสู่ระบบ
          </button>
        </form>
        </div>
      </div>
    </div>
  )
}
