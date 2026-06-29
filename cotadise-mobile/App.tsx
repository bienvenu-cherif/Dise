import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { API_BASE, request } from './src/api';
import { formatCurrency, formatDateTime, getFullName, getNotificationTypeLabel, getStatusLabel } from './src/format';
import type {
  AuthResponse,
  Cotisation,
  Defi,
  InvitedStudent,
  Level,
  NotificationMessage,
  Paiement,
  StudentRanking,
  StudentSummary,
  User,
} from './src/types';

const TOKEN_KEY = 'cotadise_token';
const USER_KEY = 'cotadise_user';
const PRIVACY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_URL ||
  (Constants.expoConfig?.extra?.privacyUrl as string | undefined);
const TERMS_URL =
  process.env.EXPO_PUBLIC_TERMS_URL ||
  (Constants.expoConfig?.extra?.termsUrl as string | undefined);
const DEFAULT_LEVEL_FILTERS: Level[] = [
  { id: 'ISE1', name: 'ISE1' },
  { id: 'ISE2', name: 'ISE2' },
  { id: 'ISE3', name: 'ISE3' },
];

type Tab = 'accueil' | 'cotisations' | 'classement' | 'messages' | 'defis' | 'profil';
type NotificationFilter = 'toutes' | 'non_lues' | 'paiements' | 'defis' | 'tresorier';
type ChallengeFilter = 'tous' | 'recus' | 'lances' | 'actifs' | 'termines';

type ActivationForm = {
  activationCode: string;
  email: string;
  phone: string;
  wavePhone: string;
  password: string;
};

type PaymentBeneficiaryMode = 'moi' | 'camarade';

