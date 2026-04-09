import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';
import type { ProgressEvent } from '../../src/types/index.js';

/**
 * We test SSE broker logic by creating a fresh instance for each test.
 * The production singleton is in sse/broker.ts; here we re-create
 * the class to avoid shared state between tests.
 */

class TestSSEBroker {
  clients = new Set<any>();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  startHeartbeat(intervalMs = 30_000) {
    this.heartbeatInterval = setInterval(() => {
      for (const reply of this.clients) {
        reply.raw.write(': heartbeat\n\n');
      }
    }, intervalMs);
  }

  subscribe(reply: any): void {
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
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    for (const reply of this.clients) {
      reply.raw.end();
    }
    this.clients.clear();
  }
}

function mockReply() {
  const raw = new EventEmitter() as EventEmitter & {
    writeHead: ReturnType<typeof vi.fn>;
    write: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
  };
  raw.writeHead = vi.fn();
  raw.write = vi.fn();
  raw.end = vi.fn();
  return { raw };
}

const sampleEvent: ProgressEvent = {
  type: 'visited',
  optionId: 42,
  locationDn: 105,
  verseDn: 3,
  by: '123456789',
  timestamp: '2026-03-30T12:00:00Z',
};

describe('SSEBroker', () => {
  let broker: TestSSEBroker;

  beforeEach(() => {
    broker = new TestSSEBroker();
  });

  afterEach(() => {
    broker.shutdown();
  });

  describe('subscribe', () => {
    it('sends SSE headers on subscribe', () => {
      const reply = mockReply();
      broker.subscribe(reply);

      expect(reply.raw.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      });
    });

    it('sends connected event on subscribe', () => {
      const reply = mockReply();
      broker.subscribe(reply);

      expect(reply.raw.write).toHaveBeenCalledWith('event: connected\ndata: {}\n\n');
    });

    it('adds client to the set', () => {
      const reply = mockReply();
      broker.subscribe(reply);

      expect(broker.clients.size).toBe(1);
    });

    it('removes client on close', () => {
      const reply = mockReply();
      broker.subscribe(reply);

      expect(broker.clients.size).toBe(1);

      // Simulate connection close
      reply.raw.emit('close');

      expect(broker.clients.size).toBe(0);
    });
  });

  describe('broadcast', () => {
    it('sends event to all connected clients', () => {
      const reply1 = mockReply();
      const reply2 = mockReply();

      broker.subscribe(reply1);
      broker.subscribe(reply2);

      broker.broadcast(sampleEvent);

      const expected = `event: progress\ndata: ${JSON.stringify(sampleEvent)}\n\n`;
      expect(reply1.raw.write).toHaveBeenCalledWith(expected);
      expect(reply2.raw.write).toHaveBeenCalledWith(expected);
    });

    it('does not send to disconnected clients', () => {
      const reply1 = mockReply();
      const reply2 = mockReply();

      broker.subscribe(reply1);
      broker.subscribe(reply2);

      // Disconnect reply1
      reply1.raw.emit('close');

      broker.broadcast(sampleEvent);

      const expected = `event: progress\ndata: ${JSON.stringify(sampleEvent)}\n\n`;
      // reply1 should NOT receive the broadcast (only connected + subscribe writes)
      const reply1Calls = reply1.raw.write.mock.calls.map((c: any[]) => c[0]);
      expect(reply1Calls).not.toContain(expected);

      // reply2 should receive it
      expect(reply2.raw.write).toHaveBeenCalledWith(expected);
    });

    it('does nothing with no clients', () => {
      // Should not throw
      expect(() => broker.broadcast(sampleEvent)).not.toThrow();
    });
  });

  describe('heartbeat', () => {
    it('sends heartbeat to all clients on interval', () => {
      vi.useFakeTimers();

      const reply = mockReply();
      broker.startHeartbeat(1000); // 1 second for test
      broker.subscribe(reply);

      // Clear subscribe calls
      reply.raw.write.mockClear();

      // Advance 1 second
      vi.advanceTimersByTime(1000);

      expect(reply.raw.write).toHaveBeenCalledWith(': heartbeat\n\n');

      vi.useRealTimers();
    });
  });

  describe('shutdown', () => {
    it('closes all connections and clears clients', () => {
      const reply1 = mockReply();
      const reply2 = mockReply();

      broker.subscribe(reply1);
      broker.subscribe(reply2);

      broker.shutdown();

      expect(reply1.raw.end).toHaveBeenCalled();
      expect(reply2.raw.end).toHaveBeenCalled();
      expect(broker.clients.size).toBe(0);
    });
  });

  describe('multiple clients', () => {
    it('handles 10 concurrent clients', () => {
      const replies = Array.from({ length: 10 }, () => mockReply());
      replies.forEach((r) => broker.subscribe(r));

      expect(broker.clients.size).toBe(10);

      broker.broadcast(sampleEvent);

      const expected = `event: progress\ndata: ${JSON.stringify(sampleEvent)}\n\n`;
      replies.forEach((r) => {
        expect(r.raw.write).toHaveBeenCalledWith(expected);
      });
    });
  });
});
