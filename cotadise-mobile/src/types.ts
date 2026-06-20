export type Level = {
  id: string;
  name: string;
  annualAmount?: number;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  wavePhone?: string | null;
  role: string;
  accountStatus?: string;
  isActive?: boolean;
  level?: Level | null;
};

export type AuthResponse = {
  accessToken: string;
  user: User;
};

export type Cotisation = {
  id: string;
  title: string;
  amount: number;
  paidAmount?: number;
  dueDate: string;
  status: string;
  paid: boolean;
};

export type Paiement = {
  id: string;
  amount: number;
  appliedAmount?: number;
  method: string;
  reference?: string | null;
  status?: string;
  paidAt?: string;
  cotisation?: Cotisation;
};

export type StudentSummary = {
  user: User;
  level?: Level | null;
  totalAmount: number;
  totalPaidAmount: number;
  totalRemainingAmount: number;
  progress: number;
  lastPayment?: string | null;
};

export type RankingItem = {
  userId?: string;
  firstName?: string;
  lastName?: string;
  paidAmount?: number;
  progress?: number;
  percentage?: number;
};

export type StudentRanking = {
  rank: number | null;
  totalInLevel: number;
  rankings: RankingItem[];
};

export type NotificationMessage = {
  id: string;
  title: string;
  message: string;
  type: string;
  readAt?: string | null;
  createdAt?: string;
};

export type Defi = {
  id: string;
  status: string;
  message?: string | null;
  challenger?: User;
  opponent?: User;
  winner?: User | null;
  challengerProgress?: number;
  opponentProgress?: number;
};

export type InvitedStudent = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  level?: Level | null;
};
