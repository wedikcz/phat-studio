import React, { useState } from 'react';
import { Compass, FileText, CheckCircle2, Shield, Calendar, Server, Search, Globe, Code } from 'lucide-react';
import { CrawlEndpointRecord, WhoisRecord } from '../../types/osint.ts';
import { calculateDaysUntilExpiry } from '../../utils/osintEngine.ts';

interface CrawlerWhoisViewProps {
  crawlEndpoints: CrawlEndpointRecord[];
  whoisData: WhoisRecord;
}

export const CrawlerWhoisView: React.FC<CrawlerWhoisViewProps> = ({ crawlEndpoints, whoisData }) => {
  const [activeTab, setActiveTab] = useState<'crawler' | 'whois'>('crawler');
  const [searchTerm, setSearchTerm] = useState('');
  const [apiOnlyFilter, setApiOnlyFilter] = useState(false);

  const daysUntilExpiry = calculateDaysUntilExpiry(whoisData.expirationDate);

  const filteredEndpoints = crawlEndpoints.filter((ep) => {
    const matchesSearch = ep.endpointPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ep.parameters.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesApi = !apiOnlyFilter || ep.isApiEndpoint;
    return matchesSearch && matchesApi;
  });

  return (
    <div className="space-y-5">
      {/* View Header with Sub-Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Katana Web Crawler & WHOIS Domain Registry</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Discovered link endpoints, API routes, parameter extraction, and domain ownership records
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-[#0a0e17] border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('crawler')}
            className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'crawler'
                ? 'bg-purple-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Katana Spider ({crawlEndpoints.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('whois')}
            className={`px-3 py-1.5 text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'whois'
                ? 'bg-purple-600 text-white font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>WHOIS Records</span>
          </button>
        </div>
      </div>

      {activeTab === 'crawler' ? (
        <div className="space-y-4">
          {/* Crawler Search and Filter */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-[#0a0e17] border border-slate-800 p-3 rounded-lg">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search crawled path or parameter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#080c14] border border-slate-800 rounded pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-600 font-mono"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={apiOnlyFilter}
                onChange={(e) => setApiOnlyFilter(e.target.checked)}
                className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
              />
              <span>Filter API & REST Endpoints Only</span>
            </label>
          </div>

          {/* Endpoints Table */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-2.5 px-4 font-mono">Method</th>
                    <th className="py-2.5 px-4">Endpoint Path</th>
                    <th className="py-2.5 px-4">Content-Type</th>
                    <th className="py-2.5 px-4 font-mono">Depth</th>
                    <th className="py-2.5 px-4">Extracted Parameters</th>
                    <th className="py-2.5 px-4 text-right">Endpoint Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredEndpoints.map((ep) => (
                    <tr key={ep.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold">
                        <span
                          className={
                            ep.method === 'GET'
                              ? 'text-cyan-400'
                              : ep.method === 'POST'
                              ? 'text-emerald-400'
                              : ep.method === 'PUT'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }
                        >
                          {ep.method}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-200 font-medium max-w-sm truncate">
                        {ep.endpointPath}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">
                        {ep.contentType}
                      </td>
                      <td className="py-2.5 px-4 font-mono tabular-nums text-slate-400">
                        Level {ep.depth}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-purple-400">
                        {ep.parameters.length > 0 ? (
                          ep.parameters.map((p) => `?${p}`).join(' ')
                        ) : (
                          <span className="text-slate-600">None</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">
                        {ep.isApiEndpoint ? (
                          <span className="text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                            REST API
                          </span>
                        ) : (
                          <span className="text-slate-500">Static / Page</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* WHOIS Tab */
        <div className="space-y-4">
          {/* Whois Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>Registrar Organization</span>
              </div>
              <div className="text-sm font-semibold text-slate-100">{whoisData.registrar}</div>
              <div className="text-xs text-slate-400">
                Registrant: {whoisData.registrantOrg || 'Privacy Guard'} ({whoisData.registrantCountry || 'US'})
              </div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Domain Lifespan</span>
              </div>
              <div className="text-sm font-bold font-mono tabular-nums text-emerald-400">
                {daysUntilExpiry} days remaining
              </div>
              <div className="text-xs text-slate-400">
                Expires: {new Date(whoisData.expirationDate).toLocaleDateString()}
              </div>
            </div>

            <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Security & DNSSEC</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-slate-200">DNSSEC Signed</span>
              </div>
              <div className="text-xs text-slate-400">
                Transfer Protection: Active
              </div>
            </div>
          </div>

          {/* Nameservers and Status */}
          <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-lg space-y-3">
            <h3 className="text-xs font-semibold text-slate-200">Authoritative Nameservers</h3>
            <div className="flex flex-wrap gap-2">
              {whoisData.nameServers.map((ns) => (
                <span key={ns} className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 font-mono text-xs text-cyan-400">
                  {ns}
                </span>
              ))}
            </div>
          </div>

          {/* Raw Terminal WHOIS Output */}
          <div className="bg-[#080c14] border border-slate-800 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-800">
              <span>$ whois {whoisData.domainName}</span>
              <span>IANA WHOIS Output</span>
            </div>
            <pre className="text-slate-400 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
              {whoisData.rawText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
