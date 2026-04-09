import type { FastifyReply } from 'fastify';
import type { ProgressEvent } from '../types/index.js';

class SSEBroker {
  private clients = new Set<FastifyReply>();
  private heartbeatInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.heartbeatInterval = setInterval(() => {
      for (const reply of this.clients) {
        reply.raw.write(': heartbeat\n\n');
      }
    }, 30_000);
  }

  subscribe(reply: FastifyReply): void {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    this.clients.add(reply);

    reply.raw.on('close', () => {
      this.clients.delete(reply);
    });

    reply.raw.write('event: connected\ndata: {}\n\n');
  }

  broadcast(event: ProgressEvent): void {
    const data = `event: progress\ndata: ${JSON.stringify(event)}\n\n`;
    for (const reply of this.clients) {
      reply.raw.write(data);
    }
  }

  shutdown(): void {
    clearInterval(this.heartbeatInterval);
    for (const reply of this.clients) {
      reply.raw.end();
    }
    this.clients.clear();
  }
}

export const sseBroker = new SSEBroker();
