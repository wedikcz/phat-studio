import React from 'react';
import {
  Globe2,
  Radio,
  Server,
  Compass,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  TargetDomain,
  SubdomainRecord,
  PortRecord,
  ActiveHostRecord,
  DnsRecord,
  CrawlEndpointRecord,
} from '../../types/osint.ts';
import { correlateAssets, calculatePortSpectrum, calculateHttpStatusDistribution } from '../../utils/osintEngine.ts';
import { NetworkTopologyVisualizer } from './NetworkTopologyVisualizer.tsx';

interface OverviewDashboardProps {
  targets: TargetDomain[];
  selectedTarget: TargetDomain;
  onSelectTarget: (target: TargetDomain) => void;
  subdomains: SubdomainRecord[];
  ports: PortRecord[];
  activeHosts: ActiveHostRecord[];
  dnsRecords: DnsRecord[];
  crawlEndpoints: CrawlEndpointRecord[];
  onNavigateTab: (tab: string) => void;
  onTriggerScan: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  targets,
  selectedTarget,
  onSelectTarget,
  subdomains,
  ports,
  activeHosts,
  dnsRecords,
  crawlEndpoints,
  onNavigateTab,
  onTriggerScan,
}) => {
  const correlatedAssets = correlateAssets(subdomains, dnsRecords, activeHosts, ports);
  const portSpectrum = calculatePortSpectrum(ports);
  const httpDist = calculateHttpStatusDistribution(activeHosts);

  // Group subdomains by source for SVG distribution chart
  const sourceCounts = subdomains.reduce((acc, sub) => {
    acc[sub.source] = (acc[sub.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sourceEntries = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  const totalSubCount = subdomains.length || 1;

  return (
    <div className="space-y-6">
      {/* Target Selector and Action Strip */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0a0e17] border border-slate-800 p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-950/60 border border-purple-800/60 flex items-center justify-center shrink-0">
            <Globe2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100">{selectedTarget.name}</h1>
              <span className="text-xs font-mono text-purple-300 bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/40">
                {selectedTarget.domain}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <span>Scope: {selectedTarget.scope}</span>
              <span>·</span>
              <span>Last scanned: {new Date(selectedTarget.lastScanTime).toLocaleTimeString()}</span>
              <span>·</span>
              <span className="capitalize text-emerald-400">{selectedTarget.status}</span>
            </div>
          </div>
        </div>

        {/* Target Switcher dropdown buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-1">
            {targets.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTarget(t)}
                className={`px-3 py-1.5 text-xs rounded transition-colors cursor-pointer ${
                  selectedTarget.id === t.id
                    ? 'bg-purple-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.domain}
              </button>
            ))}
          </div>

          <button
            onClick={onTriggerScan}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Re-Run Recon</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards with Tabular Numerals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div
          onClick={() => onNavigateTab('subdomains')}
          className="bg-[#0b0f19] border border-slate-800/90 p-4 rounded-lg cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Subdomains</span>
            <Globe2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-100 mt-2">
            {subdomains.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Subfinder · Amass</div>
        </div>

        <div
          onClick={() => onNavigateTab('ports')}
          className="bg-[#0b0f19] border border-slate-800/90 p-4 rounded-lg cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Open Ports</span>
            <Radio className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-cyan-400 mt-2">
            {ports.filter(p => p.state === 'open').length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Nmap probe hits</div>
        </div>

        <div
          onClick={() => onNavigateTab('active-hosts')}
          className="bg-[#0b0f19] border border-slate-800/90 p-4 rounded-lg cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Active Hosts</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-2">
            {activeHosts.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">httpx HTTP 200/302</div>
        </div>

        <div
          onClick={() => onNavigateTab('crawler-whois')}
          className="bg-[#0b0f19] border border-slate-800/90 p-4 rounded-lg cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Crawled Endpoints</span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-100 mt-2">
            {crawlEndpoints.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Katana spider routes</div>
        </div>

        <div
          onClick={() => onNavigateTab('ports')}
          className="bg-[#0b0f19] border border-slate-800/90 p-4 rounded-lg cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Critical CVEs</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-400 mt-2">
            {ports.filter(p => p.vulnerabilities && p.vulnerabilities.length > 0).length}
          </div>
          <div className="text-[11px] text-rose-500/80 mt-1">Action required</div>
        </div>
      </div>

      {/* Network Topology Visualizer (D3 Attack Surface) */}
      <NetworkTopologyVisualizer
        target={selectedTarget}
        subdomains={subdomains}
        activeHosts={activeHosts}
        ports={ports}
      />

      {/* Reconnaissance Workflow Pipeline (Chain of Tools) */}
      <div className="bg-[#0a0e17] border border-slate-800 p-5 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-slate-200">Reconnaissance Tool Orchestration Chain</h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">Autonomous Pipeline</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 pt-2">
          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-purple-400 font-mono uppercase">01. Discovery</div>
              <div className="text-xs font-semibold text-slate-200 mt-1">Subfinder & Amass</div>
              <p className="text-[11px] text-slate-400 mt-1">Passive OSINT across 30+ sources</p>
            </div>
            <div className="text-xs font-mono text-slate-300 mt-3 pt-2 border-t border-slate-800/80">
              {subdomains.length} subdomains
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-cyan-400 font-mono uppercase">02. DNS Filter</div>
              <div className="text-xs font-semibold text-slate-200 mt-1">DNSX Toolkit</div>
              <p className="text-[11px] text-slate-400 mt-1">Wildcard pruning & fast IP resolve</p>
            </div>
            <div className="text-xs font-mono text-slate-300 mt-3 pt-2 border-t border-slate-800/80">
              {dnsRecords.length} A/AAAA records
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-emerald-400 font-mono uppercase">03. HTTP Probe</div>
              <div className="text-xs font-semibold text-slate-200 mt-1">httpx Suite</div>
              <p className="text-[11px] text-slate-400 mt-1">Tech stack & TLS certificate check</p>
            </div>
            <div className="text-xs font-mono text-slate-300 mt-3 pt-2 border-t border-slate-800/80">
              {activeHosts.length} live endpoints
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-amber-400 font-mono uppercase">04. Deep Spider</div>
              <div className="text-xs font-semibold text-slate-200 mt-1">Katana Crawler</div>
              <p className="text-[11px] text-slate-400 mt-1">JavaScript endpoint & param parsing</p>
            </div>
            <div className="text-xs font-mono text-slate-300 mt-3 pt-2 border-t border-slate-800/80">
              {crawlEndpoints.length} paths discovered
            </div>
          </div>

          <div className="p-3 rounded bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[11px] text-rose-400 font-mono uppercase">05. Port Scan</div>
              <div className="text-xs font-semibold text-slate-200 mt-1">Nmap Scanner</div>
              <p className="text-[11px] text-slate-400 mt-1">Stealth SYN scan & CVE detection</p>
            </div>
            <div className="text-xs font-mono text-slate-300 mt-3 pt-2 border-t border-slate-800/80">
              {ports.filter(p => p.state === 'open').length} open ports
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Charts: Port Spectrum & Subdomain Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Chart 1: Port Spectrum Histogram */}
        <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Open Ports Spectrum (Nmap)</h3>
            <button
              onClick={() => onNavigateTab('ports')}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Explore all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {portSpectrum.slice(0, 6).map((item) => {
              const maxCount = Math.max(...portSpectrum.map(p => p.count), 1);
              const pct = (item.count / maxCount) * 100;
              const isHighRisk = [8080, 22, 3306, 9090].includes(item.port);

              return (
                <div key={item.port} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold">
                      Port {item.port} <span className="text-slate-500 font-normal">({item.service})</span>
                    </span>
                    <span className="text-slate-400 tabular-nums">
                      {item.count} {item.count === 1 ? 'target' : 'targets'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHighRisk ? 'bg-amber-500' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Subdomain Discovery by Source */}
        <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Discovery Sources (Subfinder / Amass)</h3>
            <button
              onClick={() => onNavigateTab('subdomains')}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Subdomain Matrix</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-2">
            {sourceEntries.map(([source, count]) => {
              const pct = Math.round((count / totalSubCount) * 100);
              return (
                <div key={source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 capitalize font-medium">{source}</span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Correlated High-Risk Attack Surface Table */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Correlated Attack Surface Matrix</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cross-tool correlation: Subdomain + DNSX IP + httpx Probe + Nmap Open Ports
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('active-hosts')}
            className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
          >
            <span>View All ({correlatedAssets.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-4">Hostname</th>
                <th className="py-2.5 px-4 font-mono">Resolved IP</th>
                <th className="py-2.5 px-4">HTTP Status</th>
                <th className="py-2.5 px-4">Open Ports</th>
                <th className="py-2.5 px-4">Detected Tech</th>
                <th className="py-2.5 px-4 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {correlatedAssets.slice(0, 5).map((asset) => (
                <tr key={asset.hostname} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span>{asset.hostname}</span>
                      {asset.httpStatus && (
                        <a
                          href={`http://${asset.hostname}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-purple-400"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {asset.ipAddresses.join(', ') || 'NXDOMAIN'}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {asset.httpStatus ? (
                      <span className={asset.httpStatus < 300 ? 'text-emerald-400' : asset.httpStatus < 400 ? 'text-cyan-400' : 'text-rose-400'}>
                        {asset.httpStatus}
                      </span>
                    ) : (
                      <span className="text-slate-600">No Web</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {asset.openPorts.length > 0 ? (
                      <span>{asset.openPorts.join(', ')}</span>
                    ) : (
                      <span className="text-slate-600">None detected</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {asset.technologies.length > 0 ? (
                      <span>{asset.technologies.slice(0, 3).join(', ')}</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">
                    <span className={asset.riskScore > 50 ? 'text-rose-400' : asset.riskScore > 20 ? 'text-amber-400' : 'text-slate-400'}>
                      {asset.riskScore}/100
                    </span>
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
