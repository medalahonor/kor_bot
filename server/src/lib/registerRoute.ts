import type { FastifyInstance, HTTPMethods, preHandlerHookHandler, RouteHandler } from 'fastify';
import type { ZodTypeAny } from 'zod';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export type RouteSchema = {
  body?: ZodTypeAny;
  querystring?: ZodTypeAny;
  params?: ZodTypeAny;
  headers?: ZodTypeAny;
  response: Record<number, ZodTypeAny>;
};

export type RouteOptions<S extends RouteSchema> = {
  method: HTTPMethods;
  url: string;
  schema: S;
  preHandler?: preHandlerHookHandler | preHandlerHookHandler[];
};

type App = FastifyInstance & { withTypeProvider<T>(): unknown };

export function route<S extends RouteSchema>(
  app: App,
  opts: RouteOptions<S>,
  handler: RouteHandler,
): void {
  (app as unknown as FastifyInstance).route({
    method: opts.method,
    url: opts.url,
    schema: opts.schema as never,
    preHandler: opts.preHandler,
    handler,
  });
}

export type { ZodTypeProvider };
