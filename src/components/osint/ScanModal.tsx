import React, { useState } from 'react';
import { Globe2, Sparkles, CheckSquare, Square, X, Play, ShieldAlert } from 'lucide-react';
import { OsintTool, TargetDomain } from '../../types/osint.ts';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartScan: (target: string, selectedTools: OsintTool[], mode: 'passive' | 'standard' | 'deep') => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({ isOpen, onClose, onStartScan }) => {
  const [targetDomain, setTargetDomain] = useState('perimeter-node.internal');
  const [scanMode, setScanMode] = useState<'passive' | 'standard' | 'deep'>('standard');
  const [selectedTools, setSelectedTools] = useState<Record<OsintTool, boolean>>({
    subfinder: true,
    amass: true,
    dnsx: true,
    httpx: true,
    nmap: true,
    katana: true,
    whois: true,
  });

  if (!isOpen) return null;

  const toggleTool = (tool: OsintTool) => {
    setSelectedTools(prev => ({ ...prev, [tool]: !prev[tool] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDomain.trim()) return;

    const activeTools = (Object.keys(selectedTools) as OsintTool[]).filter(
      t => selectedTools[t]
    );

    onStartScan(targetDomain.trim().toLowerCase(), activeTools, scanMode);
    onClose();
  };

  const toolList: Array<{ id: OsintTool; label: string; desc: string }> = [
    { id: 'subfinder', label: 'Subfinder', desc: 'Fast passive subdomain aggregation' },
    { id: 'amass', label: 'Amass', desc: 'ASN infrastructure & DNS mapping' },
    { id: 'dnsx', label: 'DNSX', desc: 'Wildcard pruning & fast DNS resolver' },
    { id: 'httpx', label: 'httpx', desc: 'Active HTTP probe & tech stack detection' },
    { id: 'nmap', label: 'Nmap', desc: 'Stealth port scanner & CVE banners' },
    { id: 'katana', label: 'Katana', desc: 'Web crawler & API endpoint spider' },
    { id: 'whois', label: 'Whois', desc: 'Registrar & DNSSEC verification' },
  ];

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-[#0f172a] border border-slate-700 rounded-lg max-w-lg w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-slate-100">Configure Autonomous Recon Scan</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 font-mono text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Target FQDN / Domain Scope
            </label>
            <input
              type="text"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              placeholder="e.g. cloudmesh.org or target-corp.internal"
              className="w-full bg-[#080c14] border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-600"
              required
            />
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Reconnaissance Profile Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'passive', label: 'Passive OSINT', hint: 'Zero network touches' },
                { id: 'standard', label: 'Standard Recon', hint: 'Passive + DNS + Web' },
                { id: 'deep', label: 'Deep BAS Suite', hint: 'All tools + Ports' },
              ].map(m => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setScanMode(m.id as any)}
                  className={`p-2 rounded border text-left cursor-pointer transition-colors ${
                    scanMode === m.id
                      ? 'bg-purple-950/60 border-purple-600 text-purple-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-semibold">{m.label}</div>
                  <div className="text-[10px] text-slate-500">{m.hint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tools Checkboxes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Enabled Reconnaissance Tools ({Object.values(selectedTools).filter(Boolean).length}/7)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {toolList.map(t => (
                <div
                  key={t.id}
                  onClick={() => toggleTool(t.id)}
                  className={`p-2 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                    selectedTools[t.id]
                      ? 'bg-slate-900/80 border-purple-800/60 text-slate-200'
                      : 'bg-slate-900/30 border-slate-800/60 text-slate-500'
                  }`}
                >
                  <div>
                    <div className="text-xs font-mono font-medium">{t.label}</div>
                    <div className="text-[10px] text-slate-500 truncate">{t.desc}</div>
                  </div>
                  {selectedTools[t.id] ? (
                    <CheckSquare className="w-4 h-4 text-purple-400 shrink-0 ml-2" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 shrink-0 ml-2" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800 rounded cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-900/40"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Launch Autonomous Recon</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
