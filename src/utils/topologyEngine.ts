/**
 * Pure Logic: Network Topology Graph Builder for D3
 */

import type { TargetDomain, SubdomainRecord, ActiveHostRecord, PortRecord } from '../types/osint.ts';

export type TopologyNodeType = 'root' | 'subdomain' | 'host' | 'port';

export interface TopologyNode {
  id: string;
  name: string;
  type: TopologyNodeType;
  radius: number;
  color: string;
  group: number;
  riskLevel: 'nominal' | 'warning' | 'critical';
  details: {
    fqdn?: string;
    ip?: string;
    port?: number;
    service?: string;
    protocol?: string;
    banner?: string;
    technologies?: string[];
    vulnerabilities?: Array<{ cve: string; severity: string; score: number }>;
    dnsStatus?: string;
    source?: string;
  };
  // D3 force simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface TopologyLink {
  source: string | TopologyNode;
  target: string | TopologyNode;
  type: 'root_to_sub' | 'sub_to_host' | 'host_to_port';
  value: number;
}

export interface TopologyGraphData {
  nodes: TopologyNode[];
  links: TopologyLink[];
  stats: {
    totalNodes: number;
    subdomainNodes: number;
    hostNodes: number;
    portNodes: number;
    criticalNodes: number;
  };
}

/**
 * Builds nodes and links graph for D3 force simulation from OSINT data
 */
export function buildTopologyGraph(
  target: TargetDomain,
  subdomains: SubdomainRecord[],
  activeHosts: ActiveHostRecord[],
  ports: PortRecord[]
): TopologyGraphData {
  const nodesMap = new Map<string, TopologyNode>();
  const links: TopologyLink[] = [];

  // 1. Root Node (Target Domain)
  const rootId = `root-${target.domain}`;
  nodesMap.set(rootId, {
    id: rootId,
    name: target.domain,
    type: 'root',
    radius: 22,
    color: '#a855f7', // purple-500
    group: 0,
    riskLevel: 'nominal',
    details: {
      fqdn: target.domain,
    },
  });

  // 2. Subdomain Nodes (Subfinder & Amass)
  for (const sub of subdomains) {
    const subId = `sub-${sub.subdomain}`;
    if (!nodesMap.has(subId)) {
      nodesMap.set(subId, {
        id: subId,
        name: sub.subdomain.replace(`.${target.domain}`, ''),
        type: 'subdomain',
        radius: 14,
        color: sub.dnsStatus === 'NXDOMAIN' ? '#64748b' : '#38bdf8', // slate or cyan
        group: 1,
        riskLevel: sub.dnsStatus === 'NXDOMAIN' ? 'warning' : 'nominal',
        details: {
          fqdn: sub.subdomain,
          ip: sub.ipAddress,
          dnsStatus: sub.dnsStatus,
          source: sub.source,
        },
      });

      // Link root to subdomain
      links.push({
        source: rootId,
        target: subId,
        type: 'root_to_sub',
        value: 1,
      });
    }

    // 3. Host / IP Node
    if (sub.ipAddress) {
      const hostId = `ip-${sub.ipAddress}`;
      if (!nodesMap.has(hostId)) {
        const matchingActiveHost = activeHosts.find(h => h.ip === sub.ipAddress);
        nodesMap.set(hostId, {
          id: hostId,
          name: sub.ipAddress,
          type: 'host',
          radius: 12,
          color: '#10b981', // emerald-500
          group: 2,
          riskLevel: 'nominal',
          details: {
            ip: sub.ipAddress,
            fqdn: sub.subdomain,
            technologies: matchingActiveHost?.technologies || [],
          },
        });
      }

      // Link subdomain to host IP
      links.push({
        source: subId,
        target: hostId,
        type: 'sub_to_host',
        value: 2,
      });
    }
  }

  // 4. Port / Service Nodes (Nmap)
  for (const p of ports) {
    if (p.state !== 'open') continue;

    const hostId = `ip-${p.targetIp}`;
    // If host doesn't exist yet, create it
    if (!nodesMap.has(hostId)) {
      nodesMap.set(hostId, {
        id: hostId,
        name: p.targetIp,
        type: 'host',
        radius: 12,
        color: '#10b981',
        group: 2,
        riskLevel: 'nominal',
        details: {
          ip: p.targetIp,
          fqdn: p.host,
        },
      });
    }

    const portId = `port-${p.targetIp}-${p.port}`;
    const hasVuln = Boolean(p.vulnerabilities && p.vulnerabilities.length > 0);
    const isCritical = hasVuln || [8080, 22, 3306].includes(p.port);

    nodesMap.set(portId, {
      id: portId,
      name: `${p.port}/${p.service.toUpperCase()}`,
      type: 'port',
      radius: hasVuln ? 13 : 9,
      color: hasVuln ? '#f43f5e' : isCritical ? '#f59e0b' : '#06b6d4', // rose or amber or cyan
      group: 3,
      riskLevel: hasVuln ? 'critical' : isCritical ? 'warning' : 'nominal',
      details: {
        port: p.port,
        service: p.service,
        protocol: p.protocol,
        banner: p.banner,
        vulnerabilities: p.vulnerabilities,
        ip: p.targetIp,
        fqdn: p.host,
      },
    });

    // Link host IP to port
    links.push({
      source: hostId,
      target: portId,
      type: 'host_to_port',
      value: 3,
    });
  }

  const nodes = Array.from(nodesMap.values());

  return {
    nodes,
    links,
    stats: {
      totalNodes: nodes.length,
      subdomainNodes: nodes.filter(n => n.type === 'subdomain').length,
      hostNodes: nodes.filter(n => n.type === 'host').length,
      portNodes: nodes.filter(n => n.type === 'port').length,
      criticalNodes: nodes.filter(n => n.riskLevel === 'critical').length,
    },
  };
}
