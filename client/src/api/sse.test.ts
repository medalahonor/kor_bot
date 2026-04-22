import { QueryClient } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import type { Note } from '@tg/shared';
import { applyNoteEventToCaches } from './sse';
import { notesKeys } from './queries';

const CAMPAIGN_ID = 1;
const VERSE_ID = 50;

const existingAttached: Note = {
  id: 1,
  campaignId: CAMPAIGN_ID,
  type: 'quest',
  body: 'old',
  verseId: VERSE_ID,
  path: [{ locationDn: 105, verseDn: 1 }],
  locationName: 'Вагенбург',
  createdAt: '2026-04-20T10:00:00Z',
};

const existingUnattached: Note = {
  id: 2,
  campaignId: CAMPAIGN_ID,
  type: 'hint',
  body: 'old hint',
  verseId: null,
  path: null,
  locationName: null,
  createdAt: '2026-04-20T11:00:00Z',
};

describe('applyNoteEventToCaches', () => {
  let qc: QueryClient;

  beforeEach(() => {
    qc = new QueryClient();
    qc.setQueryData<Note[]>(notesKeys.campaign(CAMPAIGN_ID), [existingAttached, existingUnattached]);
    qc.setQueryData<Note[]>(notesKeys.verse(VERSE_ID), [existingAttached]);
  });

  it('note_created: prepends new attached note to both caches', () => {
    const note: Note = {
      id: 3,
      campaignId: CAMPAIGN_ID,
      type: 'general',
      body: 'new',
      verseId: VERSE_ID,
      path: [{ locationDn: 105, verseDn: 1 }],
      locationName: 'Вагенбург',
      createdAt: '2026-04-20T12:00:00Z',
    };
    applyNoteEventToCaches(qc, { type: 'note_created', note });

    expect(qc.getQueryData<Note[]>(notesKeys.campaign(CAMPAIGN_ID))).toEqual([
      note,
      existingAttached,
      existingUnattached,
    ]);
    expect(qc.getQueryData<Note[]>(notesKeys.verse(VERSE_ID))).toEqual([note, existingAttached]);
  });

  it('note_created: unattached note only touches campaign cache', () => {
    const note: Note = {
      id: 4,
      campaignId: CAMPAIGN_ID,
      type: 'hint',
      body: 'free',
      verseId: null,
      path: null,
      locationName: null,
      createdAt: '2026-04-20T13:00:00Z',
    };
    const verseBefore = qc.getQueryData<Note[]>(notesKeys.verse(VERSE_ID));
    applyNoteEventToCaches(qc, { type: 'note_created', note });

    expect(qc.getQueryData<Note[]>(notesKeys.campaign(CAMPAIGN_ID))?.[0]).toStrictEqual(note);
    expect(qc.getQueryData<Note[]>(notesKeys.verse(VERSE_ID))).toBe(verseBefore);
  });

  it('note_created: noop when cache is empty (no observer)', () => {
    const empty = new QueryClient();
    const note: Note = { ...existingAttached, id: 99 };
    applyNoteEventToCaches(empty, { type: 'note_created', note });
    expect(empty.getQueryData<Note[]>(notesKeys.campaign(CAMPAIGN_ID))).toBeUndefined();
  });

  it('note_updated: replaces note by id in both caches', () => {
    const updated: Note = { ...existingAttached, body: 'new body', type: 'hint' };
    applyNoteEventToCaches(qc, { type: 'note_updated', note: updated });

    expect(qc.getQueryData<Note[]>(notesKeys.campaign(CAMPAIGN_ID))?.[0]).toEqual(updated);
    expect(qc.getQueryData<Note[]>(notesKeys.verse(VERSE_ID))).toEqual([updated]);
  });

  it('note_deleted: removes note from both caches', () => {
    applyNoteEventToCaches(qc, {
      type: 'note_deleted',
      noteId: existingAttached.id,
      campaignId: CAMPAIGN_ID,
      verseId: VERSE_ID,
    });

    expect(qc.getQueryData<Note[]>(notesKeys.campaign(CAMPAIGN_ID))).toEqual([existingUnattached]);
    expect(qc.getQueryData<Note[]>(notesKeys.verse(VERSE_ID))).toEqual([]);
  });

  it('note_deleted: null verseId skips verse cache', () => {
    const verseBefore = qc.getQueryData<Note[]>(notesKeys.verse(VERSE_ID));
    applyNoteEventToCaches(qc, {
      type: 'note_deleted',
      noteId: existingUnattached.id,
      campaignId: CAMPAIGN_ID,
      verseId: null,
    });

    expect(qc.getQueryData<Note[]>(notesKeys.campaign(CAMPAIGN_ID))).toEqual([existingAttached]);
    expect(qc.getQueryData<Note[]>(notesKeys.verse(VERSE_ID))).toBe(verseBefore);
  });
});
