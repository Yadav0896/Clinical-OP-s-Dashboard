// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Maya PA Platform — API Helper Functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const BASE = '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── Dashboard ──
export interface DashboardStats {
  overview: {
    totalPatients: number;
    totalSubmissions: number;
    totalDocuments: number;
    totalUsers: number;
    avgDaysToDecision: number;
    approvalRate: number;
  };
  submissions: {
    byStage: Record<string, number>;
    byDrug: Record<string, number>;
    byPayer: Record<string, number>;
    recentCount: number;
    urgentCount: number;
    pendingCount: number;
  };
  documents: { byStatus: Record<string, number> };
  stages: Record<string, number>;
}

export function fetchDashboardStats() {
  return request<DashboardStats>('/api/dashboard/stats');
}

// ── Patients ──
export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  mrn?: string;
  memberId?: string;
  payerId?: string;
  payerName?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string;
  diagnosisNotes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { submissions: number; biomarkers: number };
  biomarkers?: Biomarker[];
  submissions?: Submission[];
}

export interface Biomarker {
  id: string;
  patientId: string;
  type: string;
  value: number;
  unit?: string;
  dateCollected: string;
  notes?: string;
  createdAt: string;
}

export function fetchPatients(search = '', page = 1, limit = 20) {
  const params = new URLSearchParams({ search, page: String(page), limit: String(limit) });
  return request<{ patients: Patient[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/patients?${params}`);
}

export function fetchPatient(id: string) {
  return request<Patient & { biomarkers: Biomarker[]; submissions: Submission[] }>(`/api/patients/${id}`);
}

export function createPatient(data: Record<string, unknown>) {
  return request<Patient>('/api/patients', { method: 'POST', body: JSON.stringify(data) });
}

export function addBiomarker(patientId: string, data: Record<string, unknown>) {
  return request<Biomarker>(`/api/patients/${patientId}/biomarkers`, { method: 'POST', body: JSON.stringify(data) });
}

// ── Submissions ──
export interface Submission {
  id: string;
  patientId: string;
  createdById?: string;
  drugId: string;
  drugName: string;
  indicationId: string;
  indication: string;
  payerId: string;
  payerName: string;
  icd10Code?: string;
  icd10Desc?: string;
  stage: string;
  priority: string;
  gapCheckResult?: string;
  docCheckResult?: string;
  icd10Validation?: string;
  aiVerdict?: string;
  aiNotes?: string;
  denialReason?: string;
  denialDate?: string;
  appealResult?: string;
  appealDate?: string;
  appealStatus?: string;
  submittedDate?: string;
  approvedDate?: string;
  deniedDate?: string;
  closedDate?: string;
  daysToDecision?: number;
  externalId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patient?: { id: string; firstName: string; lastName: string; mrn?: string; dateOfBirth?: string };
  createdBy?: { id: string; name: string; role: string };
  _count?: { documents: number; timeline: number };
  documents?: SubmissionDocument[];
  timeline?: TimelineEvent[];
  auditLogs?: AuditLog[];
}

export interface SubmissionDocument {
  id: string;
  submissionId: string;
  type: string;
  name: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  category: string;
  status: string;
  notes?: string;
  uploadedById?: string;
  uploadedAt: string;
}

export interface TimelineEvent {
  id: string;
  submissionId: string;
  event: string;
  description: string;
  metadata?: string;
  userId?: string;
  createdAt: string;
}

export function fetchSubmissions(stage?: string, page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (stage && stage !== 'all') params.set('stage', stage);
  return request<{ submissions: Submission[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/submissions?${params}`);
}

export function fetchSubmission(id: string) {
  return request<Submission>(`/api/submissions/${id}`);
}

export function createSubmission(data: Record<string, unknown>) {
  return request<Submission>('/api/submissions', { method: 'POST', body: JSON.stringify(data) });
}

export function updateSubmission(id: string, data: Record<string, unknown>) {
  return request<Submission>(`/api/submissions/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export function updateSubmissionStage(id: string, stage: string, userId?: string) {
  return request<Submission>(`/api/submissions/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage, userId }) });
}

export function fetchSubmissionDocuments(id: string) {
  return request<SubmissionDocument[]>(`/api/submissions/${id}/documents`);
}

// ── Audit Logs ──
export interface AuditLog {
  id: string;
  userId?: string;
  submissionId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user?: { id: string; name: string; email: string; role: string };
  submission?: { id: string; drugName: string; stage: string };
}

export function fetchAuditLogs(params: { page?: number; limit?: number; action?: string; entity?: string; userId?: string } = {}) {
  const searchParams = new URLSearchParams({
    page: String(params.page || 1),
    limit: String(params.limit || 50),
  });
  if (params.action) searchParams.set('action', params.action);
  if (params.entity) searchParams.set('entity', params.entity);
  if (params.userId) searchParams.set('userId', params.userId);
  return request<{ auditLogs: AuditLog[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/audit-logs?${searchParams}`);
}

// ── AI Tools ──
export interface ResearchMeta {
  sourcesUsed: number;
  researchTimeMs: number;
  sources: { name: string; url: string }[];
}

export interface ICD10Result {
  valid: boolean;
  message: string;
  validCodes?: { code: string; desc: string }[];
  rejectionReason?: string;
  aiAnalysis?: string;
  kbResult?: { valid: boolean; message: string };
  research?: ResearchMeta;
}

export function validateICD10(data: { drugId: string; indicationId: string; payerId: string; code: string }) {
  return request<ICD10Result>('/api/validate-icd10', { method: 'POST', body: JSON.stringify(data) });
}

export interface DocRecommendation {
  name: string;
  required: boolean;
  rationale?: string;
  tag?: string;
}

export interface DocRecommendResult {
  documents: DocRecommendation[];
  required: DocRecommendation[];
  optional: DocRecommendation[];
  totalDocs: number;
  requiredCount: number;
  aiAnalysis?: string;
  kbResult?: { documents: DocRecommendation[]; requiredCount: number };
  research?: ResearchMeta;
}

export function recommendDocs(data: { drugId: string; indicationId: string; payerId: string; submissionId?: string }) {
  return request<DocRecommendResult>('/api/recommend-docs', { method: 'POST', body: JSON.stringify(data) });
}

export interface GapCheckResult {
  verdict: string;
  message: string;
  gaps: { severity: string; title: string; detail: string; action?: string }[];
  criticalCount: number;
  warningCount: number;
  passCount: number;
  aiAnalysis?: string;
  kbResult?: { verdict: string; criticalCount: number; warningCount: number };
  research?: ResearchMeta;
}

export function checkGaps(data: { drugId: string; indicationId: string; payerId: string; patientData?: Record<string, unknown> }) {
  return request<GapCheckResult>('/api/check-gaps', { method: 'POST', body: JSON.stringify(data) });
}

export interface AppealResult {
  appeal: { denialReason: string; strategy: string; citations: string[]; letterTemplate?: string };
  letter: string;
  citations: string[];
  aiAnalysis?: string;
  kbResult?: { strategy: string; citations: string[] };
  research?: ResearchMeta;
}

export function generateAppeal(data: { drugId: string; indicationId: string; payerId: string; denialReason: string; patientData?: Record<string, unknown> }) {
  return request<AppealResult>('/api/generate-appeal', { method: 'POST', body: JSON.stringify(data) });
}
