import React, { useEffect } from 'react';
import { useGenerationStore, type QueuedTask } from '../store/generationStore';
import { useNavigate } from 'react-router-dom';

const STATUS_CONFIG: Record<QueuedTask['status'], { dot: string; label: string }> = {
  queued:    { dot: 'bg-yellow-400',                    label: 'Queued' },
  running:   { dot: 'bg-violet-400 animate-pulse',      label: 'Running' },
  completed: { dot: 'bg-green-400',                     label: 'Done' },
  failed:    { dot: 'bg-red-400',                       label: 'Failed' },
};

const TaskRow: React.FC<{ task: QueuedTask }> = ({ task }) => {
  const cfg = STATUS_CONFIG[task.status];
  const progressPct =
    task.progress && task.totalSteps
      ? Math.round((task.progress / task.totalSteps) * 100)
      : 0;

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-gray-900 border border-gray-800">
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      <span className="text-xs text-gray-400 w-14 shrink-0">{cfg.label}</span>
      <span className="text-xs text-gray-300 truncate flex-1 min-w-0">
        {task.prompt}
      </span>
      {task.status === 'running' && (
        <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden shrink-0">
          <div
            className="h-full bg-violet-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
      {task.status === 'running' && (
        <span className="text-[10px] text-violet-400 font-mono w-8 text-right shrink-0">
          {progressPct}%
        </span>
      )}
      {task.status === 'failed' && task.error && (
        <span className="text-[10px] text-red-400 truncate max-w-[100px]" title={task.error}>
          {task.error}
        </span>
      )}
    </div>
  );
};

export const QueueIndicator: React.FC = () => {
  const { queuedTasks, pruneFinishedTasks } = useGenerationStore();
  const navigate = useNavigate();

  // Auto-prune finished tasks every 2 seconds
  useEffect(() => {
    const id = setInterval(() => pruneFinishedTasks(), 2000);
    return () => clearInterval(id);
  }, [pruneFinishedTasks]);

  if (queuedTasks.length === 0) return null;

  const active = queuedTasks.filter((t) => t.status === 'queued' || t.status === 'running');

  return (
    <div className="w-full flex flex-col gap-2 mt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Queue
          </span>
          {active.length > 0 && (
            <span className="text-[10px] bg-violet-900/40 border border-violet-800 text-violet-300 px-1.5 py-0.5 rounded-full">
              {active.length} active
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-[10px] text-gray-500 hover:text-violet-400 transition-colors"
        >
          View all →
        </button>
      </div>

      {/* Task list */}
      <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
        {queuedTasks.map((task) => (
          <TaskRow key={task.task_id} task={task} />
        ))}
      </div>
    </div>
  );
};
