import client from './client';
import { Maze, MazeSummary, Paginated, Grid, TerrainGrid, SharedLink } from '../types';

export interface CreateMazePayload {
  name: string;
  description?: string;
  rows: number;
  cols: number;
  grid_data: Grid;
  terrain_data?: TerrainGrid | null;
  is_public?: boolean;
  difficulty?: string;
  tags?: string[];
}

export const mazesApi = {
  // Public
  listPublic: (params?: { page?: number; q?: string; difficulty?: string }) =>
    client.get<Paginated<MazeSummary>>('/mazes', { params }),

  getShared: (token: string) =>
    client.get<Maze>(`/mazes/shared/${token}`),

  // Authenticated
  getMine: (page = 1) =>
    client.get<Paginated<MazeSummary>>('/mazes/mine', { params: { page } }),

  get: (id: string) =>
    client.get<Maze>(`/mazes/${id}`),

  create: (payload: CreateMazePayload) =>
    client.post<Maze>('/mazes', payload),

  update: (id: string, payload: Partial<CreateMazePayload>) =>
    client.put<Maze>(`/mazes/${id}`, payload),

  delete: (id: string) =>
    client.delete(`/mazes/${id}`),

  duplicate: (id: string) =>
    client.post<Maze>(`/mazes/${id}/duplicate`),

  createShareLink: (id: string, expires_in_days?: number) =>
    client.post<SharedLink>(`/mazes/${id}/share`, { expires_in_days }),

  // Favorites
  getFavorites: (page = 1) =>
    client.get<Paginated<MazeSummary>>('/mazes/favorites', { params: { page } }),

  addFavorite: (id: string) =>
    client.post(`/mazes/${id}/favorite`),

  removeFavorite: (id: string) =>
    client.delete(`/mazes/${id}/favorite`),
};
