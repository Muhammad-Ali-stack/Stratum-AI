export type CRMProvider = "salesforce" | "hubspot" | "servicenow";
export type AIProvider = "groq" | "gemini" | "copilot";

export interface Connection {
  provider: CRMProvider;
  connectedAt: string;
  status: "active" | "error";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface KPIData {
  pipelineValue: number;
  openOpportunities: number;
  closedDeals: number;
  activeContacts: number;
}

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

export const CRM_LABELS: Record<CRMProvider, string> = {
  salesforce: "Salesforce",
  hubspot: "HubSpot",
  servicenow: "ServiceNow",
};

export const AI_LABELS: Record<AIProvider, string> = {
  groq: "Groq",
  gemini: "Google Gemini",
  copilot: "Copilot / Azure OpenAI",
};
