import { exec, spawn } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

export async function checkOllamaStatus() {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: controller.signal });
    clearTimeout(id);
    if (res.ok) {
      const data = await res.json();
      return { online: true, modelsCount: data.models ? data.models.length : 0 };
    }
  } catch (err) {
    // API not responding, check if CLI installed
  }

  try {
    const { stdout } = await execAsync('ollama --version');
    return { online: false, cliInstalled: true, version: stdout.trim() };
  } catch (e) {
    return { online: false, cliInstalled: false };
  }
}

export async function getInstalledModels() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`);
    if (res.ok) {
      const data = await res.json();
      return (data.models || []).map(m => ({
        name: m.name,
        model: m.model,
        sizeBytes: m.size,
        sizeFormatted: formatBytes(m.size),
        modifiedAt: m.modified_at,
        digest: m.digest ? m.digest.substring(0, 12) : '',
        details: m.details || {}
      }));
    }
  } catch (err) {
    // Fallback to CLI
  }

  try {
    const { stdout } = await execAsync('ollama list');
    const lines = stdout.trim().split('\n').slice(1);
    return lines.map(line => {
      const parts = line.split(/\s+/);
      return {
        name: parts[0] || 'Unknown',
        digest: parts[1] || '',
        sizeFormatted: parts[2] ? `${parts[2]} ${parts[3] || ''}` : 'N/A',
        modifiedAt: parts.slice(4).join(' ') || 'N/A'
      };
    });
  } catch (err) {
    return [];
  }
}

export async function getRunningModels() {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/ps`);
    if (res.ok) {
      const data = await res.json();
      return (data.models || []).map(m => ({
        name: m.name,
        model: m.model,
        sizeBytes: m.size,
        sizeFormatted: formatBytes(m.size),
        sizeVramBytes: m.size_vram,
        sizeVramFormatted: formatBytes(m.size_vram),
        expiresAt: m.expires_at,
        details: m.details || {}
      }));
    }
  } catch (err) {
    // Fallback to CLI
  }

  try {
    const { stdout } = await execAsync('ollama ps');
    const lines = stdout.trim().split('\n').slice(1);
    return lines.map(line => {
      const parts = line.split(/\s+/);
      if (!parts[0]) return null;
      return {
        name: parts[0],
        digest: parts[1],
        sizeFormatted: parts[2] ? `${parts[2]} ${parts[3] || ''}` : '',
        sizeVramFormatted: parts[4] ? `${parts[4]} ${parts[5] || ''}` : '',
        expiresAt: parts.slice(6).join(' ')
      };
    }).filter(Boolean);
  } catch (e) {
    return [];
  }
}

export function startOllamaServer() {
  return new Promise((resolve) => {
    // Spawn ollama serve in background detached
    const child = spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    setTimeout(resolve, 1500);
  });
}

export async function stopModel(modelName) {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelName, keep_alive: 0 })
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function deleteModel(modelName) {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName })
    });
    return res.ok;
  } catch (e) {
    try {
      await execAsync(`ollama rm ${modelName}`);
      return true;
    } catch (err) {
      return false;
    }
  }
}

function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
