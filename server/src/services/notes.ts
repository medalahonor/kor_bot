import type { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { sseBroker } from '../sse/broker.js';
import type { Note, NoteType, NotePath, NotePathStep, SseEvent } from '@tg/shared';

type NoteRow = {
  id: number;
  campaign_id: number;
  type: string;
  body: string;
  verse_id: number | null;
  path: unknown;
  created_at: Date;
  verse?: {
    id: number;
    display_number: number;
    location: { id: number; display_number: number; name: string };
  } | null;
};

const noteInclude = {
  verse: { include: { location: true } },
} as const;

function toDto(row: NoteRow): Note {
  const verse = row.verse ?? null;
  return {
    id: row.id,
    campaignId: row.campaign_id,
    type: row.type as NoteType,
    body: row.body,
    verseId: row.verse_id,
    path: (row.path as NotePath | null) ?? null,
    locationName: verse ? verse.location.name : null,
    createdAt: row.created_at.toISOString(),
  };
}

function broadcast(event: SseEvent) {
  sseBroker.broadcast(event);
}

export async function listCampaignNotes(
  prisma: PrismaClient,
  campaignId: number,
  type?: NoteType,
): Promise<Note[]> {
  const rows = await prisma.notes.findMany({
    where: { campaign_id: campaignId, ...(type ? { type } : {}) },
    orderBy: { created_at: 'desc' },
    include: noteInclude,
  });
  return (rows as NoteRow[]).map(toDto);
}

export async function listVerseNotes(
  prisma: PrismaClient,
  verseId: number,
): Promise<Note[]> {
  const rows = await prisma.notes.findMany({
    where: { verse_id: verseId },
    orderBy: { created_at: 'desc' },
    include: noteInclude,
  });
  return (rows as NoteRow[]).map(toDto);
}

async function resolveTargetVerseId(
  prisma: PrismaClient,
  campaignId: number,
  target: NotePathStep,
): Promise<number> {
  const location = await prisma.locations.findUnique({
    where: {
      campaign_id_display_number: {
        campaign_id: campaignId,
        display_number: target.locationDn,
      },
    },
    select: { id: true },
  });
  if (!location) {
    throw Object.assign(new Error('Location not found'), { code: 'P2025' });
  }
  const verse = await prisma.verses.findUnique({
    where: {
      location_id_display_number: {
        location_id: location.id,
        display_number: target.verseDn,
      },
    },
    select: { id: true },
  });
  if (!verse) {
    throw Object.assign(new Error('Verse not found'), { code: 'P2025' });
  }
  return verse.id;
}

export async function createNote(
  prisma: PrismaClient,
  campaignId: number,
  data: { type: NoteType; body: string; path?: NotePath | null },
): Promise<Note> {
  let verseId: number | null = null;
  const path = data.path ?? null;
  if (path && path.length > 0) {
    verseId = await resolveTargetVerseId(prisma, campaignId, path[path.length - 1]);
  }
  const row = await prisma.notes.create({
    data: {
      campaign_id: campaignId,
      type: data.type,
      body: data.body,
      verse_id: verseId,
      ...(path ? { path: path as unknown as Prisma.InputJsonValue } : {}),
    },
    include: noteInclude,
  });
  const note = toDto(row as NoteRow);
  broadcast({ type: 'note_created', note });
  return note;
}

export async function updateNote(
  prisma: PrismaClient,
  noteId: number,
  data: { type: NoteType; body: string },
): Promise<Note> {
  const row = await prisma.notes.update({
    where: { id: noteId },
    data: { type: data.type, body: data.body },
    include: noteInclude,
  });
  const note = toDto(row as NoteRow);
  broadcast({ type: 'note_updated', note });
  return note;
}

export async function deleteNote(
  prisma: PrismaClient,
  noteId: number,
): Promise<void> {
  const removed = (await prisma.notes.delete({ where: { id: noteId } })) as NoteRow;
  broadcast({
    type: 'note_deleted',
    noteId: removed.id,
    campaignId: removed.campaign_id,
    verseId: removed.verse_id,
  });
}
