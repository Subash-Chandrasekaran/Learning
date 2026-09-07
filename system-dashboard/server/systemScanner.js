import si from 'systeminformation';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = util.promisify(exec);

export async function getSystemOverview() {
  const [cpu, mem, osInfo, currentLoad, diskLayout, fsSize] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.osInfo(),
    si.currentLoad(),
    si.diskLayout(),
    si.fsSize()
  ]);

  const mainDisk = fsSize[0] || { size: 0, used: 0, use: 0, mount: '/' };

  return {
    cpu: {
      manufacturer: cpu.manufacturer,
      brand: cpu.brand,
      cores: cpu.cores,
      physicalCores: cpu.physicalCores,
      speed: cpu.speed,
      currentLoad: Math.round(currentLoad.currentLoad * 10) / 10,
      loadUser: Math.round(currentLoad.currentLoadUser * 10) / 10,
      loadSystem: Math.round(currentLoad.currentLoadSystem * 10) / 10
    },
    memory: {
      totalBytes: mem.total,
      usedBytes: mem.used,
      freeBytes: mem.free,
      activeBytes: mem.active,
      swapTotalBytes: mem.swaptotal,
      swapUsedBytes: mem.swapused,
      usedPercentage: Math.round((mem.used / mem.total) * 1000) / 10
    },
    disk: {
      mount: mainDisk.mount,
      sizeBytes: mainDisk.size,
      usedBytes: mainDisk.used,
      availableBytes: mainDisk.available || (mainDisk.size - mainDisk.used),
      usedPercentage: Math.round(mainDisk.use * 10) / 10
    },
    os: {
      platform: osInfo.platform,
      distro: osInfo.distro,
      release: osInfo.release,
      kernel: osInfo.kernel,
      arch: osInfo.arch,
      hostname: osInfo.hostname,
      uptimeSeconds: si.time().uptime
    }
  };
}

export async function getTopProcesses(limit = 30) {
  const processes = await si.processes();
  const sorted = processes.list.sort((a, b) => (b.cpu + b.mem) - (a.cpu + a.mem));
  
  return sorted.slice(0, limit).map(p => ({
    pid: p.pid,
    name: p.name,
    cpu: Math.round(p.cpu * 10) / 10,
    mem: Math.round(p.mem * 10) / 10,
    memVszBytes: p.memVsz * 1024,
    memRssBytes: p.memRss * 1024,
    user: p.user,
    started: p.started,
    command: p.command
  }));
}

export async function getInstalledInventory() {
  const [apps, brew, npmPkgs, pipPkgs, extensions] = await Promise.all([
    scanApplications(),
    scanHomebrew(),
    scanNpmGlobal(),
    scanPipGlobal(),
    scanExtensions()
  ]);

  return {
    apps,
    brew,
    npm: npmPkgs,
    pip: pipPkgs,
    extensions,
    summary: {
      appsCount: apps.length,
      brewCount: brew.length,
      npmCount: npmPkgs.length,
      pipCount: pipPkgs.length,
      extensionsCount: extensions.length
    }
  };
}

async function scanApplications() {
  const dirs = ['/Applications', path.join(os.homedir(), 'Applications')];
  const apps = [];

  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (!file.endsWith('.app')) continue;
        const fullPath = path.join(dir, file);
        try {
          const stats = fs.statSync(fullPath);
          let version = 'Unknown';
          const plistPath = path.join(fullPath, 'Contents', 'Info.plist');
          if (fs.existsSync(plistPath)) {
            // Quick regex search for CFBundleShortVersionString or CFBundleVersion
            const plistStr = fs.readFileSync(plistPath, 'utf8');
            const match = plistStr.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/i) ||
                          plistStr.match(/<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/i);
            if (match) version = match[1];
          }

          apps.push({
            name: file.replace('.app', ''),
            path: fullPath,
            installedDate: stats.birthtime ? stats.birthtime.toISOString() : stats.ctime.toISOString(),
            modifiedDate: stats.mtime.toISOString(),
            version,
            location: dir
          });
        } catch (e) {
          // ignore permission errors
        }
      }
    } catch (e) {}
  }
  return apps.sort((a, b) => new Date(b.installedDate) - new Date(a.installedDate));
}

