import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, isGroqConfigured, isGeminiConfigured } from '../config/index.js';
import { logger } from '../lib/logger.js';
import { AppError } from '../middleware/errorHandler.js';
import { querySalesforce } from './salesforceService.js';
import type {
  SalesforceApiCall,
  SalesforceObject,
  PendingAction,
} from '../types/shared.js';

let _groq: Groq | null = null;
let _gemini: GoogleGenerativeAI | null = null;

// ✅ Updated: use a current supported Groq model as default
const DEFAULT_GROQ_MODEL = 'llama-3.3-70b-versatile';
const FALLBACK_GROQ_MODEL = 'llama-3.1-8b-instant';

function getGroq(): Groq {
  if (!isGroqConfigured()) {
    throw new AppError(503, 'Groq API key not configured. Please add GROQ_API_KEY to your environment.');
  }
  if (!_groq) _groq = new Groq({ apiKey: config.GROQ_API_KEY });
  return _groq;
}

function getGemini(): GoogleGenerativeAI {
  if (!isGeminiConfigured()) {
    throw new AppError(503, 'Gemini API key not configured. Please add GEMINI_API_KEY to your environment.');
  }
  if (!_gemini) _gemini = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  return _gemini;
}

export interface AiIntentResult {
  action: 'query' | 'create' | 'update' | 'summarize' | 'unknown';
  object?: SalesforceObject;
  soql?: string;
  recordId?: string;
  fields?: Record<string, unknown>;
  naturalResponse?: string;
}

export interface ChatResult {
  content: string;
  aiModel: string;
  apiCalls: SalesforceApiCall[];
  sfObject?: string;
  sfOperation?: string;
  pendingAction?: PendingAction;
}

const SUPPORTED_OBJECTS: SalesforceObject[] = ['Lead', 'Contact', 'Account', 'Opportunity', 'Task', 'Case'];

const SYSTEM_PROMPT = `You are Stratum AI, an AI assistant that helps users interact with their Salesforce CRM.

You have access to Salesforce data and can:
1. Query records (Leads, Contacts, Accounts, Opportunities, Tasks, Cases)
2. Create new records
3. Update existing records
4. Summarize pipeline and data

When responding, you must output valid JSON matching this schema:
{
  "action": "query" | "create" | "update" | "summarize" | "unknown",
  "object": "Lead" | "Contact" | "Account" | "Opportunity" | "Task" | "Case" | null,
  "soql": "SELECT ... FROM ... WHERE ..." | null,
  "recordId": "string or null",
  "fields": { "field": "value" } | null,
  "naturalResponse": "A concise, helpful response to show the user after executing the action" | null
}

Rules:
- For queries, always write valid SOQL. Use LIMIT 50 unless user specifies otherwise.
- For summarize, use a query action with appropriate SOQL and write a summary in naturalResponse.
- For creates, include all required fields in the fields object.
- For updates, include the recordId and only changed fields.
- If the intent is unclear, use action: "unknown" and explain in naturalResponse.
- NEVER include sensitive data in naturalResponse.
- Today's date context: ${new Date().toISOString().split('T')[0]}
- Common SOQL examples:
  - Open opps: SELECT Id, Name, Amount, StageName, CloseDate FROM Opportunity WHERE IsClosed = false
  - This quarter opps: SELECT Id, Name, Amount, StageName FROM Opportunity WHERE CloseDate = THIS_QUARTER
  - Leads by status: SELECT Id, FirstName, LastName, Company, Status FROM Lead WHERE IsConverted = false LIMIT 50
`;

// ✅ Sanitizes the model string — replaces any decommissioned model with the current default
function sanitizeGroqModel(model: string): string {
  const decommissioned = [
    'llama3-8b-8192',
    'llama3-70b-8192',
    'mixtral-8x7b-32768',
    'gemma-7b-it',
  ];
  if (decommissioned.includes(model)) {
    logger.warn({ model }, `Model "${model}" is decommissioned, switching to ${DEFAULT_GROQ_MODEL}`);
    return DEFAULT_GROQ_MODEL;
  }
  return model;
}

