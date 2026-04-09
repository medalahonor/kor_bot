import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const noAuth = process.env.NO_AUTH === '1' || process.env.NO_AUTH === 'true';

export const config = {
  databaseUrl: required('DATABASE_URL'),
  botToken: noAuth ? 'dummy' : required('BOT_TOKEN'),
  port: parseInt(process.env.PORT || '3000', 10),
  adminTelegramId: process.env.ADMIN_TELEGRAM_ID
    ? BigInt(process.env.ADMIN_TELEGRAM_ID)
    : null,
  noAuth,
};
