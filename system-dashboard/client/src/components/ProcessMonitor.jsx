import React, { useState } from 'react';
import { Cpu, HardDrive, AlertTriangle, XCircle, Search, RefreshCw, Layers } from 'lucide-react';

export default function ProcessMonitor({ processesData, onKillProcess, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmKill, setConfirmKill] = useState(null);

  if (!processesData) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Cpu className="w-6 h-6 animate-spin mr-3 text-brand-blue" />
        <span>Scanning active background processes and resource footprints...</span>
      </div>
    );
  }

  const formatMB = (bytes) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  let filtered = processesData;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.command && p.command.toLowerCase().includes(q)) ||
      p.pid.toString().includes(q)
    );
  }

  const handleKill = async (pid) => {
    await onKillProcess(pid);
    setConfirmKill(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="glass-card rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-brand-blue" />
            Process Resource Consumption Monitor
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of active applications, background daemons, and extension helper processes.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search process by name or PID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-900 border border-slate-700/70 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-blue"
            />
          </div>
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-dark-800 border border-slate-700/70 text-slate-300 hover:text-white hover:border-brand-blue transition-all"
            title="Refresh Processes"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top Consumers Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-dark-800/90 text-xs text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono">
              <tr>
                <th className="px-6 py-3.5">PID</th>
                <th className="px-6 py-3.5">Process Name</th>
                <th className="px-6 py-3.5">CPU Load</th>
                <th className="px-6 py-3.5">RAM Usage %</th>
                <th className="px-6 py-3.5">Memory RSS</th>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No active processes matching search query.
                  </td>
                </tr>
              ) : (
                filtered.map((proc) => {
                  const isHighCpu = proc.cpu > 25;
                  const isHighMem = proc.mem > 10;
                  return (
                    <tr key={proc.pid} className="hover:bg-dark-800/50 transition-colors">
                      
                      {/* PID */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-400 font-semibold">
                        {proc.pid}
                      </td>

                      {/* Name & Command snippet */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${isHighCpu || isHighMem ? 'bg-brand-rose/20 text-brand-rose' : 'bg-dark-800 text-brand-blue'}`}>
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center gap-2">
                              {proc.name}
                              {isHighCpu && (
                                <span className="px-2 py-0.5 rounded text-[10px] bg-brand-rose/20 text-brand-rose border border-brand-rose/30 font-mono">
                                  HIGH CPU
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 font-mono max-w-md truncate">
                              {proc.command || proc.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* CPU */}
                      <td className="px-6 py-4 font-mono text-sm">
                        <span className={`font-semibold ${isHighCpu ? 'text-brand-rose font-bold' : 'text-brand-cyan'}`}>
                          {proc.cpu}%
                        </span>
                      </td>

                      {/* RAM % */}
                      <td className="px-6 py-4 font-mono text-sm">
                        <span className={`font-semibold ${isHighMem ? 'text-brand-rose font-bold' : 'text-brand-purple'}`}>
                          {proc.mem}%
                        </span>
                      </td>

                      {/* Memory RSS */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {formatMB(proc.memRssBytes)}
                      </td>

                      {/* User */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        {proc.user}
                      </td>

                      {/* Kill Action */}
                      <td className="px-6 py-4 text-right">
                        {confirmKill === proc.pid ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleKill(proc.pid)}
                              className="px-2.5 py-1 text-xs font-semibold rounded bg-brand-rose text-white hover:bg-rose-700 transition-colors"
                            >
                              Confirm Kill
                            </button>
                            <button
                              onClick={() => setConfirmKill(null)}
                              className="px-2.5 py-1 text-xs font-medium rounded bg-dark-700 text-slate-300 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmKill(proc.pid)}
                            className="p-1.5 text-slate-400 hover:text-brand-rose rounded-lg hover:bg-brand-rose/10 transition-colors"
                            title="Kill Process"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
