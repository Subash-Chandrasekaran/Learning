import React, { useState } from 'react';
import { Package, Calendar, Search, Filter, AppWindow, Terminal, Code2, Cpu, ExternalLink, Tag } from 'lucide-react';

export default function InstalledInventory({ inventoryData }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  if (!inventoryData) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Package className="w-6 h-6 animate-spin mr-3 text-brand-blue" />
        <span>Scanning installed applications, homebrew packages, and IDE extensions...</span>
      </div>
    );
  }

  const { apps = [], brew = [], npm = [], pip = [], extensions = [], summary = {} } = inventoryData;

  // Combine items with normalized properties
  const allItems = [
    ...apps.map(item => ({ ...item, category: 'App', icon: AppWindow, badgeColor: 'bg-brand-blue/20 text-brand-cyan border-brand-blue/30' })),
    ...brew.map(item => ({ ...item, category: 'Homebrew', icon: Terminal, badgeColor: 'bg-brand-purple/20 text-brand-purple border-brand-purple/30' })),
    ...npm.map(item => ({ ...item, category: 'NPM Global', icon: Package, badgeColor: 'bg-brand-rose/20 text-brand-rose border-brand-rose/30' })),
    ...pip.map(item => ({ ...item, category: 'Python Pip', icon: Cpu, badgeColor: 'bg-brand-amber/20 text-brand-amber border-brand-amber/30' })),
    ...extensions.map(item => ({ ...item, category: `Extension (${item.source})`, icon: Code2, badgeColor: 'bg-brand-emerald/20 text-brand-emerald border-brand-emerald/30' }))
  ];

  // Filter
  let filtered = allItems.filter(item => {
    if (activeCategory === 'apps') return item.category === 'App';
    if (activeCategory === 'brew') return item.category === 'Homebrew';
    if (activeCategory === 'npm') return item.category === 'NPM Global';
    if (activeCategory === 'pip') return item.category === 'Python Pip';
    if (activeCategory === 'extensions') return item.category.startsWith('Extension');
    return true;
  });

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(item => 
      item.name.toLowerCase().includes(q) || 
      (item.version && item.version.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  }

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.installedDate || 0) - new Date(a.installedDate || 0);
    } else if (sortBy === 'date-asc') {
      return new Date(a.installedDate || 0) - new Date(b.installedDate || 0);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    try {
      const date = new Date(isoStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch(e) {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Category Summary Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {[
          { id: 'all', label: 'All Software', count: allItems.length, icon: Package },
          { id: 'apps', label: 'macOS Apps', count: summary.appsCount || apps.length, icon: AppWindow },
          { id: 'brew', label: 'Homebrew', count: summary.brewCount || brew.length, icon: Terminal },
          { id: 'npm', label: 'NPM Global', count: summary.npmCount || npm.length, icon: Package },
          { id: 'pip', label: 'Python Packages', count: summary.pipCount || pip.length, icon: Cpu },
          { id: 'extensions', label: 'IDE Extensions', count: summary.extensionsCount || extensions.length, icon: Code2 }
        ].map(cat => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`p-4 rounded-xl glass-card text-left transition-all ${
                isSelected 
                  ? 'border-brand-blue/50 bg-brand-blue/10 shadow-lg shadow-brand-blue/10 ring-1 ring-brand-blue/30' 
                  : 'hover:border-slate-700 hover:bg-dark-800'
              }`}
            >
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-cyan' : ''}`} />
                <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${isSelected ? 'bg-brand-blue text-white' : 'bg-dark-700 text-slate-300'}`}>
                  {cat.count}
                </span>
              </div>
              <div className={`text-sm font-medium ${isSelected ? 'text-white font-semibold' : 'text-slate-300'}`}>
                {cat.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls Bar: Search & Sort */}
      <div className="glass-card rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search apps, formulas, extensions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-900 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-blue"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-brand-blue" />
            Sort By:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-dark-900 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-blue"
          >
            <option value="date-desc">Installed Date (Newest First)</option>
            <option value="date-asc">Installed Date (Oldest First)</option>
            <option value="name">Name (A - Z)</option>
          </select>
        </div>
      </div>

      {/* Installed Items Grid / Table */}
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-800">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            Installed Software & Extensions Registry
            <span className="text-xs text-slate-400 font-normal">({filtered.length} items shown)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-dark-800/80 text-xs text-slate-400 border-b border-slate-800 uppercase tracking-wider font-mono">
              <tr>
                <th className="px-6 py-3.5">Software / Extension Name</th>
                <th className="px-6 py-3.5">Type & Source</th>
                <th className="px-6 py-3.5">Version</th>
                <th className="px-6 py-3.5">Installed Date</th>
                <th className="px-6 py-3.5 text-right">Location Path</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No matching software or extensions found.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon || Package;
                  return (
                    <tr key={idx} className="hover:bg-dark-800/50 transition-colors">
                      
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-dark-800 border border-slate-700/60 text-brand-blue">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white hover:text-brand-cyan transition-colors">
                              {item.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono border ${item.badgeColor}`}>
                          <Tag className="w-3 h-3 mr-1 opacity-70" />
                          {item.category}
                        </span>
                      </td>

                      {/* Version */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {item.version || 'v1.0.0'}
                      </td>

                      {/* Installed Date */}
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-brand-purple" />
                          {formatDate(item.installedDate)}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4 text-right font-mono text-xs text-slate-400 max-w-xs truncate">
                        <span title={item.path || item.location}>
                          {item.path || item.location || 'System Standard'}
                        </span>
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
