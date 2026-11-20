import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET || 'pr-academy-singpass-session-secret-2026';
const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'academy-store.json');

type PlanId = 'adhoc' | 'monthly' | 'annual';
type BillingBasis = 'ad-hoc' | 'monthly' | 'annual';

interface SubscriptionPlan {
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

interface StoredUser {
  id: string;
  fullName: string;
  email: string;
  nricUpper: string;
  maskedNric: string;
  dob: string;
  studentId: string | null;
  isExistingStudent: boolean;
  passwordHash: string;
  passwordSalt: string;
  singpassVerified: boolean;
  createdAt: string;
}

interface StoredOrder {
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
  verifiedAgeAtPurchase: number;
}

interface StoreState {
  users: StoredUser[];
  orders: StoredOrder[];
  orderSeq: number;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Fellowship',
    kicker: 'Monthly · 3-Month Minimum Term',
    billingBasis: 'monthly',
    unitPrice: 260,
    unitLabel: 'month',
    billingNote: 'Minimum 3-month commitment required',
    minUnits: 3,
    maxUnits: 11,
    selectableUnits: [3, 6, 9],
    defaultUnits: 3,
    headlineBenefit: 'Weekly live masterclasses & cohort workshops',
    description:
      'Structured cohort progression across Professor PR’s core syllabus. Enforces a three-month minimum commitment to complete a full foundational module.',
    benefits: [
      '4 weekly live masterclasses per month with Professor PR',
      'Bi-weekly small-group quantitative case workshops & feedback',
      'Complete digital syllabus, decision frameworks & full replay archive',
      'Weekly Teaching Fellow office hours & private cohort forum',
      'Verified PR Academy Certificate upon completing 3-month term',
    ],
    imageUrl: '/src/assets/images/tier_monthly_fellowship_1795157801478.jpg',
  },
  {
    id: 'annual',
    name: 'Annual Scholar',
    kicker: 'Annually · 12-Month Full Curriculum',
    billingBasis: 'annual',
    unitPrice: 195,
    unitLabel: 'month',
    billingNote: 'Billed annually for 12 months (25% lower than Monthly)',
    minUnits: 12,
    maxUnits: 12,
    selectableUnits: [12],
    defaultUnits: 12,
    headlineBenefit: 'Full-year curriculum, 1-on-1 reviews & print monograph',
    description:
      'Comprehensive year-long fellowship covering all four academic quarters, private manuscript critiques, and priority in-person symposium seating.',
    benefits: [
      'All 48 annual lectures, special policy dialogues & guest roundtables',
      'Full on-demand access to all recorded live sessions & 5-year archive',
      'Quarterly 1-on-1 strategy or manuscript review with Professor PR',
      'Hardcover linen-bound edition of Professor PR’s 2026 Monograph',
      'Priority front-row seating at Singapore campus seminars',
    ],
    imageUrl: '/src/assets/images/tier_annual_scholar_1795157801294.jpg',
  },
  {
    id: 'adhoc',
    name: 'Single Seminar Pass',
    kicker: 'Single · Ad-Hoc Pay-Per-Session',
    billingBasis: 'ad-hoc',
    unitPrice: 140,
    unitLabel: 'session',
    billingNote: 'Pay-per-session with no recurring commitment',
    minUnits: 1,
    maxUnits: 10,
    selectableUnits: [1, 3, 5],
    defaultUnits: 1,
    headlineBenefit: 'Single seminar entry with 14-day replay',
    description:
      'Designed for executives and independent learners seeking focused mastery on an individual seminar topic without a multi-month contract.',
    benefits: [
      'Live 90-minute seminar seat with Professor PR (Singapore or livestream)',
      'Annotated digital briefing packet and primary source reading list',
      '14-day on-demand high-definition lecture replay',
      'Advance floor question submission prior to live Q&A',
    ],
    imageUrl: '/src/assets/images/tier_adhoc_seminar_1795157801756.jpg',
  },
];

