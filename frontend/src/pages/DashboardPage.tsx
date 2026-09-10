import React, { useEffect, useRef, useState } from 'react';
import { useSystemStore } from '../store/systemStore';
import { ResourcePanel } from '../components/dashboard/ResourcePanel';
import { ModelListPanel } from '../components/dashboard/ModelListPanel';
import { TaskQueuePanel } from '../components/dashboard/TaskQueuePanel';
import { getAllTasks } from '../api/tasks';
import { wsManager } from '../api/ws';
import type { QueuedTaskInfo } from '../types';

const TASK_POLL_MS = 2000;
const STATUS_POLL_MS = 3000;

export const DashboardPage: React.FC = () => {
  const { status, models, fetchStatus, fetchModels } = useSystemStore();
  const [tasks, setTasks] = useState<QueuedTaskInfo[]>([]);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  // Initial fetches
  useEffect(() => {
    fetchModels();
    fetchStatus();
  }, [fetchModels, fetchStatus]);

  // Poll system status
  useEffect(() => {
    const id = setInterval(() => fetchStatus(), STATUS_POLL_MS);
    return () => clearInterval(id);
  }, [fetchStatus]);

  // Poll task list
  const loadTasks = async () => {
    try {
      const res = await getAllTasks();
      setTasks(res.tasks);
    } catch {
      // silently ignore — backend may not be ready yet
    }
  };

  useEffect(() => {
    loadTasks();
    const id = setInterval(loadTasks, TASK_POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Real-time WS updates: patch task progress without waiting for next poll
  useEffect(() => {
    const unsubscribe = wsManager.subscribe((event) => {
      setTasks((prev) => {
        switch (event.type) {
          case 'task_queued':
            // New task will appear on next poll; just trigger a refresh
            setTimeout(loadTasks, 300);
            return prev;

          case 'task_started':
            return prev.map((t) =>
              t.task_id === event.task_id ? { ...t, status: 'running' } : t
            );

          case 'task_progress':
            return prev.map((t) =>
              t.task_id === event.task_id
                ? { ...t, status: 'running', progress_step: event.step, progress_total: event.total_steps }
                : t
            );

          case 'task_completed':
            return prev.map((t) =>
              t.task_id === event.task_id
                ? { ...t, status: 'completed', progress_step: null, progress_total: null }
                : t
            );

          case 'task_failed':
            return prev.map((t) =>
              t.task_id === event.task_id
                ? { ...t, status: 'failed', error: event.error }
                : t
            );

          default:
            return prev;
        }
      });
    });
    return () => unsubscribe();
  }, []);

  const running = tasks.filter((t) => t.status === 'running').length;
  const queued  = tasks.filter((t) => t.status === 'queued').length;

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto p-4 sm:p-6 pb-12">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">System resources &amp; generation queue</p>
        </div>

        {/* Live counters */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {running > 0 && (
            <div className="flex items-center gap-1.5 text-xs bg-violet-900/40 border border-violet-700 text-violet-300 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              {running} running
            </div>
          )}
          {queued > 0 && (
            <div className="flex items-center gap-1.5 text-xs bg-yellow-900/30 border border-yellow-800 text-yellow-300 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              {queued} queued
            </div>
          )}
        </div>
      </div>

      {/*
        Layout:
          mobile          → single column: resources → models → queue
          md (tablet)     → two columns: [resources | queue], models full-width below
          lg (desktop)    → sidebar [resources + models] | main [queue]
      */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4">
          <ResourcePanel status={status} />
          <ModelListPanel models={models} status={status} />
        </div>

        {/* Task queue — main column */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-300">
              Task Queue
              {tasks.length > 0 && (
                <span className="ml-2 text-xs text-gray-600 font-normal">({tasks.length} total)</span>
              )}
            </h2>
            <button
              onClick={loadTasks}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
              title="Refresh"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <TaskQueuePanel tasks={tasks} />
        </div>
      </div>
    </div>
  );
};
