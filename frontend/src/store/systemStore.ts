import { create } from 'zustand';
import type { SystemStatus, ModelInfo, LoraInfo } from '../types';
import { getSystemStatus, getModels, getLoras } from '../api/system';

interface SystemState {
  status: SystemStatus | null;
  models: ModelInfo[];
  loras: LoraInfo[];
  connected: boolean;

  fetchStatus: () => Promise<void>;
  fetchModels: () => Promise<void>;
  fetchLoras: () => Promise<void>;
  setConnected: (connected: boolean) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  status: null,
  models: [],
  loras: [],
  connected: false,

  fetchStatus: async () => {
    try {
      const status = await getSystemStatus();
      set({ status });
    } catch (e) {
      console.error(e);
    }
  },

  fetchModels: async () => {
    try {
      const res = await getModels();
      set({ models: res.models });
    } catch (e) {
      console.error(e);
    }
  },

  fetchLoras: async () => {
    try {
      const res = await getLoras();
      set({ loras: res.loras });
    } catch (e) {
      console.error(e);
    }
  },

  setConnected: (connected) => set({ connected }),
}));
