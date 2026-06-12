import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { CRMProvider } from '@/types';

export type RecordObjectType = 'leads' | 'contacts' | 'accounts' | 'opportunities';

export interface CRMRecord {
  id: string;
  name: string;
  provider: CRMProvider;
  // Leads
  company?: string;
  email?: string;
  phone?: string;
  status?: string;
  leadSource?: string;
  // Contacts
  accountName?: string;
  title?: string;
  lastActivityDate?: string;
  // Accounts
  industry?: string;
  annualRevenue?: number;
  numberOfEmployees?: number;
  website?: string;
  // Opportunities
  amount?: number;
  stage?: string;
  closeDate?: string;
  probability?: number;
  // Common
  createdDate?: string;
  ownedBy?: string;
  crmUrl?: string;
}

interface RecordsResponse {
  connected: boolean;
  objectType: RecordObjectType;
  records: CRMRecord[];
  total: number;
}

async function fetchRecords(objectType: RecordObjectType): Promise<RecordsResponse> {
  const { data } = await axios.get<RecordsResponse>(`/api/records/${objectType}`);
  return data;
}

const MOCK_RECORDS: Record<RecordObjectType, CRMRecord[]> = {
  leads: [
    { id: 'l1', name: 'Sarah Chen', provider: 'salesforce', company: 'Anthropic', email: 'sarah@anthropic.com', status: 'New', leadSource: 'Web', createdDate: '2026-05-12', ownedBy: 'Alex Rivera' },
    { id: 'l2', name: 'Marcus Webb', provider: 'hubspot', company: 'Scale AI', email: 'marcus@scale.ai', status: 'Working', leadSource: 'Event', createdDate: '2026-05-10', ownedBy: 'Jordan Lee' },
    { id: 'l3', name: 'Priya Sharma', provider: 'salesforce', company: 'Cohere', email: 'priya@cohere.com', status: 'Nurturing', leadSource: 'Referral', createdDate: '2026-05-08', ownedBy: 'Sam Kim' },
    { id: 'l4', name: 'Tomás Díaz', provider: 'hubspot', company: 'Mistral AI', email: 'tomas@mistral.ai', status: 'New', leadSource: 'Organic', createdDate: '2026-05-07', ownedBy: 'Alex Rivera' },
    { id: 'l5', name: 'Anya Patel', provider: 'salesforce', company: 'Runway', email: 'anya@runwayml.com', status: 'Converted', leadSource: 'LinkedIn', createdDate: '2026-05-05', ownedBy: 'Jordan Lee' },
    { id: 'l6', name: 'Kai Tanaka', provider: 'servicenow', company: 'Stability AI', email: 'kai@stability.ai', status: 'Working', leadSource: 'Conference', createdDate: '2026-05-04', ownedBy: 'Sam Kim' },
    { id: 'l7', name: 'Lena Müller', provider: 'salesforce', company: 'ElevenLabs', email: 'lena@elevenlabs.io', status: 'New', leadSource: 'Paid Ad', createdDate: '2026-05-03', ownedBy: 'Alex Rivera' },
    { id: 'l8', name: 'Omar Hassan', provider: 'hubspot', company: 'Together AI', email: 'omar@together.ai', status: 'Nurturing', leadSource: 'Web', createdDate: '2026-05-01', ownedBy: 'Jordan Lee' },
  ],
  contacts: [
    { id: 'c1', name: 'Elise Fontaine', provider: 'salesforce', email: 'elise@acmecorp.com', phone: '+1 415 555 0123', accountName: 'Acme Corp', title: 'VP of Engineering', lastActivityDate: '2026-05-16', ownedBy: 'Alex Rivera' },
    { id: 'c2', name: 'Daniel Park', provider: 'hubspot', email: 'daniel@techflow.io', phone: '+1 650 555 0189', accountName: 'TechFlow', title: 'CTO', lastActivityDate: '2026-05-15', ownedBy: 'Jordan Lee' },
    { id: 'c3', name: 'Isabelle Roy', provider: 'salesforce', email: 'isabelle@nexusai.co', phone: '+1 628 555 0174', accountName: 'Nexus AI', title: 'Head of Product', lastActivityDate: '2026-05-14', ownedBy: 'Sam Kim' },
    { id: 'c4', name: 'Raj Mehta', provider: 'servicenow', email: 'raj@cloudbase.io', phone: '+1 408 555 0212', accountName: 'CloudBase', title: 'Director of IT', lastActivityDate: '2026-05-13', ownedBy: 'Alex Rivera' },
    { id: 'c5', name: 'Chloe Martin', provider: 'hubspot', email: 'chloe@vertexsoft.com', phone: '+1 510 555 0167', accountName: 'VertexSoft', title: 'CEO', lastActivityDate: '2026-05-11', ownedBy: 'Jordan Lee' },
    { id: 'c6', name: 'Noah Johansson', provider: 'salesforce', email: 'noah@oriondata.se', phone: '+46 8 555 0145', accountName: 'Orion Data', title: 'Sales Director', lastActivityDate: '2026-05-09', ownedBy: 'Sam Kim' },
  ],
  accounts: [
    { id: 'a1', name: 'Acme Corp', provider: 'salesforce', industry: 'Manufacturing', annualRevenue: 42000000, numberOfEmployees: 850, website: 'acmecorp.com', ownedBy: 'Alex Rivera', createdDate: '2024-01-15' },
    { id: 'a2', name: 'TechFlow', provider: 'hubspot', industry: 'Software', annualRevenue: 18500000, numberOfEmployees: 200, website: 'techflow.io', ownedBy: 'Jordan Lee', createdDate: '2024-03-22' },
    { id: 'a3', name: 'Nexus AI', provider: 'salesforce', industry: 'Artificial Intelligence', annualRevenue: 9000000, numberOfEmployees: 85, website: 'nexusai.co', ownedBy: 'Sam Kim', createdDate: '2024-06-10' },
    { id: 'a4', name: 'CloudBase', provider: 'servicenow', industry: 'Cloud Services', annualRevenue: 67000000, numberOfEmployees: 1200, website: 'cloudbase.io', ownedBy: 'Alex Rivera', createdDate: '2023-11-08' },
    { id: 'a5', name: 'VertexSoft', provider: 'hubspot', industry: 'Enterprise Software', annualRevenue: 31000000, numberOfEmployees: 430, website: 'vertexsoft.com', ownedBy: 'Jordan Lee', createdDate: '2024-02-19' },
    { id: 'a6', name: 'Orion Data', provider: 'salesforce', industry: 'Data Analytics', annualRevenue: 12000000, numberOfEmployees: 150, website: 'oriondata.se', ownedBy: 'Sam Kim', createdDate: '2024-04-30' },
    { id: 'a7', name: 'PulseMetrics', provider: 'hubspot', industry: 'Marketing Tech', annualRevenue: 8200000, numberOfEmployees: 95, website: 'pulsemetrics.io', ownedBy: 'Alex Rivera', createdDate: '2024-07-05' },
  ],
  opportunities: [
    { id: 'o1', name: 'Acme Corp — Platform Expansion', provider: 'salesforce', accountName: 'Acme Corp', amount: 120000, stage: 'Proposal/Price Quote', closeDate: '2026-05-30', probability: 65, ownedBy: 'Alex Rivera' },
    { id: 'o2', name: 'TechFlow — Enterprise License', provider: 'hubspot', accountName: 'TechFlow', amount: 98000, stage: 'Negotiation/Review', closeDate: '2026-06-15', probability: 80, ownedBy: 'Jordan Lee' },
    { id: 'o3', name: 'Nexus AI — Pilot', provider: 'salesforce', accountName: 'Nexus AI', amount: 24000, stage: 'Value Proposition', closeDate: '2026-07-01', probability: 40, ownedBy: 'Sam Kim' },
    { id: 'o4', name: 'CloudBase — ServiceNow Integration', provider: 'servicenow', accountName: 'CloudBase', amount: 75000, stage: 'Id. Decision Makers', closeDate: '2026-06-30', probability: 55, ownedBy: 'Alex Rivera' },
    { id: 'o5', name: 'VertexSoft — Annual Renewal', provider: 'hubspot', accountName: 'VertexSoft', amount: 45000, stage: 'Closed Won', closeDate: '2026-05-20', probability: 100, ownedBy: 'Jordan Lee' },
    { id: 'o6', name: 'Orion Data — Starter Plan', provider: 'salesforce', accountName: 'Orion Data', amount: 18000, stage: 'Qualification', closeDate: '2026-07-15', probability: 30, ownedBy: 'Sam Kim' },
    { id: 'o7', name: 'PulseMetrics — POC', provider: 'hubspot', accountName: 'PulseMetrics', amount: 12500, stage: 'Needs Analysis', closeDate: '2026-08-01', probability: 25, ownedBy: 'Alex Rivera' },
  ],
};

export function useRecords(objectType: RecordObjectType) {
  return useQuery<RecordsResponse>({
    queryKey: ['records', objectType],
    queryFn: async () => {
      try {
        return await fetchRecords(objectType);
      } catch {
        return {
          connected: false,
          objectType,
          records: MOCK_RECORDS[objectType],
          total: MOCK_RECORDS[objectType].length,
        };
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}
