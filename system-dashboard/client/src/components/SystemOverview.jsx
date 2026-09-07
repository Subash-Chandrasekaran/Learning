import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Server, ShieldCheck, Activity, Clock, Terminal, Zap } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function SystemOverview({ overviewData, historyData }) {
  if (!overviewData) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Activity className="w-6 h-6 animate-spin mr-3 text-brand-blue" />
        <span>Gathering System Hardware Telemetry...</span>
      </div>
    );
  }

  const { cpu, memory, disk, os } = overviewData;

  const formatUptime = (seconds) => {
    if (!seconds) return '0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const formatGB = (bytes) => {
    if (!bytes) return '0 GB';
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Specs Banner */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-brand-blue/20 rounded-xl text-brand-cyan border border-brand-blue/30">
              <Server className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{os.hostname}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-200">
                  <ShieldCheck className="w-4 h-4 text-brand-emerald" />
                  {os.distro} {os.release} ({os.arch})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 font-mono text-slate-300">
                  <Cpu className="w-4 h-4 text-brand-purple" />
                  {cpu.brand} ({cpu.cores} Cores)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-4 h-4 text-brand-amber" />
                  Uptime: {formatUptime(os.uptimeSeconds)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="px-4 py-2 rounded-xl bg-dark-800/80 border border-slate-700/60 text-right">
              <div className="text-xs text-slate-400">Kernel Version</div>
              <div className="text-sm font-mono font-medium text-slate-200">{os.kernel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Gauge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CPU Card */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand-blue/20 text-brand-blue rounded-xl">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">CPU Utilization</h3>
                <p className="text-xs text-slate-400">{cpu.cores} Physical Cores @ {cpu.speed} GHz</p>
              </div>
            </div>
            <span className="text-2xl font-bold font-mono text-brand-cyan">{cpu.currentLoad}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-dark-900 rounded-full h-3 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-brand-blue to-brand-cyan h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, cpu.currentLoad)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-400 pt-1">
            <span>User Load: {cpu.loadUser}%</span>
            <span>System Load: {cpu.loadSystem}%</span>
          </div>
        </div>

        {/* RAM Card */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand-purple/20 text-brand-purple rounded-xl">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">System Memory</h3>
                <p className="text-xs text-slate-400">{formatGB(memory.usedBytes)} / {formatGB(memory.totalBytes)}</p>
              </div>
            </div>
            <span className="text-2xl font-bold font-mono text-brand-purple">{memory.usedPercentage}%</span>
          </div>

          <div className="w-full bg-dark-900 rounded-full h-3 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-brand-purple to-brand-rose h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, memory.usedPercentage)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-400 pt-1">
            <span>Free RAM: {formatGB(memory.freeBytes)}</span>
            <span>Active: {formatGB(memory.activeBytes)}</span>
          </div>
        </div>

        {/* Disk Space Card */}
        <div className="glass-card glass-card-hover rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-brand-emerald/20 text-brand-emerald rounded-xl">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Storage ({disk.mount})</h3>
                <p className="text-xs text-slate-400">{formatGB(disk.usedBytes)} / {formatGB(disk.sizeBytes)}</p>
              </div>
            </div>
            <span className="text-2xl font-bold font-mono text-brand-emerald">{disk.usedPercentage}%</span>
          </div>

          <div className="w-full bg-dark-900 rounded-full h-3 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-brand-emerald to-brand-cyan h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, disk.usedPercentage)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-400 pt-1">
            <span>Available: {formatGB(disk.availableBytes)}</span>
            <span>Used: {disk.usedPercentage}%</span>
          </div>
        </div>

      </div>

      {/* Live Telemetry Chart */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-brand-blue" />
            <h3 className="font-semibold text-white">Live CPU & Memory Load Timeline</h3>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-brand-cyan">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan inline-block" />
              CPU Load (%)
            </span>
            <span className="flex items-center gap-1.5 text-brand-purple">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-purple inline-block" />
              RAM Used (%)
            </span>
          </div>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData || []}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#475569" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 100]} stroke="#475569" fontSize={11} tickLine={false} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#121824', borderColor: '#2a364f', borderRadius: '12px', color: '#fff' }}
              />
              <Area type="monotone" dataKey="cpu" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorCpu)" name="CPU %" />
              <Area type="monotone" dataKey="ram" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorMem)" name="RAM %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
