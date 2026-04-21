import { useMemo } from 'react';
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
  GetChaptersContract,
  CreateChapterContract,
  CreateChapterBodySchema,
  UpdateChapterContract,
  UpdateChapterBodySchema,
  DeleteChapterContract,
  UpdateChapterLocationsContract,
  UpdateChapterLocationsBodySchema,
  type CreateChapterBody,
  type UpdateChapterBody,
  type UpdateChapterLocationsBody,
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

// 10 сек — верхняя граница завершения исследования перед тем как показать error.
// Не ретраим: юзер сам решит через модалку (Повторить / Закрыть).
const BATCH_SET_STATUS_TIMEOUT_MS = 10_000;

export function useBatchSetStatus() {
  return useMutation({
    mutationFn: ({ optionIds, status }: { optionIds: number[]; status: OptionStatus }) => {
      const body = PutProgressBatchBodySchema.parse({ optionIds, status });
      return api('/progress/batch', PutProgressBatchContract.response[200], {
        method: 'PUT',
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(BATCH_SET_STATUS_TIMEOUT_MS),
      });
    },
  });
}

export type LocationProgressInfo = {
  visited: number;
  total: number;
  visitedCyclic: number;
  totalCyclic: number;
};

// Объединяет batch (обычные локации KoR) и EK-progress в одну Map<dn, info>.
// EK выходит отдельным запросом, потому что их прогресс считается иначе.
export function useLocationProgressMap(): Map<number, LocationProgressInfo> {
  const { data: batchProgress } = useBatchProgress();
  const { data: ekData } = useEkData();

  return useMemo(() => {
    const map = new Map<number, LocationProgressInfo>();
    if (batchProgress) {
      for (const item of batchProgress) {
        map.set(item.displayNumber, {
          visited: item.completedPaths,
          total: item.totalPaths,
          visitedCyclic: item.completedCyclic,
          totalCyclic: item.totalCyclic,
        });
      }
    }
    if (ekData) {
      for (const loc of ekData.locations) {
        map.set(loc.locationDn, {
          visited: loc.completedPaths,
          total: loc.totalPaths,
          visitedCyclic: loc.completedCyclic,
          totalCyclic: loc.totalCyclic,
        });
      }
    }
    return map;
  }, [batchProgress, ekData]);
}

const CHAPTERS_KEY = ['chapters', CAMPAIGN_ID] as const;

export function useChapters() {
  return useQuery({
    queryKey: CHAPTERS_KEY,
    queryFn: () =>
      api(
        `/campaigns/${CAMPAIGN_ID}/chapters`,
        GetChaptersContract.response[200],
      ),
  });
}

export function useCreateChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChapterBody) => {
      const body = CreateChapterBodySchema.parse(input);
      return api(
        `/campaigns/${CAMPAIGN_ID}/chapters`,
        CreateChapterContract.response[201],
        { method: 'POST', body: JSON.stringify(body) },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAPTERS_KEY }),
  });
}

export function useUpdateChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chapterId, ...patch }: { chapterId: number } & UpdateChapterBody) => {
      const body = UpdateChapterBodySchema.parse(patch);
      return api(
        `/chapters/${chapterId}`,
        UpdateChapterContract.response[200],
        { method: 'PATCH', body: JSON.stringify(body) },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAPTERS_KEY }),
  });
}

export function useDeleteChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chapterId }: { chapterId: number }) =>
      api(
        `/chapters/${chapterId}`,
        DeleteChapterContract.response[200],
        { method: 'DELETE' },
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAPTERS_KEY }),
  });
}

export function useUpdateChapterLocations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      chapterId,
      ...patch
    }: { chapterId: number } & UpdateChapterLocationsBody) => {
      const body = UpdateChapterLocationsBodySchema.parse(patch);
      return api(
        `/chapters/${chapterId}/locations`,
        UpdateChapterLocationsContract.response[200],
        { method: 'PATCH', body: JSON.stringify(body) },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAPTERS_KEY }),
  });
}