const getRankingItemName = (item?: StudentRanking['rankings'][number] | null) =>
  item ? `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() || 'un camarade' : '';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetPasswordConfirm, setResetPasswordConfirm] = useState('');
  const [resetStep, setResetStep] = useState<'demande' | 'validation'>('demande');
  const [tab, setTab] = useState<Tab>('accueil');
  const [notificationFilter, setNotificationFilter] = useState<NotificationFilter>('toutes');
  const [challengeFilter, setChallengeFilter] = useState<ChallengeFilter>('tous');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState('');
  const [summary, setSummary] = useState<StudentSummary | null>(null);
  const [ranking, setRanking] = useState<StudentRanking | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [defis, setDefis] = useState<Defi[]>([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [selectedCotisationId, setSelectedCotisationId] = useState('');
  const [paymentBeneficiaryMode, setPaymentBeneficiaryMode] = useState<PaymentBeneficiaryMode>('moi');
  const [beneficiaryLevelId, setBeneficiaryLevelId] = useState('');
  const [beneficiaryQuery, setBeneficiaryQuery] = useState('');
  const [beneficiarySearched, setBeneficiarySearched] = useState(false);
  const [searchingBeneficiaries, setSearchingBeneficiaries] = useState(false);
  const [beneficiaryResults, setBeneficiaryResults] = useState<User[]>([]);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<User | null>(null);
  const [beneficiaryCotisations, setBeneficiaryCotisations] = useState<Cotisation[]>([]);
  const [challengeLevelId, setChallengeLevelId] = useState('');
  const [challengeQuery, setChallengeQuery] = useState('');
  const [challengeSearched, setChallengeSearched] = useState(false);
  const [searchingChallengeOpponents, setSearchingChallengeOpponents] = useState(false);
  const [challengeResults, setChallengeResults] = useState<User[]>([]);
  const [selectedOpponent, setSelectedOpponent] = useState<User | null>(null);
  const [challengeMessage, setChallengeMessage] = useState('');
  const [profileForm, setProfileForm] = useState({ email: '', phone: '', wavePhone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [activationQuery, setActivationQuery] = useState('');
  const [invites, setInvites] = useState<InvitedStudent[]>([]);
  const [selectedInvite, setSelectedInvite] = useState<InvitedStudent | null>(null);
  const [activationForm, setActivationForm] = useState<ActivationForm>({
    activationCode: '',
    email: '',
    phone: '',
    wavePhone: '',
    password: '',
  });

  const remainingCotisations = useMemo(
    () => {
      const source = paymentBeneficiaryMode === 'camarade' ? beneficiaryCotisations : cotisations;
      return source.filter((item) => !item.paid && (item.paidAmount ?? 0) < item.amount);
    },
    [beneficiaryCotisations, cotisations, paymentBeneficiaryMode],
  );
  const openCotisations = useMemo(
    () =>
      cotisations
        .filter((item) => !item.paid && (item.paidAmount ?? 0) < item.amount)
        .slice()
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [cotisations],
  );
  const paidCotisations = useMemo(
    () =>
      cotisations
        .filter((item) => item.paid || (item.paidAmount ?? 0) >= item.amount)
        .slice()
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()),
    [cotisations],
  );
  const urgentCotisations = useMemo(
    () => openCotisations.filter((item) => daysUntil(item.dueDate) <= 30).slice(0, 3),
    [openCotisations],
  );
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const rankingContext = useMemo(() => {
    const list = ranking?.rankings ?? [];
    const currentIndex = user?.id ? list.findIndex((item) => item.userId === user.id) : -1;
    return {
      rank: ranking?.rank ?? (currentIndex >= 0 ? currentIndex + 1 : null),
      total: ranking?.totalInLevel ?? list.length,
      ahead: currentIndex > 0 ? list[currentIndex - 1] : null,
      aheadRank: currentIndex > 0 ? currentIndex : null,
      behind: currentIndex >= 0 && currentIndex < list.length - 1 ? list[currentIndex + 1] : null,
      behindRank: currentIndex >= 0 && currentIndex < list.length - 1 ? currentIndex + 2 : null,
    };
  }, [ranking, user?.id]);
  const notificationCounts = useMemo(
    () => ({
      toutes: notifications.length,
      non_lues: notifications.filter((item) => !item.readAt).length,
      paiements: notifications.filter((item) => getNotificationCategory(item.type) === 'paiements').length,
      defis: notifications.filter((item) => getNotificationCategory(item.type) === 'defis').length,
      tresorier: notifications.filter((item) => getNotificationCategory(item.type) === 'tresorier').length,
    }),
    [notifications],
  );
  const filteredNotifications = useMemo(
    () =>
      notifications.filter((item) => {
        if (notificationFilter === 'toutes') return true;
        if (notificationFilter === 'non_lues') return !item.readAt;
        return getNotificationCategory(item.type) === notificationFilter;
      }),
    [notificationFilter, notifications],
  );
  const openDefisCount = defis.filter((item) => item.status === 'en_attente').length;
  const challengeCounts = useMemo(
    () => ({
      tous: defis.length,
      recus: defis.filter((item) => item.opponent?.id === user?.id).length,
      lances: defis.filter((item) => item.challenger?.id === user?.id).length,
      actifs: defis.filter((item) => ['en_attente', 'accepte'].includes(item.status)).length,
      termines: defis.filter((item) => ['termine', 'refuse', 'annule'].includes(item.status)).length,
    }),
    [defis, user?.id],
  );
  const filteredDefis = useMemo(
    () =>
      defis.filter((item) => {
        if (challengeFilter === 'tous') return true;
        if (challengeFilter === 'recus') return item.opponent?.id === user?.id;
        if (challengeFilter === 'lances') return item.challenger?.id === user?.id;
        if (challengeFilter === 'actifs') return ['en_attente', 'accepte'].includes(item.status);
        return ['termine', 'refuse', 'annule'].includes(item.status);
      }),
    [challengeFilter, defis, user?.id],
  );
  const hasCompletedCotisation = !!summary && (summary.totalRemainingAmount ?? 0) <= 0 && (summary.totalAmount ?? 0) > 0;
  const nextCotisation = useMemo(
    () =>
      cotisations
        .filter((item) => !item.paid && (item.paidAmount ?? 0) < item.amount)
        .slice()
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0],
    [cotisations],
  );
  const nextCotisationRemaining = nextCotisation ? Math.max(0, nextCotisation.amount - (nextCotisation.paidAmount ?? 0)) : 0;
  const nextActionTitle = hasCompletedCotisation
    ? 'Objectif atteint'
    : nextCotisation
      ? 'Prochaine cotisation'
      : 'En attente du tresorier';
  const nextActionText = hasCompletedCotisation
    ? 'Vous pouvez maintenant encourager un camarade ou accepter un defi.'
    : nextCotisation
      ? `${nextCotisation.title} - reste ${formatCurrency(nextCotisationRemaining)} avant le ${formatDateTime(nextCotisation.dueDate).split(' ')[0]}`
      : 'Aucune cotisation ouverte pour le moment.';
  const lastPayment = useMemo(
    () =>
      paiements
        .slice()
        .sort((a, b) => new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime())[0],
    [paiements],
  );
  const recentPaiements = useMemo(
    () =>
      paiements
        .slice()
        .sort((a, b) => new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime()),
    [paiements],
  );
  const paymentEvolution = useMemo(() => buildPaymentEvolution(paiements), [paiements]);
  const levelFilters = useMemo(() => {
    const loadedLevels = levels.filter((level) => level.name.toLowerCase() !== 'alumni');
    return loadedLevels.length ? loadedLevels : DEFAULT_LEVEL_FILTERS;
  }, [levels]);

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    if (token) {
      loadData(token).catch((error) => setNotice(error.message));
    }
  }, [token]);

  const restoreSession = async () => {
    const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
    const storedUser = await SecureStore.getItemAsync(USER_KEY);
    if (storedToken) setToken(storedToken);
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser) as User;
      setUser(parsedUser);
      setProfileForm({
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
        wavePhone: parsedUser.wavePhone || '',
      });
    }
  };

  const loadData = async (activeToken = token) => {
    if (!activeToken) return;
    setRefreshing(true);
    try {
      const [summaryResult, cotisationsResult, paiementsResult, rankingResult, notificationsResult, defisResult] =
        await Promise.all([
          request<StudentSummary>('/dashboard/me', activeToken),
          request<Cotisation[]>('/cotisations/me', activeToken),
          request<Paiement[]>('/paiements/me', activeToken),
          request<StudentRanking>('/dashboard/rankings/me', activeToken),
          request<NotificationMessage[]>('/notifications/me', activeToken),
          request<Defi[]>('/defis/me', activeToken),
        ]);
      setSummary(summaryResult);
      setUser(summaryResult.user);
      setProfileForm({
        email: summaryResult.user.email || '',
        phone: summaryResult.user.phone || '',
        wavePhone: summaryResult.user.wavePhone || '',
      });
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(summaryResult.user));
      setCotisations(cotisationsResult);
      setPaiements(paiementsResult);
      setRanking(rankingResult);
      setNotifications(notificationsResult);
      setDefis(defisResult);
      request<Level[]>('/levels', activeToken)
        .then(setLevels)
        .catch(() => setLevels([]));
      setSelectedCotisationId((current) => current || cotisationsResult.find((item) => !item.paid)?.id || '');
      setPaymentPhone((current) => current || summaryResult.user.wavePhone || summaryResult.user.phone || '');
    } finally {
      setRefreshing(false);
    }
  };

  const login = async () => {
    setLoading(true);
    setNotice('');
    try {
      const data = await request<AuthResponse>('/auth/login', null, {
        method: 'POST',
        body: JSON.stringify({ identifier: email, password }),
      });
      if (data.user.role !== 'etudiant') {
        throw new Error("Cette application est reservee a l'espace etudiant.");
      }
      setToken(data.accessToken);
      setUser(data.user);
      await SecureStore.setItemAsync(TOKEN_KEY, data.accessToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
    } catch (error: any) {
      setNotice(error.message || 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async () => {
    if (!resetEmail.trim()) {
      setNotice('Saisissez votre email pour recevoir un code.');
      return;
    }
    setLoading(true);
    try {
      await request('/auth/mot-de-passe-oublie', null, {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail }),
      });
      setResetStep('validation');
      setNotice('Si ce compte existe, un code vient d etre envoye par email.');
    } catch (error: any) {
      setNotice(error.message || 'Demande impossible');
    } finally {
      setLoading(false);
    }
  };

  const resetForgottenPassword = async () => {
    if (resetPassword !== resetPasswordConfirm) {
      setNotice('La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await request('/auth/reinitialiser-mot-de-passe', null, {
        method: 'POST',
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          newPassword: resetPassword,
        }),
      });
      setEmail(resetEmail);
      setPassword('');
      setResetCode('');
      setResetPassword('');
      setResetPasswordConfirm('');
      setResetStep('demande');
      setNotice('Mot de passe reinitialise. Vous pouvez vous connecter.');
    } catch (error: any) {
      setNotice(error.message || 'Reinitialisation impossible');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    setToken(null);
      setUser(null);
      setProfileForm({ email: '', phone: '', wavePhone: '' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setSummary(null);
      setCotisations([]);
      setBeneficiaryResults([]);
      setSelectedBeneficiary(null);
      setBeneficiaryCotisations([]);
      setChallengeResults([]);
      setSelectedOpponent(null);
      setChallengeMessage('');
      setPaiements([]);
    setRanking(null);
    setNotifications([]);
    setDefis([]);
  };

  const searchInvites = async () => {
    if (activationQuery.trim().length < 2) {
      setNotice('Saisissez au moins 2 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const result = await request<InvitedStudent[]>(`/users/invites/recherche?q=${encodeURIComponent(activationQuery)}`);
      setInvites(result);
      setNotice(result.length ? '' : 'Aucun compte invite trouve.');
    } catch (error: any) {
      setNotice(error.message || 'Recherche impossible');
    } finally {
      setLoading(false);
    }
  };

  const selectInvite = (invite: InvitedStudent) => {
    setSelectedInvite(invite);
    setActivationForm({
      activationCode: '',
      email: invite.email.endsWith('@cotadise.local') ? '' : invite.email,
      phone: '',
      wavePhone: '',
      password: '',
    });
  };

  const activateInvite = async () => {
    if (!selectedInvite) return;
    setLoading(true);
    try {
      await request(`/users/invites/${selectedInvite.id}/activer`, null, {
        method: 'POST',
        body: JSON.stringify({
          activationCode: activationForm.activationCode.trim().toUpperCase(),
          email: activationForm.email,
          phone: activationForm.phone,
          wavePhone: activationForm.wavePhone || activationForm.phone,
          password: activationForm.password,
        }),
      });
      setEmail(activationForm.email);
      setPassword(activationForm.password);
      setSelectedInvite(null);
      setInvites([]);
      setNotice('Compte active. Vous pouvez vous connecter.');
    } catch (error: any) {
      setNotice(error.message || 'Activation impossible');
    } finally {
      setLoading(false);
    }
  };

  const initiateWavePayment = async () => {
    if (!selectedCotisationId || !paymentAmount) {
      Alert.alert('Paiement Wave', 'Choisissez une cotisation et un montant.');
      return;
    }
    if (paymentBeneficiaryMode === 'camarade' && !selectedBeneficiary) {
      Alert.alert('Paiement pour camarade', 'Choisissez le camarade beneficiaire.');
      return;
    }
    setLoading(true);
    try {
      const result = await request<{ configured: boolean; wave?: unknown }>('/paiements/wave/initier', token, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(paymentAmount),
          cotisationId: selectedCotisationId,
          userId: paymentBeneficiaryMode === 'camarade' ? selectedBeneficiary?.id : undefined,
          payerPhone: paymentPhone || undefined,
          note:
            paymentBeneficiaryMode === 'camarade'
              ? `Paiement pour ${selectedBeneficiary ? getFullName(selectedBeneficiary) : 'un camarade'} depuis application mobile`
              : 'Paiement initie depuis application mobile',
        }),
      });
      setPaymentAmount('');
      await loadData();
      Alert.alert(
        'Paiement Wave',
        result.configured
          ? 'Demande de paiement envoyee. Validez sur Wave, puis la cotisation sera mise a jour.'
          : "Paiement mis en attente: le compte Wave de l'annee n'est pas encore configure.",
      );
    } catch (error: any) {
      Alert.alert('Paiement impossible', error.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const searchBeneficiaries = async () => {
    if (beneficiaryQuery.trim().length < 2) {
      setNotice('Saisissez au moins 2 caracteres pour rechercher un camarade.');
      return;
    }
    setSearchingBeneficiaries(true);
    setBeneficiarySearched(true);
    setNotice('');
    try {
      const params = new URLSearchParams({ q: beneficiaryQuery });
      if (beneficiaryLevelId) params.set('levelId', beneficiaryLevelId);
      const result = await request<User[]>(`/users/camarades/recherche?${params.toString()}`, token);
      setBeneficiaryResults(result);
    } catch (error: any) {
      setNotice(error.message || 'Recherche impossible');
    } finally {
      setSearchingBeneficiaries(false);
    }
  };

  const selectBeneficiary = async (beneficiary: User) => {
    setSelectedBeneficiary(beneficiary);
    setBeneficiaryResults([]);
    setLoading(true);
    try {
      const result = await request<Cotisation[]>(`/cotisations/beneficiaire/${beneficiary.id}`, token);
      setBeneficiaryCotisations(result);
      const firstOpen = result.find((item) => !item.paid && (item.paidAmount ?? 0) < item.amount);
      setSelectedCotisationId(firstOpen?.id || '');
      setNotice(firstOpen ? '' : 'Ce camarade n a aucune cotisation ouverte a payer.');
    } catch (error: any) {
      setNotice(error.message || 'Cotisations du camarade indisponibles');
    } finally {
      setLoading(false);
    }
  };

  const switchBeneficiaryMode = (mode: PaymentBeneficiaryMode) => {
    setPaymentBeneficiaryMode(mode);
    setPaymentAmount('');
    setSelectedCotisationId('');
    setBeneficiaryQuery('');
    setBeneficiaryLevelId('');
    setBeneficiarySearched(false);
    setBeneficiaryResults([]);
    setSelectedBeneficiary(null);
    setBeneficiaryCotisations([]);
    if (mode === 'moi') {
      setSelectedCotisationId(cotisations.find((item) => !item.paid)?.id || '');
    }
  };

  const searchChallengeOpponents = async () => {
    if (challengeQuery.trim().length < 2) {
      setNotice('Saisissez au moins 2 caracteres pour rechercher un adversaire.');
      return;
    }
    setSearchingChallengeOpponents(true);
    setChallengeSearched(true);
    setNotice('');
    try {
      const params = new URLSearchParams({ q: challengeQuery });
      if (challengeLevelId) params.set('levelId', challengeLevelId);
      const result = await request<User[]>(`/users/camarades/recherche?${params.toString()}`, token);
      setChallengeResults(result);
    } catch (error: any) {
      setNotice(error.message || 'Recherche impossible');
    } finally {
      setSearchingChallengeOpponents(false);
    }
  };

  const createChallenge = async () => {
    if (!selectedOpponent) {
      Alert.alert('Defi', 'Choisissez le camarade a defier.');
      return;
    }
    setLoading(true);
    try {
      await request('/defis', token, {
        method: 'POST',
        body: JSON.stringify({
          opponentId: selectedOpponent.id,
          message: challengeMessage.trim() || undefined,
        }),
      });
      setSelectedOpponent(null);
      setChallengeQuery('');
      setChallengeResults([]);
      setChallengeSearched(false);
      setChallengeMessage('');
      await loadData();
      Alert.alert('Defi envoye', `${getFullName(selectedOpponent)} a recu votre demande de defi.`);
    } catch (error: any) {
      Alert.alert('Defi impossible', error.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const updateMyProfile = async () => {
    setLoading(true);
    try {
      const updatedUser = await request<User>('/users/me', token, {
        method: 'PUT',
        body: JSON.stringify({
          email: profileForm.email,
          phone: profileForm.phone,
          wavePhone: profileForm.wavePhone || profileForm.phone,
        }),
      });
      setUser(updatedUser);
      setPaymentPhone(updatedUser.wavePhone || updatedUser.phone || '');
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
      Alert.alert('Profil mis a jour', 'Vos contacts ont ete enregistres.');
    } catch (error: any) {
      Alert.alert('Mise a jour impossible', error.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const changeMyPassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      Alert.alert('Mot de passe', 'La confirmation ne correspond pas au nouveau mot de passe.');
      return;
    }
    setLoading(true);
    try {
      await request('/users/me/mot-de-passe', token, {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Mot de passe modifie', 'Votre nouveau mot de passe est actif.');
    } catch (error: any) {
      Alert.alert('Modification impossible', error.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await request(`/notifications/${id}/lire`, token, { method: 'PATCH' });
      await loadData();
    } catch (error: any) {
      setNotice(error.message || 'Action impossible');
    }
  };

  const actOnChallenge = async (id: string, action: 'accepter' | 'refuser') => {
    try {
      await request(`/defis/${id}/${action}`, token, { method: 'PATCH' });
      await loadData();
    } catch (error: any) {
      Alert.alert('Defi', error.message || 'Action impossible');
    }
  };

  const cancelChallenge = async (id: string) => {
    try {
      await request(`/defis/${id}/annuler`, token, { method: 'PATCH' });
      await loadData();
    } catch (error: any) {
      Alert.alert('Defi', error.message || 'Annulation impossible');
    }
  };

  if (!token || !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.authScreen}>
          <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
            <View style={styles.brandBlock}>
              <View style={styles.authMarkRow}>
                <Image source={require('./assets/icon.png')} style={styles.authMark} />
                <View>
                  <Text style={styles.brand}>CotaDISE</Text>
                  <Text style={styles.brandSub}>Division ISE</Text>
                </View>
              </View>
              <Text style={styles.brandTitle}>Cotise, suis ta progression, reste dans le mouvement.</Text>
              <Text style={styles.brandText}>Application officielle de suivi des cotisations des etudiants ISE.</Text>
              <View style={styles.authTrustRow}>
                <Text style={styles.authTrustPill}>ISE1</Text>
                <Text style={styles.authTrustPill}>ISE2</Text>
                <Text style={styles.authTrustPill}>ISE3</Text>
                <Text style={styles.authTrustPill}>Wave</Text>
              </View>
            </View>

            <View style={styles.authCard}>
              <Text style={styles.cardTitle}>Connexion etudiant</Text>
              <Text style={styles.mutedText}>Connectez-vous avec l'email valide utilise lors de l'activation.</Text>
              <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              <TextInput style={styles.input} placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
              <Pressable style={styles.primaryButton} onPress={login} disabled={loading}>
                <Text style={styles.primaryButtonText}>{loading ? 'Patientez...' : 'Se connecter'}</Text>
              </Pressable>
            </View>

            <View style={styles.authCard}>
              <Text style={styles.cardTitle}>Mot de passe oublie</Text>
              <Text style={styles.mutedText}>Recevez un code temporaire sur votre email d'activation.</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {resetStep === 'validation' && (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Code recu par email"
                    value={resetCode}
                    onChangeText={setResetCode}
                    keyboardType="number-pad"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nouveau mot de passe"
                    value={resetPassword}
                    onChangeText={setResetPassword}
                    secureTextEntry
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirmer le nouveau mot de passe"
                    value={resetPasswordConfirm}
                    onChangeText={setResetPasswordConfirm}
                    secureTextEntry
                  />
                </>
              )}
              <Pressable
                style={styles.secondaryButtonWide}
                onPress={resetStep === 'demande' ? requestPasswordReset : resetForgottenPassword}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>
                  {loading ? 'Patientez...' : resetStep === 'demande' ? 'Recevoir un code' : 'Reinitialiser'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.authInfoGrid}>
              <View style={styles.authInfoCard}>
                <Text style={styles.authInfoTitle}>Liste officielle</Text>
                <Text style={styles.authInfoText}>Seuls les etudiants importes peuvent activer un compte.</Text>
              </View>
              <View style={styles.authInfoCard}>
                <Text style={styles.authInfoTitle}>Paiement securise</Text>
                <Text style={styles.authInfoText}>Les confirmations Wave passent par le serveur.</Text>
              </View>
            </View>

            <View style={styles.authCard}>
              <Text style={styles.cardTitle}>Premiere connexion</Text>
              <Text style={styles.mutedText}>Recherchez votre nom dans la liste officielle importee par le tresorier, puis completez vos contacts.</Text>
              <View style={styles.row}>
                <TextInput style={[styles.input, styles.rowInput]} placeholder="Nom, prenom ou email" value={activationQuery} onChangeText={setActivationQuery} />
                <Pressable style={styles.smallButton} onPress={searchInvites}>
                  <Text style={styles.smallButtonText}>Chercher</Text>
                </Pressable>
              </View>
              {invites.map((invite) => (
                <Pressable key={invite.id} style={styles.resultItem} onPress={() => selectInvite(invite)}>
                  <Text style={styles.resultName}>{getFullName(invite)}</Text>
                  <Text style={styles.resultMeta}>{invite.level?.name || 'Niveau non renseigne'}</Text>
                </Pressable>
              ))}
              {selectedInvite && (
                <View style={styles.activationBox}>
                  <Text style={styles.cardTitle}>Activer {getFullName(selectedInvite)}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Code d activation remis par le tresorier"
                    value={activationForm.activationCode}
                    onChangeText={(value) => setActivationForm({ ...activationForm, activationCode: value.toUpperCase() })}
                    autoCapitalize="characters"
                    maxLength={12}
                  />
                  <TextInput style={styles.input} placeholder="Email valide" value={activationForm.email} onChangeText={(value) => setActivationForm({ ...activationForm, email: value })} autoCapitalize="none" />
                  <TextInput style={styles.input} placeholder="Telephone" value={activationForm.phone} onChangeText={(value) => setActivationForm({ ...activationForm, phone: value })} keyboardType="phone-pad" />
                  <TextInput style={styles.input} placeholder="Numero Wave" value={activationForm.wavePhone} onChangeText={(value) => setActivationForm({ ...activationForm, wavePhone: value })} keyboardType="phone-pad" />
                  <TextInput style={styles.input} placeholder="Mot de passe" value={activationForm.password} onChangeText={(value) => setActivationForm({ ...activationForm, password: value })} secureTextEntry />
                  <Pressable style={styles.primaryButton} onPress={activateInvite}>
                    <Text style={styles.primaryButtonText}>Activer mon compte</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {!!notice && <Text style={styles.notice}>{notice}</Text>}
            <Text style={styles.apiText}>API: {API_BASE}</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerIdentity}>
          <Image source={require('./assets/icon.png')} style={styles.headerMark} />
          <View style={styles.headerTextBlock}>
            <Text style={styles.headerEyebrow}>Espace etudiant</Text>
            <Text style={styles.headerTitle}>{getFullName(user)}</Text>
            <Text style={styles.headerMeta}>{summary?.level?.name || user.level?.name || 'Niveau non renseigne'}</Text>
          </View>
        </View>
        <Pressable style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Sortir</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData()} />}
      >
        {tab === 'accueil' && (
          <>
            <View style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>Progression annuelle</Text>
                  <Text style={styles.heroPercent}>{summary?.progress ?? 0}%</Text>
                </View>
                <View style={[styles.statusPill, hasCompletedCotisation && styles.statusPillDone]}>
                  <Text style={[styles.statusPillText, hasCompletedCotisation && styles.statusPillTextDone]}>
                    {hasCompletedCotisation ? 'Terminee' : 'En cours'}
                  </Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(100, summary?.progress ?? 0)}%` }]} />
              </View>
              <View style={styles.statRow}>
                <Stat label="Attendu" value={formatCurrency(summary?.totalAmount ?? 0)} />
                <Stat label="Verse" value={formatCurrency(summary?.totalPaidAmount ?? 0)} />
                <Stat label="Reste" value={formatCurrency(summary?.totalRemainingAmount ?? 0)} />
              </View>
            </View>

            {hasCompletedCotisation && (
              <View style={styles.successCard}>
                <Text style={styles.successTitle}>Cotisation complete</Text>
                <Text style={styles.successText}>
                  Vous avez termine votre cotisation pour cette annee. Aucun rappel automatique de cotisation ne sera envoye.
                </Text>
              </View>
            )}

            <View style={styles.nextActionCard}>
              <View style={styles.nextActionHeader}>
                <View style={styles.nextActionIcon}>
                  <Text style={styles.nextActionIconText}>{hasCompletedCotisation ? 'OK' : 'DI'}</Text>
                </View>
                <View style={styles.nextActionBody}>
                  <Text style={styles.nextActionLabel}>Action recommandee</Text>
                  <Text style={styles.nextActionTitle}>{nextActionTitle}</Text>
                  <Text style={styles.nextActionText}>{nextActionText}</Text>
                </View>
              </View>
              <View style={styles.nextActionButtons}>
                {!hasCompletedCotisation && nextCotisation && (
                  <Pressable
                    style={styles.nextActionButtonPrimary}
                    onPress={() => {
                      switchBeneficiaryMode('moi');
                      setSelectedCotisationId(nextCotisation.id);
                    }}
                  >
                    <Text style={styles.nextActionButtonPrimaryText}>Payer maintenant</Text>
                  </Pressable>
                )}
                <Pressable style={styles.nextActionButton} onPress={() => setTab(hasCompletedCotisation ? 'defis' : 'messages')}>
                  <Text style={styles.nextActionButtonText}>{hasCompletedCotisation ? 'Voir defis' : 'Voir alertes'}</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.insightGrid}>
              <Insight label="Rang" value={ranking?.rank ? `#${ranking.rank}` : '-'} detail={`${ranking?.totalInLevel ?? 0} dans le niveau`} />
              <Insight label="Alertes" value={`${unreadCount}`} detail={unreadCount ? 'non lue(s)' : 'a jour'} />
              <Insight label="Defis" value={`${openDefisCount}`} detail={openDefisCount ? 'en attente' : 'calme'} />
              <Insight label="Dernier" value={lastPayment ? formatCurrency(lastPayment.amount) : '-'} detail={lastPayment?.paidAt ? formatDateTime(lastPayment.paidAt).split(' ')[0] : 'paiement'} />
            </View>

            <View style={styles.actionGrid}>
              <Pressable
                style={styles.actionCard}
                onPress={() => {
                  switchBeneficiaryMode('moi');
                  setTab('accueil');
                }}
              >
                <Text style={styles.actionTitle}>Cotiser pour moi</Text>
                <Text style={styles.actionText}>Payer ma cotisation avec mon numero Wave.</Text>
              </Pressable>
              <Pressable
                style={styles.actionCard}
                onPress={() => {
                  switchBeneficiaryMode('camarade');
                  setTab('accueil');
                }}
              >
                <Text style={styles.actionTitle}>Payer pour un camarade</Text>
                <Text style={styles.actionText}>Rechercher un etudiant et alimenter sa cotisation.</Text>
              </Pressable>
              <Pressable style={styles.actionCard} onPress={() => setTab('defis')}>
                <Text style={styles.actionTitle}>Lancer un defi</Text>
                <Text style={styles.actionText}>Defier un camarade sur la progression de cotisation.</Text>
              </Pressable>
              <Pressable style={styles.actionCard} onPress={() => setTab('messages')}>
                <Text style={styles.actionTitle}>Voir mes alertes</Text>
                <Text style={styles.actionText}>Messages du tresorier, paiements et defis.</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={styles.cardTitle}>
                    {paymentBeneficiaryMode === 'camarade' ? 'Paiement Wave pour un camarade' : 'Paiement Wave personnel'}
                  </Text>
                  <Text style={styles.mutedText}>Le serveur confirme le paiement apres retour securise de Wave.</Text>
                </View>
                <Text style={styles.waveBadge}>Wave</Text>
              </View>
              <View style={styles.demoNotice}>
                <Text style={styles.demoNoticeTitle}>Mode test possible</Text>
                <Text style={styles.demoNoticeText}>
                  Si le compte Wave marchand n'est pas encore active, le tresorier peut enregistrer un paiement main a main pour mettre votre progression a jour.
                </Text>
              </View>
              <View style={styles.segmented}>
                <Pressable
                  style={[styles.segmentItem, paymentBeneficiaryMode === 'moi' && styles.segmentItemActive]}
                  onPress={() => switchBeneficiaryMode('moi')}
                >
                  <Text style={[styles.segmentText, paymentBeneficiaryMode === 'moi' && styles.segmentTextActive]}>Pour moi</Text>
                </Pressable>
                <Pressable
                  style={[styles.segmentItem, paymentBeneficiaryMode === 'camarade' && styles.segmentItemActive]}
                  onPress={() => switchBeneficiaryMode('camarade')}
                >
                  <Text style={[styles.segmentText, paymentBeneficiaryMode === 'camarade' && styles.segmentTextActive]}>Pour camarade</Text>
                </Pressable>
              </View>
              {paymentBeneficiaryMode === 'camarade' && (
                <View style={styles.beneficiaryBox}>
                  <Text style={styles.beneficiaryLabel}>Beneficiaire</Text>
                  {selectedBeneficiary ? (
                    <View style={styles.selectedBeneficiary}>
                      <View>
                        <Text style={styles.resultName}>{getFullName(selectedBeneficiary)}</Text>
                        <Text style={styles.resultMeta}>{selectedBeneficiary.level?.name || 'Niveau non renseigne'}</Text>
                      </View>
                      <Pressable style={styles.linkButton} onPress={() => switchBeneficiaryMode('camarade')}>
                        <Text style={styles.linkButtonText}>Changer</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <LevelSelector
                        value={beneficiaryLevelId}
                        levels={levelFilters}
                        onChange={(value) => {
                          setBeneficiaryLevelId(value);
                          setBeneficiaryResults([]);
                          setBeneficiarySearched(false);
                        }}
                      />
                      <View style={styles.row}>
                        <TextInput
                          style={[styles.input, styles.rowInput]}
                          placeholder="Nom ou prenom"
                          value={beneficiaryQuery}
                          onChangeText={(value) => {
                            setBeneficiaryQuery(value);
                            setBeneficiaryResults([]);
                            setBeneficiarySearched(false);
                          }}
                        />
                        <Pressable
                          style={[styles.smallButton, searchingBeneficiaries && styles.disabledButton]}
                          onPress={searchBeneficiaries}
                          disabled={searchingBeneficiaries}
                        >
                          <Text style={styles.smallButtonText}>{searchingBeneficiaries ? '...' : 'Chercher'}</Text>
                        </Pressable>
                      </View>
                      {beneficiaryResults.map((item) => (
                        <StudentSearchResult
                          key={item.id}
                          student={item}
                          actionLabel="Choisir"
                          onPress={() => selectBeneficiary(item)}
                        />
                      ))}
                      {beneficiarySearched && !searchingBeneficiaries && !beneficiaryResults.length && (
                        <SearchEmpty text="Aucun etudiant actif ne correspond a cette recherche." />
                      )}
                    </>
                  )}
                </View>
              )}
              {paymentBeneficiaryMode === 'camarade' && !selectedBeneficiary ? (
                <Text style={styles.mutedText}>Recherchez un camarade pour charger ses cotisations ouvertes.</Text>
              ) : remainingCotisations.length ? (
                <>
                  <PickerLike
                    value={selectedCotisationId}
                    items={remainingCotisations.map((item) => ({
                      value: item.id,
                      label: `${item.title} - reste ${formatCurrency(item.amount - (item.paidAmount ?? 0))}`,
                    }))}
                    onChange={setSelectedCotisationId}
                  />
                  <TextInput style={styles.input} placeholder="Montant" value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="numeric" />
                  <TextInput style={styles.input} placeholder="Numero Wave" value={paymentPhone} onChangeText={setPaymentPhone} keyboardType="phone-pad" />
                  <View style={styles.securityBox}>
                    <Text style={styles.securityText}>Aucune cle Wave n'est stockee dans votre telephone.</Text>
                    <Text style={styles.securityText}>
                      {paymentBeneficiaryMode === 'camarade'
                        ? 'Le beneficiaire recevra une alerte lorsque le paiement sera confirme.'
                        : 'Un camarade peut aussi payer volontairement pour vous.'}
                    </Text>
                  </View>
                  <Pressable style={styles.primaryButton} onPress={initiateWavePayment} disabled={loading}>
                    <Text style={styles.primaryButtonText}>{loading ? 'Traitement...' : 'Payer avec Wave'}</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.mutedText}>Aucune cotisation ouverte a payer actuellement.</Text>
              )}
            </View>
          </>
        )}

        {tab === 'cotisations' && (
          <>
            <View style={styles.cotisationOverview}>
              <Text style={styles.heroLabel}>Situation de cotisation</Text>
              <Text style={styles.cotisationOverviewAmount}>{formatCurrency(summary?.totalRemainingAmount ?? 0)}</Text>
              <Text style={styles.cotisationOverviewText}>
                {hasCompletedCotisation ? 'Tout est solde pour cette annee.' : 'restant a cotiser pour cette annee'}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(100, summary?.progress ?? 0)}%` }]} />
              </View>
              <View style={styles.statRow}>
                <Stat label="Total" value={formatCurrency(summary?.totalAmount ?? 0)} />
                <Stat label="Deja verse" value={formatCurrency(summary?.totalPaidAmount ?? 0)} />
                <Stat label="Progression" value={`${summary?.progress ?? 0}%`} />
              </View>
            </View>

            <View style={styles.actionGrid}>
              <Pressable
                style={styles.actionCard}
                onPress={() => {
                  switchBeneficiaryMode('moi');
                  setTab('accueil');
                }}
              >
                <Text style={styles.actionTitle}>Cotiser pour moi</Text>
                <Text style={styles.actionText}>Ouvrir le formulaire Wave personnel.</Text>
              </Pressable>
              <Pressable
                style={styles.actionCard}
                onPress={() => {
                  switchBeneficiaryMode('camarade');
                  setTab('accueil');
                }}
              >
                <Text style={styles.actionTitle}>Payer pour un camarade</Text>
                <Text style={styles.actionText}>Rechercher un camarade et payer sa cotisation.</Text>
              </Pressable>
              <Pressable style={styles.actionCard} onPress={() => setTab('defis')}>
                <Text style={styles.actionTitle}>Lancer un defi</Text>
                <Text style={styles.actionText}>Choisir un camarade a defier.</Text>
              </Pressable>
            </View>

            {!!urgentCotisations.length && (
              <>
                <SectionTitle title="A traiter en priorite" />
                {urgentCotisations.map((item) => (
                  <CotisationCard key={item.id} item={item} urgent />
                ))}
              </>
            )}

            <SectionTitle title="Cotisations ouvertes" />
            {openCotisations.length ? (
              openCotisations.map((item) => <CotisationCard key={item.id} item={item} />)
            ) : (
              <EmptyState title="Aucune cotisation ouverte" text={hasCompletedCotisation ? 'Toutes vos cotisations sont soldees.' : 'Les cotisations apparaitront ici apres generation par le tresorier.'} />
            )}

            {!!paidCotisations.length && (
              <>
                <SectionTitle title="Cotisations soldees" />
                {paidCotisations.map((item) => <CotisationCard key={item.id} item={item} />)}
              </>
            )}

            <SectionTitle title="Evolution" />
            <EvolutionChart points={paymentEvolution} totalAmount={summary?.totalAmount ?? 0} />

            <SectionTitle title="Historique des paiements" />
            {recentPaiements.length ? (
              recentPaiements.map((item) => <PaymentHistoryCard key={item.id} item={item} />)
            ) : (
              <EmptyState title="Aucun paiement" text="Vos confirmations Wave et paiements enregistres apparaitront ici." />
            )}
          </>
        )}

        {tab === 'classement' && (
          <>
            <View style={styles.rankingHero}>
              <Text style={styles.heroLabel}>Ma position</Text>
              <Text style={styles.rankingHeroRank}>{rankingContext.rank ? `#${rankingContext.rank}` : '-'}</Text>
              <Text style={styles.cotisationOverviewText}>{rankingContext.total} etudiant(s) dans le niveau</Text>
            </View>
            {rankingContext.rank ? (
              <View style={styles.rankingPositionCard}>
                <Text style={styles.rankingPositionTitle}>Votre situation dans le niveau</Text>
                <Text style={styles.rankingPositionText}>
                  Vous etes actuellement #{rankingContext.rank} sur {rankingContext.total}.{' '}
                  {rankingContext.ahead
                    ? `Devant vous : ${getRankingItemName(rankingContext.ahead)} (#${rankingContext.aheadRank}).`
                    : 'Personne n est devant vous.'}{' '}
                  {rankingContext.behind
                    ? `Derriere vous : ${getRankingItemName(rankingContext.behind)} (#${rankingContext.behindRank}).`
                    : 'Personne n est derriere vous.'}
                </Text>
              </View>
            ) : (
              <EmptyState title="Classement indisponible" text="Votre rang apparaitra lorsque les cotisations seront generees." />
            )}
          </>
        )}

        {tab === 'messages' && (
          <>
            <SectionTitle title="Messages et alertes" />
            <View style={styles.alertSummary}>
              <Text style={styles.alertSummaryTitle}>{unreadCount} alerte(s) non lue(s)</Text>
              <Text style={styles.alertSummaryText}>Paiements, rappels, defis et messages du tresorier sont regroupes ici.</Text>
            </View>
            <View style={styles.notificationFilters}>
              {[
                ['toutes', 'Toutes', notificationCounts.toutes],
                ['non_lues', 'Non lues', notificationCounts.non_lues],
                ['paiements', 'Paiements', notificationCounts.paiements],
                ['defis', 'Defis', notificationCounts.defis],
                ['tresorier', 'Tresorier', notificationCounts.tresorier],
              ].map(([key, label, count]) => (
                <Pressable
                  key={key}
                  style={[styles.notificationFilter, notificationFilter === key && styles.notificationFilterActive]}
                  onPress={() => setNotificationFilter(key as NotificationFilter)}
                >
                  <Text style={[styles.notificationFilterText, notificationFilter === key && styles.notificationFilterTextActive]}>
                    {label}
                  </Text>
                  <Text style={[styles.notificationFilterCount, notificationFilter === key && styles.notificationFilterTextActive]}>
                    {count}
                  </Text>
                </Pressable>
              ))}
            </View>
            {filteredNotifications.length ? filteredNotifications.map((item) => (
              <NotificationCard key={item.id} item={item} onPress={() => markNotificationRead(item.id)} />
            )) : (
              <EmptyState title="Aucun message" text="Aucune alerte ne correspond a ce filtre." />
            )}
          </>
        )}

        {tab === 'defis' && (
          <>
            <SectionTitle title="Defis de cotisation" />
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Lancer un defi</Text>
              <Text style={styles.mutedText}>Choisissez le niveau, recherchez par nom ou prenom, puis envoyez le defi.</Text>
              {selectedOpponent ? (
                <View style={styles.selectedBeneficiary}>
                  <View>
                    <Text style={styles.resultName}>{getFullName(selectedOpponent)}</Text>
                    <Text style={styles.resultMeta}>{selectedOpponent.level?.name || 'Niveau non renseigne'}</Text>
                  </View>
                  <Pressable
                    style={styles.linkButton}
                    onPress={() => {
                      setSelectedOpponent(null);
                      setChallengeMessage('');
                      setChallengeSearched(false);
                    }}
                  >
                    <Text style={styles.linkButtonText}>Changer</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <LevelSelector
                    value={challengeLevelId}
                    levels={levelFilters}
                    onChange={(value) => {
                      setChallengeLevelId(value);
                      setChallengeResults([]);
                      setChallengeSearched(false);
                    }}
                  />
                  <View style={styles.row}>
                    <TextInput
                      style={[styles.input, styles.rowInput]}
                      placeholder="Nom ou prenom"
                      value={challengeQuery}
                      onChangeText={(value) => {
                        setChallengeQuery(value);
                        setChallengeResults([]);
                        setChallengeSearched(false);
                      }}
                    />
                    <Pressable
                      style={[styles.smallButton, searchingChallengeOpponents && styles.disabledButton]}
                      onPress={searchChallengeOpponents}
                      disabled={searchingChallengeOpponents}
                    >
                      <Text style={styles.smallButtonText}>{searchingChallengeOpponents ? '...' : 'Chercher'}</Text>
                    </Pressable>
                  </View>
                  {challengeResults.map((item) => (
                    <StudentSearchResult
                      key={item.id}
                      student={item}
                      actionLabel="Defier"
                      onPress={() => {
                        setSelectedOpponent(item);
                        setChallengeResults([]);
                        setChallengeSearched(false);
                      }}
                    />
                  ))}
                  {challengeSearched && !searchingChallengeOpponents && !challengeResults.length && (
                    <SearchEmpty text="Aucun etudiant actif ne correspond a cette recherche." />
                  )}
                </>
              )}
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Message du defi"
                value={challengeMessage}
                onChangeText={setChallengeMessage}
                multiline
                maxLength={300}
              />
              <Pressable style={styles.primaryButton} onPress={createChallenge} disabled={loading || !selectedOpponent}>
                <Text style={styles.primaryButtonText}>{loading ? 'Envoi...' : 'Envoyer le defi'}</Text>
              </Pressable>
            </View>
            <View style={styles.challengeSummary}>
              <Text style={styles.challengeSummaryTitle}>{challengeCounts.actifs} defi(s) actif(s)</Text>
              <Text style={styles.challengeSummaryText}>
                {challengeCounts.recus} recu(s), {challengeCounts.lances} lance(s), {challengeCounts.termines} termine(s).
              </Text>
            </View>
            <View style={styles.notificationFilters}>
              {[
                ['tous', 'Tous', challengeCounts.tous],
                ['recus', 'Recus', challengeCounts.recus],
                ['lances', 'Lances', challengeCounts.lances],
                ['actifs', 'Actifs', challengeCounts.actifs],
                ['termines', 'Termines', challengeCounts.termines],
              ].map(([key, label, count]) => (
                <Pressable
                  key={key}
                  style={[styles.notificationFilter, challengeFilter === key && styles.notificationFilterActive]}
                  onPress={() => setChallengeFilter(key as ChallengeFilter)}
                >
                  <Text style={[styles.notificationFilterText, challengeFilter === key && styles.notificationFilterTextActive]}>
                    {label}
                  </Text>
                  <Text style={[styles.notificationFilterCount, challengeFilter === key && styles.notificationFilterTextActive]}>
                    {count}
                  </Text>
                </Pressable>
              ))}
            </View>
            {filteredDefis.length ? filteredDefis.map((item) => (
              <View key={item.id} style={styles.challengeCard}>
                <View style={styles.rowBetween}>
                  <Text style={styles.listTitle}>{getFullName(item.challenger)} vs {getFullName(item.opponent)}</Text>
                  <Text style={styles.badge}>{getStatusLabel(item.status)}</Text>
                </View>
                {!!item.message && <Text style={styles.challengeMessage}>{item.message}</Text>}
                <ChallengeProgress name={getFullName(item.challenger)} progress={item.challengerProgress ?? 0} highlight={item.winner?.id === item.challenger?.id} />
                <ChallengeProgress name={getFullName(item.opponent)} progress={item.opponentProgress ?? 0} highlight={item.winner?.id === item.opponent?.id} />
                {item.winner && (
                  <Text style={styles.winnerText}>Gagnant: {getFullName(item.winner)}</Text>
                )}
                {item.status === 'en_attente' && item.opponent?.id === user.id && (
                  <View style={styles.row}>
                    <Pressable style={styles.smallButton} onPress={() => actOnChallenge(item.id, 'accepter')}>
                      <Text style={styles.smallButtonText}>Accepter</Text>
                    </Pressable>
                    <Pressable style={styles.secondaryButton} onPress={() => actOnChallenge(item.id, 'refuser')}>
                      <Text style={styles.secondaryButtonText}>Refuser</Text>
                    </Pressable>
                  </View>
                )}
                {['en_attente', 'accepte'].includes(item.status) && item.challenger?.id === user.id && (
                  <Pressable style={styles.secondaryButtonWide} onPress={() => cancelChallenge(item.id)}>
                    <Text style={styles.secondaryButtonText}>Annuler le defi</Text>
                  </Pressable>
                )}
              </View>
            )) : (
              <EmptyState title="Aucun defi" text="Aucun defi ne correspond a ce filtre." />
            )}
          </>
        )}

        {tab === 'profil' && (
          <>
            <View style={styles.profileHero}>
              <Image source={require('./assets/icon.png')} style={styles.profileMark} />
              <View style={styles.profileHeroText}>
                <Text style={styles.headerEyebrow}>Profil etudiant</Text>
                <Text style={styles.profileName}>{getFullName(user)}</Text>
                <Text style={styles.profileLevel}>{user.level?.name || 'Niveau non renseigne'}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Informations personnelles</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={profileForm.email}
                onChangeText={(value) => setProfileForm({ ...profileForm, email: value })}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextInput
                style={styles.input}
                placeholder="Telephone"
                value={profileForm.phone}
                onChangeText={(value) => setProfileForm({ ...profileForm, phone: value })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Numero Wave"
                value={profileForm.wavePhone}
                onChangeText={(value) => setProfileForm({ ...profileForm, wavePhone: value })}
                keyboardType="phone-pad"
              />
              <ProfileRow label="Statut" value={getStatusLabel(user.accountStatus || 'actif')} />
              <Pressable style={styles.primaryButton} onPress={updateMyProfile} disabled={loading}>
                <Text style={styles.primaryButtonText}>{loading ? 'Enregistrement...' : 'Enregistrer mes contacts'}</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>CotaDISE</Text>
              <Text style={styles.mutedText}>Application mobile de suivi des cotisations des etudiants ISE.</Text>
              <ProfileRow label="Division" value="Ingenieurs Statisticiens Economistes" />
              <ProfileRow label="Ecole" value="ENSEA Abidjan" />
              <ProfileRow label="Paiements" value="Wave confirme par le serveur" />
              {(PRIVACY_URL || TERMS_URL) && (
                <View style={styles.legalButtonRow}>
                  {!!PRIVACY_URL && (
                    <Pressable style={styles.linkButton} onPress={() => Linking.openURL(PRIVACY_URL)}>
                      <Text style={styles.linkButtonText}>Confidentialite</Text>
                    </Pressable>
                  )}
                  {!!TERMS_URL && (
                    <Pressable style={styles.linkButton} onPress={() => Linking.openURL(TERMS_URL)}>
                      <Text style={styles.linkButtonText}>Conditions</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Mot de passe</Text>
              <Text style={styles.mutedText}>Utilisez au moins 8 caracteres avec une lettre et un chiffre.</Text>
              <TextInput
                style={styles.input}
                placeholder="Mot de passe actuel"
                value={passwordForm.currentPassword}
                onChangeText={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Nouveau mot de passe"
                value={passwordForm.newPassword}
                onChangeText={(value) => setPasswordForm({ ...passwordForm, newPassword: value })}
                secureTextEntry
              />
              <TextInput
                style={styles.input}
                placeholder="Confirmer le nouveau mot de passe"
                value={passwordForm.confirmPassword}
                onChangeText={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })}
                secureTextEntry
              />
              <Pressable style={styles.secondaryButtonWide} onPress={changeMyPassword} disabled={loading}>
                <Text style={styles.secondaryButtonText}>{loading ? 'Modification...' : 'Modifier le mot de passe'}</Text>
              </Pressable>
            </View>

            <Pressable style={styles.logoutButtonLarge} onPress={logout}>
              <Text style={styles.logoutButtonLargeText}>Se deconnecter</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <View style={styles.nav}>
        {[
          ['accueil', 'Accueil'],
          ['cotisations', 'Cotiser'],
          ['classement', 'Rang'],
          ['messages', 'Alertes'],
          ['defis', 'Defis'],
          ['profil', 'Profil'],
        ].map(([key, label]) => (
          <Pressable key={key} style={[styles.navItem, tab === key && styles.navItemActive]} onPress={() => setTab(key as Tab)}>
            <Text style={[styles.navText, tab === key && styles.navTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function Insight({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View style={styles.insightCard}>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={styles.insightValue}>{value}</Text>
      <Text style={styles.insightDetail}>{detail}</Text>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function NotificationCard({ item, onPress }: { item: NotificationMessage; onPress: () => void }) {
  const tone = getNotificationTone(item.type);
  return (
    <Pressable style={[styles.notificationCard, !item.readAt && styles.unreadCard]} onPress={onPress}>
      <View style={styles.rowBetween}>
        <Text style={[styles.notificationBadge, { backgroundColor: tone.backgroundColor, color: tone.color }]}>
          {getNotificationTypeLabel(item.type)}
        </Text>
        <Text style={styles.notificationDate}>{formatDateTime(item.createdAt)}</Text>
      </View>
      <Text style={styles.listTitle}>{item.title}</Text>
      <Text style={styles.listMeta}>{item.message}</Text>
      {!item.readAt && <Text style={styles.unreadText}>Toucher pour marquer comme lu</Text>}
    </Pressable>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileRowLabel}>{label}</Text>
      <Text style={styles.profileRowValue}>{value}</Text>
    </View>
  );
}

function getNotificationTone(type?: string) {
  const tones: Record<string, { backgroundColor: string; color: string }> = {
    rappel_cotisation: { backgroundColor: '#fef3c7', color: '#92400e' },
    paiement_confirme: { backgroundColor: '#dcfce7', color: '#166534' },
    paiement_pour_toi: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
    defi_recu: { backgroundColor: '#ede9fe', color: '#6d28d9' },
    defi_termine: { backgroundColor: '#ccfbf1', color: '#0f766e' },
    demande_aide_alumni: { backgroundColor: '#fce7f3', color: '#be185d' },
    message_tresorier: { backgroundColor: '#e0f2fe', color: '#0369a1' },
  };
  return tones[type || ''] || { backgroundColor: '#e2e8f0', color: '#334155' };
}

function getNotificationCategory(type?: string): Exclude<NotificationFilter, 'toutes' | 'non_lues'> {
  const normalized = type || '';
  if (normalized.includes('paiement')) return 'paiements';
  if (normalized.includes('defi')) return 'defis';
  return 'tresorier';
}

function daysUntil(dateValue?: string) {
  if (!dateValue) return Number.POSITIVE_INFINITY;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateValue);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function CotisationCard({ item, urgent }: { item: Cotisation; urgent?: boolean }) {
  const progress = item.amount > 0 ? Math.round(((item.paidAmount ?? 0) / item.amount) * 100) : 0;
  const remaining = Math.max(0, item.amount - (item.paidAmount ?? 0));
  const days = daysUntil(item.dueDate);
  const deadlineText = days < 0 ? `${Math.abs(days)} j de retard` : days === 0 ? "Aujourd'hui" : `${days} j restants`;
  return (
    <View style={[styles.listCard, urgent && styles.urgentCotisationCard]}>
      <View style={styles.rowBetween}>
        <Text style={styles.listTitle}>{item.title}</Text>
        <Text style={styles.badge}>{getStatusLabel(item.status)}</Text>
      </View>
      <Text style={styles.listMeta}>{formatCurrency(item.paidAmount ?? 0)} / {formatCurrency(item.amount)}</Text>
      <Text style={styles.listMeta}>Reste: {formatCurrency(remaining)}</Text>
      <Text style={[styles.deadlineText, days <= 30 && !item.paid && styles.deadlineTextUrgent]}>
        Echeance: {formatDateTime(item.dueDate).split(' ')[0]} - {deadlineText}
      </Text>
      <View style={styles.progressTrackSmall}>
        <View style={[styles.progressFill, { width: `${Math.min(100, progress)}%` }]} />
      </View>
    </View>
  );
}

function PaymentHistoryCard({ item }: { item: Paiement }) {
  return (
    <View style={styles.paymentCard}>
      <View style={styles.rowBetween}>
        <Text style={styles.paymentAmount}>{formatCurrency(item.appliedAmount ?? item.amount)}</Text>
        <Text style={styles.badge}>{getStatusLabel(item.status)}</Text>
      </View>
      <Text style={styles.listTitle}>{item.cotisation?.title || 'Paiement'}</Text>
      <Text style={styles.listMeta}>{item.reference || 'Reference en attente'}</Text>
      {!!item.paidAt && <Text style={styles.listMeta}>{formatDateTime(item.paidAt)}</Text>}
    </View>
  );
}

function EvolutionChart({ points, totalAmount }: { points: Array<{ label: string; amount: number }>; totalAmount: number }) {
  if (!points.length) {
    return <EmptyState title="Pas encore de courbe" text="La courbe apparaitra apres les premiers paiements confirmes." />;
  }

  const maxAmount = Math.max(totalAmount, ...points.map((item) => item.amount), 1);
  const latestAmount = points[points.length - 1]?.amount ?? 0;
  const latestProgress = totalAmount > 0 ? Math.min(100, Math.round((latestAmount / totalAmount) * 100)) : 0;

  return (
    <View style={styles.chartCard}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.chartTitle}>Paiements cumules</Text>
          <Text style={styles.chartSubtitle}>{latestProgress}% de l'objectif annuel</Text>
        </View>
        <Text style={styles.paymentAmount}>{formatCurrency(latestAmount)}</Text>
      </View>
      <View style={styles.chartArea}>
        {points.map((point, index) => {
          const height = Math.max(8, Math.round((point.amount / maxAmount) * 120));
          return (
            <View key={`${point.label}-${index}`} style={styles.chartColumn}>
              <View style={[styles.chartBar, { height }]} />
              <Text style={styles.chartLabel}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function SearchEmpty({ text }: { text: string }) {
  return (
    <View style={styles.searchEmpty}>
      <Text style={styles.searchEmptyText}>{text}</Text>
    </View>
  );
}

function StudentSearchResult({
  student,
  actionLabel,
  onPress,
}: {
  student: User;
  actionLabel: string;
  onPress: () => void;
}) {
  const firstInitial = student.firstName?.charAt(0) || '';
  const lastInitial = student.lastName?.charAt(0) || '';
  const initials = `${firstInitial}${lastInitial}`.toUpperCase() || 'DI';

  return (
    <Pressable style={styles.studentResultCard} onPress={onPress}>
      <View style={styles.studentAvatar}>
        <Text style={styles.studentAvatarText}>{initials}</Text>
      </View>
      <View style={styles.studentResultBody}>
        <Text style={styles.resultName}>{getFullName(student)}</Text>
        <View style={styles.studentMetaRow}>
          <Text style={styles.studentLevelBadge}>{student.level?.name || 'Niveau non renseigne'}</Text>
          <Text style={styles.studentStatusText}>Actif</Text>
        </View>
      </View>
      <Text style={styles.studentActionText}>{actionLabel}</Text>
    </Pressable>
  );
}

function buildPaymentEvolution(paiements: Paiement[]) {
  const confirmed = paiements
    .filter((item) => ['confirme', 'paid', 'completed'].includes(item.status || '') || !!item.paidAt)
    .slice()
    .sort((a, b) => {
      const dateA = a.paidAt ? new Date(a.paidAt).getTime() : 0;
      const dateB = b.paidAt ? new Date(b.paidAt).getTime() : 0;
      return dateA - dateB;
    });

  let cumulative = 0;
  const allPoints = confirmed.map((item, index) => {
    cumulative += item.appliedAmount ?? item.amount ?? 0;
    const label = item.paidAt ? formatDateTime(item.paidAt).split(' ')[0] : `P${index + 1}`;
    return { label, amount: cumulative };
  });
  return allPoints.slice(-8);
}

function ChallengeProgress({ name, progress, highlight }: { name: string; progress: number; highlight?: boolean }) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));
  return (
    <View style={styles.challengeProgressBlock}>
      <View style={styles.rowBetween}>
        <Text style={[styles.challengeName, highlight && styles.challengeNameWinner]}>{name || '-'}</Text>
        <Text style={[styles.challengePercent, highlight && styles.challengeNameWinner]}>{safeProgress}%</Text>
      </View>
      <View style={styles.progressTrackSmall}>
        <View style={[styles.progressFill, highlight && styles.progressFillWinner, { width: `${safeProgress}%` }]} />
      </View>
    </View>
  );
}

function PickerLike({
  value,
  items,
  onChange,
}: {
  value: string;
  items: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  if (!items.length) {
    return <Text style={styles.mutedText}>Aucune cotisation ouverte a payer.</Text>;
  }
  return (
    <FlatList
      data={items}
      horizontal
      keyExtractor={(item) => item.value}
      showsHorizontalScrollIndicator={false}
      renderItem={({ item }) => (
        <Pressable style={[styles.choice, value === item.value && styles.choiceActive]} onPress={() => onChange(item.value)}>
          <Text style={[styles.choiceText, value === item.value && styles.choiceTextActive]}>{item.label}</Text>
        </Pressable>
      )}
    />
  );
}

function LevelSelector({
  value,
  levels,
  onChange,
}: {
  value: string;
  levels: Level[];
  onChange: (value: string) => void;
}) {
  const items = [
    { value: '', label: 'Tous' },
    ...levels.map((level) => ({ value: level.id || level.name, label: level.name })),
  ];

  return (
    <View style={styles.levelSelector}>
      {items.map((item) => (
        <Pressable
          key={item.value || 'all'}
          style={[styles.levelOption, value === item.value && styles.levelOptionActive]}
          onPress={() => onChange(item.value)}
        >
          <Text style={[styles.levelOptionText, value === item.value && styles.levelOptionTextActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  authScreen: {
    flex: 1,
  },
  authContent: {
    padding: 20,
    paddingBottom: 36,
  },
  brandBlock: {
    paddingVertical: 22,
  },
  authMarkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  authMark: {
    borderRadius: 16,
    height: 54,
    width: 54,
  },
  brand: {
    color: '#eff2c5',
    fontSize: 20,
    fontWeight: '900',
  },
  brandSub: {
    color: '#22a6cf',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  brandTitle: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '900',
    lineHeight: 38,
    marginTop: 14,
  },
  brandText: {
    color: '#b6c7d8',
    fontSize: 16,
    marginTop: 12,
    lineHeight: 23,
  },
  apiText: {
    color: '#718096',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  authTrustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  authTrustPill: {
    backgroundColor: 'rgba(239, 242, 197, 0.12)',
    borderColor: 'rgba(239, 242, 197, 0.28)',
    borderRadius: 999,
    borderWidth: 1,
    color: '#eff2c5',
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  authCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginBottom: 14,
    padding: 18,
  },
  authInfoGrid: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 14,
  },
  authInfoCard: {
    backgroundColor: '#eff2c5',
    borderRadius: 16,
    minHeight: 104,
    padding: 13,
  },
  authInfoTitle: {
    color: '#1f1c5b',
    fontSize: 14,
    fontWeight: '900',
  },
  authInfoText: {
    color: '#154a8b',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 7,
  },
  cardTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  mutedText: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderColor: '#dbe4ee',
    borderRadius: 12,
    borderWidth: 1,
    color: '#0f172a',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  textArea: {
    minHeight: 92,
    paddingTop: 13,
    textAlignVertical: 'top',
  },
  rowInput: {
    marginBottom: 0,
    width: '100%',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 12,
    minHeight: 50,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  smallButton: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    width: '100%',
  },
  smallButtonText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.65,
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  secondaryButtonWide: {
    alignItems: 'center',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  secondaryButtonText: {
    color: '#334155',
    fontWeight: '900',
  },
  notice: {
    color: '#fef08a',
    fontWeight: '800',
    marginTop: 8,
  },
  resultItem: {
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  resultName: {
    color: '#0f172a',
    fontWeight: '900',
  },
  resultMeta: {
    color: '#64748b',
    marginTop: 3,
  },
  searchEmpty: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    padding: 12,
  },
  searchEmptyText: {
    color: '#64748b',
    fontWeight: '800',
    lineHeight: 19,
  },
  studentResultCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ee',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    padding: 11,
  },
  studentAvatar: {
    alignItems: 'center',
    backgroundColor: '#1f1c5b',
    borderRadius: 999,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  studentAvatarText: {
    color: '#eff2c5',
    fontSize: 13,
    fontWeight: '900',
  },
  studentResultBody: {
    flex: 1,
    minWidth: 0,
  },
  studentMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  studentLevelBadge: {
    backgroundColor: '#ccfbf1',
    borderRadius: 999,
    color: '#0f766e',
    fontSize: 11,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  studentStatusText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
  },
  studentActionText: {
    color: '#154a8b',
    fontSize: 12,
    fontWeight: '900',
  },
  activationBox: {
    marginTop: 14,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerIdentity: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingRight: 10,
  },
  headerMark: {
    borderRadius: 12,
    height: 42,
    width: 42,
  },
  headerTextBlock: {
    flex: 1,
  },
  headerEyebrow: {
    color: '#5eead4',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
    flexShrink: 1,
  },
  headerMeta: {
    color: '#94a3b8',
    marginTop: 2,
  },
  logoutButton: {
    borderColor: '#334155',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexShrink: 0,
  },
  logoutText: {
    color: '#cbd5e1',
    fontWeight: '800',
  },
  content: {
    padding: 12,
    paddingBottom: 128,
  },
  heroCard: {
    backgroundColor: '#eff2c5',
    borderRadius: 24,
    padding: 20,
    marginBottom: 14,
  },
  cotisationOverview: {
    backgroundColor: '#eff2c5',
    borderRadius: 20,
    marginBottom: 14,
    padding: 18,
  },
  cotisationOverviewAmount: {
    color: '#1f1c5b',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 8,
  },
  cotisationOverviewText: {
    color: '#154a8b',
    fontWeight: '800',
    marginTop: 4,
  },
  heroTop: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroLabel: {
    color: '#154a8b',
    fontWeight: '800',
  },
  heroPercent: {
    color: '#1f1c5b',
    fontSize: 46,
    fontWeight: '900',
    marginTop: 8,
  },
  statusPill: {
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusPillDone: {
    backgroundColor: '#dcfce7',
  },
  statusPillText: {
    color: '#154a8b',
    fontSize: 12,
    fontWeight: '900',
  },
  statusPillTextDone: {
    color: '#166534',
  },
  progressTrack: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    height: 12,
    overflow: 'hidden',
    marginVertical: 18,
  },
  progressTrackSmall: {
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  progressFill: {
    backgroundColor: '#22a6cf',
    height: '100%',
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '31%',
    minWidth: 92,
  },
  statLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
  },
  statValue: {
    color: '#1f1c5b',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },
  successCard: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
    padding: 15,
  },
  successTitle: {
    color: '#166534',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 5,
  },
  successText: {
    color: '#166534',
    lineHeight: 20,
  },
  insightGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  insightCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    flexBasis: '100%',
    minHeight: 92,
    padding: 12,
  },
  insightLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
  },
  insightValue: {
    color: '#1f1c5b',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 6,
  },
  insightDetail: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  nextActionCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ee',
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 15,
  },
  nextActionHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  nextActionIcon: {
    alignItems: 'center',
    backgroundColor: '#1f1c5b',
    borderRadius: 15,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  nextActionIconText: {
    color: '#eff2c5',
    fontSize: 13,
    fontWeight: '900',
  },
  nextActionBody: {
    flex: 1,
  },
  nextActionLabel: {
    color: '#22a6cf',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  nextActionTitle: {
    color: '#1f1c5b',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 3,
  },
  nextActionText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  nextActionButtons: {
    flexDirection: 'column',
    gap: 9,
    marginTop: 13,
  },
  nextActionButtonPrimary: {
    alignItems: 'center',
    backgroundColor: '#0f766e',
    borderRadius: 12,
    flexGrow: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  nextActionButtonPrimaryText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  nextActionButton: {
    alignItems: 'center',
    backgroundColor: '#eff2c5',
    borderRadius: 12,
    flexGrow: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  nextActionButtonText: {
    color: '#1f1c5b',
    fontWeight: '900',
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dbe4ee',
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '100%',
    minHeight: 112,
    padding: 14,
  },
  actionTitle: {
    color: '#1f1c5b',
    fontSize: 15,
    fontWeight: '900',
  },
  actionText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 7,
  },
  cardHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 12,
  },
  waveBadge: {
    backgroundColor: '#22a6cf',
    borderRadius: 999,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  demoNotice: {
    backgroundColor: '#fef3c7',
    borderColor: '#fde68a',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  demoNoticeTitle: {
    color: '#92400e',
    fontSize: 13,
    fontWeight: '900',
  },
  demoNoticeText: {
    color: '#92400e',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  segmented: {
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    flexDirection: 'row',
    marginBottom: 12,
    padding: 4,
  },
  segmentItem: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  segmentItemActive: {
    backgroundColor: '#1f1c5b',
  },
  segmentText: {
    color: '#475569',
    fontWeight: '900',
  },
  segmentTextActive: {
    color: '#ffffff',
  },
  beneficiaryBox: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  beneficiaryLabel: {
    color: '#154a8b',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  selectedBeneficiary: {
    alignItems: 'stretch',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 10,
  },
  linkButton: {
    borderColor: '#cbd5e1',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  linkButtonText: {
    color: '#154a8b',
    fontSize: 12,
    fontWeight: '900',
  },
  legalButtonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  securityBox: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    padding: 12,
  },
  securityText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
    marginTop: 6,
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
  },
  urgentCotisationCard: {
    borderColor: '#facc15',
    borderWidth: 2,
  },
  deadlineText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 6,
  },
  deadlineTextUrgent: {
    color: '#92400e',
  },
  challengeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 15,
    marginBottom: 10,
  },
  challengeSummary: {
    backgroundColor: '#ede9fe',
    borderColor: '#ddd6fe',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    padding: 15,
  },
  challengeSummaryTitle: {
    color: '#6d28d9',
    fontSize: 17,
    fontWeight: '900',
  },
  challengeSummaryText: {
    color: '#6d28d9',
    lineHeight: 20,
    marginTop: 5,
  },
  challengeMessage: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    color: '#475569',
    lineHeight: 20,
    marginTop: 10,
    padding: 10,
  },
  challengeProgressBlock: {
    marginTop: 12,
  },
  challengeName: {
    color: '#334155',
    flex: 1,
    fontSize: 13,
    fontWeight: '900',
    paddingRight: 8,
  },
  challengePercent: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '900',
  },
  challengeNameWinner: {
    color: '#166534',
  },
  progressFillWinner: {
    backgroundColor: '#22c55e',
  },
  winnerText: {
    color: '#166534',
    fontWeight: '900',
    marginTop: 12,
  },
  unreadCard: {
    borderColor: '#22a6cf',
    borderWidth: 2,
  },
  alertSummary: {
    backgroundColor: '#eff2c5',
    borderRadius: 16,
    marginBottom: 12,
    padding: 15,
  },
  alertSummaryTitle: {
    color: '#1f1c5b',
    fontSize: 18,
    fontWeight: '900',
  },
  alertSummaryText: {
    color: '#154a8b',
    lineHeight: 20,
    marginTop: 5,
  },
  notificationCard: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    padding: 15,
  },
  notificationFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  notificationFilter: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 12,
  },
  notificationFilterActive: {
    backgroundColor: '#eff2c5',
    borderColor: '#eff2c5',
  },
  notificationFilterText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '900',
  },
  notificationFilterTextActive: {
    color: '#1f1c5b',
  },
  notificationFilterCount: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '900',
  },
  notificationBadge: {
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '900',
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  notificationDate: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
  },
  unreadText: {
    color: '#154a8b',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 10,
  },
  listTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
  },
  listMeta: {
    color: '#64748b',
    lineHeight: 20,
    marginTop: 5,
  },
  paymentCard: {
    backgroundColor: '#ffffff',
    borderLeftColor: '#22a6cf',
    borderLeftWidth: 5,
    borderRadius: 16,
    marginBottom: 10,
    padding: 15,
  },
  paymentAmount: {
    color: '#1f1c5b',
    fontSize: 20,
    fontWeight: '900',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 10,
    padding: 15,
  },
  chartTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
  },
  chartSubtitle: {
    color: '#64748b',
    marginTop: 4,
  },
  chartArea: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    height: 160,
    marginTop: 18,
  },
  chartColumn: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    minWidth: 24,
  },
  chartBar: {
    backgroundColor: '#22a6cf',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    width: '100%',
  },
  chartLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 6,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    padding: 16,
  },
  emptyTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: '#64748b',
    lineHeight: 20,
    marginTop: 5,
  },
  row: {
    flexDirection: 'column',
    gap: 10,
  },
  rowBetween: {
    alignItems: 'flex-start',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 10,
  },
  badge: {
    backgroundColor: '#ccfbf1',
    borderRadius: 999,
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '900',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  choice: {
    borderColor: '#cbd5e1',
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 10,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  choiceActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  choiceText: {
    color: '#334155',
    fontWeight: '800',
  },
  choiceTextActive: {
    color: '#ffffff',
  },
  levelSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  levelOption: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    borderWidth: 1,
    flexGrow: 1,
    minHeight: 42,
    minWidth: 74,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  levelOptionActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  levelOptionText: {
    color: '#334155',
    fontWeight: '900',
  },
  levelOptionTextActive: {
    color: '#ffffff',
  },
  rankingHero: {
    backgroundColor: '#eff2c5',
    borderRadius: 20,
    marginBottom: 14,
    padding: 18,
  },
  rankingHeroRank: {
    color: '#1f1c5b',
    fontSize: 54,
    fontWeight: '900',
    marginTop: 4,
  },
  rankingPositionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    gap: 8,
    padding: 16,
  },
  rankingPositionTitle: {
    color: '#1f1c5b',
    fontSize: 18,
    fontWeight: '900',
  },
  rankingPositionText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 23,
  },
  profileHero: {
    alignItems: 'center',
    backgroundColor: '#eff2c5',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 14,
    marginBottom: 14,
    padding: 16,
  },
  profileMark: {
    borderRadius: 18,
    height: 68,
    width: 68,
  },
  profileHeroText: {
    flex: 1,
  },
  profileName: {
    color: '#1f1c5b',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  profileLevel: {
    color: '#154a8b',
    fontWeight: '800',
    marginTop: 3,
  },
  profileRow: {
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    paddingVertical: 11,
  },
  profileRowLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '900',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  profileRowValue: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  logoutButtonLarge: {
    alignItems: 'center',
    borderColor: '#475569',
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 4,
    minHeight: 50,
  },
  logoutButtonLargeText: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '900',
  },
  nav: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e2e8f0',
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    paddingBottom: Platform.OS === 'ios' ? 22 : 10,
    paddingHorizontal: 8,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
  },
  navItem: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 9,
  },
  navItemActive: {
    backgroundColor: '#ccfbf1',
  },
  navText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
  },
  navTextActive: {
    color: '#0f766e',
  },
});
