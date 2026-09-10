import { apiClient } from './client';
import type { TasksListResponse } from '../types';

export const getAllTasks = async (): Promise<TasksListResponse> => {
  const { data } = await apiClient.get<TasksListResponse>('/tasks');
  return data;
};
