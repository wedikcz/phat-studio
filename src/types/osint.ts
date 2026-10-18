/**
 * OSINT and Reconnaissance Tool Data Types
 * Covers Amass, Nmap, Subfinder, DNSX, Katana, httpx, and Whois.
 */

export type OsintTool = 
  | 'amass'
  | 'nmap'
  | 'subfinder'
  | 'dnsx'
  | 'katana'
  | 'httpx'
  | 'whois';

export interface SubdomainRecord {
  id: string;
  subdomain: string;
  rootDomain: string;
  source: 'subfinder' | 'amass' | 'dnsx' | 'certspotter' | 'shodan' | 'alienvault';
  ipAddress?: string;
  dnsStatus?: 'RESOLVED' | 'NXDOMAIN' | 'WILDCARD' | 'CNAME_ONLY';
  cname?: string;
  firstSeen: string;
  confidence: number;
}

export interface PortRecord {
  id: string;
  targetIp: string;
  host: string;
  port: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'filtered' | 'closed';
  service: string;
  product?: string;
  version?: string;
  banner?: string;
  cpe?: string;
  vulnerabilities?: Array<{
    cve: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    score: number;
  }>;
}

export interface ActiveHostRecord {
  id: string;
  host: string;
  url: string;
  ip: string;
  asn?: string;
  org?: string;
  statusCode: number;
  title: string;
  webServer: string;
  technologies: string[];
  responseTimeMs: number;
  contentLength: number;
  sslCert?: {
    subject: string;
    issuer: string;
    expiresInDays: number;
    isValid: boolean;
  };
  discoveredBy: 'httpx' | 'dnsx' | 'amass';
}

export interface DnsRecord {
  id: string;
  domain: string;
  recordType: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SOA';
  value: string;
  ttl: number;
  resolver: string;
  status: 'NOERROR' | 'NXDOMAIN' | 'SERVFAIL';
}

export interface CrawlEndpointRecord {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpointPath: string;
  contentType: string;
  depth: number;
  parameters: string[];
  sourceUrl: string;
  isApiEndpoint: boolean;
  discoveredBy: 'katana';
}

export interface WhoisRecord {
  domainName: string;
  registrar: string;
  creationDate: string;
  updatedDate: string;
  expirationDate: string;
  nameServers: string[];
  status: string[];
  dnssec: boolean;
  registrantCountry?: string;
  registrantOrg?: string;
  adminContactPrivacy: boolean;
  rawText: string;
}

export interface TargetDomain {
  id: string;
  domain: string;
  name: string;
  scope: 'internal' | 'external' | 'bounty' | 'infrastructure';
  lastScanTime: string;
  status: 'idle' | 'scanning' | 'completed' | 'failed';
  stats: {
    totalSubdomains: number;
    openPorts: number;
    activeHosts: number;
    crawledEndpoints: number;
    cveCount: number;
  };
}

export interface LiveWebSocketEvent {
  id: string;
  timestamp: string;
  tool: OsintTool;
  eventType: 'DISCOVERY' | 'PORT_HIT' | 'HOST_PROBED' | 'ENDPOINT_CRAWLED' | 'DNS_RESOLVED' | 'SYSTEM_ALERT';
  summary: string;
  payload: Record<string, unknown>;
  severity: 'info' | 'nominal' | 'warning' | 'alert';
}

export interface OsintScanFilters {
  searchQuery: string;
  toolFilter: OsintTool | 'all';
  statusFilter: string;
}
