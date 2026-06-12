import axios, { AxiosError } from 'axios';
import type {
  User,
  SalesforceConnection,
  Conversation,
  Message,
  UserSettings,
  ChatResponse,
  DashboardResponse,
  SearchResults,
} from '../types/shared';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60_000,
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: string; message?: string }>) => {
    const message =
      err.response?.data?.error ??
      err.response?.data?.message ??
      err.message ??
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  success: boolean;
  data: { user: Pick<User, 'id' | 'email' | 'created_at'> };
}

// ── Mock auth (no-backend fallback) ──────────────────────────────────────────
export const MOCK_EMAIL    = 'demo@stratum.ai';
export const MOCK_PASSWORD = 'demo1234';
const MOCK_SESSION_KEY     = 'stratum-mock-session';

const MOCK_USER: User = {
  id: 'mock-user-001',
  email: MOCK_EMAIL,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: new Date().toISOString(),
};

function getMockSession(): User | null {
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch { return null; }
}

function setMockSession(user: User): void {
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(user));
}

function clearMockSession(): void {
  localStorage.removeItem(MOCK_SESSION_KEY);
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, password });
    return data;
  } catch {
    // Mock fallback: accept any registration when backend is offline
    const user = { ...MOCK_USER, email, updated_at: new Date().toISOString() };
    setMockSession(user);
    return { success: true, data: { user } };
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return data;
  } catch {
    // Mock fallback: only accept the demo credentials
    if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
      setMockSession(MOCK_USER);
      return { success: true, data: { user: MOCK_USER } };
    }
    throw new Error('Invalid credentials. Use demo@stratum.ai / demo1234 to try the demo.');
  }
}

export async function logout(): Promise<void> {
  clearMockSession();
  try { await api.post('/auth/logout'); } catch { /* offline — session cleared locally */ }
}

export async function getMe(): Promise<User> {
  try {
    const { data } = await api.get<{ success: boolean; data: { user: User } }>('/auth/me');
    return data.data.user;
  } catch {
    const mock = getMockSession();
    if (mock) return mock;
    throw new Error('Not authenticated');
  }
}

// ─── Salesforce ────────────────────────────────────────────────────────────────

export interface SalesforceStatusResponse {
  connected: boolean;
  connection: SalesforceConnection | null;
}

export async function getSalesforceConnectUrl(): Promise<string> {
  const { data } = await api.get<{ success: boolean; data: { url: string } }>('/salesforce/connect');
  return data.data.url;
}

export async function getSalesforceStatus(): Promise<SalesforceStatusResponse> {
  const { data } = await api.get<{ success: boolean; data: SalesforceStatusResponse }>('/salesforce/status');
  return data.data;
}

export async function disconnectSalesforce(): Promise<void> {
  await api.delete('/salesforce/disconnect');
}

// ─── Chat ──────────────────────────────────────────────────────────────────────

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get<{ success: boolean; data: { conversations: Conversation[] } }>('/chat/conversations');
  return data.data.conversations;
}

export async function createConversation(): Promise<Conversation> {
  const { data } = await api.post<{ success: boolean; data: { conversation: Conversation } }>('/chat/conversations');
  return data.data.conversation;
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  const { data } = await api.get<{ success: boolean; data: { messages: Message[] } }>(
    `/chat/conversations/${conversationId}/messages`,
  );
  return data.data.messages;
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  await api.patch(`/chat/conversations/${id}`, { title });
}

export async function deleteConversation(id: string): Promise<void> {
  await api.delete(`/chat/conversations/${id}`);
}

export async function sendMessage(content: string, conversationId?: string): Promise<ChatResponse> {
  const { data } = await api.post<{ success: boolean; data: ChatResponse }>('/chat/send', {
    content,
    conversation_id: conversationId,
  });
  return data.data;
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardResponse> {
  const { data } = await api.get<{ success: boolean; data: DashboardResponse }>('/dashboard/stats');
  return data.data;
}

export async function searchCRM(q: string): Promise<SearchResults> {
  const { data } = await api.get<{ success: boolean; data: SearchResults }>('/dashboard/search', {
    params: { q },
  });
  return data.data;
}

// ─── Settings ──────────────────────────────────────────────────────────────────

export interface SettingsResponse {
  settings: UserSettings;
  availableModels: string[];
}

export async function getSettings(): Promise<SettingsResponse> {
  const { data } = await api.get<{ success: boolean; data: SettingsResponse }>('/settings');
  return data.data;
}

export async function updateSettings(
  updates: Partial<Pick<UserSettings, 'preferred_ai_model' | 'show_api_transparency'>>,
): Promise<UserSettings> {
  const { data } = await api.patch<{ success: boolean; data: { settings: UserSettings } }>('/settings', updates);
  return data.data.settings;
}
