import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SystemOverview from './components/SystemOverview';
import InstalledInventory from './components/InstalledInventory';
import ProcessMonitor from './components/ProcessMonitor';
import OllamaHub from './components/OllamaHub';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewData, setOverviewData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [processesData, setProcessesData] = useState(null);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [ollamaModels, setOllamaModels] = useState([]);
  const [ollamaRunning, setOllamaRunning] = useState([]);
  const [historyData, setHistoryData] = useState([]);

  // Fetch initial telemetry data
  const fetchData = async () => {
    try {
      const [overviewRes, inventoryRes, processesRes, statusRes, modelsRes, psRes] = await Promise.all([
        fetch('/api/system/overview').then(r => r.json()),
        fetch('/api/inventory').then(r => r.json()),
        fetch('/api/system/processes').then(r => r.json()),
        fetch('/api/ollama/status').then(r => r.json()),
        fetch('/api/ollama/models').then(r => r.json()),
        fetch('/api/ollama/ps').then(r => r.json())
      ]);

      setOverviewData(overviewRes);
      setInventoryData(inventoryRes);
      setProcessesData(processesRes);
      setOllamaStatus(statusRes);
      setOllamaModels(modelsRes);
      setOllamaRunning(psRes);

      // Append to live history
      if (overviewRes?.cpu && overviewRes?.memory) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setHistoryData(prev => [
          ...prev.slice(-19),
          { time: timeStr, cpu: overviewRes.cpu.currentLoad, ram: overviewRes.memory.usedPercentage }
        ]);
      }
    } catch (err) {
      console.error('Error fetching dashboard telemetry:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to SSE Metrics Stream
    const eventSource = new EventSource('/api/stream/metrics');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.overview) {
          setOverviewData(data.overview);
          const timeStr = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setHistoryData(prev => [
            ...prev.slice(-19),
            { time: timeStr, cpu: data.overview.cpu.currentLoad, ram: data.overview.memory.usedPercentage }
          ]);
        }
        if (data.runningOllama) {
          setOllamaRunning(data.runningOllama);
        }
      } catch (e) {}
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Action handlers
  const handleKillProcess = async (pid) => {
    try {
      const res = await fetch(`/api/system/process/${pid}`, { method: 'DELETE' });
      if (res.ok) {
        setProcessesData(prev => prev.filter(p => p.pid !== pid));
      }
    } catch (e) {}
  };

  const handleStartOllama = async () => {
    try {
      await fetch('/api/ollama/start', { method: 'POST' });
      setTimeout(fetchData, 2000);
    } catch (e) {}
  };

  const handleStopModel = async (model) => {
    try {
      await fetch('/api/ollama/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      fetchData();
    } catch (e) {}
  };

  const handleDeleteModel = async (model) => {
    try {
      await fetch('/api/ollama/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model })
      });
      fetchData();
    } catch (e) {}
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col font-sans">
      
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        liveMetrics={{ overview: overviewData }}
        ollamaStatus={ollamaStatus}
        onRefresh={fetchData}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {activeTab === 'overview' && (
          <SystemOverview overviewData={overviewData} historyData={historyData} />
        )}

        {activeTab === 'inventory' && (
          <InstalledInventory inventoryData={inventoryData} />
        )}

        {activeTab === 'processes' && (
          <ProcessMonitor
            processesData={processesData}
            onKillProcess={handleKillProcess}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'ollama' && (
          <OllamaHub
            ollamaStatus={ollamaStatus}
            modelsList={ollamaModels}
            runningModels={ollamaRunning}
            onRefresh={fetchData}
            onStartServer={handleStartOllama}
            onStopModel={handleStopModel}
            onDeleteModel={handleDeleteModel}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="glass-card border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Antigravity Agentic System Dashboard & Ollama Intelligence Monitor</span>
          <span className="font-mono text-slate-400">Node v26.8.1 • macOS {overviewData?.os?.release || 'ARM64'}</span>
        </div>
      </footer>

    </div>
  );
}