const UPCOMING_CLASSES = [
  {
    id: 'cls-01',
    code: '01.',
    title: 'Institutional Strategy & Incentive Design',
    schedule: 'Thursdays · 7:30 PM SGT',
    duration: '90 min',
    format: 'Singapore Campus & Live Stream',
    seatsRemaining: 14,
    summary: 'How asymmetric incentives, governance rules, and capital structures determine multi-decade organizational durability.',
  },
  {
    id: 'cls-02',
    code: '02.',
    title: 'Quantitative Decisions Under Uncertainty',
    schedule: 'Saturdays · 10:00 AM SGT',
    duration: '90 min',
    format: 'Singapore Campus & Live Stream',
    seatsRemaining: 9,
    summary: 'Expected value frameworks, tail-risk calibration, and Bayesian updating applied to real-world market and policy case studies.',
  },
  {
    id: 'cls-03',
    code: '03.',
    title: 'Capital Allocation in Southeast Asia',
    schedule: 'Tuesdays · 8:00 PM SGT',
    duration: '90 min',
    format: 'Live Interactive Stream',
    seatsRemaining: 22,
    summary: 'Evaluating infrastructure, trade corridors, sovereign balance sheets, and cross-border compounding across ASEAN.',
  },
  {
    id: 'cls-04',
    code: '04.',
    title: 'Regulation, Technology & Long-Horizon Moats',
    schedule: 'Sundays · 4:00 PM SGT',
    duration: '90 min',
    format: 'Singapore Campus & Live Stream',
    seatsRemaining: 11,
    summary: 'Examining structural competitive advantages when AI, compliance frameworks, and public-private partnerships intersect.',
  },
];

const VALID_ALUMNI_IDS = new Set([
  'PR-2023-104',
  'PR-2024-089',
  'PR-2025-212',
  'PR-2024-315',
  'PR-2022-041',
]);

const SINGPASS_PERSONAS = [
  {
    id: 'over40-new',
    label: 'Tan Wei Ming · Age 45 (Over-40 Concession)',
    nric: 'S8145920D',
    fullName: 'Tan Wei Ming',
    dob: '1981-04-12',
    email: 'weiming.tan@example.sg',
    note: 'DOB 12 Apr 1981 · Automatically verified >= 40 years (20% Off)',
  },
  {
    id: 'existing-student',
    label: 'Lim Hui Ling · Age 28 (Existing Student)',
    nric: 'S9821345G',
    fullName: 'Lim Hui Ling',
    dob: '1998-09-23',
    email: 'huiling.lim@example.sg',
    studentId: 'PR-2024-089',
    note: 'DOB 23 Sep 1998 · Alumni ID PR-2024-089 (15% Off)',
  },
  {
    id: 'combined-both',
    label: 'Dr. Rajesh Nair · Age 48 (Existing Student + Over 40)',
    nric: 'S7833102B',
    fullName: 'Dr. Rajesh Nair',
    dob: '1978-07-08',
    email: 'rajesh.nair@example.sg',
    studentId: 'PR-2023-104',
    note: 'DOB 08 Jul 1978 · Both Over 40 & Alumni (30% Combined Off)',
  },
  {
    id: 'standard-learner',
    label: 'Sarah Chen · Age 25 (Standard Applicant)',
    nric: 'T0129481J',
    fullName: 'Sarah Chen',
    dob: '2001-02-14',
    email: 'sarah.chen@example.sg',
    note: 'DOB 14 Feb 2001 · Standard learner rate (0% Concession)',
  },
];

function hashPassword(password: string, salt?: string) {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash, salt: actualSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
}

function maskNric(nric: string): string {
  const clean = nric.trim().toUpperCase();
  if (clean.length < 5) return clean;
  return `${clean[0]}****${clean.slice(-4)}`;
}

function isValidNric(nric: string): boolean {
  return /^[STFGM]\d{7}[A-Z]$/i.test(nric.trim());
}

function computeAge(dobStr: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dobStr.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const dob = new Date(Date.UTC(year, month - 1, day));
  if (
    Number.isNaN(dob.getTime()) ||
    dob.getUTCFullYear() !== year ||
    dob.getUTCMonth() !== month - 1 ||
    dob.getUTCDate() !== day
  ) {
    return null;
  }

  const now = new Date();
  let age = now.getUTCFullYear() - year;
  const currentMonth = now.getUTCMonth() + 1;
  const currentDay = now.getUTCDate();
  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age -= 1;
  }
  if (age < 12 || age > 115) return null;
  return age;
}

