import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export function useUpdateOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api(`/admin/options/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verses'] });
    },
  });
}

export function useDeleteOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api(`/admin/options/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verses'] });
    },
  });
}

export function useCreateOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      verseId,
      data,
    }: {
      verseId: number;
      data: Record<string, unknown>;
    }) =>
      api(`/admin/verses/${verseId}/options`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verses'] });
    },
  });
}

export function useUpdateVerse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api(`/admin/verses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verses'] });
    },
  });
}

export function useDeleteVerse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api(`/admin/verses/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verses'] });
    },
  });
}