async function scanHomebrew() {
  try {
    const { stdout } = await execAsync('brew list --versions');
    const lines = stdout.trim().split('\n').filter(Boolean);
    
    // Attempt to get brew paths for installation timestamps
    const cellarDir = fs.existsSync('/opt/homebrew/Cellar') ? '/opt/homebrew/Cellar' : '/usr/local/Cellar';
    
    return lines.map(line => {
      const parts = line.split(/\s+/);
      const name = parts[0];
      const version = parts.slice(1).join(', ');
      let installedDate = null;

      if (fs.existsSync(cellarDir)) {
        const pkgDir = path.join(cellarDir, name);
        if (fs.existsSync(pkgDir)) {
          try {
            const stats = fs.statSync(pkgDir);
            installedDate = stats.birthtime ? stats.birthtime.toISOString() : stats.ctime.toISOString();
          } catch(e) {}
        }
      }

      return {
        name,
        version,
        installedDate: installedDate || new Date().toISOString(),
        type: 'formula'
      };
    }).sort((a, b) => new Date(b.installedDate || 0) - new Date(a.installedDate || 0));
  } catch (e) {
    return [];
  }
}

async function scanNpmGlobal() {
  try {
    const { stdout } = await execAsync('npm list -g --depth=0 --json');
    const data = JSON.parse(stdout);
    const deps = data.dependencies || {};
    const result = [];
    
    // Global npm node_modules path
    let npmGlobalPath = '';
    try {
      const { stdout: prefix } = await execAsync('npm prefix -g');
      npmGlobalPath = path.join(prefix.trim(), 'lib', 'node_modules');
    } catch(e) {}

    for (const [name, info] of Object.entries(deps)) {
      let installedDate = null;
      if (npmGlobalPath) {
        const pkgDir = path.join(npmGlobalPath, name);
        if (fs.existsSync(pkgDir)) {
          try {
            const stats = fs.statSync(pkgDir);
            installedDate = stats.birthtime ? stats.birthtime.toISOString() : stats.ctime.toISOString();
          } catch(e) {}
        }
      }

      result.push({
        name,
        version: info.version || 'unknown',
        installedDate: installedDate || new Date().toISOString()
      });
    }

    return result.sort((a, b) => new Date(b.installedDate || 0) - new Date(a.installedDate || 0));
  } catch (e) {
    return [];
  }
}

async function scanPipGlobal() {
  try {
    const { stdout } = await execAsync('python3 -m pip list --format=json');
    const pkgs = JSON.parse(stdout);
    return pkgs.map(p => ({
      name: p.name,
      version: p.version,
      type: 'pip'
    }));
  } catch (e) {
    return [];
  }
}

async function scanExtensions() {
  const home = os.homedir();
  const extensionDirs = [
    { source: 'Cursor IDE', path: path.join(home, '.cursor', 'extensions') },
    { source: 'VS Code', path: path.join(home, '.vscode', 'extensions') },
    { source: 'Antigravity Skills', path: path.join(home, '.gemini', 'antigravity-ide', 'builtin', 'skills') }
  ];

  const extensions = [];

  for (const item of extensionDirs) {
    if (!fs.existsSync(item.path)) continue;
    try {
      const files = fs.readdirSync(item.path);
      for (const f of files) {
        if (f.startsWith('.')) continue;
        const fullPath = path.join(item.path, f);
        try {
          const stats = fs.statSync(fullPath);
          extensions.push({
            name: f,
            source: item.source,
            installedDate: stats.birthtime ? stats.birthtime.toISOString() : stats.ctime.toISOString(),
            path: fullPath
          });
        } catch(e) {}
      }
    } catch(e) {}
  }

  return extensions.sort((a, b) => new Date(b.installedDate || 0) - new Date(a.installedDate || 0));
}
