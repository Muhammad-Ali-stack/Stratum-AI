export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface SalesforceConnection {
  id: string;
  user_id: string;
  instance_url: string;
  sf_user_id: string | null;
  sf_org_id: string | null;
  identity_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface PendingAction {
  type: 'create' | 'update';
  object: SalesforceObject;
  fields: Record<string, unknown>;
  recordId?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: MessageMetadata;
  created_at: string;
}

export interface MessageMetadata {
  ai_model?: string;
  sf_object?: string;
  sf_operation?: string;
  api_calls?: SalesforceApiCall[];
  error?: string;
  processing_time_ms?: number;
  pending_action?: PendingAction;
}

export interface SalesforceApiCall {
  object: string;
  operation: 'query' | 'create' | 'update' | 'delete';
  soql?: string;
  record_id?: string;
}

export interface UserSettings {
  user_id: string;
  preferred_ai_model: string;
  show_api_transparency: boolean;
  notify_daily_digest: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
}

export type SalesforceObject =
  | 'Lead'
  | 'Contact'
  | 'Account'
  | 'Opportunity'
  | 'Task'
  | 'Case';

export interface SalesforceRecord {
  Id: string;
  [key: string]: unknown;
}

export interface SalesforceQueryResult {
  totalSize: number;
  done: boolean;
  records: SalesforceRecord[];
}

export interface ChatRequest {
  content: string;
  conversation_id?: string;
}

export interface ChatResponse {
  message: Message;
  conversation: Conversation;
  transparency?: TransparencyInfo;
}

export interface TransparencyInfo {
  ai_model: string;
  sf_object?: string;
  sf_operation?: string;
  api_calls?: SalesforceApiCall[];
  processing_time_ms: number;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStageRow {
  stage: string;
  count: number;
  value: number;
}

export interface DashboardClosingSoon {
  id: string;
  name: string;
  amount: number | null;
  closeDate: string;
  stage: string;
  account: string | null;
}

export interface DashboardActivity {
  id: string;
  subject: string;
  status: string;
  priority: string;
  date: string | null;
}

export interface DashboardCaseStatus {
  status: string;
  count: number;
}

export interface DashboardStats {
  connected: true;
  pipelineValue: number;
  openOpportunities: number;
  newLeadsThisMonth: number;
  winRate: number | null;
  byStage: DashboardStageRow[];
  closingSoon: DashboardClosingSoon[];
  recentActivity: DashboardActivity[];
  casesByStatus: DashboardCaseStatus[];
  lastRefreshed: string;
  errors: {
    opps: string | null;
    leads: string | null;
    tasks: string | null;
    cases: string | null;
  };
}

export type DashboardResponse = DashboardStats | { connected: false };

// ─── Pipeline ────────────────────────────────────────────────────────────────

export interface PipelineOpportunity {
  id: string;
  name: string;
  account: string | null;
  amount: number | null;
  closeDate: string;
  probability: number | null;
  stage: string;
}

export interface PipelineStage {
  name: string;
  count: number;
  totalValue: number;
  opportunities: PipelineOpportunity[];
}

export interface PipelineData {
  connected: true;
  stages: PipelineStage[];
  totalPipelineValue: number;
  totalOpportunities: number;
}

export type PipelineResponse = PipelineData | { connected: false };

// ─── Dashboard Search ──────────────────────────────────────────────────────────

export interface SearchLead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  status: string;
}

export interface SearchContact {
  id: string;
  name: string;
  email: string | null;
  title: string | null;
  account: string | null;
}

export interface SearchAccount {
  id: string;
  name: string;
  type: string | null;
  industry: string | null;
  annualRevenue: number | null;
}

export interface SearchResults {
  connected: boolean;
  leads: SearchLead[];
  contacts: SearchContact[];
  accounts: SearchAccount[];
  total: number;
}
