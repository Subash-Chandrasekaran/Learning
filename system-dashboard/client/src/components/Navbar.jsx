import React from 'react';
import { Cpu, HardDrive, Package, Activity, Bot, ShieldCheck, RefreshCw } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, liveMetrics, ollamaStatus, onRefresh }) {
  const cpuLoad = liveMetrics?.overview?.cpu?.currentLoad || 0;
  const memUsedPct = liveMetrics?.overview?.memory?.usedPercentage || 0;
  const ollamaOnline = ollamaStatus?.online;

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-slate-800/80 bg-dark-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue via-brand-purple to-brand-cyan p-0.5 flex items-center justify-center shadow-lg shadow-brand-blue/20">
              <div className="w-full h-full bg-dark-900 rounded-[10px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-brand-cyan animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                Antigravity System Agent
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-blue/20 text-brand-cyan font-mono border border-brand-blue/30">
                  v1.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">Software Inventory, Extensions & Ollama Telemetry</p>
            </div>
          </div>

          {/* Quick Metrics Badges */}
          <div className="hidden md:flex items-center space-x-4">
            
            {/* CPU Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-dark-800/80 border border-slate-700/50">
              <Cpu className="w-4 h-4 text-brand-blue" />
              <div className="text-xs">
                <span className="text-slate-400">CPU: </span>
                <span className={`font-mono font-semibold ${cpuLoad > 80 ? 'text-brand-rose' : 'text-slate-200'}`}>
                  {cpuLoad}%
                </span>
              </div>
            </div>

            {/* RAM Badge */}
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-dark-800/80 border border-slate-700/50">
              <HardDrive className="w-4 h-4 text-brand-purple" />
              <div className="text-xs">
                <span className="text-slate-400">RAM: </span>
                <span className={`font-mono font-semibold ${memUsedPct > 90 ? 'text-brand-rose' : 'text-slate-200'}`}>
                  {memUsedPct}%
                </span>
              </div>
            </div>

            {/* Ollama Status Badge */}
            <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              ollamaOnline 
                ? 'bg-brand-emerald/10 border-brand-emerald/30 text-brand-emerald' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400'
            }`}>
              <Bot className="w-4 h-4" />
              <span>Ollama: {ollamaOnline ? 'Active' : 'Offline'}</span>
              <span className={`w-2 h-2 rounded-full ${ollamaOnline ? 'bg-brand-emerald animate-ping' : 'bg-slate-500'}`} />
            </div>

            {/* Refresh button */}
            <button
              onClick={onRefresh}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-dark-700 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

          </div>

        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-t border-slate-800/60 pt-2 pb-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'System Telemetry', icon: Activity },
            { id: 'inventory', label: 'Installed Apps & Extensions', icon: Package },
            { id: 'processes', label: 'Resource Consumers', icon: Cpu },
            { id: 'ollama', label: 'Ollama Monitor & Actions', icon: Bot, highlight: true }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? tab.highlight 
                      ? 'bg-gradient-to-r from-brand-blue/30 to-brand-purple/30 text-white border border-brand-blue/40 shadow-sm'
                      : 'bg-brand-blue/20 text-brand-cyan border border-brand-blue/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? (tab.highlight ? 'text-brand-cyan' : 'text-brand-blue') : ''}`} />
                <span>{tab.label}</span>
                {tab.highlight && !isActive && (
                  <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
