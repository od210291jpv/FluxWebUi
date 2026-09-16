import React from 'react';
import { PromptInput } from '../components/PromptInput';
import { ParameterPanel } from '../components/ParameterPanel';
import { GenerationProgress } from '../components/GenerationProgress';
import { ImagePreview } from '../components/ImagePreview';
import { QueueIndicator } from '../components/QueueIndicator';
import { useGenerationStore } from '../store/generationStore';

export const GeneratePage: React.FC = () => {
  const { submitGeneration, isSubmitting, queuedTasks, prompt, parameters } = useGenerationStore();
  
  const canGenerate = prompt.trim().length > 0 && parameters.model;
  const activeCount = queuedTasks.filter(
    (t) => t.status === 'queued' || t.status === 'running'
  ).length;

  return (
    <div className="flex flex-col lg:flex-row h-full w-full gap-6 p-4 sm:p-6 pb-12">
      {/* Left Sidebar */}
      <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6 overflow-y-auto">
        <PromptInput />
        <ParameterPanel />
        <button
          onClick={submitGeneration}
          disabled={!canGenerate || isSubmitting}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${
            !canGenerate || isSubmitting
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? 'Submitting...' : activeCount > 0 ? `Generate (${activeCount} in queue)` : 'Generate'}
        </button>
        <QueueIndicator />
      </div>
      
      {/* Right Output Area */}
      <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center relative">
        <GenerationProgress />
        <ImagePreview />
      </div>
    </div>
  );
};
