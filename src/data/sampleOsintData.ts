import {
  TargetDomain,
  SubdomainRecord,
  PortRecord,
  ActiveHostRecord,
  DnsRecord,
  CrawlEndpointRecord,
  WhoisRecord,
  LiveWebSocketEvent
} from '../types/osint.ts';

export const SAMPLE_TARGETS: TargetDomain[] = [
  {
    id: 'target-1',
    domain: 'target-defense.corp',
    name: 'Target Defense Enterprise',
    scope: 'infrastructure',
    lastScanTime: '2026-10-18T10:45:00Z',
    status: 'completed',
    stats: {
      totalSubdomains: 48,
      openPorts: 19,
      activeHosts: 34,
      crawledEndpoints: 142,
      cveCount: 4,
    },
  },
  {
    id: 'target-2',
    domain: 'fintech-gateway.io',
    name: 'Fintech Payment Cloud',
    scope: 'bounty',
    lastScanTime: '2026-10-18T11:02:15Z',
    status: 'scanning',
    stats: {
      totalSubdomains: 31,
      openPorts: 12,
      activeHosts: 22,
      crawledEndpoints: 98,
      cveCount: 1,
    },
  },
  {
    id: 'target-3',
    domain: 'cloudmesh.org',
    name: 'CloudMesh Kubernetes Grid',
    scope: 'external',
    lastScanTime: '2026-10-17T22:30:00Z',
    status: 'idle',
    stats: {
      totalSubdomains: 26,
      openPorts: 8,
      activeHosts: 17,
      crawledEndpoints: 64,
      cveCount: 0,
    },
  },
];

