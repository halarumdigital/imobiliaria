import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface CallCampaign {
  id: string;
  companyId: string;
  name: string;
  contactListId: string;
  contactListName: string;
  assistantId?: string;
  assistantName: string;
  phoneNumber: string;
  status: "draft" | "running" | "completed" | "paused" | "failed";
  startedAt?: Date;
  completedAt?: Date;
  totalContacts: number;
  completedCalls: number;
  answeredCalls: number;
  notAnsweredCalls: number;
  failedCalls: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Call {
  id: string;
  campaignId: string;
  contactId: string;
  contactName: string;
  customerNumber: string;
  status: "queued" | "ringing" | "in-progress" | "completed" | "failed" | "no-answer";
  endReason?: "customer-ended-call" | "customer-did-not-answer" | "customer-did-not-give-microphone-permission" | "assistant-ended-call" | "phone-call-provider-closed-call" | "exceeded-max-duration";
  duration?: number;
  startedAt?: Date;
  endedAt?: Date;
  assistantName: string;
  recordingUrl?: string;
  transcript?: string;
  analysis?: {
    summary: string;
    successEvaluation: boolean;
    structuredData?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignData {
  name: string;
  contactListId: string;
  contactListName: string;
  assistantId?: string;
  assistantName: string;
  phoneNumber: string;
  totalContacts: number;
}

// Hook for fetching campaigns
export function useCampaigns() {
  return useQuery<CallCampaign[]>({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const response = await fetch('/api/call-campaigns', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      return response.json();
    },
  });
}

// Hook for fetching a single campaign
export function useCampaign(id: string) {
  return useQuery<CallCampaign>({
    queryKey: ['campaigns', id],
    queryFn: async () => {
      const response = await fetch(`/api/call-campaigns/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch campaign');
      }

      return response.json();
    },
    enabled: !!id,
  });
}

// Hook for creating a campaign
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation<CallCampaign, Error, CreateCampaignData>({
    mutationFn: async (data) => {
      const response = await fetch('/api/call-campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create campaign');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

// Hook for updating a campaign
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation<CallCampaign, Error, { id: string; data: Partial<CallCampaign> }>({
    mutationFn: async ({ id, data }) => {
      const response = await fetch(`/api/call-campaigns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update campaign');
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', id] });
    },
  });
}

// Hook for fetching calls
export function useCalls(campaignId?: string) {
  return useQuery<Call[]>({
    queryKey: ['calls', campaignId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (campaignId) {
        params.append('campaignId', campaignId);
      }

      const response = await fetch(`/api/calls?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calls');
      }

      return response.json();
    },
  });
}

// Hook for fetching a single call
export function useCall(id: string) {
  return useQuery<Call>({
    queryKey: ['calls', 'single', id],
    queryFn: async () => {
      const response = await fetch(`/api/calls/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch call');
      }

      return response.json();
    },
    enabled: !!id,
  });
}