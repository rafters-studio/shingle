/**
 * Legion API client for the dashboard.
 * Connects to legion serve at the configured base URL.
 * SSE at /sse pushes full array replacements every 2s for: agents, feed, tasks.
 */

const DEFAULT_BASE = 'http://localhost:3131';

export interface Agent {
  name: string;
  status: string;
  repo: string;
  last_seen?: string;
}

export interface Task {
  id: string;
  title: string;
  agent: string;
  status: 'pending' | 'accepted' | 'in-progress' | 'blocked' | 'in-review' | 'needs-input' | 'done' | 'cancelled';
  priority?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FeedItem {
  id: string;
  from: string;
  text: string;
  timestamp: string;
  repo?: string;
  type?: string;
}

export interface Signal {
  id: string;
  from: string;
  to: string;
  verb: string;
  status?: string;
  text: string;
  timestamp: string;
}

export interface HealthData {
  cpu: number;
  memory: number;
  swap: number;
  load: number[];
  temp?: number;
  pressure?: number;
  agent_count: number;
}

export interface SearchResult {
  id: string;
  agent: string;
  content: string;
  score: number;
  repo?: string;
}

export interface Stats {
  agents: Record<string, { tokens_in: number; tokens_out: number; reflections: number }>;
}

export interface Workload {
  agent: string;
  pending: number;
  active: number;
  done: number;
}

type SSEEventType = 'agents' | 'feed' | 'tasks';
type SSEHandler = (data: unknown) => void;

export function createLegionClient(baseUrl: string = DEFAULT_BASE) {
  const listeners = new Map<SSEEventType, Set<SSEHandler>>();
  let eventSource: EventSource | null = null;

  async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(path, baseUrl);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Legion API ${path}: ${res.status}`);
    return res.json();
  }

  async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    const res = await fetch(new URL(path, baseUrl).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Legion API POST ${path}: ${res.status}`);
    return res.json();
  }

  return {
    agents: () => get<Agent[]>('/api/agents'),
    tasks: () => get<Task[]>('/api/tasks'),
    feed: (filter?: 'signals' | 'musings', repo?: string) => {
      const params: Record<string, string> = {};
      if (filter) params.filter = filter;
      if (repo) params.repo = repo;
      return get<FeedItem[]>('/api/feed', params);
    },
    signals: () => get<Signal[]>('/api/signals'),
    health: () => get<HealthData>('/api/health'),
    stats: () => get<Stats>('/api/stats'),
    status: () => get<Record<string, unknown>>('/api/status'),
    workloads: () => get<Workload[]>('/api/kanban/workloads'),
    search: (q: string, repo?: string, limit?: number) => {
      const params: Record<string, string> = { q };
      if (repo) params.repo = repo;
      if (limit) params.limit = String(limit);
      return get<SearchResult[]>('/api/search', params);
    },
    postSignal: (text: string, repo: string) =>
      post<{ ok: boolean }>('/api/post', { text, repo }),
    moveTask: (id: string, status: string) =>
      post<{ ok: boolean }>(`/api/kanban/${id}/move`, { status }),

    subscribe(event: SSEEventType, handler: SSEHandler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);

      if (!eventSource) {
        eventSource = new EventSource(`${baseUrl}/sse`);
        for (const type of ['agents', 'feed', 'tasks'] as SSEEventType[]) {
          eventSource.addEventListener(type, (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            listeners.get(type)?.forEach(fn => fn(data));
          });
        }
        eventSource.onerror = () => {
          eventSource?.close();
          eventSource = null;
          setTimeout(() => {
            listeners.forEach((handlers, type) => {
              handlers.forEach(h => this.subscribe(type, h));
            });
          }, 5000);
        };
      }
      return () => {
        listeners.get(event)?.delete(handler);
        const empty = [...listeners.values()].every(s => s.size === 0);
        if (empty && eventSource) {
          eventSource.close();
          eventSource = null;
        }
      };
    },

    disconnect() {
      eventSource?.close();
      eventSource = null;
      listeners.clear();
    },
  };
}

export type LegionClient = ReturnType<typeof createLegionClient>;
