import { AgentScenarioPreset, PreventionRule } from '../types/agent.ts';

export const INITIAL_PREVENTION_RULES: PreventionRule[] = [
  {
    id: 'prv-01',
    ruleCode: 'PRV-LOOP-101',
    category: 'REASONING',
    condition: 'Consecutive identical tool invocation failure count >= 2',
    enforcedAction: 'Break execution loop, switch strategy from active brute-force to passive aggregation, invoke DNSX fallback.',
    preventionCount: 42,
    dateCreated: '2026-10-15T09:00:00Z',
    active: true,
  },
  {
    id: 'prv-02',
    ruleCode: 'PRV-TOUT-204',
    category: 'TOOL_CALLING',
    condition: 'Port scanning subnet /24 without host discovery validation',
    enforcedAction: 'Pre-flight filter CIDR block with ICMP/DNSX probe; only scan ports for responsive hosts.',
    preventionCount: 89,
    dateCreated: '2026-10-16T11:20:00Z',
    active: true,
  },
  {
    id: 'prv-03',
    ruleCode: 'PRV-SCHM-308',
    category: 'TOOL_CALLING',
    condition: 'Tool argument expects string[] array but string provided',
    enforcedAction: 'Apply Zod auto-split delimiter regex (/,|\\s+/) before dispatching MCP tool.',
    preventionCount: 114,
    dateCreated: '2026-10-17T14:15:00Z',
    active: true,
  },
  {
    id: 'prv-04',
    ruleCode: 'PRV-SAND-402',
    category: 'SANDBOX',
    condition: 'File write target outside /tmp/sandbox or working workspace root',
    enforcedAction: 'Intercept I/O call, re-route to ephemeral isolated sandbox container, flag audit log.',
    preventionCount: 16,
    dateCreated: '2026-10-18T04:45:00Z',
    active: true,
  },
];

