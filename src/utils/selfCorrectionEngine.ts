/**
 * Pure Logic: Advanced Agent Self-Correction & Automated Refactoring Engine
 */

import type {
  AgentExecutionStep,
  SelfCorrectionDiagnostic,
  AutomatedRefactorPatch,
  PreventionRule,
  AgentErrorType
} from '../types/agent.ts';

/**
 * Detects cyclical loops in reasoning or repetitive tool execution
 */
export function detectExecutionAnomalies(steps: AgentExecutionStep[]): {
  hasAnomaly: boolean;
  errorType?: AgentErrorType;
  stepIndex?: number;
  reason?: string;
} {
  if (steps.length === 0) return { hasAnomaly: false };

  // 1. Check for repetitive failed tool calls (loop detection)
  const toolCalls = steps.filter(s => s.toolName);
  if (toolCalls.length >= 3) {
    const last3 = toolCalls.slice(-3);
    const sameTool = last3.every(s => s.toolName === last3[0].toolName);
    const allFailed = last3.every(s => s.status === 'FAILED');
    if (sameTool && allFailed) {
      return {
        hasAnomaly: true,
        errorType: 'INFINITE_REASONING_LOOP',
        stepIndex: steps.indexOf(last3[2]),
        reason: `Detected cyclical invocation loop: tool '${last3[0].toolName}' failed 3 consecutive times without strategy mutation.`,
      };
    }
  }

  // 2. Check for explicit error statuses
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (step.status === 'FAILED') {
      const thoughtLower = step.thoughtProcess.toLowerCase();
      if (thoughtLower.includes('timeout') || step.durationMs > 15000) {
        return {
          hasAnomaly: true,
          errorType: 'TOOL_TIMEOUT',
          stepIndex: i,
          reason: `Execution timeout in step ${step.stepNumber}: Duration ${step.durationMs}ms exceeded threshold.`,
        };
      }
      if (thoughtLower.includes('schema') || thoughtLower.includes('validation') || thoughtLower.includes('typeerror')) {
        return {
          hasAnomaly: true,
          errorType: 'SCHEMA_VALIDATION_ERROR',
          stepIndex: i,
          reason: `Schema validation failed on input arguments for step ${step.stepNumber}.`,
        };
      }
      if (thoughtLower.includes('sandbox') || thoughtLower.includes('permission') || thoughtLower.includes('eacces')) {
        return {
          hasAnomaly: true,
          errorType: 'SANDBOX_PERMISSION_VIOLATION',
          stepIndex: i,
          reason: `Security sandbox constraint violation in step ${step.stepNumber}.`,
        };
      }
      return {
        hasAnomaly: true,
        errorType: 'PARSING_FAILED',
        stepIndex: i,
        reason: `Uncaught exception in tool output parser for step ${step.stepNumber}.`,
      };
    }
  }

  return { hasAnomaly: false };
}

/**
 * Synthesizes self-correction diagnostics and lessons learned
 */
