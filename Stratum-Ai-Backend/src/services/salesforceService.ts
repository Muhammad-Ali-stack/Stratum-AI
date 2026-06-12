import axios, { AxiosInstance } from 'axios';
import { config } from '../config/index.js';
import { encrypt, decrypt } from '../lib/crypto.js';
import { logger } from '../lib/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  getSalesforceTokens,
  upsertSalesforceConnection,
  updateSalesforceAccessToken,
} from './supabaseService.js';
import type { SalesforceQueryResult, SalesforceRecord } from '../types/shared.js';

const SF_AUTH_BASE = 'https://login.salesforce.com';
const SF_API_VERSION = 'v59.0';

export interface SalesforceTokenResponse {
  access_token: string;
  refresh_token: string;
  instance_url: string;
  token_type: string;
  issued_at: string;
  id: string;
  scope?: string;
}

export function buildOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.SALESFORCE_CLIENT_ID,
    redirect_uri: config.SALESFORCE_REDIRECT_URI,
    scope: 'full refresh_token',
    state,
  });
  return `${SF_AUTH_BASE}/services/oauth2/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<SalesforceTokenResponse> {
  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.SALESFORCE_CLIENT_ID,
      client_secret: config.SALESFORCE_CLIENT_SECRET,
      redirect_uri: config.SALESFORCE_REDIRECT_URI,
      code,
    });

    const { data } = await axios.post<SalesforceTokenResponse>(
      `${SF_AUTH_BASE}/services/oauth2/token`,
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return data;
  } catch (err) {
    logger.error({ err }, 'Salesforce token exchange failed');
    throw new AppError(502, 'Failed to exchange Salesforce authorization code');
  }
}

async function refreshAccessToken(userId: string, refreshTokenEnc: string, instanceUrl: string): Promise<string> {
  try {
    const refreshToken = decrypt(refreshTokenEnc);
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: config.SALESFORCE_CLIENT_ID,
      client_secret: config.SALESFORCE_CLIENT_SECRET,
      refresh_token: refreshToken,
    });

    const { data } = await axios.post<{ access_token: string }>(
      `${instanceUrl}/services/oauth2/token`,
      params.toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const newTokenEnc = encrypt(data.access_token);
    await updateSalesforceAccessToken(userId, newTokenEnc);

    logger.info({ userId }, 'Salesforce access token refreshed');
    return data.access_token;
  } catch (err) {
    logger.error({ err, userId }, 'Salesforce token refresh failed');
    throw new AppError(401, 'Salesforce session expired. Please reconnect your Salesforce org.');
  }
}

async function getSalesforceClient(userId: string): Promise<{ client: AxiosInstance; instanceUrl: string }> {
  const tokens = await getSalesforceTokens(userId);

  if (!tokens) {
    throw new AppError(400, 'No Salesforce connection found. Please connect your Salesforce org first.');
  }

  let accessToken: string;
  try {
    accessToken = decrypt(tokens.accessTokenEnc);
  } catch {
    throw new AppError(500, 'Failed to decrypt Salesforce credentials');
  }

  const client = axios.create({
    baseURL: `${tokens.instanceUrl}/services/data/${SF_API_VERSION}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    timeout: 30_000,
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        const newToken = await refreshAccessToken(userId, tokens.refreshTokenEnc, tokens.instanceUrl);
        if (axios.isAxiosError(error) && error.config) {
          error.config.headers['Authorization'] = `Bearer ${newToken}`;
          return axios.request(error.config);
        }
      }
      return Promise.reject(error);
    },
  );

  return { client, instanceUrl: tokens.instanceUrl };
}

export async function storeSalesforceConnection(
  userId: string,
  tokenResponse: SalesforceTokenResponse,
): Promise<void> {
  let sfUserId: string | null = null;
  let sfOrgId: string | null = null;

  try {
    const identityRes = await axios.get<{ user_id: string; organization_id: string }>(
      tokenResponse.id,
      { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } },
    );
    sfUserId = identityRes.data.user_id ?? null;
    sfOrgId = identityRes.data.organization_id ?? null;
  } catch (err) {
    logger.warn({ err }, 'Failed to fetch Salesforce identity info');
  }

  await upsertSalesforceConnection({
    userId,
    instanceUrl: tokenResponse.instance_url,
    accessTokenEnc: encrypt(tokenResponse.access_token),
    refreshTokenEnc: encrypt(tokenResponse.refresh_token),
    tokenType: tokenResponse.token_type,
    issuedAt: tokenResponse.issued_at ? Number(tokenResponse.issued_at) : null,
    identityUrl: tokenResponse.id,
    sfUserId,
    sfOrgId,
  });
}

export async function querySalesforce(userId: string, soql: string): Promise<SalesforceQueryResult> {
  const { client } = await getSalesforceClient(userId);

  try {
    const { data } = await client.get<SalesforceQueryResult>('/query', {
      params: { q: soql },
    });
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const sfErrors = err.response?.data as Array<{ message: string; errorCode: string }> | undefined;
      const sfMsg = sfErrors?.[0]?.message ?? err.message;
      throw new AppError(err.response?.status ?? 502, `Salesforce query failed: ${sfMsg}`);
    }
    throw new AppError(502, 'Salesforce query failed');
  }
}

export async function createSalesforceRecord(
  userId: string,
  objectName: string,
  fields: Record<string, unknown>,
): Promise<{ id: string; success: boolean }> {
  const { client } = await getSalesforceClient(userId);

  try {
    const { data } = await client.post<{ id: string; success: boolean }>(
      `/sobjects/${objectName}`,
      fields,
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const sfErrors = err.response?.data as Array<{ message: string }> | undefined;
      const sfMsg = sfErrors?.[0]?.message ?? err.message;
      throw new AppError(err.response?.status ?? 502, `Failed to create ${objectName}: ${sfMsg}`);
    }
    throw new AppError(502, `Failed to create ${objectName} record`);
  }
}

export async function updateSalesforceRecord(
  userId: string,
  objectName: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<void> {
  const { client } = await getSalesforceClient(userId);

  try {
    await client.patch(`/sobjects/${objectName}/${recordId}`, fields);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const sfErrors = err.response?.data as Array<{ message: string }> | undefined;
      const sfMsg = sfErrors?.[0]?.message ?? err.message;
      throw new AppError(err.response?.status ?? 502, `Failed to update ${objectName}: ${sfMsg}`);
    }
    throw new AppError(502, `Failed to update ${objectName} record`);
  }
}

export async function getSalesforceRecord(
  userId: string,
  objectName: string,
  recordId: string,
): Promise<SalesforceRecord> {
  const { client } = await getSalesforceClient(userId);

  try {
    const { data } = await client.get<SalesforceRecord>(`/sobjects/${objectName}/${recordId}`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new AppError(err.response?.status ?? 502, `Salesforce record fetch failed`);
    }
    throw new AppError(502, 'Salesforce record fetch failed');
  }
}
