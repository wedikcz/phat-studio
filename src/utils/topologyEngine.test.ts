import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTopologyGraph } from './topologyEngine.ts';
import type { TargetDomain, SubdomainRecord, ActiveHostRecord, PortRecord } from '../types/osint.ts';

test('buildTopologyGraph builds connected graph with root, subdomains, hosts, and ports', () => {
  const target: TargetDomain = {
    id: 't-1',
    domain: 'example.com',
    name: 'Example',
    scope: 'infrastructure',
    lastScanTime: '2026-10-18T10:00:00Z',
    status: 'completed',
    stats: { totalSubdomains: 1, openPorts: 1, activeHosts: 1, crawledEndpoints: 0, cveCount: 0 },
  };

  const subdomains: SubdomainRecord[] = [
    {
      id: 'sub-1',
      subdomain: 'api.example.com',
      rootDomain: 'example.com',
      source: 'subfinder',
      ipAddress: '93.184.216.34',
      dnsStatus: 'RESOLVED',
      firstSeen: '2026-10-18T10:00:00Z',
      confidence: 95,
    },
  ];

  const activeHosts: ActiveHostRecord[] = [
    {
      id: 'h-1',
      host: 'api.example.com',
      url: 'https://api.example.com',
      ip: '93.184.216.34',
      statusCode: 200,
      title: 'API',
      webServer: 'nginx',
      technologies: ['FastAPI'],
      responseTimeMs: 30,
      contentLength: 200,
      discoveredBy: 'httpx',
    },
  ];

  const ports: PortRecord[] = [
    {
      id: 'p-1',
      targetIp: '93.184.216.34',
      host: 'api.example.com',
      port: 443,
      protocol: 'tcp',
      state: 'open',
      service: 'https',
    },
    {
      id: 'p-2',
      targetIp: '93.184.216.34',
      host: 'api.example.com',
      port: 8080,
      protocol: 'tcp',
      state: 'open',
      service: 'http',
      vulnerabilities: [{ cve: 'CVE-2024-9999', severity: 'CRITICAL', score: 9.8 }],
    },
  ];

  const graph = buildTopologyGraph(target, subdomains, activeHosts, ports);

  // Check node counts: 1 root + 1 subdomain + 1 host + 2 ports = 5 nodes
  assert.equal(graph.nodes.length, 5);
  assert.equal(graph.stats.subdomainNodes, 1);
  assert.equal(graph.stats.hostNodes, 1);
  assert.equal(graph.stats.portNodes, 2);
  assert.equal(graph.stats.criticalNodes, 1); // port 8080 has CVE

  // Check links exist connecting root -> sub -> host -> port
  assert.ok(graph.links.some(l => l.type === 'root_to_sub'));
  assert.ok(graph.links.some(l => l.type === 'sub_to_host'));
  assert.ok(graph.links.some(l => l.type === 'host_to_port'));
});
