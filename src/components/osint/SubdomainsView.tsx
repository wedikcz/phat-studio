import React, { useState, useMemo } from 'react';
import { Search, Download, Plus, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { SubdomainRecord } from '../../types/osint.ts';

interface SubdomainsViewProps {
  subdomains: SubdomainRecord[];
  onAddSubdomain: (sub: SubdomainRecord) => void;
}

export const SubdomainsView: React.FC<SubdomainsViewProps> = ({ subdomains, onAddSubdomain }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newSubdomainInput, setNewSubdomainInput] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = useMemo(() => {
    return subdomains.filter((sub) => {
      const matchesSearch = sub.subdomain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.ipAddress && sub.ipAddress.includes(searchTerm));
      const matchesSource = sourceFilter === 'all' || sub.source === sourceFilter;
      const matchesStatus = statusFilter === 'all' || (sub.dnsStatus || 'UNKNOWN') === statusFilter;
      return matchesSearch && matchesSource && matchesStatus;
    });
  }, [subdomains, searchTerm, sourceFilter, statusFilter]);

  const uniqueSources = Array.from(new Set(subdomains.map(s => s.source)));

  const handleExportCSV = () => {
    const headers = 'Subdomain,RootDomain,Source,IPAddress,DNSStatus,Confidence,FirstSeen\n';
    const rows = filtered.map(s => `"${s.subdomain}","${s.rootDomain}","${s.source}","${s.ipAddress || ''}","${s.dnsStatus || ''}",${s.confidence},"${s.firstSeen}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subdomains-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubdomainInput.trim()) return;

    const newSub: SubdomainRecord = {
      id: `sub-${Date.now()}`,
      subdomain: newSubdomainInput.trim().toLowerCase(),
      rootDomain: 'target-defense.corp',
      source: 'subfinder',
      ipAddress: '198.51.100.' + Math.floor(Math.random() * 200 + 10),
      dnsStatus: 'RESOLVED',
      firstSeen: new Date().toISOString(),
      confidence: 90,
    };

    onAddSubdomain(newSub);
    setNewSubdomainInput('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Subdomain Discovery Matrix</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated intelligence from Subfinder, Amass, and DNSX resolvers ({filtered.length} of {subdomains.length} records)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-900/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add In-Scope Asset</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0a0e17] border border-slate-800 p-3 rounded-lg">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search subdomains or IP addresses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#080c14] border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-600 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          {/* Source Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Source:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-[#080c14] border border-slate-800 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-purple-600 cursor-pointer"
            >
              <option value="all">All Sources</option>
              {uniqueSources.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* DNS Status Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>DNS:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#080c14] border border-slate-800 text-slate-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-purple-600 cursor-pointer"
            >
              <option value="all">All States</option>
              <option value="RESOLVED">Resolved (A/AAAA)</option>
              <option value="NXDOMAIN">NXDOMAIN (Unmapped)</option>
              <option value="WILDCARD">Wildcard</option>
            </select>
          </div>
        </div>
      </div>

      {/* High-Density Data Grid */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-4">Subdomain FQDN</th>
                <th className="py-2.5 px-4">Discovery Engine</th>
                <th className="py-2.5 px-4 font-mono">DNS Resolution</th>
                <th className="py-2.5 px-4 font-mono">Mapped IP / CNAME</th>
                <th className="py-2.5 px-4">Confidence</th>
                <th className="py-2.5 px-4 text-right">Discovered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-slate-200 font-medium">
                    {sub.subdomain}
                  </td>
                  <td className="py-2.5 px-4 capitalize text-slate-400">
                    <span className="font-mono text-purple-400 font-medium">{sub.source}</span>
                  </td>
                  <td className="py-2.5 px-4 font-mono">
                    {sub.dnsStatus === 'RESOLVED' && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resolved</span>
                      </span>
                    )}
                    {sub.dnsStatus === 'NXDOMAIN' && (
                      <span className="text-rose-400 flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        <span>NXDOMAIN</span>
                      </span>
                    )}
                    {sub.dnsStatus === 'WILDCARD' && (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Wildcard</span>
                      </span>
                    )}
                    {!sub.dnsStatus && <span className="text-slate-600">Pending</span>}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-300">
                    {sub.cname ? (
                      <div className="space-y-0.5">
                        <span className="text-slate-200">{sub.ipAddress || '-'}</span>
                        <div className="text-[10px] text-cyan-400">CNAME: {sub.cname}</div>
                      </div>
                    ) : (
                      <span>{sub.ipAddress || '-'}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 font-mono tabular-nums text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>{sub.confidence}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                    {new Date(sub.firstSeen).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Add Subdomain Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-700 rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-slate-100">Add In-Scope Target Asset</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-100 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Subdomain FQDN
                </label>
                <input
                  type="text"
                  placeholder="e.g. staging-auth.target-defense.corp"
                  value={newSubdomainInput}
                  onChange={(e) => setNewSubdomainInput(e.target.value)}
                  className="w-full bg-[#080c14] border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-purple-600"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded cursor-pointer"
                >
                  Confirm & Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
