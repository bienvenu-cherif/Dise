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

type WaveConfiguration = {
  id: string
  nomCompte: string
  nomBureau?: string | null
  checkoutUrl: string
  currency: string
  successUrl?: string | null
  errorUrl?: string | null
  webhookUrl?: string | null
  statut: string
  active: boolean
  activeeLe?: string | null
  valideeLe?: string | null
  dernierTestLe?: string | null
  apiKeyConfigured: boolean
  webhookSecretConfigured: boolean
  anneeAcademique?: AcademicYear
}

type AuditLog = {
  id: string
  action: string
  entityType: string
  entityId?: string | null
  actorType: string
  actor?: User | null
  details?: Record<string, unknown>
  createdAt: string
}

type EmailStatus = {
  enabled: boolean
  configured: boolean
  ready: boolean
  host: string | null
  port: number
  secure: boolean
  from: string | null
  intervalMs: number
  batchSize: number
}

type EmailMessage = {
  id: string
  recipientEmail: string
  recipientName?: string | null
  subject: string
  status: string
  attempts: number
  createdAt: string
}

type StudentImportResult = {
  email: string
  activationCode?: string
  status: string
  message?: string
}

type AcademicYearPreparation = {
  pretPaiements: boolean
  score: number
  total: number
  checks: Array<{
    key: string
    label: string
    ok: boolean
    details: string
  }>
  counts: {
    inscriptions: number
    eligibleInscriptions: number
    montants: number
    cotisations: number
  }
}

type PassagePreview = {
  userId: string
  nom: string
  niveauActuel: string
  statutScolaire: string
  prochainNiveau: string
  eligibleCotisation: boolean
}

type InscriptionAnnuelle = {
  id: string
  user: User
  anneeAcademique: AcademicYear
  level: Level
  statutScolaire: 'actif' | 'redoublant' | 'abandon' | 'exclu' | 'alumni'
  eligibleCotisation: boolean
  commentaire?: string | null
}

type MontantCotisation = {
  id: string
  anneeAcademique: AcademicYear
  level?: Level | null
  user?: User | null
  type: 'niveau' | 'exception'
  montant: number
  dateLimite: string
  commentaire?: string | null
}

type AnnualGenerationResult = {
  anneeAcademique: Pick<AcademicYear, 'id' | 'libelle'>
  createdCount: number
  skippedCount: number
  created: Cotisation[]
  skipped: Array<{ userId: string; reason: string }>
}

type AnnualGenerationPreview = {
  anneeAcademique: Pick<AcademicYear, 'id' | 'libelle'>
  total: number
  pret: number
  dejaGenerees: number
  ignorees: number
  montantsManquants: number
  lignes: Array<{
    userId: string
    nom: string
    niveau: string
    statutScolaire: string
    eligibleCotisation: boolean
    montant: number
    dateLimite: string | null
    source: string
    statutGeneration: 'pret' | 'ignore' | 'deja_generee' | 'montant_manquant'
    raison: string
  }>
}

type User = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  wavePhone?: string | null
  role: string
  accountStatus?: string | null
  entrySource?: string | null
  promotionSortante?: string | null
  isActive?: boolean
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
  appliedAmount?: number
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

