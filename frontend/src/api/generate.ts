import { apiClient } from './client';
import type { GenerateRequest, TaskResponse, TaskDetailsResponse } from '../types';

export const submitGeneration = async (request: GenerateRequest): Promise<TaskResponse> => {
  const { data } = await apiClient.post<TaskResponse>('/generate', request);
  return data;
};

export const getTaskStatus = async (taskId: string): Promise<TaskDetailsResponse> => {
  const { data } = await apiClient.get<TaskDetailsResponse>(`/tasks/${taskId}`);
  return data;
};

export const cancelTask = async (taskId: string): Promise<void> => {
  await apiClient.post(`/tasks/${taskId}/cancel`);
};
