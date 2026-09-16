import React, { useEffect } from 'react';
import { useGenerationStore } from '../store/generationStore';
import { useSystemStore } from '../store/systemStore';

const aspectRatios = [
  { label: '1:1', w: 1024, h: 1024 },
  { label: '16:9', w: 1344, h: 768 },
  { label: '9:16', w: 768, h: 1344 },
  { label: '4:3', w: 1152, h: 864 },
  { label: '3:2', w: 1216, h: 832 },
  { label: '2:3', w: 832, h: 1216 },
];

export const ParameterPanel: React.FC = () => {
  const { parameters, setParameter, lastResult } = useGenerationStore();
  const { models, loras } = useSystemStore();

  useEffect(() => {
    if (models.length > 0 && !parameters.model) {
      setParameter('model', models[0].id);
      setParameter('steps', models[0].defaults.steps);
      setParameter('guidance_scale', models[0].defaults.guidance_scale);
    }
  }, [models, parameters.model, setParameter]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setParameter('model', val);
    const model = models.find((m) => m.id === val);
    if (model) {
      setParameter('steps', model.defaults.steps);
      setParameter('guidance_scale', model.defaults.guidance_scale);
    }
  };

  const isSchnell = parameters.model.toLowerCase().includes('schnell');

  return (
    <div className="flex flex-col gap-6 p-4 bg-gray-900 rounded-xl border border-gray-700">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-400">Model</label>
        <select
          value={parameters.model}
          onChange={handleModelChange}
          className="bg-gray-800 border border-gray-600 rounded-lg p-2 text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.id}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-400">Aspect Ratio</label>
        <div className="grid grid-cols-3 gap-2">
          {aspectRatios.map((ar) => (
            <button
              key={ar.label}
              onClick={() => { setParameter('width', ar.w); setParameter('height', ar.h); }}
              className={`py-1 text-xs rounded border transition-colors ${
                parameters.width === ar.w && parameters.height === ar.h
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {ar.label}
            </button>
          ))}
        </div>
        <div className="flex gap-4 mt-2">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs text-gray-500">Width</label>
            <input type="number" value={parameters.width} min={256} max={2048} step={16}
                   onChange={(e) => setParameter('width', Number(e.target.value))}
                   className="bg-gray-800 border border-gray-600 rounded p-1 text-sm text-gray-100 text-center w-full focus:ring-2 focus:ring-violet-500 outline-none" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs text-gray-500">Height</label>
            <input type="number" value={parameters.height} min={256} max={2048} step={16}
                   onChange={(e) => setParameter('height', Number(e.target.value))}
                   className="bg-gray-800 border border-gray-600 rounded p-1 text-sm text-gray-100 text-center w-full focus:ring-2 focus:ring-violet-500 outline-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-400">Inference Steps</label>
          <input type="number" value={parameters.steps} min={1} max={100}
                 onChange={(e) => setParameter('steps', Number(e.target.value))}
                 className="bg-gray-800 border border-gray-600 rounded p-1 w-16 text-sm text-center focus:ring-2 focus:ring-violet-500 outline-none" />
        </div>
        <input type="range" min={1} max={50} value={parameters.steps}
               onChange={(e) => setParameter('steps', Number(e.target.value))}
               className="w-full accent-violet-500" />
      </div>

      {!isSchnell && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-400">Guidance Scale</label>
            <input type="number" value={parameters.guidance_scale} min={0} max={20} step={0.1}
                   onChange={(e) => setParameter('guidance_scale', Number(e.target.value))}
                   className="bg-gray-800 border border-gray-600 rounded p-1 w-16 text-sm text-center focus:ring-2 focus:ring-violet-500 outline-none" />
          </div>
          <input type="range" min={0} max={10} step={0.1} value={parameters.guidance_scale}
                 onChange={(e) => setParameter('guidance_scale', Number(e.target.value))}
                 className="w-full accent-violet-500" />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-400">Seed</label>
          <div className="flex gap-2">
            <button onClick={() => setParameter('seedMode', 'random')}
                    className={`px-2 py-1 text-xs rounded border ${parameters.seedMode === 'random' ? 'bg-violet-600 border-violet-500' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
              🎲 Random
            </button>
            <button onClick={() => setParameter('seedMode', 'fixed')}
                    className={`px-2 py-1 text-xs rounded border ${parameters.seedMode === 'fixed' ? 'bg-violet-600 border-violet-500' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
              📌 Fixed
            </button>
          </div>
        </div>
        {parameters.seedMode === 'fixed' && (
          <div className="flex gap-2">
            <input type="number" value={parameters.seed || 0}
                   onChange={(e) => setParameter('seed', Number(e.target.value))}
                   className="flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-sm text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none" />
            {lastResult && (
              <button onClick={() => setParameter('seed', lastResult.seed)}
                      className="px-3 bg-gray-700 hover:bg-gray-600 rounded text-xs border border-gray-600 transition-colors">
                Reuse Last
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-400">LoRA</label>
        <select
          value={parameters.lora || ''}
          onChange={(e) => setParameter('lora', e.target.value || null)}
          className="bg-gray-800 border border-gray-600 rounded-lg p-2 text-gray-100 focus:ring-2 focus:ring-violet-500 outline-none"
        >
          <option value="">None</option>
          {loras.map((l) => (
            <option key={l.path} value={l.path}>{l.name}</option>
          ))}
        </select>
        {parameters.lora && (
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-gray-500 w-12 text-right">{parameters.loraScale.toFixed(2)}</span>
            <input type="range" min={0} max={1} step={0.05} value={parameters.loraScale}
                   onChange={(e) => setParameter('loraScale', Number(e.target.value))}
                   className="flex-1 accent-violet-500" />
          </div>
        )}
      </div>
    </div>
  );
};
