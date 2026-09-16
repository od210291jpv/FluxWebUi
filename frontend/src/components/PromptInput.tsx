import React, { useRef, useEffect } from 'react';
import { useGenerationStore } from '../store/generationStore';

export const PromptInput: React.FC = () => {
  const { prompt, setPrompt, submitGeneration, isSubmitting } = useGenerationStore();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isSubmitting) {
        submitGeneration();
      }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 80)}px`;
    }
  }, [prompt]);

  return (
    <div className="relative flex flex-col w-full bg-gray-900 rounded-xl border border-gray-700 p-2 shadow-sm focus-within:ring-2 focus-within:ring-violet-500 focus-within:border-violet-500 transition-all">
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe the image you want to generate..."
        className="w-full bg-transparent text-gray-100 placeholder-gray-500 resize-none outline-none p-2 min-h-[80px]"
        rows={3}
      />
      <div className="absolute bottom-2 right-3 text-xs text-gray-500 font-mono">
        {prompt.length} / 2000
      </div>
    </div>
  );
};
