/**
 * Autonomous Agent, Self-Correction & MCP Engine Types
 */

export type AgentErrorType =
  | 'TOOL_TIMEOUT'
  | 'SCHEMA_VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INFINITE_REASONING_LOOP'
  | 'PARSING_FAILED'
  | 'SANDBOX_PERMISSION_VIOLATION'
  | 'INEFFICIENT_TOOL_SEQUENCE'
  | 'STALE_MEMORY_POISONING';

export interface AgentExecutionStep {
  stepNumber: number;
  phase: 'PLAN' | 'TOOL_INVOCATION' | 'EVALUATION' | 'SELF_REFLECTION' | 'AUTO_REFACTOR' | 'RE_EXECUTION';
  timestamp: string;
  toolName?: string;
  inputPayload?: Record<string, unknown>;
  outputPayload?: Record<string, unknown>;
  thoughtProcess: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'RECOVERED';
  durationMs: number;
}

export interface SelfCorrectionDiagnostic {
  id: string;
  errorType: AgentErrorType;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  detectedAt: string;
  failedStepNumber: number;
  symptomSummary: string;
  rootCauseAnalysis: string;
  impactScore: number; // 0 - 100
  lessonsLearned: string;
  recurrenceRisk: 'HIGH' | 'MODERATE' | 'NEGLIGIBLE';
}

export interface AutomatedRefactorPatch {
  id: string;
  diagnosticId: string;
  strategy: 'RETRY_WITH_BACKOFF' | 'FALLBACK_TOOL_PIPELINE' | 'SCHEMA_NORMALIZATION' | 'SANDBOX_SCOPE_RELAXATION' | 'LOOP_BREAK_DEBOUNCE';
  originalPlanSummary: string;
  refactoredPlanSummary: string;
  codeDiff: {
    fileName: string;
    beforeCode: string;
    afterCode: string;
    changesSummary: string[];
  };
  metricsImprovement: {
    latencyReductionPct: number;
    reliabilityScoreBefore: number;
    reliabilityScoreAfter: number;
    resourceCostSavedPct: number;
  };
  appliedStatus: 'PROPOSED' | 'APPLIED' | 'VERIFIED';
}

export interface PreventionRule {
  id: string;
  ruleCode: string;
  category: 'TOOL_CALLING' | 'REASONING' | 'MEMORY' | 'SANDBOX';
  condition: string;
  enforcedAction: string;
  preventionCount: number;
  dateCreated: string;
  active: boolean;
}

export interface McpToolDefinition {
  name: string;
  version: string;
  description: string;
  category: 'OSINT' | 'SYSTEM' | 'NETWORK' | 'WEB' | 'AGENT';
  inputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      default?: unknown;
      enum?: string[];
    }>;
    required: string[];
  };
  outputSchema: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
    }>;
  };
  permissions: string[];
  sandboxMode: 'STRICT' | 'ISOLATED_CONTAINER' | 'READ_ONLY';
  rateLimitPerMin: number;
}

export interface AgentScenarioPreset {
  id: string;
  title: string;
  description: string;
  targetDomain: string;
  expectedError: AgentErrorType;
  steps: AgentExecutionStep[];
  diagnostic: SelfCorrectionDiagnostic;
  refactorPatch: AutomatedRefactorPatch;
}
