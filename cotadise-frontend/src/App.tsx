import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api'

type Summary = {
  totalCotisations: number
  totalAmount: number
  totalPaidAmount: number
  totalRemainingAmount: number
  totalPaid: number
  totalPartial: number
  totalPending: number
  totalOverdue: number
  totalOverdueAmount: number
  totalPayments: number
}

type Level = {
  id: string
  name: string
  description: string | null
  annualAmount: number
}

type AcademicYear = {
  id: string
  libelle: string
  statut: string
  active: boolean
  dateDebut: string
  dateFin: string
}

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  role: string
  promotionSortante?: string | null
  level?: Level | null
}

type Cotisation = {
  id: string
  title: string
  description?: string | null
  amount: number
  paidAmount?: number
  dueDate: string
  status: string
  paid: boolean
  user?: User
}

type Paiement = {
  id: string
  amount: number
  method: string
  reference?: string | null
  paidAt?: string
  status?: string
  origin?: string
  cotisation?: Cotisation
  user?: User
}

type DonAlumni = {
  id: string
  amount: number
  method: string
  status: string
  origin: string
  reference?: string | null
  donatedAt?: string
  alumni?: User
  recordedBy?: User | null
}

type PromotionAlumni = {
  promotion: string
  totalAlumni: number
  alumni: User[]
}

type Defi = {
  id: string
  status: string
  challenger: User
  opponent: User
  winner?: User | null
  challengerProgress?: number
  opponentProgress?: number
  createdAt?: string
  completedAt?: string | null
}

type Adherent = {
  id: string
  membershipNumber: string
  status: string
}

type Ranking = {
  userId?: string
  firstName?: string
  lastName?: string
  level?: string | Pick<Level, 'id' | 'name'> | null
  paidAmount?: number
  totalAmount?: number
  expectedAmount?: number
  progress?: number
  percentage?: number
}

type StudentSummary = {
  user: User
  level: Pick<Level, 'id' | 'name' | 'annualAmount'> | null
  totalAmount: number
  totalPaidAmount: number
  totalRemainingAmount: number
  progress: number
  lastPayment: string | null
  cotisations: Cotisation[]
  payments: Paiement[]
}

type StudentRanking = {
  user: User
  level: Pick<Level, 'id' | 'name' | 'annualAmount'> | null
  rank: number | null
  totalInLevel: number
  rankings: Ranking[]
}

type Notice = {
  kind: 'success' | 'error'
  message: string
}

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
})

const formatCurrency = (value = 0) => currencyFormatter.format(value)

const getFullName = (user?: User | null) => {
  if (!user) return 'Non assigne'
  return `${user.firstName} ${user.lastName}`
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    paid: 'Payee',
    partial: 'Partielle',
    pending: 'En attente',
    overdue: 'En retard',
    confirme: 'Confirme',
    en_attente: 'En attente',
    initie: 'Initie',
    echoue: 'Echoue',
    annule: 'Annule',
    termine: 'Termine',
    accepte: 'Accepte',
    refuse: 'Refuse',
    don_wave: 'Don Wave',
    don_main_a_main: 'Don main a main',
    main_a_main: 'Main a main',
    paiement_pour_camarade: 'Pour camarade',
  }
  return labels[status] ?? status
}

const getRankingLevelName = (level?: Ranking['level']) => {
  if (!level) return '-'
  return typeof level === 'string' ? level : level.name
}

const getStoredUser = () => {
  const stored = localStorage.getItem('cotadise_user')
  if (!stored) return null
  try {
    return JSON.parse(stored) as User
  } catch {
    localStorage.removeItem('cotadise_user')
    return null
  }
}

const toQueryString = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value)
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

const request = async <T,>(path: string, token: string, init: RequestInit = {}) => {
  const isFormData = init.body instanceof FormData
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'omit',
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.message || response.statusText)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

