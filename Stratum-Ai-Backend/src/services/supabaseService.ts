import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../lib/supabase.js';
import { requireSupabase } from '../lib/supabase.js';
import { AppError } from '../middleware/errorHandler.js';
import type {
  User,
  SalesforceConnection,
  Conversation,
  Message,
  UserSettings,
  MessageMetadata,
} from '../types/shared.js';

const SALT_ROUNDS = 12;

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createUser(email: string, password: string): Promise<User> {
  requireSupabase();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({ email: email.toLowerCase().trim(), password_hash: passwordHash })
    .select('id, email, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new AppError(409, 'An account with this email already exists');
    }
    throw new AppError(500, 'Failed to create user account');
  }

  await supabaseAdmin
    .from('user_settings')
    .insert({ user_id: data.id })
    .throwOnError();

  return data as User;
}

export async function findUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  requireSupabase();
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, password_hash, created_at, updated_at')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new AppError(500, 'Database query failed');
  }

  return data as User & { password_hash: string };
}

export async function findUserById(id: string): Promise<User | null> {
  requireSupabase();
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, email, created_at, updated_at')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new AppError(500, 'Database query failed');
  }

  return data as User;
}

export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}

// ─── Salesforce Connections ────────────────────────────────────────────────────

export async function upsertSalesforceConnection(params: {
  userId: string;
  instanceUrl: string;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  tokenType: string;
  issuedAt: number | null;
  identityUrl: string | null;
  sfUserId: string | null;
  sfOrgId: string | null;
}): Promise<void> {
  requireSupabase();
  const { error } = await supabaseAdmin.from('salesforce_connections').upsert(
    {
      user_id: params.userId,
      instance_url: params.instanceUrl,
      access_token_enc: params.accessTokenEnc,
      refresh_token_enc: params.refreshTokenEnc,
      token_type: params.tokenType,
      issued_at: params.issuedAt,
      identity_url: params.identityUrl,
      sf_user_id: params.sfUserId,
      sf_org_id: params.sfOrgId,
    },
    { onConflict: 'user_id' },
  );

  if (error) throw new AppError(500, 'Failed to save Salesforce connection');
}

export async function getSalesforceConnection(userId: string): Promise<SalesforceConnection | null> {
  requireSupabase();
  const { data, error } = await supabaseAdmin
    .from('salesforce_connections')
    .select('id, user_id, instance_url, sf_user_id, sf_org_id, identity_url, created_at, updated_at')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new AppError(500, 'Database query failed');
  }

  return data as SalesforceConnection;
}

export async function getSalesforceTokens(userId: string): Promise<{
  instanceUrl: string;
  accessTokenEnc: string;
  refreshTokenEnc: string;
} | null> {
  requireSupabase();
  const { data, error } = await supabaseAdmin
    .from('salesforce_connections')
    .select('instance_url, access_token_enc, refresh_token_enc')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new AppError(500, 'Database query failed');
  }

  return {
    instanceUrl: data.instance_url as string,
    accessTokenEnc: data.access_token_enc as string,
    refreshTokenEnc: data.refresh_token_enc as string,
  };
}

export async function updateSalesforceAccessToken(userId: string, accessTokenEnc: string): Promise<void> {
  requireSupabase();
  const { error } = await supabaseAdmin
    .from('salesforce_connections')
    .update({ access_token_enc: accessTokenEnc })
    .eq('user_id', userId);

  if (error) throw new AppError(500, 'Failed to update Salesforce access token');
}

export async function deleteSalesforceConnection(userId: string): Promise<void> {
  requireSupabase();
  const { error } = await supabaseAdmin
    .from('salesforce_connections')
    .delete()
    .eq('user_id', userId);

  if (error) throw new AppError(500, 'Failed to remove Salesforce connection');
}

// ─── Conversations ─────────────────────────────────────────────────────────────

export async function createConversation(userId: string, title?: string): Promise<Conversation> {
  requireSupabase();
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .insert({ user_id: userId, title: title ?? null })
    .select()
    .single();

  if (error) throw new AppError(500, 'Failed to create conversation');
  return data as Conversation;
}

export async function getConversations(userId: string): Promise<Conversation[]> {
  requireSupabase();
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new AppError(500, 'Failed to fetch conversations');
  return data as Conversation[];
}

export async function getConversationById(id: string, userId: string): Promise<Conversation | null> {
  requireSupabase();
  const { data, error } = await supabaseAdmin
    .from('conversations')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new AppError(500, 'Database query failed');
  }

  return data as Conversation;
}

export async function updateConversationTitle(id: string, userId: string, title: string): Promise<void> {
  requireSupabase();
  const { error } = await supabaseAdmin
    .from('conversations')
    .update({ title })
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new AppError(500, 'Failed to update conversation title');
}

export async function deleteConversation(id: string, userId: string): Promise<void> {
  requireSupabase();
  const { error } = await supabaseAdmin
    .from('conversations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw new AppError(500, 'Failed to delete conversation');
}

// ─── Messages ──────────────────────────────────────────────────────────────────

export async function createMessage(params: {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: MessageMetadata;
}): Promise<Message> {
  requireSupabase();
  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      conversation_id: params.conversationId,
      role: params.role,
      content: params.content,
      metadata: params.metadata ?? {},
    })
    .select()
    .single();

  if (error) throw new AppError(500, 'Failed to save message');
  return data as Message;
}

export async function getMessages(conversationId: string, userId: string): Promise<Message[]> {
  requireSupabase();
  const { data: conversation } = await supabaseAdmin
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .eq('user_id', userId)
    .single();

  if (!conversation) throw new AppError(404, 'Conversation not found');

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new AppError(500, 'Failed to fetch messages');
  return data as Message[];
}

// ─── User Settings ─────────────────────────────────────────────────────────────

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  requireSupabase();
  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new AppError(500, 'Failed to fetch settings');
  }

  return data as UserSettings;
}

export async function updateUserSettings(
  userId: string,
  updates: Partial<Pick<UserSettings, 'preferred_ai_model' | 'show_api_transparency' | 'notify_daily_digest'>>,
): Promise<UserSettings> {
  requireSupabase();
  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new AppError(500, 'Failed to update settings');
  return data as UserSettings;
}
