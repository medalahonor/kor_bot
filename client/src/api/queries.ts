import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import {
  GetCampaignLocationsContract,
  GetBatchProgressContract,
  GetLocationVersesContract,
  GetLocationProgressContract,
  GetVerseNumbersContract,
  GetRemainingContract,
  GetKsVersesContract,
  GetEkVersesContract,
  PutProgressContract,
  PutProgressBatchContract,
  PutProgressBodySchema,
  PutProgressBatchBodySchema,
  type OptionStatus,
} from '@tg/shared';

const CAMPAIGN_ID = 1;

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () =>
      api(`/campaigns/${CAMPAIGN_ID}/locations`, GetCampaignLocationsContract.response[200]),
  });
}

export function useBatchProgress() {
  return useQuery({
    queryKey: ['progress', 'batch'],
    queryFn: () =>
      api(`/campaigns/${CAMPAIGN_ID}/locations/progress`, GetBatchProgressContract.response[200]),
  });
}

export function useLocationVerses(dn: number) {
  return useQuery({
    queryKey: ['verses', dn],
    queryFn: () =>
      api(
        `/locations/${dn}/verses?campaign=${CAMPAIGN_ID}`,
        GetLocationVersesContract.response[200],
      ),
    enabled: dn > 0,
  });
}

export function useLocationProgress(dn: number) {
  return useQuery({
    queryKey: ['progress', dn],
    queryFn: () =>
      api(
        `/locations/${dn}/progress?campaign=${CAMPAIGN_ID}`,
        GetLocationProgressContract.response[200],
      ),
    enabled: dn > 0,
  });
}

export function useRemaining(dn: number, startVerse?: number) {
  const startParam = startVerse !== undefined ? `&startVerse=${startVerse}` : '';
  return useQuery({
    queryKey: ['remaining', dn, startVerse],
    queryFn: () =>
      api(
        `/locations/${dn}/remaining?campaign=${CAMPAIGN_ID}${startParam}`,
        GetRemainingContract.response[200],
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
      return api(
        `/campaigns/${CAMPAIGN_ID}/ks/verses?${params}`,
        GetKsVersesContract.response[200],
      );
    },
  });
}

export function useEkData() {
  return useQuery({
    queryKey: ['ek-verses'],
    queryFn: () =>
      api(`/campaigns/${CAMPAIGN_ID}/ek/verses`, GetEkVersesContract.response[200]),
  });
}

export function useVerseNumbers(dn: number) {
  return useQuery({
    queryKey: ['verse-numbers', dn],
    queryFn: () =>
      api(
        `/locations/${dn}/verse-numbers?campaign=${CAMPAIGN_ID}`,
        GetVerseNumbersContract.response[200],
      ),
    enabled: dn > 0,
  });
}

export function useSetOptionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ optionId, status }: { optionId: number; status: OptionStatus }) => {
      const body = PutProgressBodySchema.parse({ optionId, status });
      return api('/progress', PutProgressContract.response[200], {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['progress'] });
      qc.invalidateQueries({ queryKey: ['remaining'] });
    },
  });
}

export function useBatchSetStatus() {
  return useMutation({
    mutationFn: ({ optionIds, status }: { optionIds: number[]; status: OptionStatus }) => {
      const body = PutProgressBatchBodySchema.parse({ optionIds, status });
      return api('/progress/batch', PutProgressBatchContract.response[200], {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
  });
}
