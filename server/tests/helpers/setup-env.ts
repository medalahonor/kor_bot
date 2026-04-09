// Set required env vars before any test imports config.ts
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://fake:fake@localhost:5432/test';
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'test-bot-token';
process.env.ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '111';
