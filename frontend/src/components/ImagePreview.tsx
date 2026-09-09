import React from 'react';
import { useGenerationStore } from '../store/generationStore';

export const ImagePreview: React.FC = () => {
  const { lastResult, currentTask, reuseSeed } = useGenerationStore();

  const handleDownload = async () => {
    if (!lastResult?.imageUrl) return;
    try {
      const response = await fetch(lastResult.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flux-${lastResult.seed}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image', err);
    }
  };

  const handleCopySeed = () => {
    if (lastResult?.seed) {
      navigator.clipboard.writeText(lastResult.seed.toString());
    }
  };

  if (currentTask.status === 'queued' || currentTask.status === 'running') {
    return null; // Handled by GenerationProgress
  }

  if (currentTask.status === 'failed') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 rounded-xl border border-red-900/50 p-8 text-red-400">
        <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <p className="text-lg font-medium">Generation Failed</p>
        <p className="text-sm mt-2 max-w-md text-center">{currentTask.error || 'Unknown error occurred'}</p>
      </div>
    );
  }

  if (!lastResult) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-xl border border-gray-800">
        <p className="text-gray-500 font-medium">Generated image will appear here</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-900 rounded-xl border border-gray-800 overflow-hidden relative group">
      <div className="flex-1 overflow-hidden flex items-center justify-center bg-black/40 p-4">
        <img
          src={lastResult.imageUrl}
          alt="Generated result"
          className="max-w-full max-h-full object-contain rounded drop-shadow-2xl"
        />
      </div>
      
      <div className="bg-gray-900 border-t border-gray-800 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-opacity duration-300">
        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="text-xs text-gray-400 flex gap-3">
            <span>Seed: <span className="text-gray-200">{lastResult.seed}</span></span>
            <span>Time: <span className="text-gray-200">{lastResult.time.toFixed(1)}s</span></span>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto shrink-0">
          <button onClick={handleCopySeed} title="Copy Seed"
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          </button>
          <button onClick={() => reuseSeed(lastResult.seed)} title="Reuse Seed"
                  className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          </button>
          <button onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors font-medium text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Download
          </button>
        </div>
      </div>
    </div>
  );
};
