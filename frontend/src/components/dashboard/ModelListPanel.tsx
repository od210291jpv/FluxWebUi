import React from 'react';
import type { ModelInfo, SystemStatus } from '../../types';

interface ModelListPanelProps {
  models: ModelInfo[];
  status: SystemStatus | null;
}

export const ModelListPanel: React.FC<ModelListPanelProps> = ({ models, status }) => {
  const loadedModel = status?.loaded_model ?? null;

  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-900 rounded-xl border border-gray-700">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-300">Models</h3>
        <span className="ml-auto text-xs text-gray-600 bg-gray-800 border border-gray-700 rounded-full px-2 py-0.5">
          {models.length}
        </span>
      </div>

      {models.length === 0 ? (
        <p className="text-xs text-gray-600 py-2">No models found in cache directory.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {models.map((model) => {
            const isLoaded = loadedModel
              ? loadedModel.endsWith(model.id) || model.id.endsWith(loadedModel) || loadedModel === model.id
              : false;

            return (
              <div
                key={model.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                  isLoaded
                    ? 'border-violet-700 bg-violet-950/40'
                    : 'border-gray-800 bg-gray-950/50'
                }`}
              >
                <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${isLoaded ? 'bg-violet-400 shadow-[0_0_6px_rgba(167,139,250,0.8)]' : 'bg-gray-700'}`} />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={`text-sm font-medium truncate ${isLoaded ? 'text-violet-200' : 'text-gray-400'}`}>
                    {model.id}
                    {isLoaded && (
                      <span className="ml-2 text-[10px] text-violet-400 bg-violet-900/60 px-1.5 py-0.5 rounded font-semibold align-middle">
                        LOADED
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-600 truncate">{model.path}</span>
                  <div className="flex gap-3 mt-1">
                    <span className="text-xs text-gray-600">
                      Steps: <span className="text-gray-500">{model.defaults.steps}</span>
                    </span>
                    <span className="text-xs text-gray-600">
                      CFG: <span className="text-gray-500">{model.defaults.guidance_scale}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
