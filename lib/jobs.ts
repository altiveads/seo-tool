import { randomUUID } from 'crypto';
import type { AuditInput, JobState } from './types';

// Persiste el store entre hot-reloads de Next.js en desarrollo
declare global {
  // eslint-disable-next-line no-var
  var __altiveJobStore: Map<string, JobState> | undefined;
}

const store: Map<string, JobState> =
  global.__altiveJobStore ?? new Map<string, JobState>();

if (!global.__altiveJobStore) {
  global.__altiveJobStore = store;
}

export function createJob(input: AuditInput): JobState {
  const job: JobState = {
    id: randomUUID(),
    createdAt: Date.now(),
    status: 'queued',
    progress: 0,
    step: 'En cola',
    input,
  };
  store.set(job.id, job);
  return job;
}

export function getJob(id: string): JobState | undefined {
  return store.get(id);
}

export function updateJob(id: string, patch: Partial<JobState>) {
  const current = store.get(id);
  if (!current) return;
  store.set(id, { ...current, ...patch });
}

export function listJobs(): JobState[] {
  return Array.from(store.values()).sort((a, b) => b.createdAt - a.createdAt);
}

// GC: elimina jobs de más de 2 horas
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [id, job] of store.entries()) {
    if (job.createdAt < cutoff) store.delete(id);
  }
}, 10 * 60 * 1000).unref?.();
