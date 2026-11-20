import type {
  MasterclassSession,
  PlanId,
  SubscriptionOrder,
  SubscriptionPlan,
  UserProfile,
} from '../types';

const TOKEN_STORAGE_KEY = 'pr_academy_session_token';

export function getStoredToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage failures
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed') as Error & {
      status?: number;
    };
    err.status = res.status;
    throw err;
  }

  return data as T;
}

export interface CatalogResponse {
  plans: SubscriptionPlan[];
  classes: MasterclassSession[];
  concessionRules: {
    over40Rate: number;
    existingStudentRate: number;
    combinedMaxRate: number;
    over40Threshold: number;
  };
}

export function fetchCatalog() {
  return apiFetch<CatalogResponse>('/api/catalog');
}

export function fetchCurrentUser() {
  return apiFetch<{ user: UserProfile | null; orders: SubscriptionOrder[] }>('/api/auth/me');
}

export async function registerAccount(payload: {
  fullName: string;
  email: string;
  password: string;
  dob: string;
  studentId?: string;
}) {
  const res = await apiFetch<{
    user: UserProfile;
    orders: SubscriptionOrder[];
    sessionToken: string;
  }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(res.sessionToken);
  return res;
}

export async function loginWithPassword(payload: { email: string; password: string }) {
  const res = await apiFetch<{
    user: UserProfile;
    orders: SubscriptionOrder[];
    sessionToken: string;
  }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(res.sessionToken);
  return res;
}

export function verifyExistingStudentId(studentId: string) {
  return apiFetch<{ user: UserProfile }>('/api/auth/verify-student', {
    method: 'POST',
    body: JSON.stringify({ studentId }),
  });
}

export async function logoutUser() {
  await apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  setStoredToken(null);
}

export function submitCheckout(payload: {
  planId: PlanId;
  termUnits: number;
  learningMode: 'In-Person (Singapore)' | 'Live Interactive Stream';
  startDate: string;
  paymentMethod: 'Card' | 'PayNow';
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  billingPostalCode: string;
  billingAddress: string;
}) {
  return apiFetch<{ order: SubscriptionOrder }>('/api/checkout', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function formatSGD(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
