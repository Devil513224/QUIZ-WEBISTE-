/**
 * Phase 0 Payload-First Security Test Suite Specification
 * Verifies the Dirty Dozen adversarial payloads against firestore.rules invariants.
 */

export interface DirtyDozenCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid?: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_PAYLOADS: DirtyDozenCase[] = [
  {
    id: 1,
    name: 'Unauthenticated question injection',
    collectionPath: 'questions/q_hack',
    operation: 'create',
    auth: null,
    payload: { id: 'q_hack', question: 'Hack?', published: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Student creating mock test',
    collectionPath: 'tests/t_fake',
    operation: 'create',
    auth: { uid: 'student1', email: 'student@example.com', email_verified: true },
    payload: { id: 't_fake', name: 'Fake Test', published: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Student modifying study material PDF',
    collectionPath: 'materials/m1',
    operation: 'update',
    auth: { uid: 'student1', email: 'student@example.com', email_verified: true },
    payload: { pdfUrl: 'https://evil.example/payload.pdf' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Unverified email spoofing admin account',
    collectionPath: 'banners/b1',
    operation: 'update',
    auth: { uid: 'spoof1', email: 'tanmaypc2006@gmail.com', email_verified: false },
    payload: { title: 'Spoofed Banner' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Public list query attempting to fetch draft questions',
    collectionPath: 'questions',
    operation: 'list',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Cross-user PII read on usersPrivate',
    collectionPath: 'usersPrivate/studentB',
    operation: 'get',
    auth: { uid: 'studentA', email: 'a@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Self-assigned admin elevation',
    collectionPath: 'admins/studentA',
    operation: 'create',
    auth: { uid: 'studentA', email: 'a@example.com', email_verified: true },
    payload: { uid: 'studentA', email: 'a@example.com', role: 'admin' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Shadow field injection on usersPublic',
    collectionPath: 'usersPublic/studentA',
    operation: 'create',
    auth: { uid: 'studentA', email: 'a@example.com', email_verified: true },
    payload: {
      uid: 'studentA',
      displayName: 'Student A',
      targetExam: 'SSC',
      preferredLang: 'English',
      status: 'Active',
      points: 0,
      isAdmin: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Suspended student attempting self-unsuspend',
    collectionPath: 'usersPublic/studentA',
    operation: 'update',
    auth: { uid: 'studentA', email: 'a@example.com', email_verified: true },
    payload: { status: 'Active' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Oversized/invalid document ID poisoning',
    collectionPath: `usersPublic/${'x'.repeat(200)}`,
    operation: 'create',
    auth: { uid: 'studentA', email: 'a@example.com', email_verified: true },
    payload: { uid: 'studentA', displayName: 'Student A' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Client-forged createdAt timestamp',
    collectionPath: 'usersPublic/studentA',
    operation: 'create',
    auth: { uid: 'studentA', email: 'a@example.com', email_verified: true },
    payload: {
      uid: 'studentA',
      displayName: 'Student A',
      createdAt: '2020-01-01T00:00:00Z',
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Non-admin reading or writing activityLogs',
    collectionPath: 'activityLogs',
    operation: 'list',
    auth: { uid: 'studentA', email: 'a@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
];
