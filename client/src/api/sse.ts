import type { QueryClient } from '@tanstack/react-query';
import {
  SseEventSchema,
  type Note,
  type SseEvent,
  type NoteCreatedEvent,
  type NoteUpdatedEvent,
  type NoteDeletedEvent,
} from '@tg/shared';
import { apiUrl } from './client';
import { notesKeys } from './queries';

let eventSource: EventSource | null = null;

export type SseFatalErrorKind = 'contract';

export type SseFatalErrorHandler = (kind: SseFatalErrorKind, err: unknown) => void;

function parseOrFail(data: string, onFatalError?: SseFatalErrorHandler): SseEvent | null {
  const parsed = SseEventSchema.safeParse(JSON.parse(data));
  if (!parsed.success) {
    console.error('SSE contract error — schema mismatch', parsed.error);
    eventSource?.close();
    eventSource = null;
    onFatalError?.('contract', parsed.error);
    return null;
  }
  return parsed.data;
}

function applyToCaches(
  queryClient: QueryClient,
  campaignId: number,
  verseId: number | null,
  updater: (prev: Note[]) => Note[],
) {
  queryClient.setQueryData<Note[]>(notesKeys.campaign(campaignId), (prev) =>
    prev ? updater(prev) : prev,
  );
  if (verseId !== null) {
    queryClient.setQueryData<Note[]>(notesKeys.verse(verseId), (prev) =>
      prev ? updater(prev) : prev,
    );
  }
}

export function applyNoteEventToCaches(
  queryClient: QueryClient,
  event: NoteCreatedEvent | NoteUpdatedEvent | NoteDeletedEvent,
) {
  if (event.type === 'note_created') {
    const { note } = event;
    applyToCaches(queryClient, note.campaignId, note.verseId, (prev) =>
      [note, ...prev.filter((n) => n.id !== note.id)],
    );
  } else if (event.type === 'note_updated') {
    const { note } = event;
    applyToCaches(queryClient, note.campaignId, note.verseId, (prev) =>
      prev.map((n) => (n.id === note.id ? note : n)),
    );
  } else if (event.type === 'note_deleted') {
    applyToCaches(queryClient, event.campaignId, event.verseId, (prev) =>
      prev.filter((n) => n.id !== event.noteId),
    );
  }
}

export function connectSSE(queryClient: QueryClient, onFatalError?: SseFatalErrorHandler) {
  if (eventSource) return;

  eventSource = new EventSource(apiUrl('/sse/progress'));

  eventSource.addEventListener('progress', (e) => {
    const event = parseOrFail((e as MessageEvent).data, onFatalError);
    if (!event) return;
    if (event.type === 'status_changed') {
      queryClient.invalidateQueries({ queryKey: ['progress', event.locationDn] });
      queryClient.invalidateQueries({ queryKey: ['progress', 'batch'] });
      queryClient.invalidateQueries({ queryKey: ['remaining', event.locationDn] });
    }
  });

  eventSource.addEventListener('notes', (e) => {
    const event = parseOrFail((e as MessageEvent).data, onFatalError);
    if (!event) return;
    if (
      event.type === 'note_created' ||
      event.type === 'note_updated' ||
      event.type === 'note_deleted'
    ) {
      applyNoteEventToCaches(queryClient, event);
    }
  });

  eventSource.addEventListener('error', () => {
    eventSource?.close();
    eventSource = null;
    setTimeout(() => connectSSE(queryClient, onFatalError), 3000);
  });
}

export function disconnectSSE() {
  eventSource?.close();
  eventSource = null;
}
