import React, { useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { GeneratePage } from './pages/GeneratePage';
import { GalleryPage } from './pages/GalleryPage';
import { SystemStatusPanel } from './components/SystemStatus';
import { wsManager } from './api/ws';
import { useSystemStore } from './store/systemStore';
import { useGenerationStore } from './store/generationStore';

export const App: React.FC = () => {
  const { fetchModels, fetchLoras, setConnected } = useSystemStore();
  const { updateTaskStatus, updateProgress, setResult } = useGenerationStore();

  useEffect(() => {
    fetchModels();
    fetchLoras();

    wsManager.onConnectionChange = setConnected;
    wsManager.connect();

    const unsubscribe = wsManager.subscribe((event) => {
      switch (event.type) {
        case 'task_queued':
          updateTaskStatus('queued', event.task_id, event.position);
          break;
        case 'task_started':
          updateTaskStatus('running', event.task_id);
          break;
        case 'task_progress':
          updateProgress(event.step, event.total_steps);
          break;
        case 'task_completed':
          updateTaskStatus('completed', event.task_id);
          setResult({
            imageUrl: event.image_url,
            seed: event.seed,
            time: event.generation_time_s
          });
          break;
        case 'task_failed':
          updateTaskStatus('failed', event.task_id, undefined, event.error);
          break;
      }
    });

    return () => {
      unsubscribe();
      wsManager.disconnect();
    };
  }, [fetchModels, fetchLoras, setConnected, updateTaskStatus, updateProgress, setResult]);

  return (
    <div className="flex flex-col h-screen w-full bg-gray-950 text-gray-100 overflow-hidden font-sans selection:bg-violet-500/30">
      <header className="h-14 flex items-center justify-between px-6 bg-gray-950 border-b border-gray-800 shrink-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg">
            F
          </div>
          <span className="font-bold tracking-tight text-lg">Flux Web UI</span>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <NavLink 
            to="/" 
            className={({isActive}) => `transition-colors hover:text-violet-400 ${isActive ? 'text-violet-500' : 'text-gray-400'}`}
          >
            Generate
          </NavLink>
          <NavLink 
            to="/gallery" 
            className={({isActive}) => `transition-colors hover:text-violet-400 ${isActive ? 'text-violet-500' : 'text-gray-400'}`}
          >
            Gallery
          </NavLink>
        </nav>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<GeneratePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
        </Routes>
      </main>

      <SystemStatusPanel />
    </div>
  );
};
