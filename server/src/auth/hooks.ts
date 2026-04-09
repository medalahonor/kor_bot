import type { FastifyRequest, FastifyReply } from 'fastify';
import { validateInitData, type TelegramUser } from './telegram.js';
import { config } from '../config.js';

declare module 'fastify' {
  interface FastifyRequest {
    telegramUser: TelegramUser;
    telegramRole: 'admin' | 'player';
  }
}

/**
 * Extract and validate Telegram initData from the X-Telegram-Init-Data header.
 * Decorates request with telegramUser and telegramRole.
 */
function extractTelegramUser(request: FastifyRequest): TelegramUser | null {
  const initData = request.headers['x-telegram-init-data'] as string | undefined;
  if (!initData) return null;

  const result = validateInitData(initData, config.botToken);
  if (!result.valid || !result.user) return null;

  return result.user;
}

function resolveRole(user: TelegramUser): 'admin' | 'player' {
  if (
    config.adminTelegramId !== null &&
    BigInt(user.id) === config.adminTelegramId
  ) {
    return 'admin';
  }
  return 'player';
}

const FAKE_USER: TelegramUser = { id: 1, first_name: 'Dev', username: 'dev' };

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (config.noAuth) {
    request.telegramUser = FAKE_USER;
    request.telegramRole = 'admin';
    return;
  }

  const user = extractTelegramUser(request);
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  request.telegramUser = user;
  request.telegramRole = resolveRole(user);
}

export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  if (config.noAuth) {
    request.telegramUser = FAKE_USER;
    request.telegramRole = 'admin';
    return;
  }

  const user = extractTelegramUser(request);
  if (!user) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  request.telegramUser = user;
  request.telegramRole = resolveRole(user);

  if (request.telegramRole !== 'admin') {
    return reply.status(403).send({ error: 'Admin access required' });
  }
}
