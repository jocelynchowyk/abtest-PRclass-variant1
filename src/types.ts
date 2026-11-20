export type PlanId = 'adhoc' | 'monthly' | 'annual';

export type BillingBasis = 'ad-hoc' | 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  kicker: string;
  billingBasis: BillingBasis;
  unitPrice: number;
  unitLabel: string;
  billingNote: string;
  minUnits: number;
  maxUnits: number;
  selectableUnits: number[];
  defaultUnits: number;
  headlineBenefit: string;
  description: string;
  benefits: string[];
  imageUrl: string;
}

export interface MasterclassSession {
  id: string;
  code: string;
  title: string;
  schedule: string;
  duration: string;
  format: string;
  seatsRemaining: number;
  summary: string;
}

export interface ConcessionBreakdown {
  age: number;
  isOver40: boolean;
  isExistingStudent: boolean;
  studentId: string | null;
  over40Rate: number;
  existingStudentRate: number;
  appliedRate: number;
  label: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  dob: string;
  concession: ConcessionBreakdown;
  createdAt: string;
}

export interface SubscriptionOrder {
  orderNumber: string;
  userId: string;
  planId: PlanId;
  planName: string;
  billingBasis: BillingBasis;
  termUnits: number;
  unitLabel: string;
  unitPrice: number;
  subtotal: number;
  discountRate: number;
  discountLabel: string;
  discountAmount: number;
  totalAmount: number;
  learningMode: 'In-Person (Singapore)' | 'Live Interactive Stream';
  startDate: string;
  paymentMethod: 'Card' | 'PayNow';
  paymentLast4?: string;
  billingPostalCode: string;
  billingAddress: string;
  status: 'Active' | 'Confirmed';
  createdAt: string;
  ageAtPurchase: number;
}
