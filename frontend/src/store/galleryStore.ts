import { create } from 'zustand';
import type { GalleryItem } from '../types';
import { listImages, deleteImage } from '../api/gallery';

interface GalleryState {
  items: GalleryItem[];
  total: number;
  page: number;
  perPage: number;
  search: string;
  loading: boolean;

  fetchImages: () => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  setSearch: (search: string) => void;
  setPage: (page: number) => void;
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  perPage: 20,
  search: '',
  loading: false,

  fetchImages: async () => {
    const { page, perPage, search } = get();
    set({ loading: true });
    try {
      const res = await listImages(page, perPage, search);
      set({ items: res.items, total: res.total, page: res.page, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  deleteImage: async (id: string) => {
    try {
      await deleteImage(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        total: state.total - 1,
      }));
    } catch (e) {
      console.error(e);
    }
  },

  setSearch: (search: string) => {
    set({ search, page: 1 });
    get().fetchImages();
  },

  setPage: (page: number) => {
    set({ page });
    get().fetchImages();
  }
}));
