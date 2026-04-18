import type { QueryClient } from '@tanstack/react-query';
import { SseEventSchema } from '@tg/shared';
import { apiUrl } from './client';

let eventSource: EventSource | null = null;

export type SseFatalErrorKind = 'contract';

export type SseFatalErrorHandler = (kind: SseFatalErrorKind, err: unknown) => void;

export function connectSSE(queryClient: QueryClient, onFatalError?: SseFatalErrorHandler) {
  if (eventSource) return;

  eventSource = new EventSource(apiUrl('/sse/progress'));

  eventSource.addEventListener('progress', (e) => {
    const parsed = SseEventSchema.safeParse(JSON.parse((e as MessageEvent).data));
    if (!parsed.success) {
      console.error('SSE contract error — schema mismatch', parsed.error);
      eventSource?.close();
      eventSource = null;
      onFatalError?.('contract', parsed.error);
      return;
    }
    const event = parsed.data;
    if (event.type === 'status_changed') {
      queryClient.invalidateQueries({ queryKey: ['progress', event.locationDn] });
      queryClient.invalidateQueries({ queryKey: ['progress', 'batch'] });
      queryClient.invalidateQueries({ queryKey: ['remaining', event.locationDn] });
    }
  });

  eventSource.addEventListener('error', () => {
    eventSource?.close();
    eventSource = null;
    setTimeout(() => connectSSE(queryClient, onFatalError), 3000);
  });
}

export function disconnectSSE() {
  eventSource?.close();
  eventSource = null;
}
