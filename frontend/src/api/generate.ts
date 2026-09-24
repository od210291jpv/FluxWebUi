import { apiClient } from './client';
import type { GenerateRequest, TaskResponse, TaskDetailsResponse, UploadedImageResponse } from '../types';

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

export const uploadImage = async (file: File): Promise<UploadedImageResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<UploadedImageResponse>('/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};