async function callGroq(
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
  model: string,
): Promise<string> {
  const groq = getGroq();
  const safeModel = sanitizeGroqModel(model); // ✅ sanitize before use
  const completion = await groq.chat.completions.create({
    model: safeModel,
    messages,
    temperature: 0.1,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from Groq');
  return content;
}

async function callGemini(prompt: string): Promise<string> {
  const gemini = getGemini();
  // ✅ gemini-2.0-flash is correct — keeping as-is
  const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(
    `${SYSTEM_PROMPT}\n\nUser message: ${prompt}\n\nRespond with valid JSON only.`,
  );
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in Gemini response');
  return jsonMatch[0];
}

async function parseIntentFromAI(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  preferredModel: string,
): Promise<{ result: AiIntentResult; modelUsed: string }> {
  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.slice(-10),
    { role: 'user', content: userMessage },
  ];

  let rawJson: string;
  let modelUsed: string;

  const safeModel = sanitizeGroqModel(preferredModel); // ✅ sanitize early

  try {
    rawJson = await callGroq(messages, safeModel);
    modelUsed = safeModel;
    logger.debug({ model: safeModel }, 'Using Groq for intent parsing');
  } catch (groqErr) {
    logger.warn({ groqErr }, 'Groq failed, falling back to Gemini');
    try {
      rawJson = await callGemini(userMessage);
      modelUsed = 'gemini-2.0-flash';
    } catch (geminiErr) {
      logger.error({ geminiErr }, 'Gemini fallback also failed');
      throw new AppError(502, 'AI service unavailable. Please try again later.');
    }
  }

  try {
    const parsed = JSON.parse(rawJson) as AiIntentResult;
    return { result: parsed, modelUsed };
  } catch {
    throw new AppError(502, 'AI returned invalid response. Please rephrase your request.');
  }
}

function formatRecordsAsText(records: unknown[], objectName: string): string {
  if (!records || records.length === 0) return `No ${objectName} records found.`;

  return records
    .map((record, idx) => {
      const entries = Object.entries(record as Record<string, unknown>)
        .filter(([key]) => key !== 'attributes')
        .map(([key, value]) => `  ${key}: ${value ?? 'N/A'}`)
        .join('\n');
      return `[${idx + 1}] ${entries}`;
    })
    .join('\n\n');
}

export async function processChat(params: {
  userId: string;
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  preferredModel: string;
}): Promise<ChatResult> {
  const startTime = Date.now();
  const apiCalls: SalesforceApiCall[] = [];

  // ✅ Sanitize the preferred model once at the top level
  const safePreferredModel = sanitizeGroqModel(params.preferredModel);

  const { result: intent, modelUsed } = await parseIntentFromAI(
    params.userMessage,
    params.conversationHistory,
    safePreferredModel,
  );

  logger.info({ action: intent.action, object: intent.object, model: modelUsed }, 'AI intent parsed');

  let responseContent: string;
  let sfObject: string | undefined;
  let sfOperation: string | undefined;

  if (intent.action === 'unknown' || !intent.object) {
    responseContent =
      intent.naturalResponse ??
      "I'm not sure how to help with that. Try asking about your Leads, Contacts, Accounts, Opportunities, Tasks, or Cases.";
    return { content: responseContent, aiModel: modelUsed, apiCalls, sfObject, sfOperation };
  }

  if (!SUPPORTED_OBJECTS.includes(intent.object as SalesforceObject)) {
    throw new AppError(400, `Unsupported Salesforce object: ${intent.object}`);
  }

  sfObject = intent.object;

  switch (intent.action) {
    case 'query':
    case 'summarize': {
      const soql = intent.soql ?? `SELECT Id, Name FROM ${intent.object} LIMIT 25`;
      sfOperation = 'query';
      apiCalls.push({ object: intent.object, operation: 'query', soql });

      const queryResult = await querySalesforce(params.userId, soql);

      if (intent.action === 'summarize') {
        const summaryPrompt = `Summarize the following ${intent.object} data in a concise, business-friendly way:\n${formatRecordsAsText(queryResult.records, intent.object)}`;
        try {
          // ✅ Use safePreferredModel instead of params.preferredModel
          const groq = getGroq();
          const summary = await groq.chat.completions.create({
            model: safePreferredModel,
            messages: [
              { role: 'system', content: 'You are a helpful CRM analyst. Summarize CRM data concisely. Do not output JSON.' },
              { role: 'user', content: summaryPrompt },
            ],
            temperature: 0.3,
            max_tokens: 1024,
          });
          responseContent =
            summary.choices[0]?.message?.content ?? formatRecordsAsText(queryResult.records, intent.object);
        } catch (summarizeErr) {
          // ✅ Log the error and gracefully fall back to plain text
          logger.warn({ summarizeErr }, 'Groq summarize failed, falling back to raw record display');
          responseContent = formatRecordsAsText(queryResult.records, intent.object);
        }
      } else {
        const naturalHeader = intent.naturalResponse ? `${intent.naturalResponse}\n\n` : '';
        responseContent = `${naturalHeader}Found **${queryResult.totalSize}** ${intent.object} record(s):\n\n${formatRecordsAsText(queryResult.records, intent.object)}`;
      }
      break;
    }

    case 'create': {
      if (!intent.fields || Object.keys(intent.fields).length === 0) {
        throw new AppError(400, 'No fields provided for record creation.');
      }
      sfOperation = 'pending_create';
      apiCalls.push({ object: intent.object, operation: 'create' });
      const pendingCreate: PendingAction = { type: 'create', object: intent.object, fields: intent.fields };
      responseContent =
        intent.naturalResponse ??
        `I'll create a new **${intent.object}** record with these details. Review the fields below and confirm when ready.`;
      return { content: responseContent, aiModel: modelUsed, apiCalls, sfObject, sfOperation, pendingAction: pendingCreate };
    }

    case 'update': {
      if (!intent.recordId) {
        throw new AppError(400, 'No record ID provided for update. Please specify which record to update.');
      }
      if (!intent.fields || Object.keys(intent.fields).length === 0) {
        throw new AppError(400, 'No fields to update were specified.');
      }
      sfOperation = 'pending_update';
      apiCalls.push({ object: intent.object, operation: 'update', record_id: intent.recordId });
      const pendingUpdate: PendingAction = { type: 'update', object: intent.object, fields: intent.fields, recordId: intent.recordId };
      responseContent =
        intent.naturalResponse ??
        `I'll update the **${intent.object}** record (\`${intent.recordId}\`). Review the changes below and confirm.`;
      return { content: responseContent, aiModel: modelUsed, apiCalls, sfObject, sfOperation, pendingAction: pendingUpdate };
    }

    default: {
      responseContent = intent.naturalResponse ?? "I couldn't process that request. Please try rephrasing.";
    }
  }

  logger.info(
    { userId: params.userId, action: intent.action, object: intent.object, durationMs: Date.now() - startTime },
    'Chat processed',
  );

  return { content: responseContent, aiModel: modelUsed, apiCalls, sfObject, sfOperation };
}