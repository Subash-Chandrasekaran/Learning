# 🚀 System, Extension & Ollama Intelligence Agent Dashboard

A full-stack, real-time System Monitoring, Software Registry, and Ollama Local AI Management Center built with **Node.js Express**, **React 18**, **Vite**, **Tailwind CSS**, and **Server-Sent Events (SSE)**.

---

## ✨ Features & Capabilities

### 1. 📊 System Telemetry & Hardware Gauges
- **Real-time Hardware Stats**: Tracks CPU load (Apple Silicon M-series/Intel), RAM utilization, storage disk space, system uptime, and OS kernel version.
- **Streaming Resource Graph**: Live 3-second interval timeline chart rendering CPU and RAM usage trends powered by **Recharts**.

### 2. 📦 Installed Software & Extension Inventory
- **macOS Applications Registry**: Scans `/Applications` and `~/Applications` with installation/creation timestamps, version numbers, and file paths.
- **Homebrew Package Manager**: Lists installed formulas and casks with exact installation dates from Cellar/Caskroom.
- **Developer Extensions**:
  - Global NPM packages.
  - Global Python packages.
  - IDE Extensions (Cursor IDE, VS Code, and Antigravity Agent skills).
- **Search & Filter**: Real-time category filtering, query search, and sorting by installation date or software name.

### 3. ⚡ Process Resource Consumption Monitor
- **Process Breakdown**: Live list of active processes sorted by CPU % and Memory RSS consumption.
- **Resource Warning Badges**: Flags high resource processes (>25% CPU or >10% RAM).
- **Process Manager**: 1-click process termination (`SIGTERM`) with confirmation.

### 4. 🤖 Dedicated Ollama Intelligence Hub ("Things It Can Do")
- **Server Status**: Checks if Ollama daemon is active with a 1-click startup trigger (`ollama serve`).
- **Downloaded Models**: Inspects installed models (`ollama list`), disk size, digest, quantization level, parameter size, and model format (`gguf`).
- **Active VRAM Tracker (`ollama ps`)**: Monitors models currently loaded into VRAM/RAM with 1-click VRAM memory release (`keep_alive: 0`).
- **Model Downloader**: Pull new models (e.g., `llama3.2`, `mistral`, `phi3`, `nomic-embed-text`) with real-time SSE console progress output.
- **Interactive Prompt Playground**: Test prompts against local LLMs with real-time SSE token response streaming.

---

## 🛠️ Quick Start & Usage

Executable management scripts are provided in the [`bin/`](bin/) folder:

```bash
# 1. Start Dashboard & Open in Browser
./bin/start.sh

# 2. Check Service Status
./bin/status.sh

# 3. Stop Dashboard Services
./bin/stop.sh
```

---

## 🌐 URLs & Default Ports

| Component | Service | Local URL |
| :--- | :--- | :--- |
| **Frontend UI** | React + Vite Dashboard | `http://localhost:3050` |
| **Backend API** | Node Express API Server | `http://localhost:5055` |
| **Local AI Engine** | Ollama API Server | `http://localhost:11434` |

---

## 📡 API Endpoints Reference

- `GET /api/system/overview` - Hardware specifications, OS info, CPU/RAM/Disk stats.
- `GET /api/inventory` - macOS apps, Homebrew formulas, NPM/Pip packages, IDE extensions.
- `GET /api/system/processes` - Active top processes ordered by resource consumption.
- `DELETE /api/system/process/:pid` - Terminate process by PID.
- `GET /api/ollama/status` - Check Ollama server availability.
- `GET /api/ollama/models` - List downloaded Ollama models.
- `GET /api/ollama/ps` - List models loaded in VRAM/RAM.
- `POST /api/ollama/start` - Initiate `ollama serve` process.
- `POST /api/ollama/stop` - Unload model from VRAM (`keep_alive: 0`).
- `DELETE /api/ollama/delete` - Remove model from disk (`ollama rm`).
- `GET /api/ollama/pull-stream?model=<name>` - Stream model download output.
- `POST /api/ollama/prompt-stream` - Stream interactive prompt generation tokens.
- `GET /api/stream/metrics` - SSE stream of live CPU/RAM telemetry every 3 seconds.

---

## 📄 License
MIT License
