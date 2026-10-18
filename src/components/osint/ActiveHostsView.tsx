import React, { useState, useMemo } from 'react';
import { Search, ExternalLink, ShieldCheck, Clock, Server, Lock, AlertCircle } from 'lucide-react';
import { ActiveHostRecord } from '../../types/osint.ts';

interface ActiveHostsViewProps {
  activeHosts: ActiveHostRecord[];
}

export const ActiveHostsView: React.FC<ActiveHostsViewProps> = ({ activeHosts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '2xx' | '3xx' | '4xx' | '5xx'>('all');

  const filteredHosts = useMemo(() => {
    return activeHosts.filter((h) => {
      const matchesSearch = h.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.ip.includes(searchTerm) ||
        h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.webServer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.technologies.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === '2xx') matchesStatus = h.statusCode >= 200 && h.statusCode < 300;
      if (statusFilter === '3xx') matchesStatus = h.statusCode >= 300 && h.statusCode < 400;
      if (statusFilter === '4xx') matchesStatus = h.statusCode >= 400 && h.statusCode < 500;
      if (statusFilter === '5xx') matchesStatus = h.statusCode >= 500;

      return matchesSearch && matchesStatus;
    });
  }, [activeHosts, searchTerm, statusFilter]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Active Probes & HTTPX Web Reconnaissance</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time web server fingerprinting, status response codes, TLS certificate validation, and framework telemetry
          </p>
        </div>

        {/* Status Code Filter */}
        <div className="flex items-center gap-1 bg-[#0a0e17] border border-slate-800 p-1 rounded-lg">
          {[
            { id: 'all', label: 'All Statuses' },
            { id: '2xx', label: '2xx OK' },
            { id: '3xx', label: '3xx Redirect' },
            { id: '4xx', label: '4xx Auth/Client' },
            { id: '5xx', label: '5xx Server Err' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id as any)}
              className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                statusFilter === item.id
                  ? 'bg-purple-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3 bg-[#0a0e17] border border-slate-800 p-3 rounded-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search web title, host, server, or technology..."
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

      {/* Active Hosts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredHosts.map((h) => {
          const isSuccess = h.statusCode >= 200 && h.statusCode < 300;
          const isRedirect = h.statusCode >= 300 && h.statusCode < 400;
          const isError = h.statusCode >= 400;

          return (
            <div
              key={h.id}
              className="bg-[#0b0f19] border border-slate-800 rounded-lg p-4 space-y-3 hover:border-slate-700 transition-colors"
            >
              {/* Host URL and Status */}
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <a
                      href={h.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-slate-100 hover:text-purple-400 truncate flex items-center gap-1.5"
                    >
                      <span>{h.host}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  </div>
                  <div className="text-xs text-slate-400 truncate font-mono">
                    {h.title || 'Untitled Page'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 font-mono text-xs">
                  <span
                    className={`px-2 py-0.5 rounded font-bold ${
                      isSuccess
                        ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        : isRedirect
                        ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
                        : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                    }`}
                  >
                    HTTP {h.statusCode}
                  </span>
                </div>
              </div>

              {/* Network and Web Server details */}
              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-800/60">
                <div>
                  <span className="text-slate-500 block text-[11px]">IP & Network:</span>
                  <span className="font-mono text-slate-300">{h.ip}</span>
                  {h.asn && <span className="text-slate-500 font-mono text-[11px] block">{h.asn}</span>}
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Web Server:</span>
                  <span className="font-mono text-slate-300 truncate block">{h.webServer}</span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <span className="font-mono tabular-nums">{h.responseTimeMs} ms</span>
                  </div>
                </div>
              </div>

              {/* Technology Stack tags (unboxed clean text) */}
              {h.technologies.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-500 block mb-1">Detected Frameworks:</span>
                  <div className="flex flex-wrap gap-1.5 text-xs text-slate-300">
                    {h.technologies.map((t, idx) => (
                      <span key={t} className="text-slate-300">
                        {t}{idx < h.technologies.length - 1 && <span className="text-slate-600 ml-1.5">/</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* TLS/SSL Certificate Metadata */}
              {h.sslCert && (
                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SSL Valid: {h.sslCert.issuer}</span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-400">
                    {h.sslCert.expiresInDays} days remaining
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