type FinanceStudentState = {
  totalAmount: number
  totalPaidAmount: number
  remainingAmount: number
  progress: number
  lastPayment?: Paiement
  cotisations: Cotisation[]
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
    brouillon: 'Brouillon',
    ouverte: 'Ouverte',
    fermee: 'Fermee',
    a_tester: 'A tester',
    validee: 'Validee',
    desactivee: 'Desactivee',
    actif: 'Actif',
    redoublant: 'Redoublant',
    abandon: 'Abandon',
    exclu: 'Exclu',
    invite: 'Invite',
    profil_a_completer: 'Profil a completer',
    suspendu: 'Suspendu',
    etudiant: 'Etudiant',
    tresorier: 'Tresorier',
    admin: 'Admin',
    alumni: 'Alumni',
    import_officiel: 'Import officiel',
    passage_automatique: 'Passage automatique',
    creation_manuelle: 'Creation manuelle',
    demo: 'Demo',
    pret: 'Pret',
    ignore: 'Ignore',
    deja_generee: 'Deja generee',
    montant_manquant: 'Montant manquant',
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
  const [academicYearPreparation, setAcademicYearPreparation] = useState<AcademicYearPreparation | null>(null)
  const [passagePreview, setPassagePreview] = useState<PassagePreview[]>([])
  const [annualInscriptions, setAnnualInscriptions] = useState<InscriptionAnnuelle[]>([])
  const [montantsCotisation, setMontantsCotisation] = useState<MontantCotisation[]>([])
  const [annualGenerationResult, setAnnualGenerationResult] = useState<AnnualGenerationResult | null>(null)
  const [annualGenerationPreview, setAnnualGenerationPreview] = useState<AnnualGenerationPreview | null>(null)
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState('')
  const [passageSourceYearId, setPassageSourceYearId] = useState('')
  const [passageTargetYearId, setPassageTargetYearId] = useState('')
  const [selectedLevelId, setSelectedLevelId] = useState('')
  const [levels, setLevels] = useState<Level[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [cotisations, setCotisations] = useState<Cotisation[]>([])
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [waveConfigurations, setWaveConfigurations] = useState<WaveConfiguration[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null)
  const [pendingEmails, setPendingEmails] = useState<EmailMessage[]>([])
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
  const [academicYearForm, setAcademicYearForm] = useState({ libelle: '', dateDebut: '', dateFin: '' })
  const [amountForm, setAmountForm] = useState({
    type: 'niveau' as 'niveau' | 'exception',
    levelId: '',
    userId: '',
    montant: '',
    dateLimite: '',
    commentaire: '',
  })
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    levelId: '',
    role: 'etudiant',
    password: 'Password123!',
  })
  const [editingUserId, setEditingUserId] = useState('')
  const [editUserForm, setEditUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    wavePhone: '',
    levelId: '',
    role: 'etudiant',
    accountStatus: 'actif',
    entrySource: 'creation_manuelle',
    promotionSortante: '',
  })
  const [handoverForm, setHandoverForm] = useState({
    nouveauTresorierId: '',
    motif: '',
  })
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [userLevelFilter, setUserLevelFilter] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState('')
  const [cotisationSearchQuery, setCotisationSearchQuery] = useState('')
  const [cotisationStatusFilter, setCotisationStatusFilter] = useState('')
  const [paymentSearchQuery, setPaymentSearchQuery] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')
  const [selectedFinanceStudentId, setSelectedFinanceStudentId] = useState('')
  const [cotisationForm, setCotisationForm] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: '',
    userId: '',
  })
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Wave',
    reference: '',
    cotisationId: '',
    userId: '',
  })
  const [studentPaymentMode, setStudentPaymentMode] = useState<'moi' | 'camarade'>('moi')
  const [studentBeneficiaryLevelId, setStudentBeneficiaryLevelId] = useState('')
  const [studentBeneficiaryQuery, setStudentBeneficiaryQuery] = useState('')
  const [studentBeneficiaryResults, setStudentBeneficiaryResults] = useState<User[]>([])
  const [studentBeneficiary, setStudentBeneficiary] = useState<User | null>(null)
  const [studentBeneficiaryCotisations, setStudentBeneficiaryCotisations] = useState<Cotisation[]>([])
  const [studentChallengeLevelId, setStudentChallengeLevelId] = useState('')
  const [studentChallengeQuery, setStudentChallengeQuery] = useState('')
  const [studentChallengeResults, setStudentChallengeResults] = useState<User[]>([])
  const [studentChallengeOpponent, setStudentChallengeOpponent] = useState<User | null>(null)
  const [studentChallengeMessage, setStudentChallengeMessage] = useState('')
  const [waveForm, setWaveForm] = useState({
    anneeAcademiqueId: '',
    nomCompte: '',
    nomBureau: '',
    checkoutUrl: '',
    currency: 'XOF',
    successUrl: '',
    errorUrl: '',
    webhookUrl: '',
    apiKey: '',
    webhookSecret: '',
  })
  const [alertForm, setAlertForm] = useState({
    recipientId: '',
    promotionSortante: '',
    type: 'message_manuel',
    canal: 'application_et_email',
    title: '',
    message: '',
    inactiveDays: '21',
  })
  const [studentStateQuery, setStudentStateQuery] = useState('')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [studentImportResults, setStudentImportResults] = useState<StudentImportResult[]>([])
  const [lastActivationCode, setLastActivationCode] = useState<{ userId: string; activationCode: string; expiresAt: string } | null>(null)

  const students = useMemo(() => users.filter(item => item.role === 'etudiant' && item.accountStatus !== 'alumni'), [users])
  const alumni = useMemo(
    () => users.filter(item => item.role === 'alumni' || item.accountStatus === 'alumni' || Boolean(item.promotionSortante)),
    [users],
  )
  const filteredUsers = useMemo(() => {
    const query = userSearchQuery.trim().toLowerCase()
    return users.filter(item => {
      const matchesLevel = !userLevelFilter || item.level?.id === userLevelFilter
      const matchesRole = !userRoleFilter || item.role === userRoleFilter
      const matchesStatus = !userStatusFilter || (item.accountStatus ?? 'actif') === userStatusFilter
      const searchable = `${item.firstName} ${item.lastName} ${item.email} ${item.phone ?? ''} ${item.wavePhone ?? ''}`.toLowerCase()
      const matchesQuery = !query || searchable.includes(query)
      return matchesLevel && matchesRole && matchesStatus && matchesQuery
    })
  }, [userLevelFilter, userRoleFilter, userSearchQuery, userStatusFilter, users])
  const userStatusCounts = useMemo(() => {
    const counts = {
      actifs: 0,
      invites: 0,
      profilsACompleter: 0,
      suspendus: 0,
      alumni: 0,
    }
    users.forEach(item => {
      const status = item.accountStatus ?? 'actif'
      if (status === 'actif') counts.actifs += 1
      if (status === 'invite') counts.invites += 1
      if (status === 'profil_a_completer') counts.profilsACompleter += 1
      if (status === 'suspendu') counts.suspendus += 1
      if (status === 'alumni' || item.role === 'alumni') counts.alumni += 1
    })
    return counts
  }, [users])
  const handoverCandidates = useMemo(
    () => users.filter(item => ['etudiant', 'tresorier', 'admin'].includes(item.role) && (item.accountStatus ?? 'actif') === 'actif' && item.isActive !== false),
    [users],
  )
  const filteredCotisations = useMemo(() => {
    const query = cotisationSearchQuery.trim().toLowerCase()
    return cotisations.filter(item => {
      const status = item.status ?? 'pending'
      const searchable = `${item.title} ${item.description ?? ''} ${getFullName(item.user)} ${item.user?.email ?? ''} ${item.user?.phone ?? ''} ${item.user?.level?.name ?? ''}`.toLowerCase()
      const matchesQuery = !query || searchable.includes(query)
      const matchesStatus = !cotisationStatusFilter || status === cotisationStatusFilter
      return matchesQuery && matchesStatus
    })
  }, [cotisationSearchQuery, cotisationStatusFilter, cotisations])
  const filteredPaiements = useMemo(() => {
    const query = paymentSearchQuery.trim().toLowerCase()
    return paiements.filter(item => {
      const status = item.status ?? 'confirme'
      const searchable = `${getFullName(item.user)} ${item.user?.email ?? ''} ${item.user?.phone ?? ''} ${item.cotisation?.title ?? ''} ${item.method} ${item.reference ?? ''}`.toLowerCase()
      const matchesQuery = !query || searchable.includes(query)
      const matchesStatus = !paymentStatusFilter || status === paymentStatusFilter
      const matchesMethod = !paymentMethodFilter || item.method === paymentMethodFilter || item.origin === paymentMethodFilter
      return matchesQuery && matchesStatus && matchesMethod
    })
  }, [paiements, paymentMethodFilter, paymentSearchQuery, paymentStatusFilter])
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

  const passageSourceYear = useMemo(
    () => academicYears.find(item => item.id === passageSourceYearId),
    [academicYears, passageSourceYearId],
  )

  const passageTargetYear = useMemo(
    () => academicYears.find(item => item.id === passageTargetYearId),
    [academicYears, passageTargetYearId],
  )

  const passageCounts = useMemo(() => ({
    total: passagePreview.length,
    eligible: passagePreview.filter(item => item.eligibleCotisation).length,
    alumni: passagePreview.filter(item => item.prochainNiveau.toLowerCase() === 'alumni').length,
    exceptions: passagePreview.filter(item => ['redoublant', 'abandon', 'exclu'].includes(item.statutScolaire)).length,
  }), [passagePreview])

  const annualInscriptionCounts = useMemo(() => ({
    total: annualInscriptions.length,
    eligible: annualInscriptions.filter(item => item.eligibleCotisation).length,
    redoublants: annualInscriptions.filter(item => item.statutScolaire === 'redoublant').length,
    bloquees: annualInscriptions.filter(item => ['abandon', 'exclu', 'alumni'].includes(item.statutScolaire)).length,
  }), [annualInscriptions])

  const levelAmounts = useMemo(
    () => montantsCotisation.filter(item => item.type === 'niveau'),
    [montantsCotisation],
  )

  const exceptionAmounts = useMemo(
    () => montantsCotisation.filter(item => item.type === 'exception'),
    [montantsCotisation],
  )

  const annualAmountReadiness = useMemo(() => {
    const eligibleLevels = new Map<string, string>()
    annualInscriptions
      .filter(item => item.eligibleCotisation && item.level.name.toLowerCase() !== 'alumni')
      .forEach(item => eligibleLevels.set(item.level.id, item.level.name))
    const configuredLevelIds = new Set(levelAmounts.map(item => item.level?.id).filter(Boolean))
    const missing = Array.from(eligibleLevels.entries())
      .filter(([levelId]) => !configuredLevelIds.has(levelId))
      .map(([, levelName]) => levelName)
    return {
      expectedLevels: eligibleLevels.size,
      configuredLevels: configuredLevelIds.size,
      missingLevels: missing.length,
      missingLevelNames: missing,
      ready: eligibleLevels.size > 0 && missing.length === 0,
    }
  }, [annualInscriptions, levelAmounts])

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

  const zeroPaymentAttention = useMemo(() => {
    const byUser = new Map<string, { user: User; remaining: number; dueDate: string }>()
    for (const cotisation of cotisations) {
      if (!cotisation.user?.id || cotisation.paid || (cotisation.paidAmount ?? 0) > 0) continue
      const existing = byUser.get(cotisation.user.id)
      const remaining = Math.max(0, cotisation.amount - (cotisation.paidAmount ?? 0))
      if (!existing) {
        byUser.set(cotisation.user.id, { user: cotisation.user, remaining, dueDate: cotisation.dueDate })
      } else {
        existing.remaining += remaining
        if (new Date(cotisation.dueDate) < new Date(existing.dueDate)) {
          existing.dueDate = cotisation.dueDate
        }
      }
    }
    return Array.from(byUser.values())
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 8)
  }, [cotisations])

  const overdueAttention = useMemo(() => {
    const byUser = new Map<string, { user: User; remaining: number; dueDate: string; overdueCount: number }>()
    for (const cotisation of cotisations) {
      if (!cotisation.user?.id || cotisation.paid || new Date(cotisation.dueDate) >= new Date()) continue
      const remaining = Math.max(0, cotisation.amount - (cotisation.paidAmount ?? 0))
      if (remaining <= 0) continue
      const existing = byUser.get(cotisation.user.id)
      if (!existing) {
        byUser.set(cotisation.user.id, { user: cotisation.user, remaining, dueDate: cotisation.dueDate, overdueCount: 1 })
      } else {
        existing.remaining += remaining
        existing.overdueCount += 1
        if (new Date(cotisation.dueDate) < new Date(existing.dueDate)) {
          existing.dueDate = cotisation.dueDate
        }
      }
    }
    return Array.from(byUser.values())
      .sort((a, b) => b.remaining - a.remaining || new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 8)
  }, [cotisations])

  const recentPayments = useMemo(
    () => paiements
      .slice()
      .sort((a, b) => new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime())
      .slice(0, 8),
    [paiements],
  )

  const topContributors = useMemo(
    () => rankings
      .slice()
      .sort((a, b) => (b.progress ?? b.percentage ?? 0) - (a.progress ?? a.percentage ?? 0) || (b.paidAmount ?? 0) - (a.paidAmount ?? 0))
      .slice(0, 8),
    [rankings],
  )

  const studentStateMatches = useMemo(() => {
    const query = studentStateQuery.trim().toLowerCase()
    if (!query) return []
    return students
      .filter(item => {
        const searchable = `${item.firstName} ${item.lastName} ${item.email} ${item.phone ?? ''} ${item.level?.name ?? ''}`.toLowerCase()
        return searchable.includes(query)
      })
      .slice(0, 8)
  }, [studentStateQuery, students])

  const getStudentState = (studentId: string): FinanceStudentState => {
    const studentCotisations = cotisations.filter(item => item.user?.id === studentId)
    const studentPaiements = paiements.filter(item => item.user?.id === studentId)
    const totalAmount = studentCotisations.reduce((sum, item) => sum + item.amount, 0)
    const totalPaidAmount = studentCotisations.reduce((sum, item) => sum + (item.paidAmount ?? 0), 0)
    const remainingAmount = Math.max(0, totalAmount - totalPaidAmount)
    const progress = totalAmount > 0 ? Math.min(100, Math.round((totalPaidAmount / totalAmount) * 100)) : 0
    const lastPayment = studentPaiements
      .slice()
      .sort((a, b) => new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime())[0]

    return { totalAmount, totalPaidAmount, remainingAmount, progress, lastPayment, cotisations: studentCotisations }
  }

  const selectedFinanceStudent = useMemo(
    () => users.find(item => item.id === selectedFinanceStudentId) ?? null,
    [selectedFinanceStudentId, users],
  )

  const selectedFinanceState = selectedFinanceStudent ? getStudentState(selectedFinanceStudent.id) : null

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
        request<Defi[]>('/defis/me', token),
        request<Level[]>('/levels', token),
      ])

      const [summaryResult, cotisationsResult, paiementsResult, rankingResult, defisResult, levelsResult] = results
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
      if (defisResult.status === 'fulfilled') setDefis(defisResult.value)
      if (levelsResult.status === 'fulfilled') setLevels(levelsResult.value)

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
      request<WaveConfiguration[]>(`/configurations-wave${toQueryString({ anneeId: selectedAcademicYearId })}`, token),
      request<AuditLog[]>('/audit', token),
      request<EmailStatus>('/emails/statut', token),
      request<EmailMessage[]>('/emails/en-attente?limit=20', token),
      selectedAcademicYearId
        ? request<AcademicYearPreparation>(`/annees-academiques/${selectedAcademicYearId}/preparation`, token)
        : Promise.resolve(null),
      selectedAcademicYearId
        ? request<InscriptionAnnuelle[]>(`/inscriptions-annuelles/annee/${selectedAcademicYearId}`, token)
        : Promise.resolve([]),
      selectedAcademicYearId
        ? request<MontantCotisation[]>(`/montants-cotisation/annee/${selectedAcademicYearId}`, token)
        : Promise.resolve([]),
    ])

    const [summaryResult, yearsResult, levelsResult, usersResult, cotisationsResult, paiementsResult, adherentsResult, rankingsResult, donsResult, promotionsResult, defisResult, waveConfigurationsResult, auditResult, emailStatusResult, pendingEmailsResult, preparationResult, annualInscriptionsResult, montantsResult] = results
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
    if (waveConfigurationsResult.status === 'fulfilled') setWaveConfigurations(waveConfigurationsResult.value)
    if (auditResult.status === 'fulfilled') setAuditLogs(auditResult.value)
    if (emailStatusResult.status === 'fulfilled') setEmailStatus(emailStatusResult.value)
    if (pendingEmailsResult.status === 'fulfilled') setPendingEmails(pendingEmailsResult.value)
    if (preparationResult.status === 'fulfilled') setAcademicYearPreparation(preparationResult.value)
    if (annualInscriptionsResult.status === 'fulfilled') setAnnualInscriptions(annualInscriptionsResult.value)
    if (montantsResult.status === 'fulfilled') setMontantsCotisation(montantsResult.value)

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
    setAcademicYearPreparation(null)
    setPassagePreview([])
    setAnnualInscriptions([])
    setMontantsCotisation([])
    setAnnualGenerationResult(null)
    setAnnualGenerationPreview(null)
    setSelectedAcademicYearId('')
    setPassageSourceYearId('')
    setPassageTargetYearId('')
    setSelectedLevelId('')
    setUserSearchQuery('')
    setUserLevelFilter('')
    setUserRoleFilter('')
    setUserStatusFilter('')
    setCotisationSearchQuery('')
    setCotisationStatusFilter('')
    setPaymentSearchQuery('')
    setPaymentStatusFilter('')
    setPaymentMethodFilter('')
    setSelectedFinanceStudentId('')
    setLevels([])
    setUsers([])
    setCotisations([])
    setPaiements([])
    setEmailStatus(null)
    setPendingEmails([])
    setStudentImportResults([])
    setLastActivationCode(null)
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

  const createAcademicYear = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runAction('Annee academique creee', async () => {
      await request('/annees-academiques', token, {
        method: 'POST',
        body: JSON.stringify(academicYearForm),
      })
      setAcademicYearForm({ libelle: '', dateDebut: '', dateFin: '' })
    })
  }

  const changeAcademicYearStatus = (id: string, action: 'ouvrir' | 'fermer') => {
    runAction(action === 'ouvrir' ? 'Annee ouverte' : 'Annee fermee', () =>
      request(`/annees-academiques/${id}/${action}`, token, { method: 'POST' }),
    )
  }

  const previewPassages = () => {
    if (!passageSourceYearId) {
      setNotice({ kind: 'error', message: 'Choisissez une annee source pour previsualiser les passages' })
      return
    }

    runAction('Previsualisation des passages chargee', async () => {
      const results = await request<PassagePreview[]>(`/inscriptions-annuelles/passages/previsualiser/${passageSourceYearId}`, token)
      setPassagePreview(results)
    })
  }

  const applyPassages = () => {
    if (!passageSourceYearId || !passageTargetYearId) {
      setNotice({ kind: 'error', message: 'Choisissez une annee source et une annee cible' })
      return
    }
    if (passageSourceYearId === passageTargetYearId) {
      setNotice({ kind: 'error', message: 'L annee source et l annee cible doivent etre differentes' })
      return
    }

    runAction('Passages annuels appliques', async () => {
      await request('/inscriptions-annuelles/passages/appliquer', token, {
        method: 'POST',
        body: JSON.stringify({
          anneeSourceId: passageSourceYearId,
          anneeCibleId: passageTargetYearId,
        }),
      })
      const results = await request<PassagePreview[]>(`/inscriptions-annuelles/passages/previsualiser/${passageTargetYearId}`, token)
      setPassagePreview(results)
      setSelectedAcademicYearId(passageTargetYearId)
    })
  }

  const updateInscriptionException = (
    inscription: InscriptionAnnuelle,
    changes: Partial<Pick<InscriptionAnnuelle, 'statutScolaire' | 'eligibleCotisation' | 'commentaire'>>,
  ) => {
    const nextStatut = changes.statutScolaire ?? inscription.statutScolaire
    const nextEligible = changes.eligibleCotisation ?? (
      !['abandon', 'exclu', 'alumni'].includes(nextStatut) && inscription.level.name.toLowerCase() !== 'alumni'
    )

    runAction('Exception mise a jour', async () => {
      await request(`/inscriptions-annuelles/${inscription.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          statutScolaire: nextStatut,
          eligibleCotisation: nextEligible,
          commentaire: changes.commentaire ?? inscription.commentaire ?? undefined,
        }),
      })
      if (passageSourceYearId === inscription.anneeAcademique.id) {
        const results = await request<PassagePreview[]>(`/inscriptions-annuelles/passages/previsualiser/${passageSourceYearId}`, token)
        setPassagePreview(results)
      }
    })
  }

  const saveAnnualAmount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedAcademicYearId) {
      setNotice({ kind: 'error', message: 'Selectionnez une annee avant de fixer un montant' })
      return
    }
    if (amountForm.type === 'niveau' && !amountForm.levelId) {
      setNotice({ kind: 'error', message: 'Choisissez le niveau concerne' })
      return
    }
    if (amountForm.type === 'exception' && !amountForm.userId) {
      setNotice({ kind: 'error', message: 'Choisissez l etudiant concerne par l exception' })
      return
    }

    const existing = montantsCotisation.find(item =>
      item.type === amountForm.type &&
      (amountForm.type === 'niveau' ? item.level?.id === amountForm.levelId : item.user?.id === amountForm.userId),
    )

    runAction(existing ? 'Montant mis a jour' : 'Montant enregistre', async () => {
      const body = {
        anneeAcademiqueId: selectedAcademicYearId,
        type: amountForm.type,
        levelId: amountForm.type === 'niveau' ? amountForm.levelId : undefined,
        userId: amountForm.type === 'exception' ? amountForm.userId : undefined,
        montant: Number(amountForm.montant),
        dateLimite: amountForm.dateLimite,
        commentaire: amountForm.commentaire || undefined,
      }
      await request(existing ? `/montants-cotisation/${existing.id}` : '/montants-cotisation', token, {
        method: existing ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      })
      setAmountForm({ type: 'niveau', levelId: '', userId: '', montant: '', dateLimite: '', commentaire: '' })
    })
  }

  const generateAnnualCotisations = () => {
    if (!selectedAcademicYearId) {
      setNotice({ kind: 'error', message: 'Selectionnez une annee avant de generer les cotisations' })
      return
    }
    if (!annualAmountReadiness.ready) {
      setNotice({ kind: 'error', message: 'Definissez les montants de tous les niveaux eligibles avant generation' })
      return
    }

    runAction('Cotisations annuelles generees', async () => {
      const result = await request<AnnualGenerationResult>('/cotisations/generer-annuelle', token, {
        method: 'POST',
        body: JSON.stringify({
          anneeAcademiqueId: selectedAcademicYearId,
          title: `Cotisation ${selectedAcademicYear?.libelle ?? ''}`.trim(),
        }),
      })
      setAnnualGenerationResult(result)
    })
  }

  const previewAnnualCotisations = () => {
    if (!selectedAcademicYearId) {
      setNotice({ kind: 'error', message: 'Selectionnez une annee avant de previsualiser les cotisations' })
      return
    }

    runAction('Previsualisation des cotisations chargee', async () => {
      const result = await request<AnnualGenerationPreview>(`/cotisations/generation-annuelle/previsualiser/${selectedAcademicYearId}`, token)
      setAnnualGenerationPreview(result)
      setAnnualGenerationResult(null)
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
      setPaymentForm({ amount: '', method: 'Wave', reference: '', cotisationId: '', userId: '' })
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
      const results = await request<StudentImportResult[]>('/users/import', token, {
        method: 'POST',
        body: formData,
      })
      setStudentImportResults(results)
      setImportFile(null)
    })
  }

  const regenerateActivationCode = (item: User) => {
    runAction('Nouveau code d activation genere', async () => {
      const result = await request<{ userId: string; activationCode: string; expiresAt: string }>(`/users/invites/${item.id}/regenerer-code`, token, {
        method: 'POST',
      })
      setLastActivationCode(result)
    })
  }

  const handleDownload = (path: string, filename: string) => {
    runAction('Export prepare', () => downloadFile(path, token, filename))
  }

  const studentPayment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runAction('Paiement Wave initie', async () => {
      await request('/paiements/wave/initier', token, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(paymentForm.amount),
          cotisationId: paymentForm.cotisationId,
          userId: studentPaymentMode === 'camarade' ? studentBeneficiary?.id : undefined,
          payerPhone: paymentForm.reference || undefined,
          note: studentPaymentMode === 'camarade'
            ? `Paiement pour ${studentBeneficiary ? getFullName(studentBeneficiary) : 'un camarade'} depuis l espace etudiant`
            : 'Paiement initie depuis l espace etudiant',
        }),
      })
      setPaymentForm({ amount: '', method: 'Wave', reference: '', cotisationId: '', userId: '' })
    })
  }

  const switchStudentPaymentMode = (mode: 'moi' | 'camarade') => {
    setStudentPaymentMode(mode)
    setPaymentForm({ amount: '', method: 'Wave', reference: '', cotisationId: '', userId: '' })
    if (mode === 'moi') {
      setStudentBeneficiary(null)
      setStudentBeneficiaryResults([])
      setStudentBeneficiaryCotisations([])
      setStudentBeneficiaryQuery('')
      setStudentBeneficiaryLevelId('')
    }
  }

  const searchStudentBeneficiaries = () => {
    runAction('Recherche terminee', async () => {
      const results = await request<User[]>(`/users/camarades/recherche${toQueryString({ q: studentBeneficiaryQuery, levelId: studentBeneficiaryLevelId })}`, token)
      setStudentBeneficiaryResults(results)
    })
  }

  const selectStudentBeneficiary = (beneficiary: User) => {
    runAction('Cotisations du camarade chargees', async () => {
      const results = await request<Cotisation[]>(`/cotisations/beneficiaire/${beneficiary.id}`, token)
      setStudentBeneficiary(beneficiary)
      setStudentBeneficiaryResults([])
      setStudentBeneficiaryCotisations(results)
      const firstOpen = results.find(item => !item.paid && (item.paidAmount ?? 0) < item.amount)
      setPaymentForm(current => ({ ...current, cotisationId: firstOpen?.id ?? '' }))
    })
  }

  const searchStudentChallengeOpponents = () => {
    runAction('Recherche terminee', async () => {
      const results = await request<User[]>(`/users/camarades/recherche${toQueryString({ q: studentChallengeQuery, levelId: studentChallengeLevelId })}`, token)
      setStudentChallengeResults(results)
    })
  }

  const createStudentChallenge = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!studentChallengeOpponent) {
      setNotice({ kind: 'error', message: 'Choisissez un camarade a defier' })
      return
    }

    runAction('Defi envoye', async () => {
      await request('/defis', token, {
        method: 'POST',
        body: JSON.stringify({
          opponentId: studentChallengeOpponent.id,
          message: studentChallengeMessage || undefined,
        }),
      })
      setStudentChallengeQuery('')
      setStudentChallengeLevelId('')
      setStudentChallengeResults([])
      setStudentChallengeOpponent(null)
      setStudentChallengeMessage('')
    })
  }

  const selectUserForEdit = (item: User) => {
    setEditingUserId(item.id)
    setEditUserForm({
      firstName: item.firstName,
      lastName: item.lastName,
      email: item.email,
      phone: item.phone ?? '',
      wavePhone: item.wavePhone ?? '',
      levelId: item.level?.id ?? '',
      role: item.role,
      accountStatus: item.accountStatus ?? 'actif',
      entrySource: item.entrySource ?? 'creation_manuelle',
      promotionSortante: item.promotionSortante ?? '',
    })
  }

  const updateSelectedUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingUserId) {
      setNotice({ kind: 'error', message: 'Choisissez un utilisateur a modifier' })
      return
    }

    runAction('Profil utilisateur mis a jour', async () => {
      await request(`/users/${editingUserId}`, token, {
        method: 'PUT',
        body: JSON.stringify({
          ...editUserForm,
          phone: editUserForm.phone || undefined,
          wavePhone: editUserForm.wavePhone || undefined,
          levelId: editUserForm.levelId || undefined,
          promotionSortante: editUserForm.promotionSortante || undefined,
        }),
      })
      setEditingUserId('')
      setEditUserForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        wavePhone: '',
        levelId: '',
        role: 'etudiant',
        accountStatus: 'actif',
        entrySource: 'creation_manuelle',
        promotionSortante: '',
      })
    })
  }

  const handoverBureau = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!handoverForm.nouveauTresorierId) {
      setNotice({ kind: 'error', message: 'Choisissez le nouveau tresorier' })
      return
    }
    const selectedTreasurer = users.find(item => item.id === handoverForm.nouveauTresorierId)
    const confirmed = window.confirm(
      `Confirmer la passation vers ${getFullName(selectedTreasurer)} ? Les anciens comptes admin/tresorier perdront immediatement tous leurs droits de gestion.`,
    )
    if (!confirmed) return

    runAction('Passation du bureau effectuee', async () => {
      await request('/users/passation-bureau', token, {
        method: 'POST',
        body: JSON.stringify({
          nouveauTresorierId: handoverForm.nouveauTresorierId,
          motif: handoverForm.motif || undefined,
        }),
      })
      setHandoverForm({ nouveauTresorierId: '', motif: '' })
    })
  }

  const createWaveConfiguration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runAction('Configuration Wave enregistree', async () => {
      await request('/configurations-wave', token, {
        method: 'POST',
        body: JSON.stringify({
          anneeAcademiqueId: waveForm.anneeAcademiqueId || selectedAcademicYearId,
          nomCompte: waveForm.nomCompte,
          nomBureau: waveForm.nomBureau || undefined,
          checkoutUrl: waveForm.checkoutUrl,
          currency: waveForm.currency || 'XOF',
          successUrl: waveForm.successUrl || undefined,
          errorUrl: waveForm.errorUrl || undefined,
          webhookUrl: waveForm.webhookUrl || undefined,
          apiKey: waveForm.apiKey,
          webhookSecret: waveForm.webhookSecret || undefined,
        }),
      })
      setWaveForm({
        anneeAcademiqueId: selectedAcademicYearId,
        nomCompte: '',
        nomBureau: '',
        checkoutUrl: '',
        currency: 'XOF',
        successUrl: '',
        errorUrl: '',
        webhookUrl: '',
        apiKey: '',
        webhookSecret: '',
      })
    })
  }

  const changeWaveConfigurationStatus = (id: string, action: 'valider' | 'activer' | 'desactiver') => {
    const labels = {
      valider: 'Configuration Wave validee',
      activer: 'Configuration Wave activee',
      desactiver: 'Configuration Wave desactivee',
    }
    runAction(labels[action], () => request(`/configurations-wave/${id}/${action}`, token, { method: 'POST' }))
  }

  const sendManualAlert = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runAction('Alerte envoyee', async () => {
      await request('/notifications/manuel', token, {
        method: 'POST',
        body: JSON.stringify({
          recipientId: alertForm.recipientId || undefined,
          promotionSortante: alertForm.recipientId ? undefined : alertForm.promotionSortante || undefined,
          anneeAcademiqueId: selectedAcademicYearId || undefined,
          type: alertForm.promotionSortante && !alertForm.recipientId ? 'demande_aide_alumni' : alertForm.type,
          canal: alertForm.canal,
          title: alertForm.title,
          message: alertForm.message,
        }),
      })
      setAlertForm({
        recipientId: '',
        promotionSortante: '',
        type: 'message_manuel',
        canal: 'application_et_email',
        title: '',
        message: '',
        inactiveDays: alertForm.inactiveDays,
      })
    })
  }

  const runContributionReminders = () => {
    runAction('Rappels de cotisation generes', () => {
      if (!selectedAcademicYearId) {
        return request('/notifications/rappels-cotisation/annee-active', token, { method: 'POST' })
      }

      return request('/notifications/rappels-cotisation', token, {
        method: 'POST',
        body: JSON.stringify({
          anneeAcademiqueId: selectedAcademicYearId,
          inactiveDays: Number(alertForm.inactiveDays || 21),
        }),
      })
    })
  }

  const testEmailConnection = () => {
    runAction('Connexion SMTP validee', async () => {
      const result = await request<{ success: boolean; skipped: boolean; reason?: string }>('/emails/tester-connexion', token, {
        method: 'POST',
      })
      if (!result.success) {
        throw new Error(result.reason || 'Connexion SMTP indisponible')
      }
    })
  }

  const dispatchPendingEmails = () => {
    runAction('Traitement de la file email termine', async () => {
      const result = await request<{ skipped: boolean; reason?: string; sentCount: number; failedCount: number }>('/emails/envoyer-en-attente', token, {
        method: 'POST',
      })
      if (result.skipped) {
        throw new Error(result.reason || 'Envoi email indisponible')
      }
      if (result.failedCount > 0) {
        throw new Error(`${result.failedCount} email(s) en echec`)
      }
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
              <div className="legal-links">
                <a href="/privacy.html" target="_blank" rel="noreferrer">Confidentialite</a>
                <a href="/terms.html" target="_blank" rel="noreferrer">Conditions</a>
              </div>
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
                <strong>{formatCurrency(studentSummary?.level?.annualAmount && studentSummary.level.annualAmount > 0 ? studentSummary.level.annualAmount : studentSummary?.totalAmount ?? 0)}</strong>
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

            <section className="quick-actions student-actions">
              <button type="button" className="ghost" onClick={() => switchStudentPaymentMode('moi')}>Cotiser pour moi</button>
              <button type="button" className="ghost" onClick={() => switchStudentPaymentMode('camarade')}>Payer pour un camarade</button>
              <button type="button" className="ghost" onClick={() => document.getElementById('student-defi-panel')?.scrollIntoView({ behavior: 'smooth' })}>Lancer un defi</button>
            </section>

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
                <h2>{studentPaymentMode === 'camarade' ? 'Payer pour un camarade' : 'Effectuer un versement'}</h2>
                <div className="segmented web-segmented">
                  <button type="button" className={studentPaymentMode === 'moi' ? 'segment active' : 'segment'} onClick={() => switchStudentPaymentMode('moi')}>Pour moi</button>
                  <button type="button" className={studentPaymentMode === 'camarade' ? 'segment active' : 'segment'} onClick={() => switchStudentPaymentMode('camarade')}>Pour camarade</button>
                </div>
                {studentPaymentMode === 'camarade' && (
                  <div className="form-hint">
                    <strong>Beneficiaire</strong>
                    <span>Choisissez d'abord le niveau, puis recherchez le camarade par nom ou prenom.</span>
                    <div className="form-grid">
                      <select value={studentBeneficiaryLevelId} onChange={e => setStudentBeneficiaryLevelId(e.target.value)}>
                        <option value="">Tous les niveaux</option>
                        {levels.filter(level => level.name !== 'alumni').map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                      </select>
                      <input value={studentBeneficiaryQuery} onChange={e => setStudentBeneficiaryQuery(e.target.value)} placeholder="Nom ou prenom" />
                      <button type="button" className="ghost compact" onClick={searchStudentBeneficiaries}>Rechercher</button>
                    </div>
                    {studentBeneficiary && <span>Camarade choisi: {getFullName(studentBeneficiary)} - {studentBeneficiary.level?.name ?? '-'}</span>}
                    {studentBeneficiaryResults.map(item => (
                      <button key={item.id} type="button" className="ghost compact" onClick={() => selectStudentBeneficiary(item)}>
                        {getFullName(item)} - {item.level?.name ?? '-'}
                      </button>
                    ))}
                  </div>
                )}
                <label>Cotisation
                  <select value={paymentForm.cotisationId} onChange={e => setPaymentForm({ ...paymentForm, cotisationId: e.target.value })} required>
                    <option value="">Choisir</option>
                    {(studentPaymentMode === 'camarade' ? studentBeneficiaryCotisations : cotisations).filter(item => !item.paid).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.title} - reste {formatCurrency(Math.max(0, item.amount - (item.paidAmount ?? 0)))}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-grid">
                  <label>Montant<input type="number" min="0" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required /></label>
                  <label>Numero Wave<input value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} /></label>
                </div>
                <button type="submit" className="cta">Enregistrer le versement</button>
              </form>
            </section>

            <section id="student-defi-panel" className="two-column">
              <form onSubmit={createStudentChallenge} className="panel form-panel">
                <h2>Lancer un defi</h2>
                <div className="form-hint">
                  <strong>Defi de cotisation</strong>
                  <span>Choisissez d'abord le niveau, puis recherchez un camarade par nom ou prenom. Le premier qui termine sa cotisation gagne le defi.</span>
                </div>
                <div className="form-grid">
                  <select value={studentChallengeLevelId} onChange={e => setStudentChallengeLevelId(e.target.value)}>
                    <option value="">Tous les niveaux</option>
                    {levels.filter(level => level.name !== 'alumni').map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                  </select>
                  <input value={studentChallengeQuery} onChange={e => setStudentChallengeQuery(e.target.value)} placeholder="Nom ou prenom" />
                  <button type="button" className="ghost compact" onClick={searchStudentChallengeOpponents}>Rechercher</button>
                </div>
                {studentChallengeOpponent && <p className="muted">Adversaire choisi: {getFullName(studentChallengeOpponent)} - {studentChallengeOpponent.level?.name ?? '-'}</p>}
                {studentChallengeResults.map(item => (
                  <button key={item.id} type="button" className="ghost compact" onClick={() => { setStudentChallengeOpponent(item); setStudentChallengeResults([]) }}>
                    {getFullName(item)} - {item.level?.name ?? '-'}
                  </button>
                ))}
                <label>Message<textarea value={studentChallengeMessage} onChange={e => setStudentChallengeMessage(e.target.value)} rows={4} placeholder="Je te defie de finir avant moi..." /></label>
                <button type="submit" className="cta">Envoyer le defi</button>
              </form>

              <DataPanel title="Mes derniers defis">
                <table>
                  <thead><tr><th>Createur</th><th>Adversaire</th><th>Statut</th><th>Progression</th></tr></thead>
                  <tbody>
                    {!defis.length && <EmptyTableRow colSpan={4} message="Aucun defi affiche dans cette session web." />}
                    {defis.slice(0, 6).map(item => (
                      <tr key={item.id}>
                        <td>{getFullName(item.challenger)}</td>
                        <td>{getFullName(item.opponent)}</td>
                        <td>{getStatusLabel(item.status)}</td>
                        <td>{item.challengerProgress ?? 0}% / {item.opponentProgress ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </DataPanel>
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
              <div
                className="hero-meter"
                style={{ background: `conic-gradient(#22a6cf ${completionRate * 3.6}deg, rgba(31, 28, 91, 0.12) 0deg)` }}
                aria-label={`Progression de collecte ${completionRate}%`}
              >
                <div>
                  <strong>{completionRate}%</strong>
                  <span>collecte</span>
                </div>
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

            <section className="campaign-ribbon">
              <article>
                <span>Annee suivie</span>
                <strong>{selectedAcademicYear?.libelle ?? 'Toutes les annees'}</strong>
              </article>
              <article>
                <span>Etat campagne</span>
                <strong>{academicYearPreparation?.pretPaiements ? 'Prete' : 'A preparer'}</strong>
              </article>
              <article>
                <span>Action prioritaire</span>
                <strong>{dashboardTotals.totalOverdue > 0 ? 'Relancer les retards' : 'Maintenir le rythme'}</strong>
              </article>
            </section>

            <section className="panel filter-panel">
              <div>
                <p className="eyebrow">Filtres de pilotage</p>
                <h2>{selectedAcademicYear?.libelle ?? 'Vue globale'}</h2>
              </div>
              <label>Annee
                <select value={selectedAcademicYearId} onChange={e => { setSelectedAcademicYearId(e.target.value); setAnnualGenerationResult(null); setAnnualGenerationPreview(null) }}>
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
                ['annees', 'Annee scolaire'],
                ['levels', 'Niveaux'],
                ['users', 'Etudiants'],
                ['cotisations', 'Cotisations'],
                ['paiements', 'Paiements'],
                ['wave', 'Wave'],
                ['rankings', 'Classement'],
                ['defis', 'Defis'],
                ['alumni', 'Alumni'],
                ['dons', 'Dons'],
                ['alertes', 'Alertes'],
                ['adherents', 'Adherents'],
                ['audit', 'Audit'],
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
                    <div className="student-mix" aria-label="Repartition des etudiants par statut de cotisation">
                      <span
                        className="mix-paid"
                        style={{ flex: Math.max(adminIndicators.fullyPaidStudents, 0) }}
                        title="Etudiants soldes"
                      />
                      <span
                        className="mix-partial"
                        style={{ flex: Math.max(adminIndicators.partialStudents, 0) }}
                        title="Etudiants partiels"
                      />
                      <span
                        className="mix-zero"
                        style={{ flex: Math.max(adminIndicators.zeroPaymentStudents, 0) }}
                        title="Etudiants a zero paiement"
                      />
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
                      <button type="button" className="ghost" onClick={() => setActiveTab('annees')}>Cycle annuel</button>
                      <button type="button" className="ghost" onClick={() => setActiveTab('cotisations')}>Creer une cotisation</button>
                      <button type="button" className="ghost" onClick={() => setActiveTab('paiements')}>Saisir un paiement</button>
                      <button type="button" className="ghost" onClick={() => setActiveTab('alertes')}>Envoyer une alerte</button>
                      <button type="button" className="ghost" onClick={() => handleDownload(overdueExportPath, 'cotisations-en-retard.xlsx')}>Exporter retards</button>
                      <button type="button" className="ghost" onClick={() => handleDownload('/dons/export', 'dons-alumni.xlsx')}>Exporter dons</button>
                    </div>
                  </div>
                </section>

                {academicYearPreparation && (
                  <section className="panel readiness-panel">
                    <div className="section-header">
                      <div>
                        <p className="eyebrow">Demarrage annuel</p>
                        <h2>{academicYearPreparation.pretPaiements ? 'Campagne prete' : 'Preparation incomplete'}</h2>
                      </div>
                      <strong>{academicYearPreparation.score}/{academicYearPreparation.total}</strong>
                    </div>
                    <div className="readiness-grid">
                      {academicYearPreparation.checks.map(item => (
                        <article key={item.key} className={item.ok ? 'readiness-item ok' : 'readiness-item warning'}>
                          <span>{item.ok ? 'OK' : 'A faire'}</span>
                          <strong>{item.label}</strong>
                          <small>{item.details}</small>
                        </article>
                      ))}
                    </div>
                  </section>
                )}

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
                      <thead><tr><th>Etudiant</th><th>Niveau</th><th>Reste</th><th>Retards</th><th>Echeance</th><th>Action</th></tr></thead>
                      <tbody>
                        {!overdueAttention.length && <EmptyTableRow colSpan={6} message="Aucun retard dans les filtres actuels." />}
                        {overdueAttention.map(item => (
                          <tr key={item.user.id}>
                            <td>{getFullName(item.user)}</td>
                            <td>{item.user.level?.name ? <span className="level-chip">{item.user.level.name}</span> : '-'}</td>
                            <td>{formatCurrency(item.remaining)}</td>
                            <td>{item.overdueCount}</td>
                            <td>{new Date(item.dueDate).toLocaleDateString('fr-FR')}</td>
                            <td>
                              <button type="button" className="ghost compact" onClick={() => { setAlertForm({ ...alertForm, recipientId: item.user.id, promotionSortante: '' }); setActiveTab('alertes') }}>
                                Cibler
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataPanel>

                  <DataPanel title="Derniers paiements">
                    <table>
                      <thead><tr><th>Etudiant</th><th>Montant</th><th>Statut</th><th>Origine</th><th>Date</th></tr></thead>
                      <tbody>
                        {!recentPayments.length && <EmptyTableRow colSpan={5} message="Aucun paiement recent dans les filtres actuels." />}
                        {recentPayments.map(item => (
                          <tr key={item.id}>
                            <td>{getFullName(item.user)}</td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td><span className={`badge ${item.status ?? 'confirme'}`}>{getStatusLabel(item.status ?? 'confirme')}</span></td>
                            <td>{getStatusLabel(item.origin ?? item.method)}</td>
                            <td>{item.paidAt ? new Date(item.paidAt).toLocaleDateString('fr-FR') : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataPanel>
                </section>

                <section className="two-column">
                  <DataPanel title="Bons contributeurs">
                    <table>
                      <thead><tr><th>Rang</th><th>Etudiant</th><th>Niveau</th><th>Verse</th><th>Progression</th></tr></thead>
                      <tbody>
                        {!topContributors.length && <EmptyTableRow colSpan={5} message="Aucun classement disponible pour ces filtres." />}
                        {topContributors.map((item, index) => {
                          const percent = Math.round(item.progress ?? item.percentage ?? 0)
                          return (
                            <tr key={item.userId ?? `${item.firstName}-${item.lastName}-${index}`}>
                              <td>#{index + 1}</td>
                              <td>{`${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || '-'}</td>
                              <td>{getRankingLevelName(item.level)}</td>
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

                  <DataPanel title="Lecture rapide">
                    <div className="insight-list">
                      <article>
                        <span>Priorite tresorerie</span>
                        <strong>{overdueAttention[0] ? getFullName(overdueAttention[0].user) : 'Aucun retard'}</strong>
                        <small>{overdueAttention[0] ? `${formatCurrency(overdueAttention[0].remaining)} a recuperer` : 'La campagne est propre sur les echeances.'}</small>
                      </article>
                      <article>
                        <span>Dynamique recente</span>
                        <strong>{recentPayments[0] ? formatCurrency(recentPayments[0].amount) : 'Aucun paiement'}</strong>
                        <small>{recentPayments[0] ? `${getFullName(recentPayments[0].user)} - ${recentPayments[0].paidAt ? new Date(recentPayments[0].paidAt).toLocaleDateString('fr-FR') : '-'}` : 'Aucune entree recente.'}</small>
                      </article>
                      <article>
                        <span>Meilleur signal</span>
                        <strong>{topContributors[0] ? `${Math.round(topContributors[0].progress ?? topContributors[0].percentage ?? 0)}%` : '-'}</strong>
                        <small>{topContributors[0] ? `${topContributors[0].firstName ?? ''} ${topContributors[0].lastName ?? ''}`.trim() : 'Classement indisponible.'}</small>
                      </article>
                    </div>
                  </DataPanel>
                </section>

                <DataPanel title="Etudiants a zero paiement">
                  <div className="panel-metrics">
                    <PanelMetric label="A surveiller" value={zeroPaymentAttention.length} />
                    <PanelMetric label="Action" value="Relance douce" />
                  </div>
                  <table>
                    <thead><tr><th>Etudiant</th><th>Niveau</th><th>Reste</th><th>Prochaine echeance</th></tr></thead>
                    <tbody>
                      {!zeroPaymentAttention.length && <EmptyTableRow colSpan={4} message="Aucun etudiant a zero paiement dans les filtres actuels." />}
                      {zeroPaymentAttention.map(item => (
                        <tr key={item.user.id}>
                          <td>{getFullName(item.user)}</td>
                          <td>{item.user.level?.name ? <span className="level-chip">{item.user.level.name}</span> : '-'}</td>
                          <td>{formatCurrency(item.remaining)}</td>
                          <td>{new Date(item.dueDate).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>
              </>
            )}

            {activeTab === 'annees' && (
              <>
                <section className="tab-brief annual-brief">
                  <div>
                    <p className="eyebrow">Cycle annuel</p>
                    <h2>Fermer, ouvrir et faire passer les promotions</h2>
                    <p>Le tresorier garde le controle sur les passages automatiques et traite les exceptions avant la nouvelle campagne.</p>
                  </div>
                  <strong>{selectedAcademicYear?.libelle ?? 'Aucune annee selectionnee'}</strong>
                </section>

                <section className="two-column">
                  <form onSubmit={createAcademicYear} className="panel form-panel">
                    <h2>Nouvelle annee scolaire</h2>
                    <label>Libelle
                      <input value={academicYearForm.libelle} onChange={e => setAcademicYearForm({ ...academicYearForm, libelle: e.target.value })} placeholder="2027-2028" required />
                    </label>
                    <label>Date debut
                      <input type="date" value={academicYearForm.dateDebut} onChange={e => setAcademicYearForm({ ...academicYearForm, dateDebut: e.target.value })} required />
                    </label>
                    <label>Date fin
                      <input type="date" value={academicYearForm.dateFin} onChange={e => setAcademicYearForm({ ...academicYearForm, dateFin: e.target.value })} required />
                    </label>
                    <button type="submit" className="cta">Creer l annee</button>
                  </form>

                  <DataPanel title="Annees academiques">
                    <table>
                      <thead><tr><th>Annee</th><th>Periode</th><th>Statut</th><th>Active</th><th>Actions</th></tr></thead>
                      <tbody>
                        {!academicYears.length && <EmptyTableRow colSpan={5} message="Aucune annee academique creee." />}
                        {academicYears.map(item => (
                          <tr key={item.id}>
                            <td><strong>{item.libelle}</strong></td>
                            <td>{new Date(item.dateDebut).toLocaleDateString('fr-FR')} - {new Date(item.dateFin).toLocaleDateString('fr-FR')}</td>
                            <td><span className={`badge ${item.statut}`}>{getStatusLabel(item.statut)}</span></td>
                            <td>{item.active ? <span className="level-chip">Active</span> : '-'}</td>
                            <td>
                              <div className="table-actions">
                                <button type="button" className="ghost compact" onClick={() => setSelectedAcademicYearId(item.id)}>Suivre</button>
                                <button type="button" className="ghost compact" onClick={() => changeAcademicYearStatus(item.id, 'ouvrir')}>Ouvrir</button>
                                <button type="button" className="ghost compact" onClick={() => changeAcademicYearStatus(item.id, 'fermer')}>Fermer</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataPanel>
                </section>

                <section className="panel annual-flow">
                  <div className="section-header">
                    <div>
                      <p className="eyebrow">Passages automatiques</p>
                      <h2>{passageSourceYear?.libelle ?? 'Annee source'} vers {passageTargetYear?.libelle ?? 'annee cible'}</h2>
                    </div>
                    <div className="table-actions">
                      <button type="button" className="ghost" onClick={previewPassages}>Previsualiser</button>
                      <button type="button" className="cta compact" onClick={applyPassages}>Appliquer</button>
                    </div>
                  </div>

                  <div className="form-grid">
                    <label>Annee source
                      <select value={passageSourceYearId} onChange={e => { setPassageSourceYearId(e.target.value); setPassagePreview([]) }}>
                        <option value="">Choisir l annee a fermer</option>
                        {academicYears.map(item => <option key={item.id} value={item.id}>{item.libelle} - {getStatusLabel(item.statut)}</option>)}
                      </select>
                    </label>
                    <label>Annee cible
                      <select value={passageTargetYearId} onChange={e => setPassageTargetYearId(e.target.value)}>
                        <option value="">Choisir la nouvelle annee</option>
                        {academicYears.map(item => <option key={item.id} value={item.id}>{item.libelle} - {getStatusLabel(item.statut)}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="panel-metrics">
                    <PanelMetric label="Etudiants vus" value={passageCounts.total} />
                    <PanelMetric label="Eligibles cotisation" value={passageCounts.eligible} />
                    <PanelMetric label="Vers alumni" value={passageCounts.alumni} />
                    <PanelMetric label="Exceptions" value={passageCounts.exceptions} />
                  </div>

                  <table>
                    <thead><tr><th>Etudiant</th><th>Niveau actuel</th><th>Statut</th><th>Prochain niveau</th><th>Cotisation</th></tr></thead>
                    <tbody>
                      {!passagePreview.length && <EmptyTableRow colSpan={5} message="Choisissez une annee source puis previsualisez les passages." />}
                      {passagePreview.map(item => (
                        <tr key={item.userId}>
                          <td>{item.nom}</td>
                          <td><span className="level-chip">{item.niveauActuel}</span></td>
                          <td><span className={`badge ${item.statutScolaire}`}>{getStatusLabel(item.statutScolaire)}</span></td>
                          <td><span className="level-chip">{item.prochainNiveau}</span></td>
                          <td>{item.eligibleCotisation ? 'Eligible' : 'Non eligible'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <DataPanel title={`Exceptions et inscriptions ${selectedAcademicYear?.libelle ?? ''}`}>
                  <div className="panel-metrics">
                    <PanelMetric label="Inscriptions" value={annualInscriptionCounts.total} />
                    <PanelMetric label="Eligibles" value={annualInscriptionCounts.eligible} />
                    <PanelMetric label="Redoublants" value={annualInscriptionCounts.redoublants} />
                    <PanelMetric label="Bloquees" value={annualInscriptionCounts.bloquees} />
                  </div>
                  <table>
                    <thead><tr><th>Etudiant</th><th>Niveau</th><th>Statut scolaire</th><th>Eligible</th><th>Commentaire</th></tr></thead>
                    <tbody>
                      {!selectedAcademicYearId && <EmptyTableRow colSpan={5} message="Selectionnez une annee dans les filtres de pilotage pour gerer les exceptions." />}
                      {selectedAcademicYearId && !annualInscriptions.length && <EmptyTableRow colSpan={5} message="Aucune inscription annuelle pour cette annee." />}
                      {annualInscriptions.map(item => (
                        <tr key={item.id}>
                          <td>{getFullName(item.user)}<br /><small>{item.user.email}</small></td>
                          <td><span className="level-chip">{item.level.name}</span></td>
                          <td>
                            <select
                              value={item.statutScolaire}
                              onChange={e => updateInscriptionException(item, { statutScolaire: e.target.value as InscriptionAnnuelle['statutScolaire'] })}
                            >
                              <option value="actif">Actif</option>
                              <option value="redoublant">Redoublant</option>
                              <option value="abandon">Abandon</option>
                              <option value="exclu">Exclu</option>
                              <option value="alumni">Alumni</option>
                            </select>
                          </td>
                          <td>
                            <label className="inline-check">
                              <input
                                type="checkbox"
                                checked={item.eligibleCotisation}
                                onChange={e => updateInscriptionException(item, { eligibleCotisation: e.target.checked })}
                              />
                              {item.eligibleCotisation ? 'Oui' : 'Non'}
                            </label>
                          </td>
                          <td>
                            <input
                              className="table-input"
                              defaultValue={item.commentaire ?? ''}
                              placeholder="Motif ou note"
                              onBlur={e => {
                                if (e.target.value !== (item.commentaire ?? '')) {
                                  updateInscriptionException(item, { commentaire: e.target.value })
                                }
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>

                <section className="two-column">
                  <form onSubmit={saveAnnualAmount} className="panel form-panel">
                    <h2>Montant de cotisation</h2>
                    <div className="form-hint">
                      <strong>Regle de calcul</strong>
                      <span>Le montant par niveau s applique a toute la classe. Une exception individuelle remplace le montant du niveau.</span>
                    </div>
                    <label>Type
                      <select value={amountForm.type} onChange={e => setAmountForm({ ...amountForm, type: e.target.value as 'niveau' | 'exception', levelId: '', userId: '' })}>
                        <option value="niveau">Montant par niveau</option>
                        <option value="exception">Exception individuelle</option>
                      </select>
                    </label>
                    {amountForm.type === 'niveau' ? (
                      <label>Niveau
                        <select value={amountForm.levelId} onChange={e => setAmountForm({ ...amountForm, levelId: e.target.value })}>
                          <option value="">Choisir un niveau</option>
                          {levels.filter(level => level.name.toLowerCase() !== 'alumni').map(level => (
                            <option key={level.id} value={level.id}>{level.name}</option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <label>Etudiant
                        <select value={amountForm.userId} onChange={e => setAmountForm({ ...amountForm, userId: e.target.value })}>
                          <option value="">Choisir un etudiant</option>
                          {annualInscriptions.filter(item => item.eligibleCotisation).map(item => (
                            <option key={item.user.id} value={item.user.id}>{getFullName(item.user)} - {item.level.name}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    <div className="form-grid">
                      <label>Montant
                        <input type="number" min="0" value={amountForm.montant} onChange={e => setAmountForm({ ...amountForm, montant: e.target.value })} required />
                      </label>
                      <label>Date limite
                        <input type="date" value={amountForm.dateLimite} onChange={e => setAmountForm({ ...amountForm, dateLimite: e.target.value })} required />
                      </label>
                    </div>
                    <label>Commentaire
                      <input value={amountForm.commentaire} onChange={e => setAmountForm({ ...amountForm, commentaire: e.target.value })} placeholder="Directive du bureau, cas social..." />
                    </label>
                    <button type="submit" className="cta">Enregistrer le montant</button>
                  </form>

                  <DataPanel title="Generation des cotisations">
                    <div className="panel-metrics">
                      <PanelMetric label="Niveaux attendus" value={annualAmountReadiness.expectedLevels} />
                      <PanelMetric label="Niveaux configures" value={annualAmountReadiness.configuredLevels} />
                      <PanelMetric label="Manquants" value={annualAmountReadiness.missingLevels} />
                      <PanelMetric label="Exceptions" value={exceptionAmounts.length} />
                    </div>
                    <div className={annualAmountReadiness.ready ? 'form-hint secure' : 'form-hint'}>
                      <strong>{annualAmountReadiness.ready ? 'Pret a generer' : 'Montants incomplets'}</strong>
                      <span>
                        {annualAmountReadiness.ready
                          ? 'Tous les niveaux eligibles ont un montant. Le tresorier peut generer les cotisations.'
                          : `Ajoutez les montants des niveaux eligibles${annualAmountReadiness.missingLevelNames.length ? `: ${annualAmountReadiness.missingLevelNames.join(', ')}` : ''}.`}
                      </span>
                    </div>
                    <div className="table-actions">
                      <button type="button" className="ghost" onClick={previewAnnualCotisations}>Previsualiser cotisations</button>
                      <button type="button" className="cta" onClick={generateAnnualCotisations}>Generer les cotisations annuelles</button>
                    </div>
                    {annualGenerationPreview && (
                      <div className="generation-report">
                        <div className="panel-metrics">
                          <PanelMetric label="Pretes" value={annualGenerationPreview.pret} />
                          <PanelMetric label="Deja generees" value={annualGenerationPreview.dejaGenerees} />
                          <PanelMetric label="Ignorees" value={annualGenerationPreview.ignorees} />
                          <PanelMetric label="Montants manquants" value={annualGenerationPreview.montantsManquants} />
                        </div>
                        <table>
                          <thead><tr><th>Statut</th><th>Etudiant</th><th>Niveau</th><th>Montant</th><th>Source</th><th>Raison</th></tr></thead>
                          <tbody>
                            {annualGenerationPreview.lignes.slice(0, 12).map(item => (
                              <tr key={`${item.userId}-${item.statutGeneration}`}>
                                <td><span className={`badge ${item.statutGeneration === 'pret' ? 'confirme' : item.statutGeneration === 'montant_manquant' ? 'echoue' : 'partial'}`}>{getStatusLabel(item.statutGeneration)}</span></td>
                                <td>{item.nom}</td>
                                <td><span className="level-chip">{item.niveau}</span></td>
                                <td>{item.montant > 0 ? formatCurrency(item.montant) : '-'}</td>
                                <td>{item.source}</td>
                                <td>{item.raison}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {annualGenerationResult && (
                      <div className="generation-report">
                        <div className="panel-metrics">
                          <PanelMetric label="Creees" value={annualGenerationResult.createdCount} />
                          <PanelMetric label="Ignorees" value={annualGenerationResult.skippedCount} />
                          <PanelMetric label="Annee" value={annualGenerationResult.anneeAcademique.libelle} />
                        </div>
                        <table>
                          <thead><tr><th>Resultat</th><th>Etudiant</th><th>Montant / raison</th></tr></thead>
                          <tbody>
                            {annualGenerationResult.created.slice(0, 8).map(item => (
                              <tr key={item.id}>
                                <td><span className="badge confirme">Creee</span></td>
                                <td>{getFullName(item.user)}</td>
                                <td>{formatCurrency(item.amount)}</td>
                              </tr>
                            ))}
                            {annualGenerationResult.skipped.slice(0, 8).map(item => (
                              <tr key={item.userId}>
                                <td><span className="badge partial">Ignoree</span></td>
                                <td>{getFullName(users.find(userItem => userItem.id === item.userId))}</td>
                                <td>{item.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </DataPanel>
                </section>

                <DataPanel title="Montants configures">
                  <table>
                    <thead><tr><th>Type</th><th>Cible</th><th>Montant</th><th>Date limite</th><th>Commentaire</th></tr></thead>
                    <tbody>
                      {!montantsCotisation.length && <EmptyTableRow colSpan={5} message="Aucun montant configure pour cette annee." />}
                      {montantsCotisation.map(item => (
                        <tr key={item.id}>
                          <td><span className="role-chip">{item.type}</span></td>
                          <td>{item.type === 'niveau' ? item.level?.name ?? '-' : getFullName(item.user)}</td>
                          <td>{formatCurrency(item.montant)}</td>
                          <td>{new Date(item.dateLimite).toLocaleDateString('fr-FR')}</td>
                          <td>{item.commentaire || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>

                {academicYearPreparation && (
                  <section className="panel readiness-panel">
                    <div className="section-header">
                      <div>
                        <p className="eyebrow">Controle avant paiements</p>
                        <h2>{academicYearPreparation.pretPaiements ? 'Campagne prete' : 'A completer avant novembre'}</h2>
                      </div>
                      <strong>{academicYearPreparation.score}/{academicYearPreparation.total}</strong>
                    </div>
                    <div className="readiness-grid">
                      {academicYearPreparation.checks.map(item => (
                        <article key={item.key} className={item.ok ? 'readiness-item ok' : 'readiness-item warning'}>
                          <span>{item.ok ? 'OK' : 'A faire'}</span>
                          <strong>{item.label}</strong>
                          <small>{item.details}</small>
                        </article>
                      ))}
                    </div>
                  </section>
                )}
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
              <>
                <section className="tab-brief students-brief">
                  <div>
                    <p className="eyebrow">Base officielle</p>
                    <h2>Etudiants, invitations et roles du bureau</h2>
                    <p>Gardez une liste propre: les nouveaux ISE1 viennent de l'import officiel, les roles sensibles restent geres par le tresorier ou l'administrateur.</p>
                  </div>
                  <strong>{users.length} comptes</strong>
                </section>
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

                    <form onSubmit={importStudents} className="panel form-panel import-panel">
                      <h2>Importer la liste des ISE1</h2>
                      <div className="form-hint">
                        <strong>Import officiel ISE1</strong>
                        <span>Colonnes attendues: nom et prenom. Le niveau est automatiquement ISE1; l'etudiant ajoute son email, son telephone et son mot de passe pendant l'activation mobile.</span>
                      </div>
                      <input type="file" accept=".xlsx,.xls,.csv" onChange={e => setImportFile(e.target.files?.[0] ?? null)} />
                      <button type="submit" className="cta">Importer la liste</button>
                      {!!studentImportResults.length && (
                        <div className="generation-report">
                          <div className="form-hint secure">
                            <strong>Codes d activation prives</strong>
                            <span>Distribuez chaque code uniquement a l'etudiant concerne. Le code n'est plus recuperable apres fermeture de cette page; il pourra etre regenere si necessaire.</span>
                          </div>
                          <table>
                            <thead><tr><th>Invitation</th><th>Statut</th><th>Code</th></tr></thead>
                            <tbody>
                              {studentImportResults.map((item, index) => (
                                <tr key={`${item.email}-${index}`}>
                                  <td>{item.email}</td>
                                  <td>{item.status}</td>
                                  <td><strong>{item.activationCode ?? item.message ?? '-'}</strong></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </form>

                    <form onSubmit={updateSelectedUser} className="panel form-panel">
                      <h2>Modifier un profil</h2>
                      <div className="form-hint secure">
                        <strong>Cas particuliers</strong>
                        <span>Utilisez ce bloc pour corriger un contact, changer un niveau, suspendre un compte ou basculer un ISE3 en alumni.</span>
                      </div>
                      {!editingUserId && <p className="muted">Cliquez sur Modifier dans la liste des utilisateurs.</p>}
                      <div className="form-grid">
                        <label>Prenom<input value={editUserForm.firstName} onChange={e => setEditUserForm({ ...editUserForm, firstName: e.target.value })} required disabled={!editingUserId} /></label>
                        <label>Nom<input value={editUserForm.lastName} onChange={e => setEditUserForm({ ...editUserForm, lastName: e.target.value })} required disabled={!editingUserId} /></label>
                      </div>
                      <label>Email<input type="email" value={editUserForm.email} onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })} required disabled={!editingUserId} /></label>
                      <div className="form-grid">
                        <label>Telephone<input value={editUserForm.phone} onChange={e => setEditUserForm({ ...editUserForm, phone: e.target.value })} disabled={!editingUserId} /></label>
                        <label>Telephone Wave<input value={editUserForm.wavePhone} onChange={e => setEditUserForm({ ...editUserForm, wavePhone: e.target.value })} disabled={!editingUserId} /></label>
                      </div>
                      <div className="form-grid">
                        <label>Niveau
                          <select value={editUserForm.levelId} onChange={e => setEditUserForm({ ...editUserForm, levelId: e.target.value })} disabled={!editingUserId}>
                            <option value="">Aucun</option>
                            {levels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                          </select>
                        </label>
                        <label>Role
                          <select value={editUserForm.role} onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value })} disabled={!editingUserId}>
                            <option value="etudiant">Etudiant</option>
                            <option value="tresorier">Tresorier</option>
                            <option value="admin">Admin</option>
                            <option value="alumni">Alumni</option>
                          </select>
                        </label>
                      </div>
                      <div className="form-grid">
                        <label>Statut
                          <select value={editUserForm.accountStatus} onChange={e => setEditUserForm({ ...editUserForm, accountStatus: e.target.value })} disabled={!editingUserId}>
                            <option value="invite">Invite</option>
                            <option value="profil_a_completer">Profil a completer</option>
                            <option value="actif">Actif</option>
                            <option value="suspendu">Suspendu</option>
                            <option value="alumni">Alumni</option>
                          </select>
                        </label>
                        <label>Source
                          <select value={editUserForm.entrySource} onChange={e => setEditUserForm({ ...editUserForm, entrySource: e.target.value })} disabled={!editingUserId}>
                            <option value="import_officiel">Import officiel</option>
                            <option value="passage_automatique">Passage automatique</option>
                            <option value="creation_manuelle">Creation manuelle</option>
                            <option value="demo">Demo</option>
                          </select>
                        </label>
                      </div>
                      <label>Promotion sortante<input value={editUserForm.promotionSortante} onChange={e => setEditUserForm({ ...editUserForm, promotionSortante: e.target.value })} placeholder="Promotion 2026" disabled={!editingUserId} /></label>
                      <div className="table-actions">
                        <button type="submit" className="cta" disabled={!editingUserId}>Enregistrer</button>
                        <button type="button" className="ghost" onClick={() => setEditingUserId('')} disabled={!editingUserId}>Annuler</button>
                      </div>
                    </form>

                    <form onSubmit={handoverBureau} className="panel form-panel danger-panel">
                      <h2>Passation du bureau</h2>
                      <div className="form-hint danger">
                        <strong>Action sensible</strong>
                        <span>Le nouveau tresorier devient gestionnaire. Les anciens comptes perdent tous leurs droits d'administration; leur acces etudiant ou alumni est conserve lorsqu'il reste legitime.</span>
                      </div>
                      <label>Nouveau tresorier
                        <select value={handoverForm.nouveauTresorierId} onChange={e => setHandoverForm({ ...handoverForm, nouveauTresorierId: e.target.value })} required>
                          <option value="">Choisir le nouveau responsable</option>
                          {handoverCandidates.map(item => (
                            <option key={item.id} value={item.id}>
                              {getFullName(item)} - {item.level?.name ?? getStatusLabel(item.role)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>Motif ou reference
                        <input value={handoverForm.motif} onChange={e => setHandoverForm({ ...handoverForm, motif: e.target.value })} placeholder="Ex: Bureau 2027 elu en octobre" />
                      </label>
                      <button type="submit" className="cta danger-cta">Confirmer la passation</button>
                    </form>
                  </div>

                  <DataPanel title="Utilisateurs">
                    {lastActivationCode && (
                      <div className="form-hint secure activation-code-banner">
                        <strong>Nouveau code: {lastActivationCode.activationCode}</strong>
                        <span>A transmettre uniquement a l'etudiant concerne. Expiration: {new Date(lastActivationCode.expiresAt).toLocaleDateString('fr-FR')}.</span>
                      </div>
                    )}
                    <div className="panel-metrics">
                      <PanelMetric label="Total" value={users.length} />
                      <PanelMetric label="Affiches" value={filteredUsers.length} />
                      <PanelMetric label="Actifs" value={userStatusCounts.actifs} />
                      <PanelMetric label="Invites" value={userStatusCounts.invites + userStatusCounts.profilsACompleter} />
                      <PanelMetric label="Suspendus" value={userStatusCounts.suspendus} />
                      <PanelMetric label="Alumni" value={userStatusCounts.alumni} />
                    </div>
                    <div className="table-filters user-filters">
                      <label>Rechercher
                        <input value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} placeholder="Nom, email ou telephone" />
                      </label>
                      <label>Niveau
                        <select value={userLevelFilter} onChange={e => setUserLevelFilter(e.target.value)}>
                          <option value="">Tous les niveaux</option>
                          {levels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
                        </select>
                      </label>
                      <label>Role
                        <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)}>
                          <option value="">Tous les roles</option>
                          <option value="etudiant">Etudiant</option>
                          <option value="tresorier">Tresorier</option>
                          <option value="admin">Admin</option>
                          <option value="alumni">Alumni</option>
                        </select>
                      </label>
                      <label>Statut
                        <select value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value)}>
                          <option value="">Tous les statuts</option>
                          <option value="invite">Invite</option>
                          <option value="profil_a_completer">Profil a completer</option>
                          <option value="actif">Actif</option>
                          <option value="suspendu">Suspendu</option>
                          <option value="alumni">Alumni</option>
                        </select>
                      </label>
                      <button
                        type="button"
                        className="ghost filter-reset"
                        onClick={() => {
                          setUserSearchQuery('')
                          setUserLevelFilter('')
                          setUserRoleFilter('')
                          setUserStatusFilter('')
                        }}
                      >
                        Reinitialiser
                      </button>
                    </div>
                    <table>
                      <thead><tr><th>Nom</th><th>Email</th><th>Niveau</th><th>Statut</th><th>Role</th><th>Actions</th></tr></thead>
                      <tbody>
                        {!filteredUsers.length && <EmptyTableRow colSpan={6} message="Aucun utilisateur ne correspond aux filtres." />}
                        {filteredUsers.map(item => (
                          <tr key={item.id}>
                            <td>{getFullName(item)}</td>
                            <td>{item.email}<br /><small>{item.phone || item.wavePhone || '-'}</small></td>
                            <td>{item.level?.name ? <span className="level-chip">{item.level.name}</span> : '-'}</td>
                            <td><span className={`badge ${item.accountStatus ?? 'actif'}`}>{getStatusLabel(item.accountStatus ?? 'actif')}</span></td>
                            <td><span className={`role-chip role-${item.role}`}>{getStatusLabel(item.role)}</span></td>
                            <td>
                              <div className="table-actions">
                                <button type="button" className="ghost compact" onClick={() => selectUserForEdit(item)}>Modifier</button>
                                {item.entrySource === 'import_officiel' && ['invite', 'profil_a_completer'].includes(item.accountStatus ?? '') && (
                                  <button type="button" className="ghost compact" onClick={() => regenerateActivationCode(item)}>Nouveau code</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataPanel>
                </section>
              </>
            )}

            {activeTab === 'cotisations' && (
              <>
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
                    <div className="panel-metrics">
                      <PanelMetric label="Affichees" value={filteredCotisations.length} />
                      <PanelMetric label="Montant" value={formatCurrency(filteredCotisations.reduce((sum, item) => sum + item.amount, 0))} />
                      <PanelMetric label="Paye" value={formatCurrency(filteredCotisations.reduce((sum, item) => sum + (item.paidAmount ?? 0), 0))} />
                    </div>
                    <div className="table-filters user-filters">
                      <label>Rechercher
                        <input value={cotisationSearchQuery} onChange={e => setCotisationSearchQuery(e.target.value)} placeholder="Etudiant, titre, email, niveau" />
                      </label>
                      <label>Statut
                        <select value={cotisationStatusFilter} onChange={e => setCotisationStatusFilter(e.target.value)}>
                          <option value="">Tous les statuts</option>
                          <option value="pending">En attente</option>
                          <option value="partial">Partielle</option>
                          <option value="paid">Payee</option>
                          <option value="overdue">En retard</option>
                        </select>
                      </label>
                      <button
                        type="button"
                        className="ghost filter-reset"
                        onClick={() => {
                          setCotisationSearchQuery('')
                          setCotisationStatusFilter('')
                        }}
                      >
                        Reinitialiser
                      </button>
                    </div>
                    <table>
                      <thead><tr><th>Titre</th><th>Etudiant</th><th>Montant</th><th>Paye</th><th>Reste</th><th>Statut</th><th>Action</th></tr></thead>
                      <tbody>
                        {!filteredCotisations.length && <EmptyTableRow colSpan={7} message="Aucune cotisation ne correspond aux filtres." />}
                        {filteredCotisations.map(item => (
                          <tr key={item.id}>
                            <td>{item.title}<br /><small>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('fr-FR') : '-'}</small></td>
                            <td>{getFullName(item.user)}<br /><small>{item.user?.level?.name ?? '-'}</small></td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td>{formatCurrency(item.paidAmount ?? 0)}</td>
                            <td>{formatCurrency(Math.max(0, item.amount - (item.paidAmount ?? 0)))}</td>
                            <td><span className={`badge ${item.status}`}>{getStatusLabel(item.status)}</span></td>
                            <td>
                              <button type="button" className="ghost compact" onClick={() => setSelectedFinanceStudentId(item.user?.id ?? '')} disabled={!item.user?.id}>
                                Voir etat
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataPanel>
                </section>

                {selectedFinanceStudent && selectedFinanceState && (
                  <FinanceStudentPanel student={selectedFinanceStudent} state={selectedFinanceState} onClose={() => setSelectedFinanceStudentId('')} />
                )}
              </>
            )}

            {activeTab === 'paiements' && (
              <>
                <section className="tab-brief payments-brief">
                  <div>
                    <p className="eyebrow">Tresorerie</p>
                    <h2>Paiements Wave, main a main et ajustements</h2>
                    <p>Chaque paiement applique modifie automatiquement la progression, les alertes, les defis et le classement.</p>
                  </div>
                  <strong>{adminIndicators.confirmedPayments} confirmes</strong>
                </section>
                <section className="two-column">
                  <form onSubmit={createPayment} className="panel form-panel">
                    <h2>Nouveau paiement</h2>
                    <div className="form-hint">
                      <strong>Paiement main a main</strong>
                      <span>Utilisez ce formulaire pour les especes ou corrections validees par le bureau. Les paiements Wave confirmes arrivent normalement par webhook.</span>
                    </div>
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
                    <div className="panel-metrics">
                      <PanelMetric label="Confirmes" value={adminIndicators.confirmedPayments} />
                      <PanelMetric label="En attente" value={adminIndicators.pendingPayments} />
                      <PanelMetric label="Main a main" value={adminIndicators.cashPayments} />
                      <PanelMetric label="Affiches" value={filteredPaiements.length} />
                    </div>
                    <div className="table-filters user-filters">
                      <label>Rechercher
                        <input value={paymentSearchQuery} onChange={e => setPaymentSearchQuery(e.target.value)} placeholder="Etudiant, reference, cotisation" />
                      </label>
                      <label>Statut
                        <select value={paymentStatusFilter} onChange={e => setPaymentStatusFilter(e.target.value)}>
                          <option value="">Tous les statuts</option>
                          <option value="confirme">Confirme</option>
                          <option value="en_attente">En attente</option>
                          <option value="initie">Initie</option>
                          <option value="echoue">Echoue</option>
                          <option value="annule">Annule</option>
                        </select>
                      </label>
                      <label>Methode
                        <select value={paymentMethodFilter} onChange={e => setPaymentMethodFilter(e.target.value)}>
                          <option value="">Toutes les methodes</option>
                          <option value="Wave">Wave</option>
                          <option value="Especes">Especes</option>
                          <option value="Mobile Money">Mobile Money</option>
                          <option value="Orange Money">Orange Money</option>
                          <option value="Virement">Virement</option>
                          <option value="main_a_main">Main a main</option>
                          <option value="paiement_pour_camarade">Pour camarade</option>
                        </select>
                      </label>
                      <button
                        type="button"
                        className="ghost filter-reset"
                        onClick={() => {
                          setPaymentSearchQuery('')
                          setPaymentStatusFilter('')
                          setPaymentMethodFilter('')
                        }}
                      >
                        Reinitialiser
                      </button>
                    </div>
                    <table>
                      <thead><tr><th>Etudiant</th><th>Cotisation</th><th>Montant</th><th>Applique</th><th>Statut</th><th>Methode</th><th>Reference</th><th>Action</th></tr></thead>
                      <tbody>
                        {!filteredPaiements.length && <EmptyTableRow colSpan={8} message="Aucun paiement enregistre pour ces filtres." />}
                        {filteredPaiements.map(item => (
                          <tr key={item.id}>
                            <td>{getFullName(item.user)}</td>
                            <td>{item.cotisation?.title ?? '-'}</td>
                            <td>{formatCurrency(item.amount)}</td>
                            <td>{formatCurrency(item.appliedAmount ?? 0)}</td>
                            <td><span className={`badge ${item.status ?? 'confirme'}`}>{getStatusLabel(item.status ?? 'confirme')}</span></td>
                            <td>{item.method}</td>
                            <td>{item.reference || '-'}</td>
                            <td>
                              <button type="button" className="ghost compact" onClick={() => setSelectedFinanceStudentId(item.user?.id ?? '')} disabled={!item.user?.id}>
                                Voir etat
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataPanel>
                </section>
                {selectedFinanceStudent && selectedFinanceState && (
                  <FinanceStudentPanel student={selectedFinanceStudent} state={selectedFinanceState} onClose={() => setSelectedFinanceStudentId('')} />
                )}
              </>
            )}

            {activeTab === 'wave' && (
              <>
                <section className="tab-brief wave-brief">
                  <div>
                    <p className="eyebrow">Compte marchand</p>
                    <h2>Wave change avec le bureau, pas avec le code</h2>
                    <p>Les cles sont chiffrees cote serveur. Une seule configuration active pilote les paiements de l'annee.</p>
                  </div>
                  <strong>{waveConfigurations.filter(item => item.active).length} active</strong>
                </section>
                <section className="two-column">
                  <form onSubmit={createWaveConfiguration} className="panel form-panel">
                    <h2>Compte Wave marchand</h2>
                    <div className="form-hint secure">
                      <strong>Secrets proteges</strong>
                      <span>Les cles API et secrets webhook sont chiffres cote serveur et ne sont pas renvoyes en clair.</span>
                    </div>
                    <label>Annee
                    <select value={waveForm.anneeAcademiqueId || selectedAcademicYearId} onChange={e => setWaveForm({ ...waveForm, anneeAcademiqueId: e.target.value })} required>
                      <option value="">Choisir</option>
                      {academicYears.map(item => <option key={item.id} value={item.id}>{item.libelle}{item.active ? ' - active' : ''}</option>)}
                    </select>
                  </label>
                  <div className="form-grid">
                    <label>Compte marchand<input value={waveForm.nomCompte} onChange={e => setWaveForm({ ...waveForm, nomCompte: e.target.value })} required /></label>
                    <label>Bureau<input value={waveForm.nomBureau} onChange={e => setWaveForm({ ...waveForm, nomBureau: e.target.value })} /></label>
                  </div>
                  <label>URL paiement Wave<input value={waveForm.checkoutUrl} onChange={e => setWaveForm({ ...waveForm, checkoutUrl: e.target.value })} required /></label>
                  <div className="form-grid">
                    <label>Devise<input value={waveForm.currency} onChange={e => setWaveForm({ ...waveForm, currency: e.target.value })} required /></label>
                    <label>Webhook<input value={waveForm.webhookUrl} onChange={e => setWaveForm({ ...waveForm, webhookUrl: e.target.value })} /></label>
                  </div>
                  <div className="form-grid">
                    <label>Retour succes<input value={waveForm.successUrl} onChange={e => setWaveForm({ ...waveForm, successUrl: e.target.value })} /></label>
                    <label>Retour echec<input value={waveForm.errorUrl} onChange={e => setWaveForm({ ...waveForm, errorUrl: e.target.value })} /></label>
                  </div>
                  <label>Cle API<input type="password" value={waveForm.apiKey} onChange={e => setWaveForm({ ...waveForm, apiKey: e.target.value })} required /></label>
                  <label>Secret webhook<input type="password" value={waveForm.webhookSecret} onChange={e => setWaveForm({ ...waveForm, webhookSecret: e.target.value })} /></label>
                  <button type="submit" className="cta">Enregistrer</button>
                </form>

                  <DataPanel title="Configurations Wave">
                    <div className="panel-metrics">
                      <PanelMetric label="Total" value={waveConfigurations.length} />
                      <PanelMetric label="Actives" value={waveConfigurations.filter(item => item.active).length} />
                      <PanelMetric label="Validees" value={waveConfigurations.filter(item => item.statut === 'validee').length} />
                    </div>
                    <table>
                      <thead><tr><th>Annee</th><th>Compte</th><th>Statut</th><th>Secrets</th><th>Actions</th></tr></thead>
                      <tbody>
                        {!waveConfigurations.length && <EmptyTableRow colSpan={5} message="Aucune configuration Wave pour cette annee." />}
                        {waveConfigurations.map(item => (
                          <tr key={item.id}>
                            <td>{item.anneeAcademique?.libelle ?? '-'}</td>
                            <td>{item.nomCompte}<br /><small>{item.nomBureau || '-'}</small></td>
                            <td><span className={`badge ${item.active ? 'confirme' : item.statut}`}>{item.active ? 'Active' : getStatusLabel(item.statut)}</span></td>
                            <td>{item.apiKeyConfigured ? 'Cle API OK' : 'Cle API manquante'} / {item.webhookSecretConfigured ? 'Webhook OK' : 'Webhook non signe'}</td>
                            <td>
                              <div className="table-actions">
                                <button type="button" className="ghost compact" onClick={() => changeWaveConfigurationStatus(item.id, 'valider')}>Valider</button>
                                <button type="button" className="ghost compact" onClick={() => changeWaveConfigurationStatus(item.id, 'activer')}>Activer</button>
                                <button type="button" className="ghost compact" onClick={() => changeWaveConfigurationStatus(item.id, 'desactiver')}>Desactiver</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </DataPanel>
                </section>
              </>
            )}

            {activeTab === 'rankings' && (
              <>
                <section className="tab-brief ranking-brief">
                  <div>
                    <p className="eyebrow">Motivation</p>
                    <h2>Classement et dynamique de cotisation</h2>
                    <p>Le podium rend la progression visible et encourage les etudiants a avancer sans attendre les rappels.</p>
                  </div>
                  <strong>{rankings.length} lignes</strong>
                </section>
                <DataPanel title="Classement des cotisants">
                  <div className="panel-metrics">
                    <PanelMetric label="Lignes" value={rankings.length} />
                    <PanelMetric label="Top" value={rankings[0] ? `${rankings[0].firstName ?? ''} ${rankings[0].lastName ?? ''}`.trim() || '-' : '-'} />
                  </div>
                  <table>
                    <thead><tr><th>Rang</th><th>Etudiant</th><th>Niveau</th><th>Progression</th></tr></thead>
                    <tbody>
                      {!rankings.length && <EmptyTableRow colSpan={4} message="Classement indisponible pour ces filtres." />}
                      {rankings.map((item, index) => {
                        const percent = Math.round(item.progress ?? item.percentage ?? 0)
                        return (
                          <tr key={item.userId ?? index}>
                            <td>#{index + 1}</td>
                            <td>{`${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || '-'}</td>
                          <td><span className="level-chip">{getRankingLevelName(item.level)}</span></td>
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
              </>
            )}

            {activeTab === 'defis' && (
              <>
                <section className="tab-brief defis-brief">
                  <div>
                    <p className="eyebrow">Emulation</p>
                    <h2>Defis actifs et resultats</h2>
                    <p>Les defis transforment la cotisation en engagement positif entre camarades, avec un gagnant clair quand 100% est atteint.</p>
                  </div>
                  <strong>{adminIndicators.activeDefis} actifs</strong>
                </section>
                <DataPanel title="Defis de cotisation">
                  <div className="panel-metrics">
                    <PanelMetric label="Actifs" value={adminIndicators.activeDefis} />
                    <PanelMetric label="Termines" value={adminIndicators.completedDefis} />
                    <PanelMetric label="Total" value={defis.length} />
                  </div>
                  <table>
                    <thead><tr><th>Createur</th><th>Adversaire</th><th>Statut</th><th>Progressions</th><th>Gagnant</th></tr></thead>
                    <tbody>
                      {!defis.length && <EmptyTableRow colSpan={5} message="Aucun defi enregistre pour le moment." />}
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
              </>
            )}

            {activeTab === 'alumni' && (
              <>
                <section className="tab-brief alumni-brief">
                  <div>
                    <p className="eyebrow">Reseau</p>
                    <h2>Promotions sortantes et soutien alumni</h2>
                    <p>Les ISE3 deviennent alumni, restent dans l'ecosysteme et peuvent etre mobilises par promotion.</p>
                  </div>
                  <strong>{adminIndicators.alumniCount} alumni</strong>
                </section>
                <section className="two-column">
                  <DataPanel title="Promotions alumni">
                    <div className="panel-metrics">
                      <PanelMetric label="Promotions" value={promotionsAlumni.length} />
                      <PanelMetric label="Alumni" value={adminIndicators.alumniCount} />
                    </div>
                    <table>
                      <thead><tr><th>Promotion</th><th>Alumni</th><th>Action</th></tr></thead>
                      <tbody>
                        {!promotionsAlumni.length && <EmptyTableRow colSpan={3} message="Aucune promotion alumni disponible." />}
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
                        {!alumni.length && <EmptyTableRow colSpan={3} message="Aucun alumni disponible." />}
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
              </>
            )}

            {activeTab === 'dons' && (
              <>
                <section className="tab-brief dons-brief">
                  <div>
                    <p className="eyebrow">Contribution alumni</p>
                    <h2>Dons et aides a la division</h2>
                    <p>Les anciens ne cotisent plus obligatoirement, mais restent un appui majeur pour la vie de la division.</p>
                  </div>
                  <strong>{formatCurrency(adminIndicators.totalDonAmount)}</strong>
                </section>
                <DataPanel title="Dons alumni" action={<button type="button" className="ghost" onClick={() => handleDownload('/dons/export', 'dons-alumni.xlsx')}>Exporter</button>}>
                  <div className="panel-metrics">
                    <PanelMetric label="Montant" value={formatCurrency(adminIndicators.totalDonAmount)} />
                    <PanelMetric label="Dons" value={adminIndicators.totalDons} />
                  </div>
                  <table>
                    <thead><tr><th>Alumni</th><th>Promotion</th><th>Montant</th><th>Methode</th><th>Origine</th><th>Date</th></tr></thead>
                    <tbody>
                      {!dons.length && <EmptyTableRow colSpan={6} message="Aucun don alumni enregistre." />}
                      {dons.map(item => (
                        <tr key={item.id}>
                          <td>{getFullName(item.alumni)}</td>
                          <td>{item.alumni?.promotionSortante ? <span className="level-chip">{item.alumni.promotionSortante}</span> : '-'}</td>
                          <td>{formatCurrency(item.amount)}</td>
                          <td>{item.method}</td>
                          <td>{getStatusLabel(item.origin)}</td>
                          <td>{item.donatedAt ? new Date(item.donatedAt).toLocaleDateString('fr-FR') : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>
              </>
            )}

            {activeTab === 'alertes' && (
              <>
                <section className="tab-brief alerts-brief">
                  <div>
                    <p className="eyebrow">Communication</p>
                    <h2>Relances, messages directs et appels alumni</h2>
                    <p>Le tresorier garde la main sur les messages sensibles, pendant que les rappels automatiques respectent le rythme de 21 jours.</p>
                  </div>
                  <strong>{zeroPaymentAttention.length} a relancer</strong>
                </section>

                <DataPanel title="Rechercher l'etat d'un etudiant">
                  <div className="panel-metrics">
                    <PanelMetric label="Resultats" value={studentStateMatches.length} />
                    <PanelMetric label="Recherche" value={studentStateQuery ? 'active' : 'nom, email, telephone'} />
                  </div>
                  <label>Nom, email ou telephone
                    <input value={studentStateQuery} onChange={e => setStudentStateQuery(e.target.value)} placeholder="Ex: Aminata, Diop, 77..." />
                  </label>
                  <table>
                    <thead><tr><th>Etudiant</th><th>Niveau</th><th>Attendu</th><th>Paye</th><th>Reste</th><th>Progression</th><th>Dernier paiement</th><th>Action</th></tr></thead>
                    <tbody>
                      {studentStateQuery && !studentStateMatches.length && <EmptyTableRow colSpan={8} message="Aucun etudiant trouve pour cette recherche." />}
                      {!studentStateQuery && <EmptyTableRow colSpan={8} message="Saisissez un nom, un email ou un telephone pour suivre un etudiant particulier." />}
                      {studentStateMatches.map(item => {
                        const state = getStudentState(item.id)
                        return (
                          <tr key={item.id}>
                            <td>{getFullName(item)}<br /><small>{item.email}</small></td>
                            <td>{item.level?.name ? <span className="level-chip">{item.level.name}</span> : '-'}</td>
                            <td>{formatCurrency(state.totalAmount)}</td>
                            <td>{formatCurrency(state.totalPaidAmount)}</td>
                            <td>{formatCurrency(state.remainingAmount)}</td>
                            <td>
                              <div className="table-progress"><span style={{ width: `${state.progress}%` }} /></div>
                              {state.progress}%
                            </td>
                            <td>{state.lastPayment?.paidAt ? new Date(state.lastPayment.paidAt).toLocaleDateString('fr-FR') : '-'}</td>
                            <td>
                              <button
                                type="button"
                                className="ghost compact"
                                onClick={() => setAlertForm({ ...alertForm, recipientId: item.id, promotionSortante: '' })}
                              >
                                Cibler
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </DataPanel>

                <section className="two-column">
                  <form onSubmit={sendManualAlert} className="panel form-panel">
                    <h2>Alerte manuelle</h2>
                    <div className="form-hint">
                      <strong>Destinataire</strong>
                      <span>Choisir une personne precise ou une promotion alumni, pas les deux.</span>
                    </div>
                    <label>Etudiant ou alumni
                      <select value={alertForm.recipientId} onChange={e => setAlertForm({ ...alertForm, recipientId: e.target.value, promotionSortante: e.target.value ? '' : alertForm.promotionSortante })}>
                        <option value="">Aucun destinataire individuel</option>
                        {[...students, ...alumni].map(item => (
                          <option key={item.id} value={item.id}>{getFullName(item)} - {item.level?.name ?? item.promotionSortante ?? item.role}</option>
                        ))}
                      </select>
                    </label>
                    <label>Promotion alumni
                      <select value={alertForm.promotionSortante} onChange={e => setAlertForm({ ...alertForm, promotionSortante: e.target.value, recipientId: e.target.value ? '' : alertForm.recipientId })}>
                        <option value="">Aucune promotion</option>
                        {promotionsAlumni.map(item => (
                          <option key={item.promotion} value={item.promotion}>{item.promotion} - {item.totalAlumni} alumni</option>
                        ))}
                      </select>
                    </label>
                    <div className="form-grid">
                      <label>Canal
                        <select value={alertForm.canal} onChange={e => setAlertForm({ ...alertForm, canal: e.target.value })}>
                          <option value="application_et_email">Application et email</option>
                          <option value="application">Application</option>
                          <option value="email">Email</option>
                        </select>
                      </label>
                      <label>Type
                        <select value={alertForm.type} onChange={e => setAlertForm({ ...alertForm, type: e.target.value })} disabled={Boolean(alertForm.promotionSortante)}>
                          <option value="message_manuel">Message manuel</option>
                          <option value="demande_aide_alumni">Demande aide alumni</option>
                        </select>
                      </label>
                    </div>
                    <label>Titre<input value={alertForm.title} onChange={e => setAlertForm({ ...alertForm, title: e.target.value })} required /></label>
                    <label>Message<textarea value={alertForm.message} onChange={e => setAlertForm({ ...alertForm, message: e.target.value })} rows={6} required /></label>
                    <button type="submit" className="cta">Envoyer</button>
                  </form>

                  <div className="panel form-panel">
                    <h2>Rappels automatiques</h2>
                    <div className="form-hint secure">
                      <strong>Protection anti-spam</strong>
                      <span>Les etudiants ayant solde leur cotisation ou recemment paye ne reçoivent pas de rappel.</span>
                    </div>
                    <label>Inactivite minimum
                      <input type="number" min="1" value={alertForm.inactiveDays} onChange={e => setAlertForm({ ...alertForm, inactiveDays: e.target.value })} />
                    </label>
                    <button type="button" className="cta" onClick={runContributionReminders}>Generer les rappels</button>
                    <div className="panel-metrics">
                      <PanelMetric label="Zero paiement" value={adminIndicators.zeroPaymentStudents} />
                      <PanelMetric label="Partiels" value={adminIndicators.partialStudents} />
                      <PanelMetric label="Soldes" value={adminIndicators.fullyPaidStudents} />
                    </div>
                  </div>
                </section>

                <DataPanel
                  title="Exploitation email"
                  action={(
                    <div className="table-actions">
                      <button type="button" className="ghost compact" onClick={testEmailConnection}>Tester SMTP</button>
                      <button type="button" className="ghost compact" onClick={dispatchPendingEmails} disabled={!pendingEmails.length}>Envoyer la file</button>
                    </div>
                  )}
                >
                  <div className="panel-metrics">
                    <PanelMetric label="Envoi" value={emailStatus?.enabled ? 'Active' : 'Desactive'} />
                    <PanelMetric label="Configuration" value={emailStatus?.configured ? 'Complete' : 'Incomplete'} />
                    <PanelMetric label="Transport" value={emailStatus?.ready ? 'Pret' : 'Non pret'} />
                    <PanelMetric label="En attente" value={pendingEmails.length} />
                  </div>
                  <div className="form-hint secure">
                    <strong>{emailStatus?.host ? `${emailStatus.host}:${emailStatus.port}` : 'Serveur SMTP non configure'}</strong>
                    <span>Expediteur: {emailStatus?.from ?? '-'} · Lot: {emailStatus?.batchSize ?? 0} · Intervalle: {emailStatus ? Math.round(emailStatus.intervalMs / 1000) : 0} secondes.</span>
                  </div>
                  <table>
                    <thead><tr><th>Destinataire</th><th>Sujet</th><th>Tentatives</th><th>Ajoute le</th></tr></thead>
                    <tbody>
                      {!pendingEmails.length && <EmptyTableRow colSpan={4} message="Aucun email en attente." />}
                      {pendingEmails.map(item => (
                        <tr key={item.id}>
                          <td>{item.recipientName || '-'}<br /><small>{item.recipientEmail}</small></td>
                          <td>{item.subject}</td>
                          <td>{item.attempts}</td>
                          <td>{new Date(item.createdAt).toLocaleString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>

                <DataPanel title="Relances prioritaires">
                  <table>
                    <thead><tr><th>Etudiant</th><th>Niveau</th><th>Reste</th><th>Echeance</th></tr></thead>
                    <tbody>
                      {!zeroPaymentAttention.length && <EmptyTableRow colSpan={4} message="Aucun compte prioritaire dans les filtres actuels." />}
                      {zeroPaymentAttention.map(item => (
                        <tr key={item.user.id}>
                          <td>{getFullName(item.user)}</td>
                          <td>{item.user.level?.name ? <span className="level-chip">{item.user.level.name}</span> : '-'}</td>
                          <td>{formatCurrency(item.remaining)}</td>
                          <td>{new Date(item.dueDate).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>
              </>
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

            {activeTab === 'audit' && (
              <>
                <section className="tab-brief audit-brief">
                  <div>
                    <p className="eyebrow">Traçabilite</p>
                    <h2>Journal des actions sensibles</h2>
                    <p>Wave, paiements, statuts et ajustements sont suivis pour proteger le bureau et les etudiants.</p>
                  </div>
                  <strong>{auditLogs.length} traces</strong>
                </section>
                <DataPanel title="Journal d audit" action={<button type="button" className="ghost" onClick={() => handleDownload('/audit/export', 'audit.xlsx')}>Exporter</button>}>
                  <div className="panel-metrics">
                    <PanelMetric label="Traces" value={auditLogs.length} />
                    <PanelMetric label="Derniere" value={auditLogs[0] ? new Date(auditLogs[0].createdAt).toLocaleDateString('fr-FR') : '-'} />
                  </div>
                  <table>
                    <thead><tr><th>Date</th><th>Action</th><th>Objet</th><th>Acteur</th><th>Details</th></tr></thead>
                  <tbody>
                    {!auditLogs.length && <EmptyTableRow colSpan={5} message="Aucune trace d'audit pour le moment." />}
                    {auditLogs.map(item => (
                        <tr key={item.id}>
                          <td>{new Date(item.createdAt).toLocaleString('fr-FR')}</td>
                          <td>{item.action}</td>
                          <td>{item.entityType}<br /><small>{item.entityId || '-'}</small></td>
                          <td>{item.actor ? getFullName(item.actor) : item.actorType}</td>
                          <td><small>{item.details ? JSON.stringify(item.details).slice(0, 180) : '-'}</small></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DataPanel>
              </>
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

function PanelMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="panel-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function FinanceStudentPanel({ student, state, onClose }: { student: User; state: FinanceStudentState; onClose: () => void }) {
  return (
    <section className="panel finance-focus">
      <div className="section-header">
        <div>
          <p className="eyebrow">Etat financier</p>
          <h2>{getFullName(student)}</h2>
          <p className="panel-note">{student.level?.name ?? 'Niveau non renseigne'} - {student.email}</p>
        </div>
        <button type="button" className="ghost compact" onClick={onClose}>Fermer</button>
      </div>
      <div className="panel-metrics">
        <PanelMetric label="Attendu" value={formatCurrency(state.totalAmount)} />
        <PanelMetric label="Verse" value={formatCurrency(state.totalPaidAmount)} />
        <PanelMetric label="Reste" value={formatCurrency(state.remainingAmount)} />
        <PanelMetric label="Progression" value={`${state.progress}%`} />
        <PanelMetric label="Dernier paiement" value={state.lastPayment?.paidAt ? new Date(state.lastPayment.paidAt).toLocaleDateString('fr-FR') : '-'} />
      </div>
      <div className="progress-track finance-progress">
        <span style={{ width: `${state.progress}%` }} />
      </div>
      <table>
        <thead><tr><th>Cotisation</th><th>Montant</th><th>Paye</th><th>Reste</th><th>Statut</th></tr></thead>
        <tbody>
          {!state.cotisations.length && <EmptyTableRow colSpan={5} message="Aucune cotisation pour cet etudiant dans les filtres actuels." />}
          {state.cotisations.map(item => (
            <tr key={item.id}>
              <td>{item.title}<br /><small>{item.dueDate ? new Date(item.dueDate).toLocaleDateString('fr-FR') : '-'}</small></td>
              <td>{formatCurrency(item.amount)}</td>
              <td>{formatCurrency(item.paidAmount ?? 0)}</td>
              <td>{formatCurrency(Math.max(0, item.amount - (item.paidAmount ?? 0)))}</td>
              <td><span className={`badge ${item.status}`}>{getStatusLabel(item.status)}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function EmptyTableRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="empty-row">{message}</td>
    </tr>
  )
}

export default App
