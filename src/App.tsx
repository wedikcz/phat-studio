/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { LiveStreamBar } from './components/LiveStreamBar.tsx';
import { OverviewDashboard } from './components/osint/OverviewDashboard.tsx';
import { SubdomainsView } from './components/osint/SubdomainsView.tsx';
import { PortSpectrumView } from './components/osint/PortSpectrumView.tsx';
import { ActiveHostsView } from './components/osint/ActiveHostsView.tsx';
import { CrawlerWhoisView } from './components/osint/CrawlerWhoisView.tsx';
import { SelfCorrectionLab } from './components/agent/SelfCorrectionLab.tsx';
import { McpToolRegistry } from './components/mcp/McpToolRegistry.tsx';
import { ApiExplorer } from './components/api/ApiExplorer.tsx';
import { ScanModal } from './components/osint/ScanModal.tsx';

import {
  SAMPLE_TARGETS,
  SAMPLE_SUBDOMAINS,
  SAMPLE_PORTS,
  SAMPLE_ACTIVE_HOSTS,
  SAMPLE_DNS_RECORDS,
  SAMPLE_CRAWL_ENDPOINTS,
  SAMPLE_WHOIS,
  INITIAL_LIVE_EVENTS,
} from './data/sampleOsintData.ts';

import {
  TargetDomain,
  SubdomainRecord,
  PortRecord,
  ActiveHostRecord,
  DnsRecord,
  CrawlEndpointRecord,
  WhoisRecord,
  LiveWebSocketEvent,
  OsintTool,
} from './types/osint.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [targets, setTargets] = useState<TargetDomain[]>(SAMPLE_TARGETS);
  const [selectedTarget, setSelectedTarget] = useState<TargetDomain>(SAMPLE_TARGETS[0]);

  // Data State
  const [subdomains, setSubdomains] = useState<SubdomainRecord[]>(SAMPLE_SUBDOMAINS);
  const [ports, setPorts] = useState<PortRecord[]>(SAMPLE_PORTS);
  const [activeHosts, setActiveHosts] = useState<ActiveHostRecord[]>(SAMPLE_ACTIVE_HOSTS);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>(SAMPLE_DNS_RECORDS);
  const [crawlEndpoints, setCrawlEndpoints] = useState<CrawlEndpointRecord[]>(SAMPLE_CRAWL_ENDPOINTS);
  const [whoisData] = useState<WhoisRecord>(SAMPLE_WHOIS);

  // Live WebSocket Simulation State
  const [liveEvents, setLiveEvents] = useState<LiveWebSocketEvent[]>(INITIAL_LIVE_EVENTS);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamSpeed, setStreamSpeed] = useState<number>(1500);
  const [selectedToolFilter, setSelectedToolFilter] = useState<OsintTool | 'all'>('all');

  // Modal State
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);

  // Background WebSocket Telemetry Generator
  useEffect(() => {
    if (!isStreaming) return;

    const interval = setInterval(() => {
      const toolPool: OsintTool[] = ['subfinder', 'amass', 'dnsx', 'httpx', 'nmap', 'katana', 'whois'];
      const chosenTool = toolPool[Math.floor(Math.random() * toolPool.length)];
      const randNum = Math.floor(Math.random() * 900 + 100);
      const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false });

      let newEvt: LiveWebSocketEvent;

      if (chosenTool === 'subfinder' || chosenTool === 'amass') {
        const subName = `edge-${randNum}.${selectedTarget.domain}`;
        newEvt = {
          id: `evt-${Date.now()}`,
          timestamp: nowStr,
          tool: chosenTool,
          eventType: 'DISCOVERY',
          summary: `Discovered passive subdomain: ${subName}`,
          payload: { subdomain: subName, source: chosenTool, confidence: 92 },
          severity: 'nominal',
        };
      } else if (chosenTool === 'dnsx') {
        newEvt = {
          id: `evt-${Date.now()}`,
          timestamp: nowStr,
          tool: 'dnsx',
          eventType: 'DNS_RESOLVED',
          summary: `Resolved node-${randNum}.${selectedTarget.domain} -> 198.51.100.${Math.floor(randNum / 4)} [NOERROR, 22ms]`,
          payload: { recordType: 'A', rcode: 'NOERROR', ttl: 300 },
          severity: 'info',
        };
      } else if (chosenTool === 'nmap') {
        const portChoices = [80, 443, 8080, 8443, 3000, 9090, 22];
        const port = portChoices[Math.floor(Math.random() * portChoices.length)];
        const isVuln = port === 8080;
        newEvt = {
          id: `evt-${Date.now()}`,
          timestamp: nowStr,
          tool: 'nmap',
          eventType: 'PORT_HIT',
          summary: `Port ${port}/TCP active on 198.51.100.${Math.floor(randNum / 5)} ${isVuln ? '[Vulnerability Alert]' : ''}`,
          payload: { port, state: 'open', banner: `Service probe ok` },
          severity: isVuln ? 'alert' : 'nominal',
        };
      } else if (chosenTool === 'httpx') {
        newEvt = {
          id: `evt-${Date.now()}`,
          timestamp: nowStr,
          tool: 'httpx',
          eventType: 'HOST_PROBED',
          summary: `HTTP 200 response on https://cluster-${randNum}.${selectedTarget.domain} (Traefik v3.0, 31ms)`,
          payload: { statusCode: 200, server: 'Traefik', latencyMs: 31 },
          severity: 'nominal',
        };
      } else if (chosenTool === 'katana') {
        newEvt = {
          id: `evt-${Date.now()}`,
          timestamp: nowStr,
          tool: 'katana',
          eventType: 'ENDPOINT_CRAWLED',
          summary: `Crawled URI /api/v2/metrics/node-${randNum} [GET, Content-Type: application/json]`,
          payload: { path: `/api/v2/metrics/node-${randNum}`, depth: 2 },
          severity: 'info',
        };
      } else {
        newEvt = {
          id: `evt-${Date.now()}`,
          timestamp: nowStr,
          tool: 'whois',
          eventType: 'DISCOVERY',
          summary: `Validated authoritative nameserver delegation for ${selectedTarget.domain}`,
          payload: { dnssec: true, authoritative: true },
          severity: 'info',
        };
      }

      setLiveEvents(prev => [newEvt, ...prev.slice(0, 49)]);
    }, streamSpeed);

    return () => clearInterval(interval);
  }, [isStreaming, streamSpeed, selectedTarget.domain]);

  // Handler to add a discovered subdomain
  const handleAddSubdomain = (newSub: SubdomainRecord) => {
    setSubdomains(prev => [newSub, ...prev]);
    // Also push a live event
    const evt: LiveWebSocketEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      tool: 'subfinder',
      eventType: 'DISCOVERY',
      summary: `Manually verified in-scope asset: ${newSub.subdomain}`,
      payload: { subdomain: newSub.subdomain, ip: newSub.ipAddress },
      severity: 'nominal',
    };
    setLiveEvents(prev => [evt, ...prev]);
  };

  // Handler to start a new recon job
  const handleStartScan = (targetDomainStr: string, activeTools: OsintTool[], mode: 'passive' | 'standard' | 'deep') => {
    const existing = targets.find(t => t.domain === targetDomainStr);
    let targetObj: TargetDomain;

    if (existing) {
      targetObj = {
        ...existing,
        status: 'scanning',
        lastScanTime: new Date().toISOString(),
      };
      setTargets(targets.map(t => t.id === existing.id ? targetObj : t));
    } else {
      targetObj = {
        id: `target-${Date.now()}`,
        domain: targetDomainStr,
        name: targetDomainStr.toUpperCase().replace(/\./g, ' '),
        scope: mode === 'passive' ? 'external' : 'infrastructure',
        lastScanTime: new Date().toISOString(),
        status: 'scanning',
        stats: {
          totalSubdomains: 14,
          openPorts: 4,
          activeHosts: 9,
          crawledEndpoints: 28,
          cveCount: 0,
        },
      };
      setTargets([targetObj, ...targets]);
    }

    setSelectedTarget(targetObj);

    // Push initial scan launch event
    const startEvt: LiveWebSocketEvent = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      tool: activeTools[0] || 'subfinder',
      eventType: 'SYSTEM_ALERT',
      summary: `Autonomous recon initiated on ${targetDomainStr} [Mode: ${mode.toUpperCase()}, Tools: ${activeTools.length}]`,
      payload: { target: targetDomainStr, mode, tools: activeTools },
      severity: 'info',
    };
    setLiveEvents(prev => [startEvt, ...prev]);

    // Simulate completion after 3s
    setTimeout(() => {
      setTargets(prev => prev.map(t => t.id === targetObj.id ? { ...t, status: 'completed' } : t));
      const doneEvt: LiveWebSocketEvent = {
        id: `evt-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        tool: 'amass',
        eventType: 'DISCOVERY',
        summary: `Recon completed on ${targetDomainStr}: Attack surface map synchronized.`,
        payload: { target: targetDomainStr, status: 'SUCCESS' },
        severity: 'nominal',
      };
      setLiveEvents(prev => [doneEvt, ...prev]);
    }, 3000);
  };

  const openPortCount = ports.filter(p => p.state === 'open').length;
  const cveCount = ports.filter(p => p.vulnerabilities && p.vulnerabilities.length > 0).length;

  return (
    <div className="h-screen bg-[#080c14] text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onTriggerScan={() => setIsScanModalOpen(true)}
      />

      {/* Real-time WebSocket Stream Telemetry Bar */}
      <LiveStreamBar
        events={liveEvents}
        isStreaming={isStreaming}
        onToggleStreaming={() => setIsStreaming(!isStreaming)}
        speed={streamSpeed}
        onChangeSpeed={setStreamSpeed}
        selectedToolFilter={selectedToolFilter}
        onSelectToolFilter={setSelectedToolFilter}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden">
        {/* Workspace Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          targetCount={targets.length}
          openPortCount={openPortCount}
          cveCount={cveCount}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'overview' && (
              <OverviewDashboard
                targets={targets}
                selectedTarget={selectedTarget}
                onSelectTarget={setSelectedTarget}
                subdomains={subdomains}
                ports={ports}
                activeHosts={activeHosts}
                dnsRecords={dnsRecords}
                crawlEndpoints={crawlEndpoints}
                onNavigateTab={setActiveTab}
                onTriggerScan={() => setIsScanModalOpen(true)}
              />
            )}

            {activeTab === 'subdomains' && (
              <SubdomainsView
                subdomains={subdomains}
                onAddSubdomain={handleAddSubdomain}
              />
            )}

            {activeTab === 'ports' && (
              <PortSpectrumView
                ports={ports}
                onTriggerNmapScan={() => setIsScanModalOpen(true)}
              />
            )}

            {activeTab === 'active-hosts' && (
              <ActiveHostsView
                activeHosts={activeHosts}
              />
            )}

            {activeTab === 'crawler-whois' && (
              <CrawlerWhoisView
                crawlEndpoints={crawlEndpoints}
                whoisData={whoisData}
              />
            )}

            {activeTab === 'self-correction' && (
              <SelfCorrectionLab />
            )}

            {activeTab === 'mcp-registry' && (
              <McpToolRegistry />
            )}

            {activeTab === 'api-docs' && (
              <ApiExplorer
                targets={targets}
                subdomains={subdomains}
                ports={ports}
                activeHosts={activeHosts}
                whoisData={whoisData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Recon Scan Configuration Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onStartScan={handleStartScan}
      />
    </div>
  );
}