function checkExistingStudent(studentId?: string | null): { valid: boolean; normalized: string | null } {
  if (!studentId || !studentId.trim()) return { valid: false, normalized: null };
  const norm = studentId.trim().toUpperCase();
  if (VALID_ALUMNI_IDS.has(norm) || /^PR-202[0-6]-\d{3}$/.test(norm)) {
    return { valid: true, normalized: norm };
  }
  return { valid: false, normalized: null };
}

function computeConcession(dob: string, isExistingStudent: boolean, studentId: string | null) {
  const age = computeAge(dob) ?? 0;
  const isOver40 = age >= 40;
  const over40Rate = isOver40 ? 0.2 : 0;
  const existingStudentRate = isExistingStudent ? 0.15 : 0;
  let appliedRate = 0;
  let label = 'Standard Tuition Rate';

  if (isOver40 && isExistingStudent) {
    appliedRate = 0.3;
    label = 'Combined Over-40 & Existing Student Concession (30% Off)';
  } else if (isOver40) {
    appliedRate = 0.2;
    label = 'Over-40 Lifelong Learner Concession (20% Off)';
  } else if (isExistingStudent) {
    appliedRate = 0.15;
    label = 'Existing Student Alumni Concession (15% Off)';
  }

  return {
    age,
    isOver40,
    isExistingStudent,
    studentId,
    over40Rate,
    existingStudentRate,
    appliedRate,
    label,
  };
}

function signPayload(payload: object): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySignedPayload<T>(token: string): T | null {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return parsed as T;
  } catch {
    return null;
  }
}

function seedDefaultStore(): StoreState {
  const seededUsers: StoredUser[] = [
    (() => {
      const { hash, salt } = hashPassword('Pass1234!');
      return {
        id: 'usr_weiming',
        fullName: 'Tan Wei Ming',
        email: 'weiming.tan@example.sg',
        nricUpper: 'S8145920D',
        maskedNric: 'S****920D',
        dob: '1981-04-12',
        studentId: null,
        isExistingStudent: false,
        passwordHash: hash,
        passwordSalt: salt,
        singpassVerified: true,
        createdAt: '2026-10-02T08:15:00.000Z',
      };
    })(),
    (() => {
      const { hash, salt } = hashPassword('Pass1234!');
      return {
        id: 'usr_huiling',
        fullName: 'Lim Hui Ling',
        email: 'huiling.lim@example.sg',
        nricUpper: 'S9821345G',
        maskedNric: 'S****345G',
        dob: '1998-09-23',
        studentId: 'PR-2024-089',
        isExistingStudent: true,
        passwordHash: hash,
        passwordSalt: salt,
        singpassVerified: true,
        createdAt: '2026-09-14T11:30:00.000Z',
      };
    })(),
    (() => {
      const { hash, salt } = hashPassword('Pass1234!');
      return {
        id: 'usr_rajesh',
        fullName: 'Dr. Rajesh Nair',
        email: 'rajesh.nair@example.sg',
        nricUpper: 'S7833102B',
        maskedNric: 'S****102B',
        dob: '1978-07-08',
        studentId: 'PR-2023-104',
        isExistingStudent: true,
        passwordHash: hash,
        passwordSalt: salt,
        singpassVerified: true,
        createdAt: '2026-08-21T09:00:00.000Z',
      };
    })(),
  ];

  const seededOrders: StoredOrder[] = [
    {
      orderNumber: 'PR-2026-1018',
      userId: 'usr_huiling',
      planId: 'monthly',
      planName: 'Monthly Fellowship',
      billingBasis: 'monthly',
      termUnits: 3,
      unitLabel: 'month',
      unitPrice: 260,
      subtotal: 780,
      discountRate: 0.15,
      discountLabel: 'Existing Student Alumni Concession (15% Off)',
      discountAmount: 117,
      totalAmount: 663,
      learningMode: 'In-Person (Singapore)',
      startDate: '2026-10-01',
      paymentMethod: 'PayNow',
      billingPostalCode: '238801',
      billingAddress: '9 Penang Road, Singapore',
      status: 'Active',
      createdAt: '2026-09-14T11:42:00.000Z',
      verifiedAgeAtPurchase: 27,
    },
  ];

  return {
    users: seededUsers,
    orders: seededOrders,
    orderSeq: 1042,
  };
}

let storeCache: StoreState | null = null;

function loadStore(): StoreState {
  if (storeCache) return storeCache;
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      storeCache = JSON.parse(raw) as StoreState;
      return storeCache;
    }
  } catch {
    // Fall back to default seeded state
  }
  storeCache = seedDefaultStore();
  saveStore(storeCache);
  return storeCache;
}

