import type { QueryClient } from '@tanstack/react-query';
import type { ProgressEvent } from '../lib/types';

let eventSource: EventSource | null = null;

export function connectSSE(queryClient: QueryClient) {
  if (eventSource) return;

  eventSource = new EventSource('/api/sse/progress');

  eventSource.addEventListener('progress', (e) => {
    const event: ProgressEvent = JSON.parse(e.data);
    queryClient.invalidateQueries({ queryKey: ['progress', event.locationDn] });
    queryClient.invalidateQueries({ queryKey: ['progress', 'batch'] });
    queryClient.invalidateQueries({ queryKey: ['remaining', event.locationDn] });
  });

  eventSource.addEventListener('error', () => {
    eventSource?.close();
    eventSource = null;
    setTimeout(() => connectSSE(queryClient), 3000);
  });
}

export function disconnectSSE() {
  eventSource?.close();
  eventSource = null;
}
