import { create } from 'zustand';
import { submitGeneration } from '../api/generate';

interface GenerationParameters {
  model: string;
  width: number;
  height: number;
  steps: number;
  guidance_scale: number;
  seed: number | null;
  seedMode: 'random' | 'fixed';
  lora: string | null;
  loraScale: number;
}

interface CurrentTask {
  id: string | null;
  status: 'idle' | 'queued' | 'running' | 'completed' | 'failed';
  position?: number;
  progress?: number;
  totalSteps?: number;
  error?: string;
}

interface LastResult {
  imageUrl: string;
  seed: number;
  time: number;
}

interface GenerationState {
  prompt: string;
  parameters: GenerationParameters;
  currentTask: CurrentTask;
  lastResult: LastResult | null;
  
  setPrompt: (prompt: string) => void;
  setParameter: <K extends keyof GenerationParameters>(key: K, value: GenerationParameters[K]) => void;
  submitGeneration: () => Promise<void>;
  updateTaskStatus: (status: CurrentTask['status'], id?: string, position?: number, error?: string) => void;
  updateProgress: (step: number, total: number) => void;
  setResult: (result: LastResult) => void;
  reuseSeed: (seed: number) => void;
}

export const useGenerationStore = create<GenerationState>((set, get) => ({
  prompt: '',
  parameters: {
    model: '',
    width: 1024,
    height: 1024,
    steps: 28,
    guidance_scale: 3.5,
    seed: null,
    seedMode: 'random',
    lora: null,
    loraScale: 0.8,
  },
  currentTask: { id: null, status: 'idle' },
  lastResult: null,

  setPrompt: (prompt) => set({ prompt }),
  setParameter: (key, value) => 
    set((state) => ({ parameters: { ...state.parameters, [key]: value } })),
  
  submitGeneration: async () => {
    const { prompt, parameters } = get();
    if (!prompt || !parameters.model) return;

    const seed = parameters.seedMode === 'fixed' ? parameters.seed : null;

    try {
      set({ currentTask: { id: null, status: 'queued' }, lastResult: null });
      const res = await submitGeneration({
        prompt,
        model: parameters.model,
        width: parameters.width,
        height: parameters.height,
        num_inference_steps: parameters.steps,
        guidance_scale: parameters.guidance_scale,
        seed,
        lora_path: parameters.lora,
        lora_scale: parameters.loraScale,
      });
      set({ currentTask: { id: res.task_id, status: res.status, position: res.position } });
    } catch (e: any) {
      set({ currentTask: { id: null, status: 'failed', error: e.message } });
    }
  },

  updateTaskStatus: (status, id, position, error) => 
    set((state) => ({
      currentTask: {
        ...state.currentTask,
        ...(id !== undefined && { id }),
        status,
        ...(position !== undefined && { position }),
        ...(error !== undefined && { error }),
      }
    })),
  
  updateProgress: (step, totalSteps) => 
    set((state) => ({
      currentTask: { ...state.currentTask, status: 'running', progress: step, totalSteps }
    })),

  setResult: (result) => set({ lastResult: result }),
  reuseSeed: (seed) => set((state) => ({ 
    parameters: { ...state.parameters, seedMode: 'fixed', seed } 
  })),
}));
