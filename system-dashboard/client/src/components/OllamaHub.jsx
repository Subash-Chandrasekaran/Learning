import React, { useState, useEffect } from 'react';
import { Bot, Play, Trash2, Download, RefreshCw, Power, Zap, MessageSquare, Terminal, CheckCircle2, AlertCircle, HardDrive, Cpu, ShieldCheck } from 'lucide-react';

export default function OllamaHub({ 
  ollamaStatus, 
  modelsList, 
  runningModels, 
  onRefresh, 
  onStartServer,
  onStopModel,
  onDeleteModel 
}) {
  const [activeTab, setActiveTab] = useState('models'); // 'models', 'running', 'pull', 'prompt'
  const [selectedModel, setSelectedModel] = useState('');
  
  // Pull state
  const [pullInput, setPullInput] = useState('');
  const [pulling, setPulling] = useState(false);
  const [pullLogs, setPullLogs] = useState([]);

  // Prompt Test state
  const [promptInput, setPromptInput] = useState('');
  const [promptModel, setPromptModel] = useState('');
  const [prompting, setPrompting] = useState(false);
  const [promptOutput, setPromptOutput] = useState('');

  useEffect(() => {
    if (modelsList && modelsList.length > 0 && !promptModel) {
      setPromptModel(modelsList[0].name);
    }
  }, [modelsList]);

  const isOnline = ollamaStatus?.online;

  // Handle Model Pull Stream via EventSource SSE
  const handlePullModel = () => {
    if (!pullInput.trim() || pulling) return;
    setPulling(true);
    setPullLogs([`Initiating pull for model: ${pullInput}...`]);

    const es = new EventSource(`/api/ollama/pull-stream?model=${encodeURIComponent(pullInput.trim())}`);
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.text) {
          setPullLogs(prev => [...prev, data.text.trim()]);
        }
        if (data.done) {
          setPulling(false);
          setPullLogs(prev => [...prev, `[Success] Model ${pullInput} pull completed!`]);
          es.close();
          onRefresh();
        }
      } catch (e) {}
    };

    es.onerror = () => {
      setPulling(false);
      setPullLogs(prev => [...prev, '[Error] SSE Connection error or pull interrupted.']);
      es.close();
    };
  };

  // Handle Interactive Prompt Test Stream via POST SSE
  const handleRunPrompt = async () => {
    if (!promptInput.trim() || !promptModel || prompting) return;
    setPrompting(true);
    setPromptOutput('');

    try {
      const response = await fetch('/api/ollama/prompt-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: promptModel, prompt: promptInput })
      });

      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.replace('data: ', ''));
              if (parsed.token) {
                setPromptOutput(prev => prev + parsed.token);
              }
              if (parsed.error) {
                setPromptOutput(prev => prev + `\n[Error: ${parsed.error}]`);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      setPromptOutput(`Error generating response: ${err.message}`);
    } finally {
      setPrompting(false);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Status */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-purple/10 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className={`p-3.5 rounded-2xl border ${
              isOnline 
                ? 'bg-brand-emerald/20 border-brand-emerald/40 text-brand-emerald' 
                : 'bg-dark-800 border-slate-700 text-slate-400'
            }`}>
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-white tracking-tight">Ollama Local AI Engine</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border flex items-center gap-1.5 ${
                  isOnline 
                    ? 'bg-brand-emerald/20 text-brand-emerald border-brand-emerald/40' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-brand-emerald animate-ping' : 'bg-slate-500'}`} />
                  {isOnline ? 'ONLINE' : 'STOPPED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Monitor local LLMs, inspect active VRAM consumption, download models, and run direct prompt evaluations.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!isOnline && (
              <button
                onClick={onStartServer}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 text-white font-semibold text-sm shadow-lg shadow-brand-emerald/20 hover:opacity-90 transition-all"
              >
                <Power className="w-4 h-4" />
                <span>Launch Ollama Server</span>
              </button>
            )}
            <button
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-dark-800 border border-slate-700 text-slate-300 hover:text-white hover:border-brand-purple transition-colors"
              title="Refresh Ollama Status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3">
        {[
          { id: 'models', label: `Downloaded Models (${modelsList ? modelsList.length : 0})`, icon: HardDrive },
          { id: 'running', label: `Active VRAM / RAM (${runningModels ? runningModels.length : 0})`, icon: Cpu, badge: runningModels?.length > 0 },
          { id: 'prompt', label: 'Interactive Model Tester', icon: MessageSquare },
          { id: 'pull', label: 'Pull New Model', icon: Download }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                isActive
                  ? 'bg-brand-purple/20 text-white border border-brand-purple/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-purple' : ''}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="w-2 h-2 rounded-full bg-brand-emerald animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content 1: Downloaded Models */}
      {activeTab === 'models' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(!modelsList || modelsList.length === 0) ? (
            <div className="col-span-full glass-card rounded-2xl p-12 text-center text-slate-400">
              <Bot className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-base font-semibold text-slate-300">No Ollama models downloaded yet</p>
              <p className="text-xs text-slate-500 mt-1">Switch to the "Pull New Model" tab to download models like llama3.2, mistral, or phi3.</p>
            </div>
          ) : (
            modelsList.map((model) => (
              <div key={model.name} className="glass-card glass-card-hover rounded-2xl p-5 space-y-4 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-white hover:text-brand-purple transition-colors">
                        {model.name}
                      </h3>
                      <span className="text-xs font-mono text-slate-400">Digest: {model.digest}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-brand-purple/20 text-brand-purple font-mono text-xs border border-brand-purple/30">
                      {model.sizeFormatted}
                    </span>
                  </div>

                  {model.details && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                      <div>
                        <span className="text-slate-500">Format:</span> {model.details.format || 'gguf'}
                      </div>
                      <div>
                        <span className="text-slate-500">Family:</span> {model.details.family || 'llama'}
                      </div>
                      <div>
                        <span className="text-slate-500">Params:</span> {model.details.parameter_size || 'N/A'}
                      </div>
                      <div>
                        <span className="text-slate-500">Quant:</span> {model.details.quantization_level || 'N/A'}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setPromptModel(model.name);
                      setActiveTab('prompt');
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-blue/20 text-brand-cyan hover:bg-brand-blue/30 text-xs font-medium border border-brand-blue/30 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Test Prompt</span>
                  </button>

                  <button
                    onClick={() => onDeleteModel(model.name)}
                    className="p-1.5 text-slate-500 hover:text-brand-rose rounded-lg hover:bg-brand-rose/10 transition-colors"
                    title="Delete Model"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab Content 2: Running VRAM Models */}
      {activeTab === 'running' && (
        <div className="glass-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-brand-emerald animate-pulse" />
                Models Currently Loaded in RAM / VRAM (`ollama ps`)
              </h3>
              <p className="text-xs text-slate-400">Shows active models holding memory and GPU resources.</p>
            </div>
          </div>

          {(!runningModels || runningModels.length === 0) ? (
            <div className="py-12 text-center text-slate-500">
              <Zap className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">No models currently loaded in VRAM</p>
              <p className="text-xs text-slate-500 mt-1">Models load automatically when queried and unload after idle timeout.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {runningModels.map((m) => (
                <div key={m.name} className="p-4 rounded-xl bg-dark-800 border border-slate-700/80 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-white flex items-center gap-2">
                      {m.name}
                      <span className="px-2 py-0.5 rounded bg-brand-emerald/20 text-brand-emerald text-xs font-mono border border-brand-emerald/30">
                        ACTIVE IN VRAM
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-4">
                      <span>VRAM Size: <strong className="text-brand-cyan">{m.sizeVramFormatted || m.sizeFormatted}</strong></span>
                      <span>Total Size: {m.sizeFormatted}</span>
                      {m.expiresAt && <span>Expires: {m.expiresAt}</span>}
                    </div>
                  </div>

                  <button
                    onClick={() => onStopModel(m.name)}
                    className="px-3 py-1.5 rounded-lg bg-brand-rose/20 text-brand-rose border border-brand-rose/30 text-xs font-medium hover:bg-brand-rose/30 transition-colors"
                  >
                    Unload from VRAM
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content 3: Interactive Prompt Tester */}
      {activeTab === 'prompt' && (
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-purple" />
                Interactive Model Prompt Tester
              </h3>
              <p className="text-xs text-slate-400">Test response speed, intelligence, and generation output locally.</p>
            </div>

            {/* Model Select */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Select Model:</span>
              <select
                value={promptModel}
                onChange={(e) => setPromptModel(e.target.value)}
                className="bg-dark-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-purple font-mono"
              >
                {modelsList && modelsList.map(m => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prompt Form */}
          <div className="space-y-3">
            <textarea
              rows={3}
              placeholder="Enter prompt for local model (e.g. Write a quick Python script to monitor system CPU...)"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              className="w-full bg-dark-900 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-purple"
            />

            <div className="flex justify-end">
              <button
                onClick={handleRunPrompt}
                disabled={prompting || !promptInput.trim()}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-md"
              >
                <Play className="w-4 h-4" />
                <span>{prompting ? 'Generating Response...' : 'Execute Prompt'}</span>
              </button>
            </div>
          </div>

          {/* Output Terminal */}
          <div className="space-y-2">
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-brand-cyan" />
              Live Generation Stream:
            </div>
            <div className="bg-dark-900/90 border border-slate-800 rounded-xl p-4 min-h-[160px] font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-96">
              {promptOutput ? promptOutput : <span className="text-slate-600 font-normal">Response tokens will stream here in real time...</span>}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 4: Pull Model */}
      {activeTab === 'pull' && (
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Download className="w-5 h-5 text-brand-cyan" />
              Download / Pull Ollama Model
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter any model name from Ollama library (e.g. <code className="text-brand-cyan font-mono">llama3.2</code>, <code className="text-brand-purple font-mono">mistral</code>, <code className="text-brand-amber font-mono">qwen2.5</code>, <code className="text-brand-emerald font-mono">nomic-embed-text</code>).
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="text"
              placeholder="Model name (e.g. llama3.2, mistral:7b, deepseek-r1:8b)"
              value={pullInput}
              onChange={(e) => setPullInput(e.target.value)}
              className="flex-1 bg-dark-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-brand-cyan"
            />
            <button
              onClick={handlePullModel}
              disabled={pulling || !pullInput.trim()}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-cyan text-dark-900 font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-md shadow-brand-cyan/20"
            >
              <Download className="w-4 h-4" />
              <span>{pulling ? 'Downloading...' : 'Pull Model'}</span>
            </button>
          </div>

          {/* Download Logs */}
          {pullLogs.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-brand-cyan" />
                Console Progress Output:
              </div>
              <div className="bg-dark-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1 max-h-64 overflow-y-auto">
                {pullLogs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
