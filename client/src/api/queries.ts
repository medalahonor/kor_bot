import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  Location,
  LocationDetail,
  LocationProgress,
  BatchLocationProgress,
  RemainingResponse,
  OptionStatus,
  KsVersesResponse,
  EkResponse,
} from '../lib/types';

const CAMPAIGN_ID = 1;

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () => api<Location[]>(`/campaigns/${CAMPAIGN_ID}/locations`),
  });
}

export function useBatchProgress() {
  return useQuery({
    queryKey: ['progress', 'batch'],
    queryFn: () =>
      api<BatchLocationProgress[]>(
        `/campaigns/${CAMPAIGN_ID}/locations/progress`,
      ),
  });
}

export function useLocationVerses(dn: number) {
  return useQuery({
    queryKey: ['verses', dn],
    queryFn: () =>
      api<LocationDetail>(`/locations/${dn}/verses?campaign=${CAMPAIGN_ID}`),
    enabled: dn > 0,
  });
}

export function useLocationProgress(dn: number) {
  return useQuery({
    queryKey: ['progress', dn],
    queryFn: () =>
      api<LocationProgress>(
        `/locations/${dn}/progress?campaign=${CAMPAIGN_ID}`,
      ),
    enabled: dn > 0,
  });
}

export function useRemaining(dn: number, startVerse?: number) {
  const startParam = startVerse !== undefined ? `&startVerse=${startVerse}` : '';
  return useQuery({
    queryKey: ['remaining', dn, startVerse],
    queryFn: () =>
      api<RemainingResponse>(
        `/locations/${dn}/remaining?campaign=${CAMPAIGN_ID}${startParam}`,
      ),
    enabled: dn > 0,
  });
}

export function useKsVerses(page: number, search: string, onlyNew: boolean) {
  return useQuery({
    queryKey: ['ks-verses', page, search, onlyNew],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
      });
      if (search) params.set('search', search);
      if (onlyNew) params.set('onlyNew', 'true');
      return api<KsVersesResponse>(
        `/campaigns/${CAMPAIGN_ID}/ks/verses?${params}`,
      );
    },
  });
}

export function useEkData() {
  return useQuery({
    queryKey: ['ek-verses'],
    queryFn: () => api<EkResponse>(`/campaigns/${CAMPAIGN_ID}/ek/verses`),
  });
}

export function useVerseNumbers(dn: number) {
  return useQuery({
    queryKey: ['verse-numbers', dn],
    queryFn: () =>
      api<{ verses: number[] }>(
        `/locations/${dn}/verse-numbers?campaign=${CAMPAIGN_ID}`,
      ),
    enabled: dn > 0,
  });
}

export function useSetOptionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ optionId, status }: { optionId: number; status: OptionStatus }) =>
      api('/progress', {
        method: 'PUT',
        body: JSON.stringify({ optionId, status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] });
      qc.invalidateQueries({ queryKey: ['remaining'] });
    },
  });
}

export function useBatchSetStatus() {
  return useMutation({
    mutationFn: ({ optionIds, status }: { optionIds: number[]; status: OptionStatus }) =>
      api('/progress/batch', {
        method: 'PUT',
        body: JSON.stringify({ optionIds, status }),
      }),
  });
}
