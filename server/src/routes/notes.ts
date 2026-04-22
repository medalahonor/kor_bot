import type { FastifyInstance } from 'fastify';
import {
  GetCampaignNotesContract,
  GetVerseNotesContract,
  CreateNoteContract,
  UpdateNoteContract,
  DeleteNoteContract,
  type CreateNoteBody,
  type UpdateNoteBody,
  type GetCampaignNotesQuery,
} from '@tg/shared';
import { route } from '../lib/registerRoute.js';
import { requireAuth } from '../auth/hooks.js';
import {
  listCampaignNotes,
  listVerseNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../services/notes.js';

export async function notesRoutes(app: FastifyInstance) {
  route(
    app,
    {
      method: 'GET',
      url: '/campaigns/:id/notes',
      schema: GetCampaignNotesContract,
      preHandler: [requireAuth],
    },
    async (request) => {
      const { id } = request.params as { id: number };
      const { type } = request.query as GetCampaignNotesQuery;
      return listCampaignNotes(app.prisma, id, type);
    },
  );

  route(
    app,
    {
      method: 'GET',
      url: '/verses/:verseId/notes',
      schema: GetVerseNotesContract,
      preHandler: [requireAuth],
    },
    async (request) => {
      const { verseId } = request.params as { verseId: number };
      return listVerseNotes(app.prisma, verseId);
    },
  );

  route(
    app,
    {
      method: 'POST',
      url: '/campaigns/:id/notes',
      schema: CreateNoteContract,
      preHandler: [requireAuth],
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      const body = request.body as CreateNoteBody;
      const note = await createNote(app.prisma, id, body);
      return reply.status(201).send(note);
    },
  );

  route(
    app,
    {
      method: 'PUT',
      url: '/notes/:noteId',
      schema: UpdateNoteContract,
      preHandler: [requireAuth],
    },
    async (request) => {
      const { noteId } = request.params as { noteId: number };
      const body = request.body as UpdateNoteBody;
      return updateNote(app.prisma, noteId, body);
    },
  );

  route(
    app,
    {
      method: 'DELETE',
      url: '/notes/:noteId',
      schema: DeleteNoteContract,
      preHandler: [requireAuth],
    },
    async (request) => {
      const { noteId } = request.params as { noteId: number };
      await deleteNote(app.prisma, noteId);
      return { ok: true as const };
    },
  );
}
