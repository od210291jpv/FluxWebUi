import React, { useState } from 'react';
import type { QueuedTaskInfo } from '../../types';
import { PromptModal } from './PromptModal';

const aspectRatioLabel = (w: number, h: number): string => {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(w, h);
  return `${w / d}:${h / d}`;
};

const statusConfig: Record<
  QueuedTaskInfo['status'],
  { label: string; bg: string; text: string; dot: string }
> = {
  queued:    { label: 'Queued',    bg: 'bg-yellow-900/40', text: 'text-yellow-300', dot: 'bg-yellow-400' },
  running:   { label: 'Running',   bg: 'bg-violet-900/40', text: 'text-violet-300', dot: 'bg-violet-400 animate-pulse' },
  completed: { label: 'Completed', bg: 'bg-green-900/30',  text: 'text-green-300',  dot: 'bg-green-400' },
  failed:    { label: 'Failed',    bg: 'bg-red-900/30',    text: 'text-red-300',    dot: 'bg-red-400' },
};

interface TaskCardProps {
  task: QueuedTaskInfo;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const [showPrompt, setShowPrompt] = useState(false);

  const cfg = statusConfig[task.status];
  const progressPercent =
    task.progress_step !== null && task.progress_total
      ? Math.round((task.progress_step / task.progress_total) * 100)
      : 0;

  const loraName = task.lora_path ? task.lora_path.split('/').pop()?.replace(/\.[^/.]+$/, '') ?? task.lora_path : null;
  const modelShort = task.model ? task.model.split('/').pop() ?? task.model : '—';
  const ar = aspectRatioLabel(task.width, task.height);

  return (
    <>
      {showPrompt && (
        <PromptModal prompt={task.prompt} onClose={() => setShowPrompt(false)} />
      )}
      <div className={`rounded-xl border border-gray-700 bg-gray-900 p-4 flex flex-col gap-3`}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
            <span className={`text-xs font-semibold ${cfg.text}`}>{cfg.label}</span>
          </div>
          <button
            onClick={() => setShowPrompt(true)}
            className="text-xs text-gray-400 hover:text-violet-300 transition-colors border border-gray-700 hover:border-violet-700 rounded px-2 py-0.5 shrink-0"
            title="View full prompt"
          >
            Prompt ↗
          </button>
        </div>

        {/* Prompt preview */}
        <p className="text-sm text-gray-300 line-clamp-2 leading-snug">{task.prompt}</p>

        {/* Progress bar (only for running tasks) */}
        {task.status === 'running' && (
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Step {task.progress_step ?? 0} / {task.progress_total ?? '?'}</span>
              <span className="text-violet-400 font-medium">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {task.status === 'failed' && task.error && (
          <p className="text-xs text-red-400 bg-red-950/30 rounded px-2 py-1 break-words">{task.error}</p>
        )}

        {/* Metadata chips */}
        <div className="flex flex-wrap gap-2">
          <Chip label="Model" value={modelShort} />
          <Chip label="AR" value={ar} />
          <Chip label="Size" value={`${task.width}×${task.height}`} />
          <Chip label="Steps" value={String(task.num_inference_steps ?? '—')} />
          <Chip label="CFG" value={task.guidance_scale != null ? task.guidance_scale.toFixed(1) : '—'} />
          <Chip label="LoRA" value={loraName ?? 'None'} dimmed={!loraName} />
          {loraName && <Chip label="LoRA scale" value={task.lora_scale.toFixed(2)} />}
        </div>
      </div>
    </>
  );
};

interface ChipProps {
  label: string;
  value: string;
  dimmed?: boolean;
}

const Chip: React.FC<ChipProps> = ({ label, value, dimmed }) => (
  <div className={`flex items-center gap-1 text-xs rounded px-2 py-0.5 border ${dimmed ? 'border-gray-800 bg-gray-900 text-gray-600' : 'border-gray-700 bg-gray-800 text-gray-300'}`}>
    <span className="text-gray-500">{label}:</span>
    <span className="font-medium truncate max-w-[120px]">{value}</span>
  </div>
);

interface TaskQueuePanelProps {
  tasks: QueuedTaskInfo[];
}

export const TaskQueuePanel: React.FC<TaskQueuePanelProps> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-600">
        <svg className="w-12 h-12 mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">No tasks yet</p>
        <p className="text-xs mt-1 text-gray-700">Submit a generation to see it here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.task_id} task={task} />
      ))}
    </div>
  );
};
