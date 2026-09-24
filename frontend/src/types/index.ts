export interface GenerateRequest {
  prompt: string;
  model: string;
  width: number;
  height: number;
  num_inference_steps: number;
  guidance_scale: number;
  seed: number | null;
  max_sequence_length?: number;
  lora_path: string | null;
  lora_scale: number;
  mode: 'generate' | 'edit';
  input_image_id: string | null;
}

export interface TaskResponse {
  task_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  position?: number;
}

export interface TaskResult {
  image_url: string;
  seed: number;
  generation_time_s: number;
}

export interface TaskDetailsResponse {
  task_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result: TaskResult | null;
  error: string | null;
}

export interface GalleryItem {
  id: string;
  image_url: string;
  prompt: string;
  model: string;
  seed: number;
  steps: number;
  guidance: number;
  time: number;
  mode: string;
}

export interface GalleryListResponse {
  items: GalleryItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface SystemStatus {
  gpu_name: string;
  vram_used_gb: number;
  vram_total_gb: number;
  loaded_model: string | null;
  queue_depth: number;
  gpu_load_percent: number;
  cpu_percent: number;
  ram_used_gb: number;
  ram_total_gb: number;
  cpu_info: string;
}

export interface ModelDefaults {
  steps: number;
  guidance_scale: number;
}

export interface ModelInfo {
  id: string;
  path: string;
  defaults: ModelDefaults;
}

export interface ModelsResponse {
  models: ModelInfo[];
}

export interface LoraInfo {
  name: string;
  path: string;
}

export interface LorasResponse {
  loras: LoraInfo[];
}

export interface UploadedImageResponse {
  image_id: string;
  filename: string;
}

export interface TaskQueuedEvent {
  type: 'task_queued';
  task_id: string;
  position: number;
}

export interface TaskStartedEvent {
  type: 'task_started';
  task_id: string;
}

export interface TaskProgressEvent {
  type: 'task_progress';
  task_id: string;
  step: number;
  total_steps: number;
}

export interface TaskCompletedEvent {
  type: 'task_completed';
  task_id: string;
  image_url: string;
  seed: number;
  generation_time_s: number;
}

export interface TaskFailedEvent {
  type: 'task_failed';
  task_id: string;
  error: string;
}

export type WebSocketEvent =
  | TaskQueuedEvent
  | TaskStartedEvent
  | TaskProgressEvent
  | TaskCompletedEvent
  | TaskFailedEvent;

export interface QueuedTaskInfo {
  task_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  position?: number;
  prompt: string;
  model: string | null;
  width: number;
  height: number;
  num_inference_steps: number | null;
  guidance_scale: number | null;
  lora_path: string | null;
  lora_scale: number;
  mode: string;
  progress_step: number | null;
  progress_total: number | null;
  error: string | null;
  created_at: string;
}

export interface TasksListResponse {
  tasks: QueuedTaskInfo[];
}
