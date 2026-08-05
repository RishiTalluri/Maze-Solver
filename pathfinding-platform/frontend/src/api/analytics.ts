import client from './client';
import { DashboardData, AlgorithmStats, GlobalStats } from '../types';

export const analyticsApi = {
  getDashboard: () =>
    client.get<DashboardData>('/analytics/dashboard'),

  getAlgorithmStats: () =>
    client.get<{ data: AlgorithmStats[] }>('/analytics/algorithms'),

  getMazeStats: () =>
    client.get<{
      difficulty_distribution: { difficulty: string; count: number }[];
      size_stats: { avg_cells: number; max_cells: number; min_cells: number };
    }>('/analytics/mazes'),

  getGlobalStats: () =>
    client.get<GlobalStats>('/analytics/global'),
};
