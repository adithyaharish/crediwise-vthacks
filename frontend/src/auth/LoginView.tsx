import type { FormEvent } from 'react'

const SURFACE = 'bg-slate-800'
const ACCENT = 'text-indigo-400'

type LoginViewProps = {
  onContinue: (payload: { email: string; firstName: string; lastName: string }) => void
  errorMessage?: string | null
}

function LoginView({ onContinue, errorMessage }: LoginViewProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email') ?? '').trim()
    const firstName = String(data.get('firstName') ?? '').trim()
    const lastName = String(data.get('lastName') ?? '').trim()

    if (!email || !firstName || !lastName) return
    onContinue({ email, firstName, lastName })
  }

  return (
    <div className={`${SURFACE} rounded-3xl p-10 shadow-xl`}>
      <div className="mb-8">
        <p className={`${ACCENT} text-sm font-medium uppercase tracking-wide`}>Step 1</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Log in</h2>
        <p className="mt-2 text-sm text-slate-400">
          Access personalized card rewards and checkout recommendations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="firstName">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              required
              placeholder="John"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="lastName">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              required
              placeholder="Doe"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
        >
          Continue to card setup
        </button>
      </form>
    </div>
  )
}

export default LoginView
