import type { FastifyInstance, FastifyError } from 'fastify';
import {
  hasZodFastifySchemaValidationErrors,
  ResponseSerializationError,
} from 'fastify-type-provider-zod';

export function setupErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | (Error & { code?: string }), _request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({ error: 'Validation error', details: error.validation });
    }

    if (error instanceof ResponseSerializationError) {
      app.log.error({ err: error, cause: error.cause }, 'response schema violation');
      return reply.status(500).send({ error: 'Internal server error' });
    }

    if ('code' in error && typeof error.code === 'string') {
      if (error.code === 'P2025') {
        return reply.status(404).send({ error: 'Not found' });
      }
      if (error.code === 'P2002') {
        return reply.status(409).send({ error: 'Already exists' });
      }
    }

    app.log.error(error);
    const statusCode = 'statusCode' in error ? (error as FastifyError).statusCode : undefined;
    return reply.status(statusCode || 500).send({
      error: statusCode === 401 ? error.message : 'Internal server error',
    });
  });
}
