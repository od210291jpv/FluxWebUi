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

export interface QueuedTask {
  task_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  prompt: string;
  position?: number;
  progress?: number;
  totalSteps?: number;
  error?: string;
  /** Timestamp (ms) when the task reached a terminal state, used for auto-cleanup. */
  completedAt?: number;
}

interface LastResult {
  imageUrl: string;
  seed: number;
  time: number;
}

interface GenerationState {
  prompt: string;
  parameters: GenerationParameters;
  /** True only during the brief HTTP POST to /api/generate. */
  isSubmitting: boolean;
  /** All tasks the user has submitted in this session. */
  queuedTasks: QueuedTask[];
  lastResult: LastResult | null;
  
  setPrompt: (prompt: string) => void;
  setParameter: <K extends keyof GenerationParameters>(key: K, value: GenerationParameters[K]) => void;
  submitGeneration: () => Promise<void>;
  updateTaskStatus: (taskId: string, status: QueuedTask['status'], position?: number, error?: string) => void;
  updateTaskProgress: (taskId: string, step: number, total: number) => void;
  setResult: (taskId: string, result: LastResult) => void;
  reuseSeed: (seed: number) => void;
  /** Remove completed/failed tasks older than the given age (ms). */
  pruneFinishedTasks: (maxAgeMs?: number) => void;
}

const PRUNE_DELAY_MS = 8_000;

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
  isSubmitting: false,
  queuedTasks: [],
  lastResult: null,

  setPrompt: (prompt) => set({ prompt }),
  setParameter: (key, value) => 
    set((state) => ({ parameters: { ...state.parameters, [key]: value } })),
  
  submitGeneration: async () => {
    const { prompt, parameters } = get();
    if (!prompt || !parameters.model) return;

    const seed = parameters.seedMode === 'fixed' ? parameters.seed : null;

    set({ isSubmitting: true });
    try {
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
      // Add the new task to the queue list
      set((state) => ({
        queuedTasks: [
          ...state.queuedTasks,
          {
            task_id: res.task_id,
            status: res.status,
            prompt,
            position: res.position,
          },
        ],
      }));
    } catch (e: any) {
      // Show a transient error — don't add a broken task to the list
      console.error('Generation submit failed:', e.message);
    } finally {
      set({ isSubmitting: false });
    }
  },

  updateTaskStatus: (taskId, status, position, error) =>
    set((state) => ({
      queuedTasks: state.queuedTasks.map((t) =>
        t.task_id === taskId
          ? {
              ...t,
              status,
              ...(position !== undefined && { position }),
              ...(error !== undefined && { error }),
              ...(status === 'completed' || status === 'failed'
                ? { completedAt: Date.now() }
                : {}),
            }
          : t
      ),
    })),
  
  updateTaskProgress: (taskId, step, totalSteps) =>
    set((state) => ({
      queuedTasks: state.queuedTasks.map((t) =>
        t.task_id === taskId
          ? { ...t, status: 'running' as const, progress: step, totalSteps }
          : t
      ),
    })),

  setResult: (_taskId, result) => set({ lastResult: result }),

  reuseSeed: (seed) => set((state) => ({ 
    parameters: { ...state.parameters, seedMode: 'fixed', seed } 
  })),

  pruneFinishedTasks: (maxAgeMs = PRUNE_DELAY_MS) => {
    const now = Date.now();
    set((state) => ({
      queuedTasks: state.queuedTasks.filter(
        (t) => !t.completedAt || now - t.completedAt < maxAgeMs
      ),
    }));
  },
}));