function saveStore(state: StoreState): void {
  storeCache = state;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), 'utf8');
  } catch {
    // Keep operating cleanly in memory if filesystem is read-only
  }
}

function toPublicUser(user: StoredUser) {
  const concession = computeConcession(user.dob, user.isExistingStudent, user.studentId);
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    maskedNric: user.maskedNric,
    dob: user.dob,
    singpassVerified: user.singpassVerified,
    concession,
    createdAt: user.createdAt,
  };
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      result[k] = v;
    }
  }
  return result;
}

function getAuthenticatedUser(req: Request): StoredUser | null {
  const cookies = parseCookies(req);
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  const token = bearerToken || cookies.pr_session;
  if (!token) return null;

  const decoded = verifySignedPayload<{ userId: string; exp: number }>(token);
  if (!decoded?.userId) return null;

  const store = loadStore();
  return store.users.find((u) => u.id === decoded.userId) || null;
}

function issueSession(res: Response, user: StoredUser): string {
  const token = signPayload({
    userId: user.id,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  });
  res.cookie('pr_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });
  return token;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Catalog & metadata endpoint
  app.get('/api/catalog', (_req: Request, res: Response) => {
    res.json({
      plans: SUBSCRIPTION_PLANS,
      classes: UPCOMING_CLASSES,
      singpassPersonas: SINGPASS_PERSONAS,
      concessionRules: {
        over40Rate: 0.2,
        existingStudentRate: 0.15,
        combinedMaxRate: 0.3,
        over40Threshold: 40,
      },
    });
  });

  // Singpass Myinfo simulated OIDC verification endpoint with automated age verification
  app.post('/api/auth/singpass/verify', (req: Request, res: Response) => {
    const { fullName, nric, dob, studentId } = req.body as {
      fullName?: string;
      nric?: string;
      dob?: string;
      studentId?: string;
    };

    if (!fullName || !fullName.trim() || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Please provide your legal full name as registered in Singpass.' });
      return;
    }

    if (!nric || !isValidNric(nric)) {
      res.status(400).json({ error: 'Invalid NRIC/FIN format. Expected format e.g. S8145920D or T0129481J.' });
      return;
    }

    if (!dob) {
      res.status(400).json({ error: 'Date of Birth from Singpass Myinfo is required for age verification.' });
      return;
    }

    const age = computeAge(dob);
    if (age === null) {
      res.status(400).json({ error: 'Invalid Date of Birth. Please use YYYY-MM-DD for a valid learner age.' });
      return;
    }

    const nricUpper = nric.trim().toUpperCase();
    const maskedNric = maskNric(nricUpper);
    const studentCheck = checkExistingStudent(studentId);
    if (studentId && studentId.trim() && !studentCheck.valid) {
      res.status(400).json({
        error: 'Student ID not found in PR Academy Alumni Registry (try e.g. PR-2024-089 or leave blank if new).',
      });
      return;
    }

    const store = loadStore();
    const existingUser = store.users.find((u) => u.nricUpper === nricUpper);
    const effectiveExistingStudent = studentCheck.valid || Boolean(existingUser?.isExistingStudent);
    const effectiveStudentId = studentCheck.normalized || existingUser?.studentId || null;

    const concession = computeConcession(dob, effectiveExistingStudent, effectiveStudentId);

    const verificationToken = signPayload({
      type: 'singpass_assertion',
      fullName: fullName.trim(),
      nricUpper,
      maskedNric,
      dob: dob.trim(),
      studentId: effectiveStudentId,
      isExistingStudent: effectiveExistingStudent,
      exp: Date.now() + 1000 * 60 * 20,
    });

    res.json({
      verificationToken,
      fullName: fullName.trim(),
      maskedNric,
      nric: nricUpper,
      dob: dob.trim(),
      concession,
      existingAccountEmail: existingUser?.email,
      verifiedAt: new Date().toISOString(),
    });
  });

  // Complete registration using verified Singpass assertion token
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { verificationToken, email, password } = req.body as {
      verificationToken?: string;
      email?: string;
      password?: string;
    };

    if (!verificationToken) {
      res.status(400).json({ error: 'Singpass Myinfo verification is required before registering.' });
      return;
    }

    const assertion = verifySignedPayload<{
      type: string;
      fullName: string;
      nricUpper: string;
      maskedNric: string;
      dob: string;
      studentId: string | null;
      isExistingStudent: boolean;
    }>(verificationToken);

    if (!assertion || assertion.type !== 'singpass_assertion') {
      res.status(400).json({ error: 'Singpass verification expired or invalid. Please re-verify via Singpass.' });
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }

    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Please create a password of at least 8 characters.' });
      return;
    }

    const store = loadStore();
    const emailLower = email.trim().toLowerCase();

    if (store.users.some((u) => u.email.toLowerCase() === emailLower)) {
      res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
      return;
    }

    if (store.users.some((u) => u.nricUpper === assertion.nricUpper)) {
      res.status(409).json({ error: 'This Singpass NRIC is already registered. Please sign in with Singpass or password.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const newUser: StoredUser = {
      id: `usr_${crypto.randomUUID().slice(0, 8)}`,
      fullName: assertion.fullName,
      email: emailLower,
      nricUpper: assertion.nricUpper,
      maskedNric: assertion.maskedNric,
      dob: assertion.dob,
      studentId: assertion.studentId,
      isExistingStudent: assertion.isExistingStudent,
      passwordHash: hash,
      passwordSalt: salt,
      singpassVerified: true,
      createdAt: new Date().toISOString(),
    };

    store.users.push(newUser);
    saveStore(store);

    const sessionToken = issueSession(res, newUser);
    res.status(201).json({
      user: toPublicUser(newUser),
      orders: [],
      sessionToken,
    });
  });

  // Standard Login with Email or NRIC + Password
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password } = req.body as { identifier?: string; password?: string };
    if (!identifier || !password) {
      res.status(400).json({ error: 'Please enter your email or NRIC and password.' });
      return;
    }

    const norm = identifier.trim().toLowerCase();
    const store = loadStore();
    const user = store.users.find(
      (u) => u.email.toLowerCase() === norm || u.nricUpper.toLowerCase() === norm
    );

    if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      res.status(401).json({ error: 'Incorrect credentials. Check your email/NRIC and password.' });
      return;
    }

    const sessionToken = issueSession(res, user);
    const orders = store.orders.filter((o) => o.userId === user.id);
    res.json({
      user: toPublicUser(user),
      orders,
      sessionToken,
    });
  });

  // Quick Sign-In via verified Singpass token (for returning Singpass learners)
  app.post('/api/auth/singpass/login', (req: Request, res: Response) => {
    const { verificationToken } = req.body as { verificationToken?: string };
    if (!verificationToken) {
      res.status(400).json({ error: 'Missing Singpass assertion token.' });
      return;
    }

    const assertion = verifySignedPayload<{
      type: string;
      nricUpper: string;
      dob: string;
      studentId: string | null;
      isExistingStudent: boolean;
    }>(verificationToken);

    if (!assertion || assertion.type !== 'singpass_assertion') {
      res.status(400).json({ error: 'Singpass assertion invalid or expired.' });
      return;
    }

    const store = loadStore();
    const user = store.users.find((u) => u.nricUpper === assertion.nricUpper);
    if (!user) {
      res.status(404).json({
        error: 'No existing PR Academy account linked to this NRIC yet. Complete step 2 to finish registering.',
        needsRegistration: true,
      });
      return;
    }

    // Update student status if newly verified during Singpass sign-in
    if (assertion.isExistingStudent && !user.isExistingStudent) {
      user.isExistingStudent = true;
      user.studentId = assertion.studentId;
      saveStore(store);
    }

    const sessionToken = issueSession(res, user);
    const orders = store.orders.filter((o) => o.userId === user.id);
    res.json({
      user: toPublicUser(user),
      orders,
      sessionToken,
    });
  });

  // Link Existing Student ID for logged-in user
  app.post('/api/auth/verify-student', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ error: 'Please sign in first.' });
      return;
    }

    const { studentId } = req.body as { studentId?: string };
    const check = checkExistingStudent(studentId);
    if (!check.valid || !check.normalized) {
      res.status(400).json({
        error: 'Student ID could not be verified in the PR Academy Alumni Registry (e.g. PR-2024-089).',
      });
      return;
    }

    const store = loadStore();
    const target = store.users.find((u) => u.id === user.id);
    if (!target) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    target.isExistingStudent = true;
    target.studentId = check.normalized;
    saveStore(store);

    res.json({ user: toPublicUser(target) });
  });

  // Current Session
  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.json({ user: null, orders: [] });
      return;
    }
    const store = loadStore();
    const orders = store.orders.filter((o) => o.userId === user.id);
    res.json({ user: toPublicUser(user), orders });
  });

  // Logout
  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.clearCookie('pr_session', { path: '/' });
    res.json({ ok: true });
  });

  // Checkout & Subscription Enrollment
  app.post('/api/checkout', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({
        error: 'Singpass-verified account required to complete subscription checkout.',
      });
      return;
    }

    const {
      planId,
      termUnits,
      learningMode,
      startDate,
      paymentMethod,
      cardNumber,
      cardExpiry,
      cardCvc,
      billingPostalCode,
      billingAddress,
    } = req.body as {
      planId?: PlanId;
      termUnits?: number;
      learningMode?: 'In-Person (Singapore)' | 'Live Interactive Stream';
      startDate?: string;
      paymentMethod?: 'Card' | 'PayNow';
      cardNumber?: string;
      cardExpiry?: string;
      cardCvc?: string;
      billingPostalCode?: string;
      billingAddress?: string;
    };

    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId);
    if (!plan) {
      res.status(400).json({ error: 'Please select a valid subscription plan.' });
      return;
    }

    const units = Number(termUnits);
    if (!Number.isInteger(units) || units < plan.minUnits || units > plan.maxUnits) {
      res.status(400).json({
        error: `${plan.name} requires between ${plan.minUnits} and ${plan.maxUnits} ${plan.unitLabel}(s).`,
      });
      return;
    }

    if (!billingPostalCode || !/^\d{5,6}$/.test(billingPostalCode.trim())) {
      res.status(400).json({ error: 'Please enter a valid 6-digit Singapore postal code.' });
      return;
    }

    if (!billingAddress || billingAddress.trim().length < 5) {
      res.status(400).json({ error: 'Please enter your billing street address.' });
      return;
    }

    const method = paymentMethod === 'PayNow' ? 'PayNow' : 'Card';
    let paymentLast4: string | undefined;

    if (method === 'Card') {
      const digits = (cardNumber || '').replace(/\s+/g, '');
      if (!/^\d{13,19}$/.test(digits)) {
        res.status(400).json({ error: 'Please enter a valid card number.' });
        return;
      }
      if (!cardExpiry || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim())) {
        res.status(400).json({ error: 'Please enter card expiry in MM/YY format.' });
        return;
      }
      if (!cardCvc || !/^\d{3,4}$/.test(cardCvc.trim())) {
        res.status(400).json({ error: 'Please enter a valid 3 or 4 digit security code.' });
        return;
      }
      paymentLast4 = digits.slice(-4);
    }

    const concession = computeConcession(user.dob, user.isExistingStudent, user.studentId);
    const subtotal = plan.unitPrice * units;
    const discountAmount = Math.round(subtotal * concession.appliedRate * 100) / 100;
    const totalAmount = Math.round((subtotal - discountAmount) * 100) / 100;

    const store = loadStore();
    store.orderSeq += 1;
    const orderNumber = `PR-2026-${store.orderSeq}`;

    const newOrder: StoredOrder = {
      orderNumber,
      userId: user.id,
      planId: plan.id,
      planName: plan.name,
      billingBasis: plan.billingBasis,
      termUnits: units,
      unitLabel: plan.unitLabel,
      unitPrice: plan.unitPrice,
      subtotal,
      discountRate: concession.appliedRate,
      discountLabel: concession.label,
      discountAmount,
      totalAmount,
      learningMode:
        learningMode === 'Live Interactive Stream'
          ? 'Live Interactive Stream'
          : 'In-Person (Singapore)',
      startDate: startDate || new Date().toISOString().slice(0, 10),
      paymentMethod: method,
      paymentLast4,
      billingPostalCode: billingPostalCode.trim(),
      billingAddress: billingAddress.trim(),
      status: 'Active',
      createdAt: new Date().toISOString(),
      verifiedAgeAtPurchase: concession.age,
    };

    store.orders.unshift(newOrder);
    saveStore(store);

    res.status(201).json({ order: newOrder });
  });

  // Healthcheck
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'An unexpected server error occurred.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PR Academy server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