export function generateDiagnostic(
  anomaly: { errorType: AgentErrorType; stepIndex: number; reason: string },
  step: AgentExecutionStep
): SelfCorrectionDiagnostic {
  const rootCauses: Record<AgentErrorType, string> = {
    TOOL_TIMEOUT: 'Tool command was invoked without concurrency limits or response buffering on large CIDR block.',
    SCHEMA_VALIDATION_ERROR: 'Input arguments were passed as raw string instead of validated JSON array schema.',
    INFINITE_REASONING_LOOP: 'Agent repeatedly re-attempted the same tool call with identical arguments without mutating query parameters.',
    RATE_LIMIT_EXCEEDED: 'Burst requests exceeded remote probe threshold without exponential backoff jitter.',
    PARSING_FAILED: 'Raw tool stdout contained non-standard ASCII banners that violated strict JSON parser expectations.',
    SANDBOX_PERMISSION_VIOLATION: 'Tool attempted to write into protected root directory outside designated /tmp/sandbox space.',
    INEFFICIENT_TOOL_SEQUENCE: 'Heavy port scanner was triggered across entire domain list before verifying active DNS hosts via DNSX.',
    STALE_MEMORY_POISONING: 'Agent retrieved an outdated resolution cache from previous scan session.',
  };

  const lessons: Record<AgentErrorType, string> = {
    TOOL_TIMEOUT: 'Enforce pre-flight DNS filtering and paginate CIDR scopes into chunks of /28.',
    SCHEMA_VALIDATION_ERROR: 'Introduce Zod/JSON-Schema pre-validator in orchestrator layer before dispatch.',
    INFINITE_REASONING_LOOP: 'Enforce maximum retry limit of 2 with mandatory algorithmic strategy mutation upon first failure.',
    RATE_LIMIT_EXCEEDED: 'Inject token bucket rate limiter and random jitter (200ms - 800ms) between batches.',
    PARSING_FAILED: 'Sanitize tool stdout with regex fallback and strip ANSI escape characters prior to parsing.',
    SANDBOX_PERMISSION_VIOLATION: 'Constrain all file operations strictly to isolated ephemeral container directory.',
    INEFFICIENT_TOOL_SEQUENCE: 'Chain Subfinder -> DNSX -> httpx probe -> Nmap targeted ports (eliminates 85% dead hosts).',
    STALE_MEMORY_POISONING: 'Tag all cache entries with cryptographic TTL and force invalidation on active recon runs.',
  };

  return {
    id: `diag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    errorType: anomaly.errorType,
    severity: anomaly.errorType === 'INFINITE_REASONING_LOOP' || anomaly.errorType === 'SANDBOX_PERMISSION_VIOLATION' ? 'CRITICAL' : 'HIGH',
    detectedAt: new Date().toISOString(),
    failedStepNumber: step.stepNumber,
    symptomSummary: anomaly.reason,
    rootCauseAnalysis: rootCauses[anomaly.errorType] || 'Unexpected runtime state divergence.',
    impactScore: anomaly.errorType === 'INFINITE_REASONING_LOOP' ? 88 : 72,
    lessonsLearned: lessons[anomaly.errorType] || 'Enforce strict pipeline preconditions.',
    recurrenceRisk: anomaly.errorType === 'INFINITE_REASONING_LOOP' ? 'HIGH' : 'MODERATE',
  };
}

/**
 * Generates an automated code and execution refactoring patch
 */
export function generateRefactorPatch(diagnostic: SelfCorrectionDiagnostic): AutomatedRefactorPatch {
  let strategy: AutomatedRefactorPatch['strategy'] = 'FALLBACK_TOOL_PIPELINE';
  let beforeCode = '';
  let afterCode = '';
  const changesSummary: string[] = [];

  switch (diagnostic.errorType) {
    case 'INFINITE_REASONING_LOOP':
      strategy = 'LOOP_BREAK_DEBOUNCE';
      beforeCode = `// Vulnerable: Unbounded retry loop
while (!scanResult) {
  scanResult = await runAmass({ domain, bruteForce: true });
}`;
      afterCode = `// Auto-Refactored: Guarded strategy mutation with circuit breaker
let attempts = 0;
while (!scanResult && attempts < 2) {
  attempts++;
  try {
    scanResult = await runAmass({ domain, timeoutMs: 5000, passiveOnly: true });
  } catch (err) {
    // Mutate pipeline to fallback DNSX + Subfinder
    scanResult = await fallbackReconPipeline(domain);
  }
}`;
      changesSummary.push('Added hard execution circuit breaker (max 2 attempts)');
      changesSummary.push('Converted active bruteForce to passive reconnaissance');
      changesSummary.push('Added fallback pipeline hook to prevent reasoning deadlock');
      break;

    case 'SCHEMA_VALIDATION_ERROR':
      strategy = 'SCHEMA_NORMALIZATION';
      beforeCode = `// Vulnerable: Raw string argument without validation
const output = await executeTool('dnsx', {
  domains: rawInputString // May contain comma-separated or unformatted input
});`;
      afterCode = `// Auto-Refactored: Normalized string array with schema verification
const normalizedDomains = Array.isArray(rawInputString)
  ? rawInputString
  : rawInputString.split(/[,\\n\\s]+/).filter(Boolean);

const validatedPayload = DnsxSchema.parse({ domains: normalizedDomains });
const output = await executeTool('dnsx', validatedPayload);`;
      changesSummary.push('Introduced regex-based normalization for domain list');
      changesSummary.push('Enforced runtime schema validation prior to tool execution');
      break;

    case 'TOOL_TIMEOUT':
    default:
      strategy = 'RETRY_WITH_BACKOFF';
      beforeCode = `// Vulnerable: Full port scan without host pre-filtering
const nmapResult = await runNmap({
  target: domain,
  ports: '1-65535',
  flags: ['-sV', '-sC', '-T4']
});`;
      afterCode = `// Auto-Refactored: DNS resolution check + top 100 ports with timeout
const isAlive = await checkDnsResolution(domain);
if (!isAlive) return { status: 'HOST_UNRESOLVABLE', openPorts: [] };

const nmapResult = await runNmap({
  target: domain,
  ports: 'top-100',
  flags: ['-sS', '-T4', '--host-timeout', '10s']
});`;
      changesSummary.push('Added pre-flight DNS resolution check');
      changesSummary.push('Reduced port scope from 65535 to top 100 high-value ports');
      changesSummary.push('Configured explicit 10s host timeout flag');
      break;
  }

  return {
    id: `patch-${Date.now()}`,
    diagnosticId: diagnostic.id,
    strategy,
    originalPlanSummary: 'Brute-force sequential execution without error mitigation hooks.',
    refactoredPlanSummary: 'Optimized defensive execution with schema pre-flight, circuit breaker, and intelligent fallback.',
    codeDiff: {
      fileName: 'agent-orchestrator.ts',
      beforeCode,
      afterCode,
      changesSummary,
    },
    metricsImprovement: {
      latencyReductionPct: 64,
      reliabilityScoreBefore: 35,
      reliabilityScoreAfter: 98,
      resourceCostSavedPct: 58,
    },
    appliedStatus: 'PROPOSED',
  };
}

/**
 * Creates a permanent Prevention Rule to be committed into agent memory
 */
export function createPreventionRule(diagnostic: SelfCorrectionDiagnostic): PreventionRule {
  return {
    id: `rule-${Date.now()}`,
    ruleCode: `PRV-${diagnostic.errorType.substring(0, 4)}-${Math.floor(100 + Math.random() * 900)}`,
    category: diagnostic.errorType === 'SANDBOX_PERMISSION_VIOLATION' ? 'SANDBOX' : 'TOOL_CALLING',
    condition: `When executing tool pipeline that encounters ${diagnostic.errorType}`,
    enforcedAction: diagnostic.lessonsLearned,
    preventionCount: 1,
    dateCreated: new Date().toISOString(),
    active: true,
  };
}
