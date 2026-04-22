import { useState } from 'react';
import type { Note, NotePath, NoteType } from '@tg/shared';
import { useCreateNote, useUpdateNote, useDeleteNote } from '../api/queries';
import { classifyApiError } from '../lib/classifyApiError';

export interface CreateTarget {
  path: NotePath | null;
  locationName: string | null;
}

export type NoteFormState =
  | { mode: 'create'; target: CreateTarget }
  | { mode: 'edit'; note: Note };

interface UseNoteFormStateOptions {
  defaultTarget?: CreateTarget;
  onCreated?: (values: { type: NoteType; body: string }) => void;
}

const EMPTY_TARGET: CreateTarget = { path: null, locationName: null };

export function useNoteFormState({ defaultTarget, onCreated }: UseNoteFormStateOptions = {}) {
  const [form, setForm] = useState<NoteFormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const openCreate = (target?: CreateTarget) => {
    setFormError(null);
    setForm({ mode: 'create', target: target ?? defaultTarget ?? EMPTY_TARGET });
  };

  const openEdit = (note: Note) => {
    setFormError(null);
    setForm({ mode: 'edit', note });
  };

  const closeForm = () => {
    setForm(null);
    setFormError(null);
  };

  const submit = async (values: { type: NoteType; body: string }) => {
    try {
      setFormError(null);
      if (form?.mode === 'create') {
        await createNote.mutateAsync({ ...values, path: form.target.path });
        onCreated?.(values);
      } else if (form?.mode === 'edit') {
        await updateNote.mutateAsync({ noteId: form.note.id, ...values });
      }
      setForm(null);
    } catch (err) {
      setFormError(classifyApiError(err));
    }
  };

  const confirmDelete = async () => {
    if (!deletingNote) return;
    try {
      setDeleteError(null);
      await deleteNote.mutateAsync({ noteId: deletingNote.id });
      setDeletingNote(null);
    } catch (err) {
      setDeleteError(classifyApiError(err));
    }
  };

  return {
    form,
    formError,
    deletingNote,
    deleteError,
    openCreate,
    openEdit,
    closeForm,
    submit,
    requestDelete: setDeletingNote,
    closeDelete: () => {
      setDeletingNote(null);
      setDeleteError(null);
    },
    confirmDelete,
    busyForm: createNote.isPending || updateNote.isPending,
    busyDelete: deleteNote.isPending,
  };
}
