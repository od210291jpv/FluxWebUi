import { apiClient } from './client';
import type { SystemStatus, ModelsResponse, LorasResponse } from '../types';

export const getSystemStatus = async (): Promise<SystemStatus> => {
  const { data } = await apiClient.get<SystemStatus>('/system/status');
  return data;
};

export const getModels = async (): Promise<ModelsResponse> => {
  const { data } = await apiClient.get<ModelsResponse>('/system/models');
  return data;
};

export const getLoras = async (): Promise<LorasResponse> => {
  const { data } = await apiClient.get<LorasResponse>('/system/loras');
  return data;
};
