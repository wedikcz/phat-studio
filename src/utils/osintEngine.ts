/**
 * Pure Logic: OSINT Intelligence & Cross-Tool Correlation Engine
 */

import type { SubdomainRecord, PortRecord, ActiveHostRecord, DnsRecord } from '../types/osint.ts';

export interface CorrelatedAsset {
  hostname: string;
  ipAddresses: string[];
  sources: string[];
  dnsStatus: string;
  httpStatus?: number;
  openPorts: number[];
  technologies: string[];
  riskScore: number;
}

/**
 * Correlates data across Subfinder, Amass, DNSX, httpx, and Nmap
 */
export function correlateAssets(
  subdomains: SubdomainRecord[],
  dnsRecords: DnsRecord[],
  activeHosts: ActiveHostRecord[],
  ports: PortRecord[]
): CorrelatedAsset[] {
  const assetMap = new Map<string, CorrelatedAsset>();

  // 1. Ingest subdomains (Subfinder, Amass)
  for (const sub of subdomains) {
    const host = sub.subdomain.toLowerCase().trim();
    if (!assetMap.has(host)) {
      assetMap.set(host, {
        hostname: host,
        ipAddresses: sub.ipAddress ? [sub.ipAddress] : [],
        sources: [sub.source],
        dnsStatus: sub.dnsStatus || 'UNKNOWN',
        openPorts: [],
        technologies: [],
        riskScore: 10,
      });
    } else {
      const existing = assetMap.get(host)!;
      if (!existing.sources.includes(sub.source)) {
        existing.sources.push(sub.source);
      }
      if (sub.ipAddress && !existing.ipAddresses.includes(sub.ipAddress)) {
        existing.ipAddresses.push(sub.ipAddress);
      }
    }
  }

  // 2. Correlate DNSX records
  for (const dns of dnsRecords) {
    const host = dns.domain.toLowerCase().trim();
    if (assetMap.has(host)) {
      const existing = assetMap.get(host)!;
      existing.dnsStatus = dns.status;
      if (dns.recordType === 'A' || dns.recordType === 'AAAA') {
        if (!existing.ipAddresses.includes(dns.value)) {
          existing.ipAddresses.push(dns.value);
        }
      }
    }
  }

  // 3. Correlate httpx active probes
  for (const hostItem of activeHosts) {
    const host = hostItem.host.toLowerCase().trim();
    let entry = assetMap.get(host);
    if (!entry) {
      entry = {
        hostname: host,
        ipAddresses: [hostItem.ip],
        sources: ['httpx'],
        dnsStatus: 'RESOLVED',
        openPorts: [],
        technologies: hostItem.technologies,
        riskScore: 20,
      };
      assetMap.set(host, entry);
    } else {
      entry.httpStatus = hostItem.statusCode;
      entry.technologies = Array.from(new Set([...entry.technologies, ...hostItem.technologies]));
      if (!entry.ipAddresses.includes(hostItem.ip)) {
        entry.ipAddresses.push(hostItem.ip);
      }
    }
  }

  // 4. Correlate Nmap open ports
  for (const portItem of ports) {
    const host = portItem.host.toLowerCase().trim();
    const entry = assetMap.get(host);
    if (entry && portItem.state === 'open') {
      if (!entry.openPorts.includes(portItem.port)) {
        entry.openPorts.push(portItem.port);
      }
      // Calculate risk score based on open critical ports and CVEs
      if ([21, 23, 445, 3389].includes(portItem.port)) {
        entry.riskScore += 25;
      }
      if (portItem.vulnerabilities && portItem.vulnerabilities.length > 0) {
        entry.riskScore += portItem.vulnerabilities.length * 20;
      }
    }
  }

  return Array.from(assetMap.values()).map(asset => ({
    ...asset,
    openPorts: asset.openPorts.sort((a, b) => a - b),
    riskScore: Math.min(100, asset.riskScore),
  }));
}

/**
 * Calculates port spectrum distribution buckets
 */
export function calculatePortSpectrum(ports: PortRecord[]): Array<{ port: number; count: number; service: string }> {
  const counts = new Map<number, { count: number; service: string }>();

  for (const p of ports) {
    if (p.state === 'open') {
      const existing = counts.get(p.port) || { count: 0, service: p.service || 'unknown' };
      existing.count += 1;
      counts.set(p.port, existing);
    }
  }

  return Array.from(counts.entries())
    .map(([port, data]) => ({ port, count: data.count, service: data.service }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Aggregates HTTP status code distribution
 */
export function calculateHttpStatusDistribution(hosts: ActiveHostRecord[]): Record<string, number> {
  const distribution: Record<string, number> = {
    '2xx Success': 0,
    '3xx Redirect': 0,
    '4xx Client Error': 0,
    '5xx Server Error': 0,
  };

  for (const h of hosts) {
    if (h.statusCode >= 200 && h.statusCode < 300) {
      distribution['2xx Success']++;
    } else if (h.statusCode >= 300 && h.statusCode < 400) {
      distribution['3xx Redirect']++;
    } else if (h.statusCode >= 400 && h.statusCode < 500) {
      distribution['4xx Client Error']++;
    } else if (h.statusCode >= 500) {
      distribution['5xx Server Error']++;
    }
  }

  return distribution;
}

/**
 * Calculates domain Whois days until expiration
 */
export function calculateDaysUntilExpiry(expirationDateStr: string): number {
  const expiry = new Date(expirationDateStr).getTime();
  const now = new Date('2026-10-18T10:00:00Z').getTime(); // Using consistent runtime reference
  const diffMs = expiry - now;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}
