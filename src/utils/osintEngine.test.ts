import test from 'node:test';
import assert from 'node:assert/strict';
import {
  correlateAssets,
  calculatePortSpectrum,
  calculateHttpStatusDistribution,
  calculateDaysUntilExpiry,
} from './osintEngine.ts';
import type { SubdomainRecord, DnsRecord, ActiveHostRecord, PortRecord } from '../types/osint.ts';

test('correlateAssets properly joins subdomains, DNS, httpx, and Nmap data', () => {
  const subdomains: SubdomainRecord[] = [
    {
      id: 'sub-1',
      subdomain: 'api.target-corp.internal',
      rootDomain: 'target-corp.internal',
      source: 'subfinder',
      ipAddress: '10.0.4.12',
      firstSeen: '2026-10-18T08:00:00Z',
      confidence: 95,
    },
    {
      id: 'sub-2',
      subdomain: 'api.target-corp.internal',
      rootDomain: 'target-corp.internal',
      source: 'amass',
      ipAddress: '10.0.4.12',
      firstSeen: '2026-10-18T08:05:00Z',
      confidence: 90,
    },
  ];

  const dnsRecords: DnsRecord[] = [
    {
      id: 'dns-1',
      domain: 'api.target-corp.internal',
      recordType: 'A',
      value: '10.0.4.12',
      ttl: 300,
      resolver: '1.1.1.1',
      status: 'NOERROR',
    },
  ];

  const activeHosts: ActiveHostRecord[] = [
    {
      id: 'host-1',
      host: 'api.target-corp.internal',
      url: 'https://api.target-corp.internal',
      ip: '10.0.4.12',
      statusCode: 200,
      title: 'API Gateway',
      webServer: 'envoy/1.28.0',
      technologies: ['Envoy', 'gRPC-Web', 'OAuth2'],
      responseTimeMs: 42,
      contentLength: 1240,
      discoveredBy: 'httpx',
    },
  ];

  const ports: PortRecord[] = [
    {
      id: 'port-1',
      targetIp: '10.0.4.12',
      host: 'api.target-corp.internal',
      port: 443,
      protocol: 'tcp',
      state: 'open',
      service: 'https',
    },
    {
      id: 'port-2',
      targetIp: '10.0.4.12',
      host: 'api.target-corp.internal',
      port: 8443,
      protocol: 'tcp',
      state: 'open',
      service: 'https-alt',
    },
  ];

  const correlated = correlateAssets(subdomains, dnsRecords, activeHosts, ports);
  assert.equal(correlated.length, 1);
  const asset = correlated[0];
  assert.equal(asset.hostname, 'api.target-corp.internal');
  assert.deepEqual(asset.sources, ['subfinder', 'amass']);
  assert.equal(asset.dnsStatus, 'NOERROR');
  assert.equal(asset.httpStatus, 200);
  assert.deepEqual(asset.openPorts, [443, 8443]);
  assert.ok(asset.technologies.includes('Envoy'));
});

test('calculatePortSpectrum aggregates port frequencies correctly', () => {
  const ports: PortRecord[] = [
    { id: '1', targetIp: '1.1.1.1', host: 'a.com', port: 443, protocol: 'tcp', state: 'open', service: 'https' },
    { id: '2', targetIp: '1.1.1.2', host: 'b.com', port: 443, protocol: 'tcp', state: 'open', service: 'https' },
    { id: '3', targetIp: '1.1.1.3', host: 'c.com', port: 80, protocol: 'tcp', state: 'open', service: 'http' },
    { id: '4', targetIp: '1.1.1.4', host: 'd.com', port: 22, protocol: 'tcp', state: 'closed', service: 'ssh' },
  ];

  const spectrum = calculatePortSpectrum(ports);
  assert.equal(spectrum.length, 2);
  assert.equal(spectrum[0].port, 443);
  assert.equal(spectrum[0].count, 2);
  assert.equal(spectrum[1].port, 80);
  assert.equal(spectrum[1].count, 1);
});

test('calculateHttpStatusDistribution categorizes 2xx, 3xx, 4xx, 5xx', () => {
  const hosts: ActiveHostRecord[] = [
    { id: '1', host: 'h1', url: 'u1', ip: 'i1', statusCode: 200, title: 't', webServer: 'w', technologies: [], responseTimeMs: 10, contentLength: 1, discoveredBy: 'httpx' },
    { id: '2', host: 'h2', url: 'u2', ip: 'i2', statusCode: 204, title: 't', webServer: 'w', technologies: [], responseTimeMs: 10, contentLength: 1, discoveredBy: 'httpx' },
    { id: '3', host: 'h3', url: 'u3', ip: 'i3', statusCode: 301, title: 't', webServer: 'w', technologies: [], responseTimeMs: 10, contentLength: 1, discoveredBy: 'httpx' },
    { id: '4', host: 'h4', url: 'u4', ip: 'i4', statusCode: 403, title: 't', webServer: 'w', technologies: [], responseTimeMs: 10, contentLength: 1, discoveredBy: 'httpx' },
    { id: '5', host: 'h5', url: 'u5', ip: 'i5', statusCode: 502, title: 't', webServer: 'w', technologies: [], responseTimeMs: 10, contentLength: 1, discoveredBy: 'httpx' },
  ];

  const dist = calculateHttpStatusDistribution(hosts);
  assert.equal(dist['2xx Success'], 2);
  assert.equal(dist['3xx Redirect'], 1);
  assert.equal(dist['4xx Client Error'], 1);
  assert.equal(dist['5xx Server Error'], 1);
});

test('calculateDaysUntilExpiry calculates remaining domain lifespan', () => {
  const futureDate = '2027-10-18T10:00:00Z'; // 365 days after 2026-10-18
  const days = calculateDaysUntilExpiry(futureDate);
  assert.equal(days, 365);
});
