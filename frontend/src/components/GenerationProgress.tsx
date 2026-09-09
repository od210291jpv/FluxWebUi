import React from 'react';
import { useGenerationStore } from '../store/generationStore';

export const GenerationProgress: React.FC = () => {
  const { currentTask } = useGenerationStore();

  if (currentTask.status === 'idle' || currentTask.status === 'completed' || currentTask.status === 'failed') {
    return null;
  }

  const isQueued = currentTask.status === 'queued';
  const progressPercent = currentTask.progress && currentTask.totalSteps
    ? Math.round((currentTask.progress / currentTask.totalSteps) * 100)
    : 0;

  return (
    <div className="w-full flex flex-col items-center justify-center h-full bg-gray-900 rounded-xl border border-gray-800 p-8">
      <div className="w-full max-w-md flex flex-col gap-4 items-center">
        {isQueued ? (
          <>
            <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-lg font-medium text-gray-200">
              Waiting in queue...
            </div>
            {currentTask.position !== undefined && (
              <div className="text-sm text-gray-400">Position: {currentTask.position}</div>
            )}
          </>
        ) : (
          <>
            <div className="w-full flex justify-between text-sm font-medium mb-1">
              <span className="text-gray-300">Generating...</span>
              <span className="text-violet-400">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-purple-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {currentTask.progress !== undefined && currentTask.totalSteps && (
              <div className="text-xs text-gray-500 mt-2">
                Step {currentTask.progress} of {currentTask.totalSteps}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
