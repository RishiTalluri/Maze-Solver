import client from './client';
import { SolveResults, AlgorithmKey, Grid, TerrainGrid, Experiment } from '../types';

export const solveApi = {
  solve: (payload: {
    grid: Grid;
    start: [number, number];
    goals: [number, number][];
    algorithms: AlgorithmKey[];
    terrain_data?: TerrainGrid | null;
    terrain_costs?: Record<string, number> | null;
    maze_id?: string;
  }) => client.post<SolveResults>('/solve', payload),

  listAlgorithms: () =>
    client.get<{ algorithms: { key: AlgorithmKey; name: string; optimal: boolean; weighted: boolean }[] }>('/algorithms'),
};

export const experimentsApi = {
  list: (page = 1) =>
    client.get<{ items: Experiment[]; total: number; page: number; pages: number }>('/experiments', { params: { page } }),

  create: (maze_id: string, algorithms: AlgorithmKey[], name?: string) =>
    client.post<{ experiment: Experiment; runs: any[]; raw_results: SolveResults }>('/experiments', {
      maze_id, algorithms, name,
    }),

  get: (id: string) =>
    client.get<Experiment>(`/experiments/${id}`),

  delete: (id: string) =>
    client.delete(`/experiments/${id}`),

  exportCsv: (id: string) =>
    client.get(`/experiments/${id}/export`, { responseType: 'blob' }),
};
