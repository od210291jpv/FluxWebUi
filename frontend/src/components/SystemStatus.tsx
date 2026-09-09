import React, { useEffect } from 'react';
import { useSystemStore } from '../store/systemStore';

export const SystemStatusPanel: React.FC = () => {
  const { status, connected, fetchStatus } = useSystemStore();

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-gray-950 border-t border-gray-800 flex items-center justify-between px-4 text-xs z-40">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2" title={connected ? 'Connected to backend' : 'Disconnected'}>
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-gray-400 font-medium">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {status && (
          <>
            <div className="hidden sm:flex items-center gap-2 border-l border-gray-800 pl-4">
              <span className="text-gray-500">GPU:</span>
              <span className="text-gray-300 truncate max-w-[200px]">{status.gpu_name}</span>
            </div>
            
            <div className="hidden md:flex items-center gap-2 border-l border-gray-800 pl-4">
              <span className="text-gray-500">VRAM:</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-violet-500" 
                    style={{ width: `${(status.vram_used_gb / status.vram_total_gb) * 100}%` }}
                  />
                </div>
                <span className="text-gray-300">{status.vram_used_gb.toFixed(1)} / {status.vram_total_gb.toFixed(1)} GB</span>
              </div>
            </div>
            
            {status.loaded_model && (
              <div className="hidden lg:flex items-center gap-2 border-l border-gray-800 pl-4">
                <span className="text-gray-500">Loaded:</span>
                <span className="text-gray-300 text-purple-400">{status.loaded_model}</span>
              </div>
            )}
          </>
        )}
      </div>
      
      {status && status.queue_depth > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Queue:</span>
          <span className="bg-violet-900 text-violet-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
            {status.queue_depth}
          </span>
        </div>
      )}
    </div>
  );
};
