import type { PrismaClient } from '@prisma/client';
import type { NotePath } from '@tg/shared';
import { isNotePathBackfilled } from '@tg/shared';
import { resolveNotePathOptionIds } from './resolveNotePathOptionIds.js';

export interface BackfillOptions {
  dryRun?: boolean;
  logger?: (msg: string) => void;
}

export interface BackfillBackupEntry {
  note_id: number;
  campaign_id: number;
  old_path: NotePath;
}

export interface BackfillResult {
  scanned: number;
  alreadyBackfilled: number;
  updated: number;
  deleted: number;
  backup: BackfillBackupEntry[];
  deletedNoteIds: number[];
}

export async function runBackfill(
  prisma: PrismaClient,
  options: BackfillOptions = {},
): Promise<BackfillResult> {
  const { dryRun = false, logger = () => {} } = options;
  const result: BackfillResult = {
    scanned: 0,
    alreadyBackfilled: 0,
    updated: 0,
    deleted: 0,
    backup: [],
    deletedNoteIds: [],
  };

  const allNotes = await prisma.notes.findMany({
    select: { id: true, campaign_id: true, path: true },
  });
  const notes = allNotes.filter(
    (n: { path: unknown }) => n.path !== null && n.path !== undefined,
  );

  for (const note of notes) {
    result.scanned++;
    const oldPath = note.path as unknown as NotePath;

    if (isNotePathBackfilled(oldPath)) {
      result.alreadyBackfilled++;
      continue;
    }

    result.backup.push({ note_id: note.id, campaign_id: note.campaign_id, old_path: oldPath });

    const resolved = await resolveNotePathOptionIds(prisma, note.campaign_id, oldPath);

    if (resolved === null) {
      result.deleted++;
      result.deletedNoteIds.push(note.id);
      logger(`note ${note.id}: unresolvable path, deleting`);
      if (!dryRun) {
        await prisma.notes.delete({ where: { id: note.id } });
      }
      continue;
    }

    result.updated++;
    logger(`note ${note.id}: backfilled with optionIds`);
    if (!dryRun) {
      await prisma.notes.update({
        where: { id: note.id },
        data: { path: resolved as never },
      });
    }
  }

  return result;
}
