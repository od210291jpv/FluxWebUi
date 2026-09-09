import { apiClient } from './client';
import type { GalleryListResponse } from '../types';

export const listImages = async (page = 1, perPage = 20, search = ''): Promise<GalleryListResponse> => {
  const { data } = await apiClient.get<GalleryListResponse>('/gallery', {
    params: { page, per_page: perPage, search },
  });
  return data;
};

export const deleteImage = async (imageId: string): Promise<void> => {
  await apiClient.delete(`/gallery/${imageId}`);
};
