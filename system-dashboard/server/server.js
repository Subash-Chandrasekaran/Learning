import express from 'express';
import cors from 'cors';
import { getSystemOverview, getTopProcesses, getInstalledInventory } from './systemScanner.js';
import { 
  checkOllamaStatus, 
  getInstalledModels, 
  getRunningModels, 
  startOllamaServer, 
  stopModel, 
  deleteModel 
} from './ollamaController.js';
import { spawn } from 'child_process';

const app = express();
const PORT = process.env.PORT || 5055;

app.use(cors());
app.use(express.json());

// --- System Telemetry Endpoints ---

app.get('/api/system/overview', async (req, res) => {
  try {
    const data = await getSystemOverview();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/system/processes', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '30', 10);
    const data = await getTopProcesses(limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/system/process/:pid', (req, res) => {
  const pid = parseInt(req.params.pid, 10);
  if (!pid) return res.status(400).json({ error: 'Invalid PID' });
  try {
    process.kill(pid, 'SIGTERM');
    res.json({ success: true, message: `Terminated process PID ${pid}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/inventory', async (req, res) => {
  try {
    const data = await getInstalledInventory();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Ollama Controller Endpoints ---

app.get('/api/ollama/status', async (req, res) => {
  try {
    const status = await checkOllamaStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ollama/models', async (req, res) => {
  try {
    const models = await getInstalledModels();
    res.json(models);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ollama/ps', async (req, res) => {
  try {
    const running = await getRunningModels();
    res.json(running);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ollama/start', async (req, res) => {
  try {
    await startOllamaServer();
    res.json({ success: true, message: 'Ollama server launch initiated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ollama/stop', async (req, res) => {
  const { model } = req.body;
  if (!model) return res.status(400).json({ error: 'Model name required' });
  try {
    const success = await stopModel(model);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/ollama/delete', async (req, res) => {
  const { model } = req.body;
  if (!model) return res.status(400).json({ error: 'Model name required' });
  try {
    const success = await deleteModel(model);
    res.json({ success });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stream Ollama Pull Command via SSE
app.get('/api/ollama/pull-stream', (req, res) => {
  const modelName = req.query.model;
  if (!modelName) {
    return res.status(400).send('Model name parameter required');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const child = spawn('ollama', ['pull', modelName]);

  child.stdout.on('data', (data) => {
    res.write(`data: ${JSON.stringify({ text: data.toString() })}\n\n`);
  });

  child.stderr.on('data', (data) => {
    res.write(`data: ${JSON.stringify({ text: data.toString() })}\n\n`);
  });

  child.on('close', (code) => {
    res.write(`data: ${JSON.stringify({ done: true, exitCode: code })}\n\n`);
    res.end();
  });
});

// Stream Ollama Prompt Test via SSE
app.post('/api/ollama/prompt-stream', async (req, res) => {
  const { model, prompt } = req.body;
  if (!model || !prompt) {
    return res.status(400).json({ error: 'Model and prompt required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: true })
    });

    if (!response.ok) {
      res.write(`data: ${JSON.stringify({ error: `Ollama returned status ${response.status}` })}\n\n`);
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          res.write(`data: ${JSON.stringify({ token: parsed.response, done: parsed.done })}\n\n`);
        } catch(e) {}
      }
    }
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Real-time Metrics Stream SSE
app.get('/api/stream/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const sendMetrics = async () => {
    try {
      const overview = await getSystemOverview();
      const runningOllama = await getRunningModels();
      res.write(`data: ${JSON.stringify({ overview, runningOllama, timestamp: Date.now() })}\n\n`);
    } catch (e) {}
  };

  sendMetrics();
  const interval = setInterval(sendMetrics, 3000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

app.listen(PORT, () => {
  console.log(`System Dashboard API server running on http://localhost:${PORT}`);
});
