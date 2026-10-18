import React, { useState, useMemo } from 'react';
import { Search, Radio, ShieldAlert, Cpu, AlertTriangle, Layers } from 'lucide-react';
import { PortRecord } from '../../types/osint.ts';

interface PortSpectrumViewProps {
  ports: PortRecord[];
  onTriggerNmapScan?: () => void;
}

export const PortSpectrumView: React.FC<PortSpectrumViewProps> = ({ ports }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'web' | 'db' | 'admin' | 'infra' | 'vulnerable'>('all');

  const filteredPorts = useMemo(() => {
    return ports.filter((p) => {
      const matchesSearch = p.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.targetIp.includes(searchTerm) ||
        p.port.toString().includes(searchTerm) ||
        (p.service && p.service.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.product && p.product.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesCategory = true;
      if (categoryFilter === 'web') matchesCategory = [80, 443].includes(p.port);
      if (categoryFilter === 'db') matchesCategory = [3306, 5432, 6379, 27017].includes(p.port);
      if (categoryFilter === 'admin') matchesCategory = [8080, 8443, 3000, 9090, 8200].includes(p.port);
      if (categoryFilter === 'infra') matchesCategory = [21, 22, 25, 53, 1194, 6443].includes(p.port);
      if (categoryFilter === 'vulnerable') matchesCategory = Boolean(p.vulnerabilities && p.vulnerabilities.length > 0);

      return matchesSearch && matchesCategory;
    });
  }, [ports, searchTerm, categoryFilter]);

  // Aggregate port counts for visual spectrum bars
  const portHistogram = useMemo(() => {
    const map = new Map<number, { count: number; service: string; hasVuln: boolean }>();
    for (const p of ports) {
      if (p.state === 'open') {
        const item = map.get(p.port) || { count: 0, service: p.service, hasVuln: false };
        item.count += 1;
        if (p.vulnerabilities && p.vulnerabilities.length > 0) item.hasVuln = true;
        map.set(p.port, item);
      }
    }
    return Array.from(map.entries())
      .map(([port, data]) => ({ port, ...data }))
      .sort((a, b) => b.count - a.count);
  }, [ports]);

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Nmap Port & Service Spectrum</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Full TCP/UDP stealth sweep, service fingerprinting, and CVE banner analysis ({filteredPorts.length} open ports detected)
          </p>
        </div>

        {/* Quick Category Segmented Buttons */}
        <div className="flex items-center gap-1 bg-[#0a0e17] border border-slate-800 p-1 rounded-lg">
          {[
            { id: 'all', label: 'All Ports' },
            { id: 'web', label: 'Web (80/443)' },
            { id: 'admin', label: 'Admin (8080/3000)' },
            { id: 'db', label: 'Databases' },
            { id: 'infra', label: 'Infrastructure' },
            { id: 'vulnerable', label: 'Vulnerabilities' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-purple-600 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Port Spectrum Bar Grid */}
      <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-semibold text-slate-200">Port Distribution Spectrum</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">Frequency Analysis</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {portHistogram.map((item) => (
            <div
              key={item.port}
              onClick={() => setSearchTerm(item.port.toString())}
              className={`p-2.5 rounded border transition-all cursor-pointer ${
                item.hasVuln
                  ? 'bg-rose-950/20 border-rose-800/60 hover:border-rose-600'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold text-slate-200">{item.port}</span>
                <span className="text-slate-500 tabular-nums">×{item.count}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate capitalize">
                {item.service}
              </div>
              {item.hasVuln && (
                <div className="flex items-center gap-1 text-[10px] text-rose-400 font-mono mt-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  <span>CVE Alert</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 bg-[#0a0e17] border border-slate-800 p-3 rounded-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search port number, IP, host, or service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#080c14] border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-600 font-mono"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-400 hover:text-slate-200 font-mono cursor-pointer"
          >
            Clear Filter
          </button>
        )}
      </div>

      {/* Ports Table */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-4 font-mono">Port / Protocol</th>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">Hostname</th>
                <th className="py-2.5 px-4 font-mono">IP Address</th>
                <th className="py-2.5 px-4">Product Version / Banner</th>
                <th className="py-2.5 px-4 text-right">Security Risk / CVE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPorts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-purple-400">{p.port}</span>
                      <span className="text-slate-500 text-[11px] font-normal uppercase">/{p.protocol}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 capitalize font-medium text-slate-300">
                    {p.service}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-300">
                    {p.host}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-400">
                    {p.targetIp}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 max-w-xs truncate">
                    {p.product ? (
                      <div className="space-y-0.5">
                        <span className="text-slate-200 font-medium">{p.product} {p.version || ''}</span>
                        {p.banner && <div className="text-[10px] font-mono text-slate-500 truncate">{p.banner}</div>}
                      </div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">
                    {p.vulnerabilities && p.vulnerabilities.length > 0 ? (
                      <div className="inline-flex items-center gap-1 text-rose-400 font-bold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/50">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{p.vulnerabilities[0].cve} (CVSS {p.vulnerabilities[0].score})</span>
                      </div>
                    ) : (
                      <span className="text-emerald-400 text-[11px]">Nominal</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
