import { useEffect, useMemo, useState } from 'react'
import type { AppView, AuthUser, CardOption } from './types'
import LoginView from './auth/LoginView'
import CardSetupView from './cards/CardSetupView'
import DashboardView from './dashboard/DashboardView'
import DashboardSavingsView from './dashboard/SavingsView'
import {
  fetchCardSelections,
  fetchCards,
  fetchCheckoutRecommendation,
  fetchUserSavings,
  type UserSavingsResponse,
  loginUser,
  logoutUser,
  saveCardSelection,
  type CheckoutPreview,
} from './services/api'
import CardwiseLogo from './assets/cardwise-logo.svg'

const APP_BACKGROUND = 'bg-slate-950'
const NAV_BUTTON_BASE = 'rounded-full px-3 py-1 transition'
const NAV_BUTTON_ACTIVE = 'bg-emerald-500 text-slate-950'
const NAV_BUTTON_INACTIVE = 'text-slate-400 hover:text-emerald-200'
const AUTH_STORAGE_KEY = 'cardwise-current-user'

function App() {
  const [view, setView] = useState<AppView>('login')
  const [selectedCards, setSelectedCards] = useState<CardOption[]>([])
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [allCards, setAllCards] = useState<CardOption[]>([])
  const [cardLoadError, setCardLoadError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [checkoutPreview, setCheckoutPreview] = useState<CheckoutPreview | null>(null)
  const [isPreviewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [userSavings, setUserSavings] = useState<UserSavingsResponse | null>(null)
  const [savingsError, setSavingsError] = useState<string | null>(null)

  useEffect(() => {
    fetchCards()
      .then((cards) => {
        setAllCards(cards)
        setCardLoadError(null)
      })
      .catch((error) => {
        console.error('Failed to load cards', error)
        setCardLoadError(error instanceof Error ? error.message : 'Failed to load cards')
      })
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tokenParam = params.get('token')
    if (tokenParam) {
      setView('dashboard')
      setPreviewLoading(true)
      fetchCheckoutRecommendation(tokenParam)
        .then((detail) => {
          setCheckoutPreview(detail)
          setPreviewError(null)
        })
        .catch((error) => {
          console.error('Failed to fetch checkout preview', error)
          setPreviewError(error instanceof Error ? error.message : 'Failed to load recommendation')
          setCheckoutPreview(null)
        })
        .finally(() => {
          setPreviewLoading(false)
        })
    }

    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser
        setAuthUser(parsed)
        setView('dashboard')
      } catch (error) {
        console.warn('Failed to parse stored user', error)
        window.localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
  }, [])

  useEffect(() => {
    if (!authUser) {
      setUserSavings(null)
      return
    }

    fetchUserSavings(authUser.id)
      .then((data) => {
        setUserSavings(data)
        setSavingsError(null)
      })
      .catch((error) => {
        console.error('Failed to fetch user savings', error)
        setSavingsError(error instanceof Error ? error.message : 'Failed to load savings')
        setUserSavings(null)
      })
  }, [authUser])

  useEffect(() => {
    if (!authUser) return

    fetchCardSelections(authUser.id)
      .then((selectionIds) => {
        setSelectedCards((prev) => {
          const source = allCards.length > 0 ? allCards : prev
          return source.filter((card) => selectionIds.includes(card.id))
        })
      })
      .catch((error) => {
        console.error('Failed to fetch selections', error)
      })
  }, [authUser, allCards])

  useEffect(() => {
    if (!authUser) return
    const ids = selectedCards.map((card) => card.id)
    saveCardSelection(authUser.id, ids).catch((error) => {
      console.error('Failed to persist card selections', error)
    })
  }, [selectedCards, authUser])

  const handleLogin = async (payload: { email: string; firstName: string; lastName: string }) => {
    try {
      const user = await loginUser(payload.email, payload.firstName, payload.lastName)
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
      setAuthUser(user)
      setView('card-setup')
      setLoginError(null)
    } catch (error) {
      console.error('Login failed', error)
      setLoginError(error instanceof Error ? error.message : 'Login failed')
    }
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error('Logout failed', error)
    }
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuthUser(null)
    setSelectedCards([])
    setView('login')
  }

  const handleCardToggle = (card: CardOption) => {
    setSelectedCards((current) => {
      const exists = current.some((item) => item.id === card.id)
      return exists ? current.filter((item) => item.id !== card.id) : [...current, card]
    })
  }

  const mainView = useMemo(() => {
    if (!authUser) {
      return <LoginView onContinue={handleLogin} errorMessage={loginError} />
    }

    switch (view) {
      case 'card-setup':
        return (
          <CardSetupView
            selectedCards={selectedCards}
            onToggleCard={handleCardToggle}
            onContinue={() => setView('dashboard')}
            availableCards={allCards}
          />
        )
      case 'savings':
        return (
          <DashboardSavingsView
            onBack={() => setView('dashboard')}
            savings={userSavings}
            error={savingsError}
          />
        )
      case 'dashboard':
      default:
        return (
          <DashboardView
            selectedCards={selectedCards}
            onReset={() => setView('card-setup')}
            onOpenSavings={() => setView('savings')}
            checkoutPreview={checkoutPreview}
            previewLoading={isPreviewLoading}
            previewError={previewError}
          />
        )
    }
  }, [authUser, view, selectedCards, allCards, checkoutPreview, isPreviewLoading, previewError, userSavings, savingsError])

  return (
    <div className={`${APP_BACKGROUND} min-h-screen w-full text-slate-100`}>
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col rounded-[32px] border border-slate-800/60 bg-slate-950/75 px-5 py-10 shadow-[0_30px_80px_rgba(14,164,122,0.18)] backdrop-blur-xl sm:px-6 md:px-12">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={CardwiseLogo} alt="Cardwise" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Crediwise</h1>
              <p className="text-sm text-slate-400">Outsmart your checkout with the right card</p>
            </div>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            {authUser ? (
              <>
                <span className="hidden rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-slate-100 md:inline-flex">
                  {authUser.firstName} {authUser.lastName}
                </span>
                <button
                  onClick={() => setView('card-setup')}
                  className={`${NAV_BUTTON_BASE} ${
                    view === 'card-setup' ? NAV_BUTTON_ACTIVE : NAV_BUTTON_INACTIVE
                  }`}
                >
                  Card Setup
                </button>
                <button
                  onClick={() => setView('dashboard')}
                  className={`${NAV_BUTTON_BASE} ${
                    view === 'dashboard' ? NAV_BUTTON_ACTIVE : NAV_BUTTON_INACTIVE
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setView('savings')}
                  className={`${NAV_BUTTON_BASE} ${
                    view === 'savings' ? NAV_BUTTON_ACTIVE : NAV_BUTTON_INACTIVE
                  }`}
                >
                  Savings
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-emerald-500/40 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500 hover:text-slate-950"
                >
                  Logout
                </button>
              </>
            ) : (
              <button className="rounded-full bg-emerald-500 px-3 py-1 text-slate-950 hover:bg-emerald-400">
                Login
              </button>
            )}
          </nav>
        </header>

        <main className="flex-1">{mainView}</main>
        {cardLoadError && (
          <p className="mt-6 text-center text-sm text-rose-400">{cardLoadError}</p>
        )}
        {loginError && !authUser && (
          <p className="mt-6 text-center text-sm text-rose-400">{loginError}</p>
        )}
        {previewError && (
          <p className="mt-6 text-center text-sm text-rose-400">{previewError}</p>
        )}
        {savingsError && view === 'savings' && (
          <p className="mt-6 text-center text-sm text-rose-400">{savingsError}</p>
        )}
      </div>
    </div>
  )
}

export default App
