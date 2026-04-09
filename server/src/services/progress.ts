import type { PrismaClient } from '@prisma/client';
import { sseBroker } from '../sse/broker.js';
import { buildGraph } from './graph.js';
import { findDescendantOptionIds } from './graph-utils.js';
import type { ProgressEvent, OptionStatus } from '../types/index.js';

async function getOptionDetails(prisma: PrismaClient, optionId: number) {
  return prisma.options.findUniqueOrThrow({
    where: { id: optionId },
    include: {
      verse: {
        include: { location: true },
      },
    },
  });
}

function broadcastStatusChange(
  optionId: number,
  status: OptionStatus,
  locationDn: number,
  verseDn: number,
  telegramId: bigint | null,
) {
  const event: ProgressEvent = {
    type: 'status_changed',
    optionId,
    status,
    locationDn,
    verseDn,
    by: telegramId?.toString() ?? '',
    timestamp: new Date().toISOString(),
  };
  sseBroker.broadcast(event);
}

export async function setOptionStatus(
  prisma: PrismaClient,
  optionId: number,
  status: OptionStatus,
  telegramId: bigint | null,
) {
  const option = await getOptionDetails(prisma, optionId);
  const locationDn = option.verse.location.display_number;
  const verseDn = option.verse.display_number;

  // requirements_not_met — атрибут конкретного выбора, не свойство пути,
  // поэтому каскад не применяется.
  if (status === 'requirements_not_met') {
    await prisma.progress.upsert({
      where: { option_id: optionId },
      update: { status, visited_at: new Date(), visited_by: telegramId },
      create: { option_id: optionId, status, visited_by: telegramId },
    });
    broadcastStatusChange(optionId, status, locationDn, verseDn, telegramId);
    return;
  }

  const { graph } = await buildGraph(
    prisma,
    option.verse.location.campaign_id,
    locationDn,
  );
  const descendants = findDescendantOptionIds(graph, optionId);
  await batchSetStatus(prisma, [optionId, ...descendants], status, telegramId);
}

export async function batchSetStatus(
  prisma: PrismaClient,
  optionIds: number[],
  status: OptionStatus,
  telegramId: bigint | null,
) {
  await prisma.$transaction(async (tx) => {
    for (const optionId of optionIds) {
      if (status === 'available') {
        await tx.progress.deleteMany({
          where: { option_id: optionId },
        });
      } else {
        await tx.progress.upsert({
          where: { option_id: optionId },
          update: { status, visited_at: new Date(), visited_by: telegramId },
          create: { option_id: optionId, status, visited_by: telegramId },
        });
      }
    }
  });

  // Fetch option details for SSE broadcasting
  const options = await prisma.options.findMany({
    where: { id: { in: optionIds } },
    include: {
      verse: {
        include: { location: true },
      },
    },
  });

  const seenLocations = new Set<number>();
  for (const opt of options) {
    const locationDn = opt.verse.location.display_number;
    if (seenLocations.has(locationDn)) continue;
    seenLocations.add(locationDn);
    broadcastStatusChange(
      opt.id,
      status,
      locationDn,
      opt.verse.display_number,
      telegramId,
    );
  }
}
