import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'node:fs';
import { runBackfill } from '../src/services/backfillNotePaths.js';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const prisma = new PrismaClient();

  console.log(`backfill-note-path-optionids: starting (dryRun=${dryRun})`);

  try {
    const result = await runBackfill(prisma, {
      dryRun,
      logger: (msg) => console.log(`  ${msg}`),
    });

    if (result.backup.length > 0) {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const fname = `backfill-backup-${ts}.json`;
      writeFileSync(fname, JSON.stringify(result.backup, null, 2));
      console.log(`backup saved: ${fname}`);
    }

    console.log('summary:');
    console.log(`  scanned: ${result.scanned}`);
    console.log(`  alreadyBackfilled: ${result.alreadyBackfilled}`);
    console.log(`  updated: ${result.updated}`);
    console.log(`  deleted: ${result.deleted}`);
    if (result.deletedNoteIds.length > 0) {
      console.log(`  deletedNoteIds: ${result.deletedNoteIds.join(', ')}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('backfill failed:', err);
  process.exit(1);
});
