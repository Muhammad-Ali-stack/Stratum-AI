import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { PipelineResponse } from '../types/shared';

const api = axios.create({ withCredentials: true });

export const PIPELINE_QUERY_KEY = ['pipeline'] as const;

const MOCK_PIPELINE: PipelineResponse = {
  connected: true,
  totalPipelineValue: 490500,
  totalOpportunities: 19,
  stages: [
    {
      name: 'Prospecting',
      count: 4,
      totalValue: 62000,
      opportunities: [
        { id: 'p1', name: 'NovaTech — Initial Outreach',     account: 'NovaTech',     amount: 18000, closeDate: '2026-08-01', probability: 15, stage: 'Prospecting' },
        { id: 'p2', name: 'QuantumLeap — Discovery Call',    account: 'QuantumLeap',  amount: 22000, closeDate: '2026-08-15', probability: 20, stage: 'Prospecting' },
        { id: 'p3', name: 'PulseMetrics — POC',              account: 'PulseMetrics', amount: 12500, closeDate: '2026-09-01', probability: 10, stage: 'Prospecting' },
        { id: 'p4', name: 'SkyBridge — First Contact',       account: 'SkyBridge',    amount: 9500,  closeDate: '2026-09-10', probability: 10, stage: 'Prospecting' },
      ],
    },
    {
      name: 'Qualification',
      count: 3,
      totalValue: 54000,
      opportunities: [
        { id: 'q1', name: 'Orion Data — Starter Plan',       account: 'Orion Data',   amount: 18000, closeDate: '2026-07-15', probability: 30, stage: 'Qualification' },
        { id: 'q2', name: 'BlueCrest — Platform Pilot',      account: 'BlueCrest',    amount: 24000, closeDate: '2026-07-30', probability: 25, stage: 'Qualification' },
        { id: 'q3', name: 'DataVault — SMB Package',         account: 'DataVault',    amount: 12000, closeDate: '2026-08-05', probability: 30, stage: 'Qualification' },
      ],
    },
    {
      name: 'Needs Analysis',
      count: 3,
      totalValue: 67500,
      opportunities: [
        { id: 'n1', name: 'PulseMetrics — Enterprise POC',   account: 'PulseMetrics', amount: 12500, closeDate: '2026-08-01', probability: 25, stage: 'Needs Analysis' },
        { id: 'n2', name: 'Vortex Labs — AI Integration',    account: 'Vortex Labs',  amount: 35000, closeDate: '2026-07-20', probability: 35, stage: 'Needs Analysis' },
        { id: 'n3', name: 'EchoSystems — Expansion Deal',    account: 'EchoSystems',  amount: 20000, closeDate: '2026-07-25', probability: 30, stage: 'Needs Analysis' },
      ],
    },
    {
      name: 'Value Proposition',
      count: 2,
      totalValue: 33000,
      opportunities: [
        { id: 'v1', name: 'Nexus AI — Pilot',                account: 'Nexus AI',     amount: 24000, closeDate: '2026-07-01', probability: 40, stage: 'Value Proposition' },
        { id: 'v2', name: 'StormData — Growth Tier',         account: 'StormData',    amount: 9000,  closeDate: '2026-07-10', probability: 40, stage: 'Value Proposition' },
      ],
    },
    {
      name: 'Proposal / Quote',
      count: 3,
      totalValue: 153000,
      opportunities: [
        { id: 'pr1', name: 'Acme Corp — Platform Expansion', account: 'Acme Corp',    amount: 120000, closeDate: '2026-05-30', probability: 65, stage: 'Proposal / Quote' },
        { id: 'pr2', name: 'VertexSoft — Team License',      account: 'VertexSoft',   amount: 21000,  closeDate: '2026-06-20', probability: 60, stage: 'Proposal / Quote' },
        { id: 'pr3', name: 'GridCore — Analytics Add-on',    account: 'GridCore',     amount: 12000,  closeDate: '2026-06-28', probability: 55, stage: 'Proposal / Quote' },
      ],
    },
    {
      name: 'Negotiation',
      count: 2,
      totalValue: 173000,
      opportunities: [
        { id: 'ng1', name: 'TechFlow — Enterprise License',  account: 'TechFlow',     amount: 98000, closeDate: '2026-06-15', probability: 80, stage: 'Negotiation' },
        { id: 'ng2', name: 'CloudBase — SN Integration',     account: 'CloudBase',    amount: 75000, closeDate: '2026-06-30', probability: 75, stage: 'Negotiation' },
      ],
    },
    {
      name: 'Closed Won',
      count: 2,
      totalValue: 63000,
      opportunities: [
        { id: 'cw1', name: 'VertexSoft — Annual Renewal',    account: 'VertexSoft',   amount: 45000, closeDate: '2026-05-20', probability: 100, stage: 'Closed Won' },
        { id: 'cw2', name: 'Pinnacle AI — Starter',          account: 'Pinnacle AI',  amount: 18000, closeDate: '2026-05-10', probability: 100, stage: 'Closed Won' },
      ],
    },
  ],
};

export function usePipeline() {
  return useQuery({
    queryKey: PIPELINE_QUERY_KEY,
    queryFn: async (): Promise<PipelineResponse> => {
      try {
        const { data } = await api.get<{ success: boolean; data: PipelineResponse }>('/api/dashboard/pipeline');
        return data.data;
      } catch {
        return MOCK_PIPELINE;
      }
    },
    staleTime: 2 * 60 * 1000,
    retry: false,
  });
}