export const AGENT_SCENARIOS: AgentScenarioPreset[] = [
  {
    id: 'scen-loop',
    title: 'Amass Subdomain Brute-Force Deadlock',
    description: 'Agent got trapped in an unbounded loop calling Amass active enumeration while rate-limited by remote DNS nameservers.',
    targetDomain: 'target-defense.corp',
    expectedError: 'INFINITE_REASONING_LOOP',
    steps: [
      {
        stepNumber: 1,
        phase: 'PLAN',
        timestamp: '11:00:01',
        thoughtProcess: 'Goal: Map all corporate subdomains. Starting active brute-force wordlist on target-defense.corp.',
        status: 'SUCCESS',
        durationMs: 45,
      },
      {
        stepNumber: 2,
        phase: 'TOOL_INVOCATION',
        timestamp: '11:00:03',
        toolName: 'amass',
        inputPayload: { domain: 'target-defense.corp', bruteForce: true, active: true },
        thoughtProcess: 'Executing active amass scan with full 50,000 subdomains wordlist.',
        status: 'FAILED',
        durationMs: 5200,
      },
      {
        stepNumber: 3,
        phase: 'TOOL_INVOCATION',
        timestamp: '11:00:09',
        toolName: 'amass',
        inputPayload: { domain: 'target-defense.corp', bruteForce: true, active: true },
        thoughtProcess: 'First attempt timed out. Retrying amass active enumeration with same arguments.',
        status: 'FAILED',
        durationMs: 5150,
      },
      {
        stepNumber: 4,
        phase: 'TOOL_INVOCATION',
        timestamp: '11:00:15',
        toolName: 'amass',
        inputPayload: { domain: 'target-defense.corp', bruteForce: true, active: true },
        thoughtProcess: 'Second attempt timed out. Retrying amass active enumeration third time.',
        status: 'FAILED',
        durationMs: 5180,
      },
    ],
    diagnostic: {
      id: 'diag-loop-01',
      errorType: 'INFINITE_REASONING_LOOP',
      severity: 'CRITICAL',
      detectedAt: '2026-10-18T11:00:21Z',
      failedStepNumber: 4,
      symptomSummary: 'Agent repeated identical failed Amass active scan 3 consecutive times without strategy divergence.',
      rootCauseAnalysis: 'The upstream DNS authoritative servers rate-limited UDP port 53 queries. The agent lacked a circuit breaker and failed to recognize the rate-limit failure pattern, leading to execution deadlock.',
      impactScore: 88,
      lessonsLearned: 'Enforce maximum retry count of 2. Upon DNS rate-limiting, immediately downgrade to passive intelligence aggregation (Subfinder + CertSpotter + AlienVault) and resolve via DNSX with 200ms jitter.',
      recurrenceRisk: 'HIGH',
    },
    refactorPatch: {
      id: 'patch-loop-01',
      diagnosticId: 'diag-loop-01',
      strategy: 'LOOP_BREAK_DEBOUNCE',
      originalPlanSummary: 'Brute-force active scan via amass with unbounded retries.',
      refactoredPlanSummary: 'Passive discovery via Subfinder + rate-limited DNSX validation + circuit breaker.',
      codeDiff: {
        fileName: 'recon_orchestrator.ts',
        beforeCode: `// Original Flawed Pipeline:
async function enumerateSubdomains(domain: string) {
  let results = null;
  while (!results) {
    // Unbounded active brute-force retry
    results = await mcp.callTool('amass', {
      domain,
      bruteForce: true,
      active: true,
    });
  }
  return results;
}`,
        afterCode: `// Self-Corrected & Optimized Pipeline:
async function enumerateSubdomains(domain: string) {
  const circuitBreaker = new ExecutionCircuitBreaker({ maxRetries: 2 });
  
  try {
    // Step 1: Passive enumeration (zero UDP flooding)
    const passiveSubs = await mcp.callTool('subfinder', {
      domain,
      sources: ['chaos', 'shodan', 'alienvault', 'crtsh'],
    });

    // Step 2: High-throughput DNS resolver with rate-limit protection
    const resolved = await mcp.callTool('dnsx', {
      domains: passiveSubs.subdomains,
      threads: 25,
      rateLimit: 150, // queries/sec
    });

    return resolved;
  } catch (error) {
    logger.warn('Passive enumeration failed, invoking cached OSINT fallback', error);
    return await fallbackWhoisLookup(domain);
  }
}`,
        changesSummary: [
          'Eliminated unbounded while loop and inserted ExecutionCircuitBreaker',
          'Replaced noisy active DNS brute-forcing with silent passive enumeration',
          'Configured DNSX with explicit rateLimit (150 qps) and concurrency throttling',
          'Added automatic fallback to cached WHOIS & Certificate Transparency logs',
        ],
      },
      metricsImprovement: {
        latencyReductionPct: 78,
        reliabilityScoreBefore: 28,
        reliabilityScoreAfter: 99,
        resourceCostSavedPct: 84,
      },
      appliedStatus: 'PROPOSED',
    },
  },
  {
    id: 'scen-timeout',
    title: 'Nmap Full-Subnet Port Scan Timeout',
    description: 'Agent requested full TCP 65535 port scan across a whole /24 subnet containing dead firewalled IPs, triggering execution timeout.',
    targetDomain: 'target-defense.corp',
    expectedError: 'TOOL_TIMEOUT',
    steps: [
      {
        stepNumber: 1,
        phase: 'PLAN',
        timestamp: '11:05:00',
        thoughtProcess: 'Found IP range 198.51.100.0/24. Need to scan all 65,535 ports on all 254 hosts.',
        status: 'SUCCESS',
        durationMs: 30,
      },
      {
        stepNumber: 2,
        phase: 'TOOL_INVOCATION',
        timestamp: '11:05:02',
        toolName: 'nmap',
        inputPayload: { target: '198.51.100.0/24', ports: '1-65535', flags: ['-sS', '-sV', '-O'] },
        thoughtProcess: 'Dispatching Nmap deep scan. Estimated execution time: 48 minutes.',
        status: 'FAILED',
        durationMs: 18400,
      },
    ],
    diagnostic: {
      id: 'diag-tout-02',
      errorType: 'TOOL_TIMEOUT',
      severity: 'HIGH',
      detectedAt: '2026-10-18T11:05:22Z',
      failedStepNumber: 2,
      symptomSummary: 'Tool execution exceeded 15,000ms sandbox limit during full TCP range port sweep on firewalled subnet.',
      rootCauseAnalysis: 'Scanning 254 IPs * 65,535 ports equates to 16.6 million packets. Without host live-probing, SYN packets to silent firewall blackholes cause maximum timeout penalties.',
      impactScore: 79,
      lessonsLearned: 'Never scan large port sets on unverified hosts. Always precede Nmap with httpx / ping host discovery, and constrain initial scan to Top 100 ports with 10s per-host timeout.',
      recurrenceRisk: 'HIGH',
    },
    refactorPatch: {
      id: 'patch-tout-02',
      diagnosticId: 'diag-tout-02',
      strategy: 'RETRY_WITH_BACKOFF',
      originalPlanSummary: 'Scan 1-65535 ports across entire 198.51.100.0/24 simultaneously.',
      refactoredPlanSummary: 'Run fast httpx/icmp discovery, then scan top 100 ports strictly on verified active hosts.',
      codeDiff: {
        fileName: 'port_scanner.ts',
        beforeCode: `// Original Flawed Scan:
async function scanSubnet(subnet: string) {
  return await mcp.callTool('nmap', {
    target: subnet,
    ports: '1-65535',
    flags: ['-sS', '-sV', '-O']
  });
}`,
        afterCode: `// Self-Corrected 2-Phase Targeted Scan:
async function scanSubnet(subnet: string) {
  // Phase 1: Fast host discovery (filters out 85% dead IPs in < 2 seconds)
  const aliveHosts = await mcp.callTool('httpx', {
    target: subnet,
    ports: [80, 443, 8080],
    probe: true,
    timeoutSec: 3,
  });

  if (aliveHosts.length === 0) return [];

  // Phase 2: Targeted Top-100 port scan only on confirmed living hosts
  return await mcp.callTool('nmap', {
    target: aliveHosts.map(h => h.ip).join(' '),
    ports: 'top-100',
    flags: ['-sS', '-T4', '--host-timeout', '10s']
  });
}`,
        changesSummary: [
          'Split single heavy scan into 2-phase pipeline (Discovery -> Targeted Scan)',
          'Used httpx lightweight probe to prune inactive IP addresses',
          'Scoped ports to Top 100 high-probability ports instead of 65,535',
          'Enforced --host-timeout 10s flag to prevent hanging on dropped packets',
        ],
      },
      metricsImprovement: {
        latencyReductionPct: 91,
        reliabilityScoreBefore: 12,
        reliabilityScoreAfter: 97,
        resourceCostSavedPct: 95,
      },
      appliedStatus: 'PROPOSED',
    },
  },
  {
    id: 'scen-schema',
    title: 'DNSX Schema Validation Argument Mismatch',
    description: 'Agent passed an unparsed comma-delimited string instead of a structured string array to the DNSX MCP tool schema.',
    targetDomain: 'target-defense.corp',
    expectedError: 'SCHEMA_VALIDATION_ERROR',
    steps: [
      {
        stepNumber: 1,
        phase: 'PLAN',
        timestamp: '11:10:00',
        thoughtProcess: 'Discovered raw domains from log text. Passing to DNSX.',
        status: 'SUCCESS',
        durationMs: 20,
      },
      {
        stepNumber: 2,
        phase: 'TOOL_INVOCATION',
        timestamp: '11:10:02',
        toolName: 'dnsx',
        inputPayload: { domains: 'api.target.corp, auth.target.corp, mail.target.corp' as unknown as string[] },
        thoughtProcess: 'Dispatching dnsx tool with comma-separated domains string.',
        status: 'FAILED',
        durationMs: 15,
      },
    ],
    diagnostic: {
      id: 'diag-schm-03',
      errorType: 'SCHEMA_VALIDATION_ERROR',
      severity: 'MEDIUM',
      detectedAt: '2026-10-18T11:10:03Z',
      failedStepNumber: 2,
      symptomSummary: "MCP Schema Validation Error: Expected Array at 'domains', received String.",
      rootCauseAnalysis: 'Agent omitted JSON array parsing step when transforming unstructured textual tool output to downstream MCP tool invocation.',
      impactScore: 65,
      lessonsLearned: 'Introduce automated schema pre-coercion in the tool orchestrator to sanitize inputs before submitting to strict JSON schema validators.',
      recurrenceRisk: 'MODERATE',
    },
    refactorPatch: {
      id: 'patch-schm-03',
      diagnosticId: 'diag-schm-03',
      strategy: 'SCHEMA_NORMALIZATION',
      originalPlanSummary: 'Pass raw text input straight to MCP tool caller.',
      refactoredPlanSummary: 'Auto-coerce and validate input payloads against tool JSON schema prior to execution.',
      codeDiff: {
        fileName: 'tool_orchestrator.ts',
        beforeCode: `// Original Dispatch:
function invokeTool(name: string, args: Record<string, any>) {
  return mcp.callTool(name, args);
}`,
        afterCode: `// Self-Corrected Dispatch with Schema Sanitization:
function invokeTool(name: string, args: Record<string, any>) {
  const schema = ToolRegistry.getSchema(name);
  const normalizedArgs = sanitizePayload(args, schema);
  return mcp.callTool(name, normalizedArgs);
}

function sanitizePayload(input: any, schema: any) {
  // Auto-coerce comma/newline strings into arrays where required by schema
  if (schema.properties?.domains?.type === 'array' && typeof input.domains === 'string') {
    input.domains = input.domains.split(/[,\\n\\s]+/).filter(Boolean);
  }
  return input;
}`,
        changesSummary: [
          'Added automatic string-to-array coercion for domain lists',
          'Enforced JSON Schema pre-validation before RPC dispatch',
          'Prevented unhandled schema validation exceptions from halting agent workflow',
        ],
      },
      metricsImprovement: {
        latencyReductionPct: 40,
        reliabilityScoreBefore: 45,
        reliabilityScoreAfter: 100,
        resourceCostSavedPct: 30,
      },
      appliedStatus: 'PROPOSED',
    },
  },
];
