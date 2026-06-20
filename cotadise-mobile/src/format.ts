export const formatCurrency = (value = 0) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(value);

export const getFullName = (user?: { firstName?: string; lastName?: string } | null) =>
  `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Non renseigne';

export const getStatusLabel = (status?: string) => {
  const labels: Record<string, string> = {
    paid: 'Payee',
    partial: 'Partielle',
    pending: 'En attente',
    overdue: 'En retard',
    confirme: 'Confirme',
    en_attente: 'En attente',
    echoue: 'Echoue',
    annule: 'Annule',
    accepte: 'Accepte',
    refuse: 'Refuse',
    termine: 'Termine',
  };
  return labels[status || ''] || status || '-';
};

export const formatDateTime = (value?: string | Date | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getNotificationTypeLabel = (type?: string) => {
  const labels: Record<string, string> = {
    rappel_cotisation: 'Rappel',
    paiement_confirme: 'Paiement',
    demande_aide_alumni: 'Alumni',
    message_tresorier: 'Tresorier',
    defi_recu: 'Defi',
    defi_termine: 'Defi termine',
    paiement_pour_toi: 'Pour toi',
  };
  return labels[type || ''] || 'Message';
};
