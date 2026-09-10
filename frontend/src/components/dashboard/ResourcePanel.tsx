import React from 'react';
import type { SystemStatus } from '../../types';

interface GaugeBarProps {
  percent: number;
  colorClass?: string;
}

const GaugeBar: React.FC<GaugeBarProps> = ({ percent, colorClass = 'bg-violet-500' }) => (
  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
    />
  </div>
);

interface MetricRowProps {
  label: string;
  value: string;
  subValue?: string;
  percent?: number;
  colorClass?: string;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, subValue, percent, colorClass }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-baseline">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <div className="text-right">
        <span className="text-sm text-gray-200 font-semibold">{value}</span>
        {subValue && <span className="text-xs text-gray-500 ml-1">{subValue}</span>}
      </div>
    </div>
    {percent !== undefined && <GaugeBar percent={percent} colorClass={colorClass} />}
  </div>
);

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, icon, children }) => (
  <div className="flex flex-col gap-3 p-4 bg-gray-900 rounded-xl border border-gray-700">
    <div className="flex items-center gap-2">
      <span className="text-violet-400">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
    </div>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

const GpuIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
  </svg>
);

const CpuIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
      d="M9 3v2m6-2v2M9 19v2m6-2v2M3 9h2m-2 6h2m14-6h2m-2 6h2M7 7h10a2 2 0 012 2v6a2 2 0 01-2 2H7a2 2 0 01-2-2V9a2 2 0 012-2zm0 0V5m10 2V5M7 19v-2m10 2v-2" />
  </svg>
);

interface ResourcePanelProps {
  status: SystemStatus | null;
}

export const ResourcePanel: React.FC<ResourcePanelProps> = ({ status }) => {
  if (!status) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-gray-900 rounded-xl border border-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }

  const vramPct = status.vram_total_gb > 0
    ? (status.vram_used_gb / status.vram_total_gb) * 100
    : 0;
  const ramPct = status.ram_total_gb > 0
    ? (status.ram_used_gb / status.ram_total_gb) * 100
    : 0;

  const hasGpu = status.vram_total_gb > 0;

  return (
    <div className="flex flex-col gap-3">
      {/* GPU section */}
      <Section title="GPU" icon={<GpuIcon />}>
        <p className="text-xs text-gray-400 truncate" title={status.gpu_name}>{status.gpu_name}</p>
        {hasGpu ? (
          <>
            <MetricRow
              label="GPU Load"
              value={`${status.gpu_load_percent.toFixed(0)}%`}
              percent={status.gpu_load_percent}
              colorClass="bg-violet-500"
            />
            <MetricRow
              label="VRAM"
              value={`${status.vram_used_gb.toFixed(1)} GB`}
              subValue={`/ ${status.vram_total_gb.toFixed(1)} GB`}
              percent={vramPct}
              colorClass={
                vramPct > 90 ? 'bg-red-500' : vramPct > 70 ? 'bg-yellow-500' : 'bg-violet-500'
              }
            />
          </>
        ) : (
          <p className="text-xs text-gray-600">No CUDA GPU detected</p>
        )}
      </Section>

      {/* CPU section */}
      <Section title="CPU" icon={<CpuIcon />}>
        <p className="text-xs text-gray-400 truncate" title={status.cpu_info}>{status.cpu_info}</p>
        <MetricRow
          label="CPU Load"
          value={`${status.cpu_percent.toFixed(0)}%`}
          percent={status.cpu_percent}
          colorClass={
            status.cpu_percent > 90 ? 'bg-red-500' : status.cpu_percent > 60 ? 'bg-yellow-500' : 'bg-sky-500'
          }
        />
        <MetricRow
          label="RAM"
          value={`${status.ram_used_gb.toFixed(1)} GB`}
          subValue={`/ ${status.ram_total_gb.toFixed(1)} GB`}
          percent={ramPct}
          colorClass={
            ramPct > 90 ? 'bg-red-500' : ramPct > 70 ? 'bg-yellow-500' : 'bg-sky-500'
          }
        />
      </Section>
    </div>
  );
};
