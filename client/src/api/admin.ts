import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import {
  UpdateOptionContract,
  CreateOptionContract,
  DeleteOptionContract,
  UpdateVerseContract,
  DeleteVerseContract,
  UpdateOptionBodySchema,
  CreateOptionBodySchema,
  UpdateVerseBodySchema,
  type UpdateOptionBody,
  type CreateOptionBody,
  type UpdateVerseBody,
} from '@tg/shared';

export function useUpdateOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOptionBody }) => {
      const body = UpdateOptionBodySchema.parse(data);
      return api(`/admin/options/${id}`, UpdateOptionContract.response[200], {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verses'] });
    },
  });
}

export function useDeleteOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api(`/admin/options/${id}`, DeleteOptionContract.response[200], {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verses'] });
    },
  });
}

export function useCreateOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ verseId, data }: { verseId: number; data: CreateOptionBody }) => {
      const body = CreateOptionBodySchema.parse(data);
      return api(
        `/admin/verses/${verseId}/options`,
        CreateOptionContract.response[201],
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verses'] });
    },
  });
}

export function useUpdateVerse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVerseBody }) => {
      const body = UpdateVerseBodySchema.parse(data);
      return api(`/admin/verses/${id}`, UpdateVerseContract.response[200], {
        method: 'PUT',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verses'] });
    },
  });
}

export function useDeleteVerse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      api(`/admin/verses/${id}`, DeleteVerseContract.response[200], {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['verses'] });
    },
  });
}