export const SAMPLE_SUBDOMAINS: SubdomainRecord[] = [
  { id: 'sub-01', subdomain: 'api.target-defense.corp', rootDomain: 'target-defense.corp', source: 'subfinder', ipAddress: '198.51.100.14', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:12:00Z', confidence: 99 },
  { id: 'sub-02', subdomain: 'auth.target-defense.corp', rootDomain: 'target-defense.corp', source: 'amass', ipAddress: '198.51.100.18', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:14:00Z', confidence: 98 },
  { id: 'sub-03', subdomain: 'vpn.target-defense.corp', rootDomain: 'target-defense.corp', source: 'shodan', ipAddress: '198.51.100.2', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:15:30Z', confidence: 94 },
  { id: 'sub-04', subdomain: 'portal.target-defense.corp', rootDomain: 'target-defense.corp', source: 'subfinder', ipAddress: '198.51.100.22', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:16:10Z', confidence: 95 },
  { id: 'sub-05', subdomain: 'k8s-ingress.target-defense.corp', rootDomain: 'target-defense.corp', source: 'amass', ipAddress: '198.51.100.45', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:17:00Z', confidence: 97 },
  { id: 'sub-06', subdomain: 'grafana.target-defense.corp', rootDomain: 'target-defense.corp', source: 'subfinder', ipAddress: '198.51.100.80', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:19:22Z', confidence: 92 },
  { id: 'sub-07', subdomain: 'jenkins.target-defense.corp', rootDomain: 'target-defense.corp', source: 'alienvault', ipAddress: '198.51.100.82', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:21:00Z', confidence: 89 },
  { id: 'sub-08', subdomain: 'vault.target-defense.corp', rootDomain: 'target-defense.corp', source: 'amass', ipAddress: '198.51.100.15', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:22:45Z', confidence: 96 },
  { id: 'sub-09', subdomain: 'mail.target-defense.corp', rootDomain: 'target-defense.corp', source: 'dnsx', ipAddress: '198.51.100.25', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:23:12Z', confidence: 99 },
  { id: 'sub-10', subdomain: 'dev-gateway.target-defense.corp', rootDomain: 'target-defense.corp', source: 'certspotter', ipAddress: '198.51.100.104', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:25:00Z', confidence: 88 },
  { id: 'sub-11', subdomain: 'staging-api.target-defense.corp', rootDomain: 'target-defense.corp', source: 'subfinder', ipAddress: '198.51.100.106', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:26:30Z', confidence: 91 },
  { id: 'sub-12', subdomain: 'metrics.target-defense.corp', rootDomain: 'target-defense.corp', source: 'amass', ipAddress: '198.51.100.90', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:28:10Z', confidence: 90 },
  { id: 'sub-13', subdomain: 'legacy-admin.target-defense.corp', rootDomain: 'target-defense.corp', source: 'shodan', ipAddress: '198.51.100.199', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:30:00Z', confidence: 85 },
  { id: 'sub-14', subdomain: 'test-qa.target-defense.corp', rootDomain: 'target-defense.corp', source: 'subfinder', dnsStatus: 'NXDOMAIN', firstSeen: '2026-10-18T08:31:00Z', confidence: 75 },
  { id: 'sub-15', subdomain: 'cdn-assets.target-defense.corp', rootDomain: 'target-defense.corp', source: 'amass', ipAddress: '104.26.12.9', cname: 'cdn.cloudflare.net', dnsStatus: 'RESOLVED', firstSeen: '2026-10-18T08:32:00Z', confidence: 98 },
];

export const SAMPLE_PORTS: PortRecord[] = [
  { id: 'port-1', targetIp: '198.51.100.14', host: 'api.target-defense.corp', port: 443, protocol: 'tcp', state: 'open', service: 'https', product: 'nginx', version: '1.24.0', banner: 'Server: nginx/1.24.0', cpe: 'cpe:/a:nginx:nginx:1.24.0' },
  { id: 'port-2', targetIp: '198.51.100.14', host: 'api.target-defense.corp', port: 80, protocol: 'tcp', state: 'open', service: 'http', product: 'nginx', version: '1.24.0' },
  { id: 'port-3', targetIp: '198.51.100.18', host: 'auth.target-defense.corp', port: 443, protocol: 'tcp', state: 'open', service: 'https', product: 'Envoy', version: '1.28.1' },
  { id: 'port-4', targetIp: '198.51.100.2', host: 'vpn.target-defense.corp', port: 1194, protocol: 'udp', state: 'open', service: 'openvpn', product: 'OpenVPN', banner: 'OpenVPN 2.6.8 x86_64' },
  { id: 'port-5', targetIp: '198.51.100.2', host: 'vpn.target-defense.corp', port: 443, protocol: 'tcp', state: 'open', service: 'https', product: 'OpenVPN Access Server' },
  { id: 'port-6', targetIp: '198.51.100.80', host: 'grafana.target-defense.corp', port: 3000, protocol: 'tcp', state: 'open', service: 'http', product: 'Grafana', version: '10.2.1', banner: 'Grafana v10.2.1 UI' },
  { id: 'port-7', targetIp: '198.51.100.82', host: 'jenkins.target-defense.corp', port: 8080, protocol: 'tcp', state: 'open', service: 'http', product: 'Jenkins', version: '2.426.1', vulnerabilities: [{ cve: 'CVE-2024-23897', severity: 'CRITICAL', score: 9.8 }] },
  { id: 'port-8', targetIp: '198.51.100.82', host: 'jenkins.target-defense.corp', port: 22, protocol: 'tcp', state: 'open', service: 'ssh', product: 'OpenSSH', version: '9.3p1', banner: 'SSH-2.0-OpenSSH_9.3p1 Debian-1' },
  { id: 'port-9', targetIp: '198.51.100.15', host: 'vault.target-defense.corp', port: 8200, protocol: 'tcp', state: 'open', service: 'vault', product: 'HashiCorp Vault', version: '1.15.2' },
  { id: 'port-10', targetIp: '198.51.100.25', host: 'mail.target-defense.corp', port: 25, protocol: 'tcp', state: 'open', service: 'smtp', product: 'Postfix' },
  { id: 'port-11', targetIp: '198.51.100.25', host: 'mail.target-defense.corp', port: 587, protocol: 'tcp', state: 'open', service: 'submission', product: 'Postfix' },
  { id: 'port-12', targetIp: '198.51.100.90', host: 'metrics.target-defense.corp', port: 9090, protocol: 'tcp', state: 'open', service: 'prometheus', product: 'Prometheus', version: '2.49.1' },
  { id: 'port-13', targetIp: '198.51.100.199', host: 'legacy-admin.target-defense.corp', port: 80, protocol: 'tcp', state: 'open', service: 'http', product: 'Apache httpd', version: '2.4.49', vulnerabilities: [{ cve: 'CVE-2021-41773', severity: 'HIGH', score: 8.6 }] },
  { id: 'port-14', targetIp: '198.51.100.199', host: 'legacy-admin.target-defense.corp', port: 3306, protocol: 'tcp', state: 'open', service: 'mysql', product: 'MySQL', version: '5.7.34', banner: '5.7.34-log MySQL Community Server' },
  { id: 'port-15', targetIp: '198.51.100.45', host: 'k8s-ingress.target-defense.corp', port: 443, protocol: 'tcp', state: 'open', service: 'https', product: 'Traefik', version: '3.0' },
  { id: 'port-16', targetIp: '198.51.100.45', host: 'k8s-ingress.target-defense.corp', port: 6443, protocol: 'tcp', state: 'filtered', service: 'kubernetes-api' },
  { id: 'port-17', targetIp: '198.51.100.106', host: 'staging-api.target-defense.corp', port: 8443, protocol: 'tcp', state: 'open', service: 'https-alt', product: 'Spring Boot' },
  { id: 'port-18', targetIp: '198.51.100.14', host: 'api.target-defense.corp', port: 6379, protocol: 'tcp', state: 'closed', service: 'redis' },
];

export const SAMPLE_ACTIVE_HOSTS: ActiveHostRecord[] = [
  {
    id: 'host-1',
    host: 'api.target-defense.corp',
    url: 'https://api.target-defense.corp',
    ip: '198.51.100.14',
    asn: 'AS64512',
    org: 'Defense Global Transit',
    statusCode: 200,
    title: 'Enterprise API Gateway v2',
    webServer: 'nginx/1.24.0',
    technologies: ['FastAPI', 'Python 3.11', 'Redis', 'Nginx', 'Docker'],
    responseTimeMs: 28,
    contentLength: 2840,
    sslCert: { subject: 'CN=*.target-defense.corp', issuer: 'DigiCert Global Root G2', expiresInDays: 142, isValid: true },
    discoveredBy: 'httpx',
  },
  {
    id: 'host-2',
    host: 'auth.target-defense.corp',
    url: 'https://auth.target-defense.corp',
    ip: '198.51.100.18',
    asn: 'AS64512',
    org: 'Defense Global Transit',
    statusCode: 200,
    title: 'Single Sign-On Identity Portal',
    webServer: 'Envoy/1.28.1',
    technologies: ['Keycloak', 'OAuth2', 'OIDC', 'React 18', 'TailwindCSS'],
    responseTimeMs: 34,
    contentLength: 5410,
    sslCert: { subject: 'CN=auth.target-defense.corp', issuer: "Let's Encrypt", expiresInDays: 58, isValid: true },
    discoveredBy: 'httpx',
  },
  {
    id: 'host-3',
    host: 'grafana.target-defense.corp',
    url: 'http://grafana.target-defense.corp:3000',
    ip: '198.51.100.80',
    asn: 'AS64512',
    org: 'Defense Global Transit',
    statusCode: 302,
    title: 'Grafana - Redirecting to Login',
    webServer: 'Grafana/10.2.1',
    technologies: ['Grafana', 'Go', 'Prometheus', 'TypeScript'],
    responseTimeMs: 52,
    contentLength: 840,
    discoveredBy: 'httpx',
  },
  {
    id: 'host-4',
    host: 'jenkins.target-defense.corp',
    url: 'http://jenkins.target-defense.corp:8080',
    ip: '198.51.100.82',
    asn: 'AS64512',
    org: 'Defense Global Transit',
    statusCode: 403,
    title: 'Jenkins Continuous Integration [Access Restricted]',
    webServer: 'Jetty/10.0.18',
    technologies: ['Jenkins', 'Java 17', 'Jetty'],
    responseTimeMs: 84,
    contentLength: 1210,
    discoveredBy: 'httpx',
  },
  {
    id: 'host-5',
    host: 'portal.target-defense.corp',
    url: 'https://portal.target-defense.corp',
    ip: '198.51.100.22',
    asn: 'AS64512',
    org: 'Defense Global Transit',
    statusCode: 200,
    title: 'Defense Partner Portal',
    webServer: 'Cloudflare',
    technologies: ['Next.js 14', 'React', 'Cloudflare CDN', 'WebP'],
    responseTimeMs: 19,
    contentLength: 12400,
    sslCert: { subject: 'CN=*.target-defense.corp', issuer: 'Cloudflare Inc ECC CA-3', expiresInDays: 280, isValid: true },
    discoveredBy: 'httpx',
  },
  {
    id: 'host-6',
    host: 'legacy-admin.target-defense.corp',
    url: 'http://legacy-admin.target-defense.corp',
    ip: '198.51.100.199',
    asn: 'AS64512',
    org: 'Defense Global Transit',
    statusCode: 500,
    title: 'Database Connection Error - Admin v1.4',
    webServer: 'Apache/2.4.49',
    technologies: ['PHP 7.4.21', 'Apache', 'MySQL'],
    responseTimeMs: 190,
    contentLength: 620,
    discoveredBy: 'httpx',
  },
];

export const SAMPLE_DNS_RECORDS: DnsRecord[] = [
  { id: 'dns-1', domain: 'target-defense.corp', recordType: 'A', value: '198.51.100.1', ttl: 300, resolver: '1.1.1.1', status: 'NOERROR' },
  { id: 'dns-2', domain: 'target-defense.corp', recordType: 'NS', value: 'ns1.target-defense.corp', ttl: 86400, resolver: '8.8.8.8', status: 'NOERROR' },
  { id: 'dns-3', domain: 'target-defense.corp', recordType: 'NS', value: 'ns2.target-defense.corp', ttl: 86400, resolver: '8.8.8.8', status: 'NOERROR' },
  { id: 'dns-4', domain: 'target-defense.corp', recordType: 'MX', value: '10 mail.target-defense.corp', ttl: 3600, resolver: '1.1.1.1', status: 'NOERROR' },
  { id: 'dns-5', domain: 'target-defense.corp', recordType: 'TXT', value: 'v=spf1 ip4:198.51.100.0/24 -all', ttl: 3600, resolver: '1.1.1.1', status: 'NOERROR' },
  { id: 'dns-6', domain: 'api.target-defense.corp', recordType: 'A', value: '198.51.100.14', ttl: 300, resolver: '1.1.1.1', status: 'NOERROR' },
  { id: 'dns-7', domain: 'auth.target-defense.corp', recordType: 'A', value: '198.51.100.18', ttl: 300, resolver: '8.8.8.8', status: 'NOERROR' },
  { id: 'dns-8', domain: 'vault.target-defense.corp', recordType: 'A', value: '198.51.100.15', ttl: 300, resolver: '9.9.9.9', status: 'NOERROR' },
  { id: 'dns-9', domain: 'test-qa.target-defense.corp', recordType: 'A', value: '0.0.0.0', ttl: 60, resolver: '1.1.1.1', status: 'NXDOMAIN' },
];

export const SAMPLE_CRAWL_ENDPOINTS: CrawlEndpointRecord[] = [
  { id: 'c-1', url: 'https://api.target-defense.corp/v1/auth/token', method: 'POST', endpointPath: '/v1/auth/token', contentType: 'application/json', depth: 1, parameters: ['grant_type', 'client_id', 'client_secret'], sourceUrl: 'https://api.target-defense.corp/docs', isApiEndpoint: true, discoveredBy: 'katana' },
  { id: 'c-2', url: 'https://api.target-defense.corp/v1/telemetry/nodes', method: 'GET', endpointPath: '/v1/telemetry/nodes', contentType: 'application/json', depth: 2, parameters: ['region', 'limit', 'page'], sourceUrl: 'https://api.target-defense.corp/v1/auth/token', isApiEndpoint: true, discoveredBy: 'katana' },
  { id: 'c-3', url: 'https://api.target-defense.corp/v1/internal/healthz', method: 'GET', endpointPath: '/v1/internal/healthz', contentType: 'text/plain', depth: 1, parameters: [], sourceUrl: 'https://api.target-defense.corp/', isApiEndpoint: true, discoveredBy: 'katana' },
  { id: 'c-4', url: 'https://portal.target-defense.corp/dashboard', method: 'GET', endpointPath: '/dashboard', contentType: 'text/html', depth: 1, parameters: ['tab', 'filter'], sourceUrl: 'https://portal.target-defense.corp/', isApiEndpoint: false, discoveredBy: 'katana' },
  { id: 'c-5', url: 'https://portal.target-defense.corp/static/js/main.7f89b.js', method: 'GET', endpointPath: '/static/js/main.7f89b.js', contentType: 'application/javascript', depth: 2, parameters: [], sourceUrl: 'https://portal.target-defense.corp/dashboard', isApiEndpoint: false, discoveredBy: 'katana' },
  { id: 'c-6', url: 'https://portal.target-defense.corp/api/user/profile', method: 'GET', endpointPath: '/api/user/profile', contentType: 'application/json', depth: 3, parameters: ['userId'], sourceUrl: 'https://portal.target-defense.corp/static/js/main.7f89b.js', isApiEndpoint: true, discoveredBy: 'katana' },
  { id: 'c-7', url: 'http://legacy-admin.target-defense.corp/phpinfo.php', method: 'GET', endpointPath: '/phpinfo.php', contentType: 'text/html', depth: 1, parameters: [], sourceUrl: 'http://legacy-admin.target-defense.corp/robots.txt', isApiEndpoint: false, discoveredBy: 'katana' },
  { id: 'c-8', url: 'http://legacy-admin.target-defense.corp/backup.sql.gz', method: 'GET', endpointPath: '/backup.sql.gz', contentType: 'application/gzip', depth: 2, parameters: [], sourceUrl: 'http://legacy-admin.target-defense.corp/', isApiEndpoint: false, discoveredBy: 'katana' },
];

export const SAMPLE_WHOIS: WhoisRecord = {
  domainName: 'target-defense.corp',
  registrar: 'MarkMonitor Inc. (IANA ID: 292)',
  creationDate: '2016-04-12T14:22:00Z',
  updatedDate: '2026-03-10T09:15:30Z',
  expirationDate: '2028-04-12T14:22:00Z',
  nameServers: ['ns1.target-defense.corp', 'ns2.target-defense.corp', 'ns3.cloudflare.com'],
  status: ['clientTransferProhibited', 'clientUpdateProhibited', 'clientDeleteProhibited'],
  dnssec: true,
  registrantCountry: 'US',
  registrantOrg: 'Target Defense Aerospace Systems LLC',
  adminContactPrivacy: true,
  rawText: `Domain Name: TARGET-DEFENSE.CORP
Registry Domain ID: 2018894121_DOMAIN_CORP-VRSN
Registrar WHOIS Server: whois.markmonitor.com
Registrar URL: http://www.markmonitor.com
Updated Date: 2026-03-10T09:15:30Z
Creation Date: 2016-04-12T14:22:00Z
Registry Expiry Date: 2028-04-12T14:22:00Z
Registrar: MarkMonitor Inc.
Registrar IANA ID: 292
Domain Status: clientTransferProhibited
Domain Status: clientUpdateProhibited
Name Server: NS1.TARGET-DEFENSE.CORP
Name Server: NS2.TARGET-DEFENSE.CORP
DNSSEC: signedDelegation
Registrant Organization: Target Defense Aerospace Systems LLC
Registrant State/Province: VA
Registrant Country: US
Admin Email: privacy-protected@markmonitor.com`,
};

export const INITIAL_LIVE_EVENTS: LiveWebSocketEvent[] = [
  {
    id: 'evt-1',
    timestamp: '11:06:12',
    tool: 'subfinder',
    eventType: 'DISCOVERY',
    summary: 'Discovered subdomain: api.target-defense.corp (Source: crt.sh)',
    payload: { subdomain: 'api.target-defense.corp', source: 'crt.sh', confidence: 99 },
    severity: 'nominal',
  },
  {
    id: 'evt-2',
    timestamp: '11:06:15',
    tool: 'dnsx',
    eventType: 'DNS_RESOLVED',
    summary: 'Resolved api.target-defense.corp -> 198.51.100.14 [NOERROR, 28ms]',
    payload: { domain: 'api.target-defense.corp', ip: '198.51.100.14', rcode: 'NOERROR' },
    severity: 'info',
  },
  {
    id: 'evt-3',
    timestamp: '11:06:19',
    tool: 'httpx',
    eventType: 'HOST_PROBED',
    summary: 'Probed https://api.target-defense.corp [HTTP 200, Nginx 1.24.0, SSL Valid]',
    payload: { statusCode: 200, server: 'nginx/1.24.0', title: 'Enterprise API Gateway v2' },
    severity: 'nominal',
  },
  {
    id: 'evt-4',
    timestamp: '11:06:24',
    tool: 'nmap',
    eventType: 'PORT_HIT',
    summary: 'Open TCP Port: 198.51.100.82:8080 (Jenkins 2.426.1 - CVE-2024-23897 Alert)',
    payload: { port: 8080, service: 'Jenkins', cve: 'CVE-2024-23897', cvss: 9.8 },
    severity: 'alert',
  },
  {
    id: 'evt-5',
    timestamp: '11:06:29',
    tool: 'katana',
    eventType: 'ENDPOINT_CRAWLED',
    summary: 'Extracted endpoint: /v1/auth/token [POST] with parameters: grant_type, client_id',
    payload: { endpoint: '/v1/auth/token', method: 'POST', depth: 1 },
    severity: 'info',
  },
  {
    id: 'evt-6',
    timestamp: '11:06:35',
    tool: 'amass',
    eventType: 'DISCOVERY',
    summary: 'ASN mapping completed: AS64512 Defense Global Transit (198.51.100.0/24)',
    payload: { asn: 'AS64512', prefix: '198.51.100.0/24', netname: 'DEFENSE-TRANSIT' },
    severity: 'info',
  },
];
