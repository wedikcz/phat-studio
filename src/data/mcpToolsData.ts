import { McpToolDefinition } from '../types/agent.ts';

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'run_amass',
    version: '4.2.0',
    description: 'In-depth network mapping of attack surfaces and external asset discovery using open source information and active reconnaissance.',
    category: 'OSINT',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Target root domain or FQDN (e.g. target-defense.corp)' },
        passiveOnly: { type: 'boolean', description: 'Perform strictly passive intelligence gathering without touching target', default: true },
        bruteForce: { type: 'boolean', description: 'Execute active subdomain brute-forcing with wordlist', default: false },
        timeoutMinutes: { type: 'number', description: 'Maximum scan execution timeout', default: 5 },
      },
      required: ['domain'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        subdomains: { type: 'array', description: 'Discovered subdomains and FQDNs' },
        asns: { type: 'array', description: 'Autonomous System Numbers associated with infrastructure' },
        networkCidrs: { type: 'array', description: 'Identified IP ranges and CIDR blocks' },
      },
    },
    permissions: ['network.dns', 'osint.external_read'],
    sandboxMode: 'ISOLATED_CONTAINER',
    rateLimitPerMin: 20,
  },
  {
    name: 'run_subfinder',
    version: '2.6.6',
    description: 'Fast passive subdomain enumeration tool that searches across 30+ passive sources (Chaos, Shodan, CertSpotter, AlienVault, crt.sh).',
    category: 'OSINT',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Target domain for passive enumeration' },
        sources: { type: 'string', description: 'Comma-separated passive sources to query (default: all)' },
        allSources: { type: 'boolean', description: 'Use all available slow and fast passive sources', default: true },
      },
      required: ['domain'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        subdomains: { type: 'array', description: 'List of discovered subdomains with source attribution' },
        count: { type: 'number', description: 'Total unique subdomains identified' },
      },
    },
    permissions: ['osint.external_read'],
    sandboxMode: 'READ_ONLY',
    rateLimitPerMin: 60,
  },
  {
    name: 'run_dnsx',
    version: '1.2.1',
    description: 'Fast and multi-purpose DNS toolkit allow to run multiple DNS queries of choice with user-supplied resolvers and wildcard filtering.',
    category: 'NETWORK',
    inputSchema: {
      type: 'object',
      properties: {
        domains: { type: 'string', description: 'List or array of domain names to resolve' },
        recordTypes: { type: 'string', description: 'DNS record types (A, AAAA, CNAME, MX, TXT, PTR)', default: 'A,AAAA,CNAME' },
        filterWildcards: { type: 'boolean', description: 'Automatically detect and filter wildcard DNS responses', default: true },
        threads: { type: 'number', description: 'Concurrent DNS worker threads', default: 25 },
      },
      required: ['domains'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        resolutions: { type: 'array', description: 'Resolved IP addresses, CNAME chains, and response codes' },
        wildcardsDetected: { type: 'number', description: 'Number of wildcard subdomains pruned' },
      },
    },
    permissions: ['network.dns'],
    sandboxMode: 'READ_ONLY',
    rateLimitPerMin: 120,
  },
  {
    name: 'run_nmap',
    version: '7.94',
    description: 'Network exploration tool and security / port scanner. Supports SYN stealth scan, service version detection, OS detection, and script scanning.',
    category: 'NETWORK',
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Target IP, hostname, or CIDR network' },
        ports: { type: 'string', description: 'Port specification (e.g. "top-100", "80,443,8080", "1-1024")', default: 'top-100' },
        scanType: { type: 'string', description: 'Scan mode: SYN, Connect, UDP, or Service Banner', enum: ['SYN', 'Connect', 'UDP', 'ServiceVersion'], default: 'SYN' },
        flags: { type: 'string', description: 'Additional safe flags (e.g. -T4, --host-timeout 10s)' },
      },
      required: ['target'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        openPorts: { type: 'array', description: 'List of detected open ports with protocol and service' },
        serviceBanners: { type: 'array', description: 'Detected software version banners and CPE strings' },
        osMatches: { type: 'array', description: 'Operating system fingerprint predictions' },
      },
    },
    permissions: ['network.raw_socket', 'network.connect'],
    sandboxMode: 'STRICT',
    rateLimitPerMin: 30,
  },
  {
    name: 'run_httpx',
    version: '1.6.0',
    description: 'Fast and multi-purpose HTTP probe toolkit to analyze web servers, status codes, technology stacks, response titles, and SSL certificates.',
    category: 'WEB',
    inputSchema: {
      type: 'object',
      properties: {
        targets: { type: 'string', description: 'Hostnames or URLs to probe' },
        followRedirects: { type: 'boolean', description: 'Follow HTTP 3xx redirects', default: true },
        techDetect: { type: 'boolean', description: 'Fingerprint web technologies and frameworks', default: true },
        probeSsl: { type: 'boolean', description: 'Extract SSL/TLS certificate metadata and expiry', default: true },
      },
      required: ['targets'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        liveHosts: { type: 'array', description: 'Responsive web hosts with status codes and response headers' },
        techStacks: { type: 'array', description: 'Detected web server software, frameworks, and CMS' },
      },
    },
    permissions: ['network.http', 'network.https'],
    sandboxMode: 'READ_ONLY',
    rateLimitPerMin: 100,
  },
  {
    name: 'run_katana',
    version: '1.1.0',
    description: 'Next-generation web crawling and spidering framework for discovering API endpoints, hidden parameters, and JavaScript routes.',
    category: 'WEB',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Seed URL to begin crawling' },
        crawlDepth: { type: 'number', description: 'Maximum crawler link depth', default: 2 },
        extractEndpoints: { type: 'boolean', description: 'Extract REST/GraphQL endpoints from script files', default: true },
        scopeField: { type: 'string', description: 'Strict in-scope domain filter regex' },
      },
      required: ['url'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        endpoints: { type: 'array', description: 'Discovered HTTP endpoints, parameters, and methods' },
        jsFiles: { type: 'array', description: 'Discovered static assets and JavaScript bundles' },
      },
    },
    permissions: ['network.http', 'network.https'],
    sandboxMode: 'READ_ONLY',
    rateLimitPerMin: 40,
  },
  {
    name: 'run_whois',
    version: '5.5.17',
    description: 'Domain registrar, nameserver, DNSSEC status, and registrant ownership information retrieval.',
    category: 'OSINT',
    inputSchema: {
      type: 'object',
      properties: {
        domain: { type: 'string', description: 'Domain name to query' },
        server: { type: 'string', description: 'Optional specific WHOIS server override' },
      },
      required: ['domain'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        registrar: { type: 'string', description: 'Registrar organization and IANA ID' },
        dates: { type: 'object', description: 'Creation, update, and expiration timestamps' },
        nameServers: { type: 'array', description: 'Authoritative DNS nameservers' },
      },
    },
    permissions: ['osint.external_read'],
    sandboxMode: 'READ_ONLY',
    rateLimitPerMin: 30,
  },
  {
    name: 'execute_python_script',
    version: '3.11.8',
    description: 'Executes safe Python analytical scripts in an isolated ephemeral execution sandbox with memory caps.',
    category: 'AGENT',
    inputSchema: {
      type: 'object',
      properties: {
        scriptCode: { type: 'string', description: 'Python source code to execute' },
        timeoutSec: { type: 'number', description: 'Execution timeout limit in seconds', default: 10 },
      },
      required: ['scriptCode'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        stdout: { type: 'string', description: 'Captured standard output' },
        stderr: { type: 'string', description: 'Captured error stream' },
        exitCode: { type: 'number', description: 'Process exit code' },
      },
    },
    permissions: ['sandbox.ephemeral_exec'],
    sandboxMode: 'ISOLATED_CONTAINER',
    rateLimitPerMin: 20,
  },
];