const downloadFile = async (path: string, token: string, filename: string) => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Impossible de telecharger le fichier')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('cotadise_token') || '')
  const [user, setUser] = useState<User | null>(getStoredUser)
  const [activeTab, setActiveTab] = useState('summary')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [studentSummary, setStudentSummary] = useState<StudentSummary | null>(null)
  const [studentRanking, setStudentRanking] = useState<StudentRanking | null>(null)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('')
  const [selectedLevelId, setSelectedLevelId] = useState('')
  const [levels, setLevels] = useState<Level[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [cotisations, setCotisations] = useState<Cotisation[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [dons, setDons] = useState<DonAlumni[]>([])
  const [promotionsAlumni, setPromotionsAlumni] = useState<PromotionAlumni[]>([])
  const [defis, setDefis] = useState<Defi[]>([])
  const [adherents, setAdherents] = useState<Adherent[]>([])
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [email, setEmail] = useState('admin@cotadise.local')
  const [password, setPassword] = useState('Admin123!')
  const [levelForm, setLevelForm] = useState({ name: '', description: '', annualAmount: '' })
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    levelId: '',
    role: 'etudiant',
    password: 'Password123!',
  })
  const [cotisationForm, setCotisationForm] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: '',
    userId: '',
  })
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Mobile Money',
    reference: '',
    cotisationId: '',
    userId: '',
  })
  const [importFile, setImportFile] = useState<File | null>(null)

  const students = useMemo(() => users.filter(item => item.role === 'etudiant'), [users])
  const alumni = useMemo(() => users.filter(item => item.role === 'alumni'), [users])
  const isConnected = Boolean(token)
  const isAdmin = user?.role === 'admin' || user?.role === 'tresorier'

  const dashboardTotals = useMemo(() => {
    const scoped = Boolean(selectedAcademicYearId || selectedLevelId)
    const totalAmount = cotisations.reduce((sum, item) => sum + item.amount, 0)
    const totalPaidAmount = cotisations.reduce((sum, item) => sum + (item.paidAmount ?? 0), 0)
    const totalRemainingAmount = cotisations.reduce((sum, item) => sum + Math.max(0, item.amount - (item.paidAmount ?? 0)), 0)
    const overdueCotisations = cotisations.filter(item => !item.paid && new Date(item.dueDate) < new Date())
    const totalOverdueAmount = overdueCotisations.reduce((sum, item) => sum + Math.max(0, item.amount - (item.paidAmount ?? 0)), 0)

    return {
      totalAmount: scoped ? totalAmount : totalAmount || summary?.totalAmount || 0,
      totalPaidAmount: scoped ? totalPaidAmount : totalPaidAmount || summary?.totalPaidAmount || 0,
      totalRemainingAmount: scoped ? totalRemainingAmount : totalRemainingAmount || summary?.totalRemainingAmount || 0,
      totalOverdue: scoped ? overdueCotisations.length : overdueCotisations.length || summary?.totalOverdue || 0,
      totalOverdueAmount: scoped ? totalOverdueAmount : totalOverdueAmount || summary?.totalOverdueAmount || 0,
    }
  }, [cotisations, selectedAcademicYearId, selectedLevelId, summary])

  const completionRate = useMemo(() => {
    if (dashboardTotals.totalAmount <= 0) return 0
    return Math.min(100, Math.round((dashboardTotals.totalPaidAmount / dashboardTotals.totalAmount) * 100))
  }, [dashboardTotals])

  const adminQuery = useMemo(
    () => toQueryString({ anneeId: selectedAcademicYearId, levelId: selectedLevelId }),
    [selectedAcademicYearId, selectedLevelId],
  )

  const selectedAcademicYear = useMemo(
    () => academicYears.find(item => item.id === selectedAcademicYearId),
    [academicYears, selectedAcademicYearId],
  )

  const dashboardYearQuery = useMemo(
    () => toQueryString({ anneeId: selectedAcademicYearId }),
    [selectedAcademicYearId],
  )

  const overdueExportPath = useMemo(() => {
    if (selectedLevelId) return `/dashboard/overdue/level/${selectedLevelId}/export${dashboardYearQuery}`
    return `/dashboard/overdue/export${dashboardYearQuery}`
  }, [dashboardYearQuery, selectedLevelId])

  const cotisationsExportPath = `/cotisations/export${adminQuery}`
  const paiementsExportPath = `/paiements/export${adminQuery}`

  const adminIndicators = useMemo(() => {
    const fullyPaidStudents = new Set(cotisations.filter(item => item.paid || (item.paidAmount ?? 0) >= item.amount).map(item => item.user?.id).filter(Boolean))
    const partialStudents = new Set(cotisations.filter(item => !item.paid && (item.paidAmount ?? 0) > 0 && (item.paidAmount ?? 0) < item.amount).map(item => item.user?.id).filter(Boolean))
    const zeroPaymentStudents = new Set(cotisations.filter(item => (item.paidAmount ?? 0) <= 0 && !item.paid).map(item => item.user?.id).filter(Boolean))
    const confirmedPayments = paiements.filter(item => !item.status || item.status === 'confirme')
    const pendingPayments = paiements.filter(item => item.status === 'en_attente' || item.status === 'initie')
    const failedPayments = paiements.filter(item => item.status === 'echoue' || item.status === 'annule')
    const friendPayments = paiements.filter(item => item.origin === 'paiement_pour_camarade')
    const cashPayments = paiements.filter(item => item.origin === 'main_a_main')
    const confirmedDons = dons.filter(item => item.status === 'confirme')
    const activeDefis = defis.filter(item => item.status === 'en_attente' || item.status === 'accepte')
    const completedDefis = defis.filter(item => item.status === 'termine')

    return {
      fullyPaidStudents: fullyPaidStudents.size,
      partialStudents: partialStudents.size,
      zeroPaymentStudents: zeroPaymentStudents.size,
      confirmedPayments: confirmedPayments.length,
      pendingPayments: pendingPayments.length,
      failedPayments: failedPayments.length,
      friendPayments: friendPayments.length,
      cashPayments: cashPayments.length,
      totalDonAmount: confirmedDons.reduce((sum, item) => sum + item.amount, 0),
      totalDons: confirmedDons.length,
      activeDefis: activeDefis.length,
      completedDefis: completedDefis.length,
      alumniCount: alumni.length,
      promotionCount: promotionsAlumni.length,
    }
  }, [alumni.length, cotisations, defis, dons, paiements, promotionsAlumni.length])

  const loadData = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setNotice(null)

    if (!isAdmin) {
      const results = await Promise.allSettled([
        request<StudentSummary>('/dashboard/me', token),
        request<Cotisation[]>('/cotisations/me', token),
        request<Paiement[]>('/paiements/me', token),
        request<StudentRanking>('/dashboard/rankings/me', token),
      ])

      const [summaryResult, cotisationsResult, paiementsResult, rankingResult] = results
      if (summaryResult.status === 'fulfilled') {
        setStudentSummary(summaryResult.value)
        setUser(summaryResult.value.user)
        localStorage.setItem('cotadise_user', JSON.stringify(summaryResult.value.user))
      }
      if (cotisationsResult.status === 'fulfilled') setCotisations(cotisationsResult.value)
      if (paiementsResult.status === 'fulfilled') setPaiements(paiementsResult.value)
      if (rankingResult.status === 'fulfilled') {
        setStudentRanking(rankingResult.value)
        setRankings(rankingResult.value.rankings)
      }

      const rejected = results.find(result => result.status === 'rejected') as PromiseRejectedResult | undefined
      if (rejected) {
        setNotice({ kind: 'error', message: rejected.reason?.message || 'Erreur de chargement' })
      }

      setLoading(false)
      return
    }

    const results = await Promise.allSettled([
      request<Summary>(`/dashboard/summary${toQueryString({ anneeId: selectedAcademicYearId })}`, token),
      request<AcademicYear[]>('/annees-academiques', token),
      request<Level[]>('/levels', token),
      request<User[]>('/users', token),
      request<Cotisation[]>(`/cotisations${adminQuery}`, token),
      request<Paiement[]>(`/paiements${adminQuery}`, token),
      request<Adherent[]>('/adherents', token),
      request<Ranking[]>(selectedLevelId ? `/dashboard/rankings/level/${selectedLevelId}${toQueryString({ anneeId: selectedAcademicYearId })}` : `/dashboard/rankings${toQueryString({ anneeId: selectedAcademicYearId })}`, token),
      request<DonAlumni[]>('/dons', token),
      request<PromotionAlumni[]>('/alumni/promotions', token),
      request<Defi[]>('/defis', token),
    ])

    const [summaryResult, yearsResult, levelsResult, usersResult, cotisationsResult, paiementsResult, adherentsResult, rankingsResult, donsResult, promotionsResult, defisResult] = results
    if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value)
    if (yearsResult.status === 'fulfilled') {
      setAcademicYears(yearsResult.value)
      if (!selectedAcademicYearId) {
        const activeYear = yearsResult.value.find(item => item.active)
        if (activeYear) setSelectedAcademicYearId(activeYear.id)
      }
    }
    if (levelsResult.status === 'fulfilled') setLevels(levelsResult.value)
    if (usersResult.status === 'fulfilled') setUsers(usersResult.value)
    if (cotisationsResult.status === 'fulfilled') setCotisations(cotisationsResult.value)
    if (paiementsResult.status === 'fulfilled') setPaiements(paiementsResult.value)
    if (adherentsResult.status === 'fulfilled') setAdherents(adherentsResult.value)
    if (rankingsResult.status === 'fulfilled') setRankings(rankingsResult.value)
    if (donsResult.status === 'fulfilled') setDons(donsResult.value)
    if (promotionsResult.status === 'fulfilled') setPromotionsAlumni(promotionsResult.value)
    if (defisResult.status === 'fulfilled') setDefis(defisResult.value)

    const rejected = results.find(result => result.status === 'rejected') as PromiseRejectedResult | undefined
    if (rejected) {
      setNotice({ kind: 'error', message: rejected.reason?.message || 'Erreur de chargement' })
    }

    setLoading(false)
  }, [adminQuery, isAdmin, selectedAcademicYearId, selectedLevelId, token])

  useEffect(() => {
    loadData().catch(err => {
      setLoading(false)
      setNotice({ kind: 'error', message: err.message || 'Erreur inattendue' })
    })
  }, [loadData])

  const runAction = async (successMessage: string, action: () => Promise<unknown>) => {
    setLoading(true)
    setNotice(null)
    try {
      await action()
      setNotice({ kind: 'success', message: successMessage })
      await loadData()
    } catch (err: any) {
      setNotice({ kind: 'error', message: err.message || 'Action impossible' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setNotice(null)
    try {
      const data = await request<{ accessToken: string; user: User }>('/auth/login', '', {
        method: 'POST',
        body: JSON.stringify({ identifier: email, password }),
      })
      setToken(data.accessToken)
      setUser(data.user)
      localStorage.setItem('cotadise_token', data.accessToken)
      localStorage.setItem('cotadise_user', JSON.stringify(data.user))
      setNotice({ kind: 'success', message: 'Connexion reussie' })
    } catch (err: any) {
      setNotice({ kind: 'error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setToken('')
    setUser(null)
    setSummary(null)
    setStudentSummary(null)
    setStudentRanking(null)
    setAcademicYears([])
    setSelectedAcademicYearId('')
    setSelectedLevelId('')
    setLevels([])
    setUsers([])
    setCotisations([])
    setPaiements([])
    setDons([])
    setPromotionsAlumni([])
    setDefis([])
    setAdherents([])
    setRankings([])
    localStorage.removeItem('cotadise_token')
    localStorage.removeItem('cotadise_user')
  }

  const createLevel = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runAction('Niveau ajoute', async () => {
      await request('/levels', token, {
        method: 'POST',
        body: JSON.stringify({
          ...levelForm,
          annualAmount: Number(levelForm.annualAmount),
        }),
      })
      setLevelForm({ name: '', description: '', annualAmount: '' })
    })
  }

  const createUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runAction('Utilisateur ajoute', async () => {
      await request('/users', token, {
        method: 'POST',
        body: JSON.stringify({
          ...userForm,
          levelId: userForm.levelId || undefined,
          phone: userForm.phone || undefined,
        }),
      })
      setUserForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        levelId: '',
        role: 'etudiant',
        password: 'Password123!',
      })
    })
  }

  const createCotisation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runAction('Cotisation creee', async () => {
      await request('/cotisations', token, {
        method: 'POST',
        body: JSON.stringify({
          ...cotisationForm,
          amount: Number(cotisationForm.amount),
          description: cotisationForm.description || undefined,
        }),
      })
      setCotisationForm({ title: '', description: '', amount: '', dueDate: '', userId: '' })
    })
  }

  const createPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runAction('Paiement enregistre', async () => {
      await request('/paiements', token, {
        method: 'POST',
        body: JSON.stringify({
          ...paymentForm,
          amount: Number(paymentForm.amount),
          reference: paymentForm.reference || undefined,
          userId: paymentForm.userId || undefined,
        }),
      })
      setPaymentForm({ amount: '', method: 'Mobile Money', reference: '', cotisationId: '', userId: '' })
    })
  }

  const importStudents = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!importFile) {
      setNotice({ kind: 'error', message: 'Selectionnez un fichier CSV ou Excel' })
      return
    }

    runAction('Import termine', async () => {
      const formData = new FormData()
      formData.append('file', importFile)
      await request('/users/import', token, {
        method: 'POST',
        body: formData,
      })
      setImportFile(null)
    })
  }

  const handleDownload = (path: string, filename: string) => {
    runAction('Export prepare', () => downloadFile(path, token, filename))
  }

  const studentPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runAction('Paiement envoye', async () => {
      await request('/paiements', token, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(paymentForm.amount),
          method: paymentForm.method,
          reference: paymentForm.reference || undefined,
          cotisationId: paymentForm.cotisationId,
        }),
      })
      setPaymentForm({ amount: '', method: 'Mobile Money', reference: '', cotisationId: '', userId: '' })
    })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <span className="brand">CotaDISE</span>
          <span className="subtitle">Cotisations de la Division ISE</span>
        </div>
        {isConnected && (
          <div className="user-chip">
            <span>{user ? getFullName(user) : 'Session admin'}</span>
            <button type="button" onClick={handleLogout}>Deconnexion</button>
          </div>
        )}
      </header>

      <main className="content">
        {!isConnected ? (
          <section className="login-layout">
            <div className="login-copy">
              <span className="eyebrow">Administration</span>
              <h1>Suivre, relancer et encaisser les cotisations sans tableur disperse.</h1>
              <p>
                Connectez-vous pour piloter les niveaux, les etudiants, les paiements et les exports financiers.
              </p>
            </div>

            <form onSubmit={handleLogin} className="panel login-form">
              <label>
                Email
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </label>
              <label>
                Mot de passe
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </label>
              <button type="submit" className="cta" disabled={loading}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
              {notice && <p className={`notice ${notice.kind}`}>{notice.message}</p>}
            </form>
          </section>
        ) : !isAdmin ? (
          <>
            <section className="hero-panel student-hero">
              <div>
                <p className="eyebrow">Espace etudiant</p>
                <h1>{studentSummary?.progress ?? 0}% de votre objectif atteint</h1>
                <p>
                  Suivez vos cotisations, consultez vos versements et gardez une trace claire de votre contribution.
                </p>
              </div>
              <div className="hero-actions">
                <button type="button" className="ghost" onClick={() => handleDownload('/cotisations/me/export', 'mes-cotisations.xlsx')}>
                  Mes cotisations
                </button>
                <button type="button" className="ghost" onClick={() => handleDownload('/paiements/me/export', 'mes-paiements.xlsx')}>
                  Mes paiements
                </button>
                <button type="button" className="ghost" onClick={loadData}>
                  Actualiser
                </button>
              </div>
            </section>

            <section className="summary-strip">
              <article>
                <span>Niveau</span>
                <strong>{studentSummary?.level?.name ?? '-'}</strong>
              </article>
              <article>
                <span>Montant attendu</span>
                <strong>{formatCurrency(studentSummary?.level?.annualAmount ?? studentSummary?.totalAmount ?? 0)}</strong>
              </article>
              <article>
                <span>Deja verse</span>
                <strong>{formatCurrency(studentSummary?.totalPaidAmount ?? 0)}</strong>
              </article>
              <article>
                <span>Reste a payer</span>
                <strong>{formatCurrency(studentSummary?.totalRemainingAmount ?? 0)}</strong>
              </article>
            </section>

            {loading && <div className="status-banner">Chargement de votre espace...</div>}
            {notice && <div className={`status-banner ${notice.kind === 'error' ? 'status-error' : 'status-success'}`}>{notice.message}</div>}

            <section className="dashboard-grid">
              <div className="panel progress-panel">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">Progression personnelle</p>
                    <h2>{getFullName(user)}</h2>
                  </div>
                  <strong>{studentSummary?.progress ?? 0}%</strong>
                </div>
                <div className="progress-track">
                  <span style={{ width: `${studentSummary?.progress ?? 0}%` }} />
                </div>
                <div className="split-stats">
                  <span>Rang {studentRanking?.rank ? `#${studentRanking.rank}` : '-'}</span>
                  <span>{studentRanking?.totalInLevel ?? 0} dans le niveau</span>
                  <span>Dernier paiement {studentSummary?.lastPayment ? new Date(studentSummary.lastPayment).toLocaleDateString('fr-FR') : '-'}</span>
                </div>
              </div>

              <form onSubmit={studentPayment} className="panel form-panel">
                <h2>Effectuer un versement</h2>
                <label>Cotisation
                  <select value={paymentForm.cotisationId} onChange={e => setPaymentForm({ ...paymentForm, cotisationId: e.target.value })} required>
                    <option value="">Choisir</option>
                    {cotisations.filter(item => !item.paid).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.title} - reste {formatCurrency(Math.max(0, item.amount - (item.paidAmount ?? 0)))}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-grid">
                  <label>Montant<input type="number" min="0" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required /></label>
                  <label>Methode
                    <select value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                      <option>Mobile Money</option>
                      <option>Orange Money</option>
                      <option>Wave</option>
                      <option>Especes</option>
                      <option>Virement</option>
                    </select>
                  </label>
                </div>
                <label>Reference<input value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} /></label>
                <button type="submit" className="cta">Enregistrer le versement</button>
              </form>
            </section>

            <section className="two-column">
              <DataPanel title="Mes cotisations">
                <table>
                  <thead><tr><th>Titre</th><th>Montant</th><th>Paye</th><th>Echeance</th><th>Statut</th></tr></thead>
                  <tbody>
                    {cotisations.map(item => (
                      <tr key={item.id}>
                        <td>{item.title}</td>
                        <td>{formatCurrency(item.amount)}</td>
                        <td>{formatCurrency(item.paidAmount ?? 0)}</td>
                        <td>{new Date(item.dueDate).toLocaleDateString('fr-FR')}</td>
                        <td><span className={`badge ${item.status}`}>{getStatusLabel(item.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataPanel>

              <DataPanel title="Classement du niveau">
                <table>
                  <thead><tr><th>Rang</th><th>Etudiant</th><th>Verse</th><th>Progression</th></tr></thead>
                  <tbody>
                    {rankings.map((item, index) => {
                      const percent = Math.round(item.progress ?? item.percentage ?? 0)
                      return (
                        <tr key={item.userId ?? index}>
                          <td>#{index + 1}</td>
                          <td>{`${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || '-'}</td>
                          <td>{formatCurrency(item.paidAmount ?? 0)}</td>
                          <td>
                            <div className="table-progress"><span style={{ width: `${Math.min(100, percent)}%` }} /></div>
                            {percent}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </DataPanel>
            </section>

            <DataPanel title="Mes paiements">
              <table>
                <thead><tr><th>Cotisation</th><th>Montant</th><th>Methode</th><th>Reference</th><th>Date</th></tr></thead>
                <tbody>
                  {paiements.map(item => (
                    <tr key={item.id}>
                      <td>{item.cotisation?.title ?? '-'}</td>
                      <td>{formatCurrency(item.amount)}</td>
                      <td>{item.method}</td>
                      <td>{item.reference || '-'}</td>
                      <td>{item.paidAt ? new Date(item.paidAt).toLocaleDateString('fr-FR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DataPanel>
          </>
        ) : (
          <>
            <section className="hero-panel">
              <div>
                <p className="eyebrow">Tableau de bord tresorier</p>
                <h1>{completionRate}% du montant attendu collecte</h1>
                <p>Vue operationnelle des cotisations, paiements, etudiants et relances prioritaires.</p>
              </div>
              <div className="hero-actions">
                <button type="button" className="ghost" onClick={() => handleDownload(cotisationsExportPath, 'cotisations.xlsx')}>
                  Export cotisations
                </button>
                <button type="button" className="ghost" onClick={() => handleDownload(paiementsExportPath, 'paiements.xlsx')}>
                  Export paiements
                </button>
                <button type="button" className="ghost" onClick={loadData}>
                  Actualiser
                </button>
              </div>
            </section>

            <section className="panel filter-panel">
              <div>
                <p className="eyebrow">Filtres de pilotage</p>
                <h2>{selectedAcademicYear?.libelle ?? 'Vue globale'}</h2>
              </div>
              <label>Annee
                <select value={selectedAcademicYearId} onChange={e => setSelectedAcademicYearId(e.target.value)}>
                  <option value="">Toutes les annees</option>
                  {academicYears.map(item => (
                    <option key={item.id} value={item.id}>{item.libelle}{item.active ? ' - active' : ''}</option>
                  ))}
                </select>
              </label>
              <label>Niveau
                <select value={selectedLevelId} onChange={e => setSelectedLevelId(e.target.value)}>
                  <option value="">Tous les niveaux</option>
                  {levels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                </select>
              </label>
              <button type="button" className="ghost compact" onClick={() => { setSelectedAcademicYearId(''); setSelectedLevelId('') }}>
                Reinitialiser
              </button>
            </section>

            {summary && (
              <section className="summary-strip">
                <article>
                  <span>Attendu</span>
                  <strong>{formatCurrency(dashboardTotals.totalAmount)}</strong>
                </article>
                <article>
                  <span>Collecte</span>
                  <strong>{formatCurrency(dashboardTotals.totalPaidAmount)}</strong>
                </article>
                <article>
                  <span>Restant</span>
                  <strong>{formatCurrency(dashboardTotals.totalRemainingAmount)}</strong>
                </article>
                <article>
                  <span>Retards</span>
                  <strong>{dashboardTotals.totalOverdue}</strong>
                </article>
                <article>
                  <span>Dons alumni</span>
                  <strong>{formatCurrency(adminIndicators.totalDonAmount)}</strong>
                </article>
                <article>
                  <span>Promotions</span>
                  <strong>{adminIndicators.promotionCount}</strong>
                </article>
              </section>
            )}

            <nav className="tabs" aria-label="Sections admin">
              {[
                ['summary', 'Resume'],
                ['levels', 'Niveaux'],
                ['users', 'Etudiants'],
                ['cotisations', 'Cotisations'],
                ['paiements', 'Paiements'],
                ['rankings', 'Classement'],
                ['defis', 'Defis'],
                ['alumni', 'Alumni'],
                ['dons', 'Dons'],
                ['adherents', 'Adherents'],
              ].map(([tab, label]) => (
                <button key={tab} type="button" className={tab === activeTab ? 'tab active' : 'tab'} onClick={() => setActiveTab(tab)}>
                  {label}
                </button>
              ))}
            </nav>

            {loading && <div className="status-banner">Traitement en cours...</div>}
            {notice && <div className={`status-banner ${notice.kind === 'error' ? 'status-error' : 'status-success'}`}>{notice.message}</div>}

            {activeTab === 'summary' && (
              <>
                <section className="dashboard-grid">
                  <div className="panel progress-panel">
                    <div className="section-header">
                      <div>
                        <p className="eyebrow">Recouvrement</p>
                        <h2>Progression globale</h2>
                      </div>
                      <strong>{completionRate}%</strong>
                    </div>
                    <div className="progress-track">
                      <span style={{ width: `${completionRate}%` }} />
                    </div>
                    <div className="split-stats">
                      <span>{adminIndicators.fullyPaidStudents} soldes</span>
                      <span>{adminIndicators.partialStudents} partiels</span>
                      <span>{adminIndicators.zeroPaymentStudents} a 0</span>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="section-header">
                      <h2>Actions rapides</h2>
                    </div>
                    <div className="quick-actions">
                      <button type="button" className="ghost" onClick={() => setActiveTab('users')}>Ajouter un etudiant</button>
                      <button type="button" className="ghost" onClick={() => setActiveTab('cotisations')}>Creer une cotisation</button>
                      <button type="button" className="ghost" onClick={() => setActiveTab('paiements')}>Saisir un paiement</button>
                      <button type="button" className="ghost" onClick={() => handleDownload(overdueExportPath, 'cotisations-en-retard.xlsx')}>Exporter retards</button>
                      <button type="button" className="ghost" onClick={() => handleDownload('/dons/export', 'dons-alumni.xlsx')}>Exporter dons</button>
                    </div>
                  </div>
                </section>

                <section className="indicator-grid">
                  <article className="panel indicator-card">
                    <span>Retards financiers</span>
                    <strong>{formatCurrency(dashboardTotals.totalOverdueAmount)}</strong>
                    <small>{dashboardTotals.totalOverdue} cotisations en retard</small>
                  </article>
                  <article className="panel indicator-card">
                    <span>Paiements</span>
                    <strong>{adminIndicators.confirmedPayments}</strong>
                    <small>{adminIndicators.pendingPayments} en attente, {adminIndicators.failedPayments} echoues</small>
                  </article>
                  <article className="panel indicator-card">
                    <span>Solidarite</span>
                    <strong>{adminIndicators.friendPayments}</strong>
                    <small>{adminIndicators.cashPayments} paiements main a main</small>
                  </article>
                  <article className="panel indicator-card">
                    <span>Defis</span>
                    <strong>{adminIndicators.activeDefis}</strong>
                    <small>{adminIndicators.completedDefis} termines</small>
                  </article>
                  <article className="panel indicator-card">
                    <span>Alumni</span>
                    <strong>{adminIndicators.alumniCount}</strong>
                    <small>{adminIndicators.promotionCount} promotions sortantes</small>
                  </article>
                  <article className="panel indicator-card">
                    <span>Dons confirmes</span>
                    <strong>{formatCurrency(adminIndicators.totalDonAmount)}</strong>
                    <small>{adminIndicators.totalDons} dons enregistres</small>
                  </article>
                </section>

                <section className="two-column">
                  <DataPanel title="Relances prioritaires" action={<button type="button" className="ghost" onClick={() => handleDownload(overdueExportPath, 'cotisations-en-retard.xlsx')}>Exporter</button>}>
                    <table>
                      <thead><tr><th>Etudiant</th><th>Niveau</th><th>Reste</th><th>Echeance</th></tr></thead>
                      <tbody>
                        {cotisations
                          .filter(item => !item.paid && new Date(item.dueDate) < new Date())
                          .slice(0, 8)
                          .map(item => (
                            <tr key={item.id}>
                              <td>{getFullName(item.user)}</td>
                              <td>{item.user?.level?.name ?? '-'}</td>
                              <td>{formatCurrency(Math.max(0, item.amount - (item.paidAmount ?? 0)))}</td>
                              <td>{new Date(item.dueDate).toLocaleDateString('fr-FR')}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </DataPanel>

                  <DataPanel title="Derniers paiements">
                    <table>
                      <thead><tr><th>Etudiant</th><th>Montant</th><th>Origine</th><th>Date</th></tr></thead>
                      <tbody>
                        {paiements.slice(0, 8).map(item => (
                          <tr key={item.id}>
                            <td>{getFullName(item.user)}</td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td>{getStatusLabel(item.origin ?? item.method)}</td>
                            <td>{item.paidAt ? new Date(item.paidAt).toLocaleDateString('fr-FR') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataPanel>
                </section>
              </>
            )}

            {activeTab === 'levels' && (
              <section className="two-column">
                <form onSubmit={createLevel} className="panel form-panel">
                  <h2>Nouveau niveau</h2>
                  <label>Nom<input value={levelForm.name} onChange={e => setLevelForm({ ...levelForm, name: e.target.value })} required /></label>
                  <label>Description<input value={levelForm.description} onChange={e => setLevelForm({ ...levelForm, description: e.target.value })} /></label>
                  <label>Montant annuel<input type="number" min="0" value={levelForm.annualAmount} onChange={e => setLevelForm({ ...levelForm, annualAmount: e.target.value })} required /></label>
                  <button type="submit" className="cta">Ajouter</button>
                </form>
                <DataPanel title="Niveaux" action={<button type="button" className="ghost" onClick={() => handleDownload('/dashboard/levels', 'dashboard-niveaux.xlsx')}>Exporter</button>}>
                  <table>
                    <thead><tr><th>Nom</th><th>Description</th><th>Annuel</th></tr></thead>
                    <tbody>
                      {levels.map(level => (
                        <tr key={level.id}><td>{level.name}</td><td>{level.description || '-'}</td><td>{formatCurrency(level.annualAmount)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>
              </section>
            )}

            {activeTab === 'users' && (
              <section className="two-column">
                <div className="stack">
                  <form onSubmit={createUser} className="panel form-panel">
                    <h2>Nouvel utilisateur</h2>
                    <div className="form-grid">
                      <label>Prenom<input value={userForm.firstName} onChange={e => setUserForm({ ...userForm, firstName: e.target.value })} required /></label>
                      <label>Nom<input value={userForm.lastName} onChange={e => setUserForm({ ...userForm, lastName: e.target.value })} required /></label>
                    </div>
                    <label>Email<input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required /></label>
                    <div className="form-grid">
                      <label>Telephone<input value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} /></label>
                      <label>Role
                        <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                          <option value="etudiant">Etudiant</option>
                          <option value="tresorier">Tresorier</option>
                          <option value="admin">Admin</option>
                          <option value="alumni">Alumni</option>
                        </select>
                      </label>
                    </div>
                    <label>Niveau
                      <select value={userForm.levelId} onChange={e => setUserForm({ ...userForm, levelId: e.target.value })}>
                        <option value="">Aucun</option>
                        {levels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                      </select>
                    </label>
                    <label>Mot de passe<input value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required /></label>
                    <button type="submit" className="cta">Ajouter</button>
                  </form>

                  <form onSubmit={importStudents} className="panel form-panel">
                    <h2>Importer des etudiants</h2>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
                    <button type="submit" className="ghost">Importer</button>
                  </form>
                </div>

                <DataPanel title="Utilisateurs">
                  <table>
                    <thead><tr><th>Nom</th><th>Email</th><th>Niveau</th><th>Role</th></tr></thead>
                    <tbody>
                      {users.map(item => (
                        <tr key={item.id}><td>{getFullName(item)}</td><td>{item.email}</td><td>{item.level?.name || '-'}</td><td>{item.role}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>
              </section>
            )}

            {activeTab === 'cotisations' && (
              <section className="two-column">
                <form onSubmit={createCotisation} className="panel form-panel">
                  <h2>Nouvelle cotisation</h2>
                  <label>Titre<input value={cotisationForm.title} onChange={e => setCotisationForm({ ...cotisationForm, title: e.target.value })} required /></label>
                  <label>Description<input value={cotisationForm.description} onChange={e => setCotisationForm({ ...cotisationForm, description: e.target.value })} /></label>
                  <div className="form-grid">
                    <label>Montant<input type="number" min="0" value={cotisationForm.amount} onChange={e => setCotisationForm({ ...cotisationForm, amount: e.target.value })} required /></label>
                    <label>Echeance<input type="date" value={cotisationForm.dueDate} onChange={e => setCotisationForm({ ...cotisationForm, dueDate: e.target.value })} required /></label>
                  </div>
                  <label>Etudiant
                    <select value={cotisationForm.userId} onChange={e => setCotisationForm({ ...cotisationForm, userId: e.target.value })} required>
                      <option value="">Choisir</option>
                      {students.map(item => <option key={item.id} value={item.id}>{getFullName(item)}</option>)}
                    </select>
                  </label>
                  <button type="submit" className="cta">Creer</button>
                </form>

                <DataPanel title="Cotisations" action={<button type="button" className="ghost" onClick={() => handleDownload(cotisationsExportPath, 'cotisations.xlsx')}>Exporter</button>}>
                  <table>
                    <thead><tr><th>Titre</th><th>Etudiant</th><th>Montant</th><th>Paye</th><th>Statut</th></tr></thead>
                    <tbody>
                      {cotisations.map(item => (
                        <tr key={item.id}>
                          <td>{item.title}</td>
                          <td>{getFullName(item.user)}</td>
                          <td>{formatCurrency(item.amount)}</td>
                          <td>{formatCurrency(item.paidAmount ?? 0)}</td>
                          <td><span className={`badge ${item.status}`}>{getStatusLabel(item.status)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>
              </section>
            )}

            {activeTab === 'paiements' && (
              <section className="two-column">
                <form onSubmit={createPayment} className="panel form-panel">
                  <h2>Nouveau paiement</h2>
                  <label>Cotisation
                    <select value={paymentForm.cotisationId} onChange={e => setPaymentForm({ ...paymentForm, cotisationId: e.target.value })} required>
                      <option value="">Choisir</option>
                      {cotisations.map(item => <option key={item.id} value={item.id}>{item.title} - {getFullName(item.user)}</option>)}
                    </select>
                  </label>
                  <div className="form-grid">
                    <label>Montant<input type="number" min="0" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required /></label>
                    <label>Methode
                      <select value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}>
                        <option>Mobile Money</option>
                        <option>Orange Money</option>
                        <option>Wave</option>
                        <option>Especes</option>
                        <option>Virement</option>
                      </select>
                    </label>
                  </div>
                  <label>Reference<input value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} /></label>
                  <button type="submit" className="cta">Enregistrer</button>
                </form>

                <DataPanel title="Paiements" action={<button type="button" className="ghost" onClick={() => handleDownload(paiementsExportPath, 'paiements.xlsx')}>Exporter</button>}>
                  <table>
                    <thead><tr><th>Etudiant</th><th>Montant</th><th>Methode</th><th>Reference</th></tr></thead>
                    <tbody>
                      {paiements.map(item => (
                        <tr key={item.id}><td>{getFullName(item.user)}</td><td>{formatCurrency(item.amount)}</td><td>{item.method}</td><td>{item.reference || '-'}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>
              </section>
            )}

            {activeTab === 'rankings' && (
              <DataPanel title="Classement des cotisants">
                <table>
                  <thead><tr><th>Rang</th><th>Etudiant</th><th>Niveau</th><th>Progression</th></tr></thead>
                  <tbody>
                    {rankings.map((item, index) => {
                      const percent = Math.round(item.progress ?? item.percentage ?? 0)
                      return (
                        <tr key={item.userId ?? index}>
                          <td>#{index + 1}</td>
                          <td>{`${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || '-'}</td>
                          <td>{getRankingLevelName(item.level)}</td>
                          <td>
                            <div className="table-progress"><span style={{ width: `${Math.min(100, percent)}%` }} /></div>
                            {percent}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </DataPanel>
            )}

            {activeTab === 'defis' && (
              <DataPanel title="Defis de cotisation">
                <table>
                  <thead><tr><th>Createur</th><th>Adversaire</th><th>Statut</th><th>Progressions</th><th>Gagnant</th></tr></thead>
                  <tbody>
                    {defis.map(item => (
                      <tr key={item.id}>
                        <td>{getFullName(item.challenger)}</td>
                        <td>{getFullName(item.opponent)}</td>
                        <td><span className={`badge ${item.status}`}>{getStatusLabel(item.status)}</span></td>
                        <td>{item.challengerProgress ?? 0}% / {item.opponentProgress ?? 0}%</td>
                        <td>{item.winner ? getFullName(item.winner) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataPanel>
            )}

            {activeTab === 'alumni' && (
              <section className="two-column">
                <DataPanel title="Promotions alumni">
                  <table>
                    <thead><tr><th>Promotion</th><th>Alumni</th><th>Action</th></tr></thead>
                    <tbody>
                      {promotionsAlumni.map(item => (
                        <tr key={item.promotion}>
                          <td>{item.promotion}</td>
                          <td>{item.totalAlumni}</td>
                          <td>
                            <button type="button" className="ghost compact" onClick={() => setActiveTab('dons')}>
                              Voir dons
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>

                <DataPanel title="Alumni">
                  <table>
                    <thead><tr><th>Nom</th><th>Email</th><th>Promotion</th></tr></thead>
                    <tbody>
                      {alumni.map(item => (
                        <tr key={item.id}>
                          <td>{getFullName(item)}</td>
                          <td>{item.email}</td>
                          <td>{item.promotionSortante ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>
              </section>
            )}

            {activeTab === 'dons' && (
              <DataPanel title="Dons alumni" action={<button type="button" className="ghost" onClick={() => handleDownload('/dons/export', 'dons-alumni.xlsx')}>Exporter</button>}>
                <table>
                  <thead><tr><th>Alumni</th><th>Promotion</th><th>Montant</th><th>Methode</th><th>Origine</th><th>Date</th></tr></thead>
                  <tbody>
                    {dons.map(item => (
                      <tr key={item.id}>
                        <td>{getFullName(item.alumni)}</td>
                        <td>{item.alumni?.promotionSortante ?? '-'}</td>
                        <td>{formatCurrency(item.amount)}</td>
                        <td>{item.method}</td>
                        <td>{getStatusLabel(item.origin)}</td>
                        <td>{item.donatedAt ? new Date(item.donatedAt).toLocaleDateString('fr-FR') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataPanel>
            )}

            {activeTab === 'adherents' && (
              <DataPanel title="Adherents" action={<button type="button" className="ghost" onClick={() => handleDownload('/adherents/export', 'adherents.xlsx')}>Exporter</button>}>
                <table>
                  <thead><tr><th>Carte</th><th>Statut</th></tr></thead>
                  <tbody>
                    {adherents.map(item => <tr key={item.id}><td>{item.membershipNumber}</td><td>{item.status}</td></tr>)}
                  </tbody>
                </table>
              </DataPanel>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function DataPanel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel data-panel">
      <div className="section-header">
        <h2>{title}</h2>
        {action}
      </div>
      <div className="table-wrapper">{children}</div>
    </section>
  )
}

export default App
