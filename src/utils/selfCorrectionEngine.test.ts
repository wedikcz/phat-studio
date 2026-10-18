import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectExecutionAnomalies,
  generateDiagnostic,
  generateRefactorPatch,
  createPreventionRule,
} from './selfCorrectionEngine.ts';
import type { AgentExecutionStep } from '../types/agent.ts';

test('detectExecutionAnomalies detects infinite reasoning loop across consecutive failed tool calls', () => {
  const steps: AgentExecutionStep[] = [
    {
      stepNumber: 1,
      phase: 'TOOL_INVOCATION',
      timestamp: '2026-10-18T10:00:00Z',
      toolName: 'amass',
      thoughtProcess: 'Running amass scan',
      status: 'FAILED',
      durationMs: 4000,
    },
    {
      stepNumber: 2,
      phase: 'TOOL_INVOCATION',
      timestamp: '2026-10-18T10:00:05Z',
      toolName: 'amass',
      thoughtProcess: 'Retrying amass scan with identical query',
      status: 'FAILED',
      durationMs: 4200,
    },
    {
      stepNumber: 3,
      phase: 'TOOL_INVOCATION',
      timestamp: '2026-10-18T10:00:10Z',
      toolName: 'amass',
      thoughtProcess: 'Retrying amass scan third time',
      status: 'FAILED',
      durationMs: 4100,
    },
  ];

  const result = detectExecutionAnomalies(steps);
  assert.equal(result.hasAnomaly, true);
  assert.equal(result.errorType, 'INFINITE_REASONING_LOOP');
  assert.equal(result.stepIndex, 2);
});

test('detectExecutionAnomalies catches schema validation and timeout errors', () => {
  const schemaErrorStep: AgentExecutionStep[] = [
    {
      stepNumber: 1,
      phase: 'TOOL_INVOCATION',
      timestamp: '2026-10-18T10:00:00Z',
      toolName: 'dnsx',
      thoughtProcess: 'Schema validation failed: expected array, received string',
      status: 'FAILED',
      durationMs: 25,
    },
  ];

  const resultSchema = detectExecutionAnomalies(schemaErrorStep);
  assert.equal(resultSchema.hasAnomaly, true);
  assert.equal(resultSchema.errorType, 'SCHEMA_VALIDATION_ERROR');

  const timeoutStep: AgentExecutionStep[] = [
    {
      stepNumber: 1,
      phase: 'TOOL_INVOCATION',
      timestamp: '2026-10-18T10:00:00Z',
      toolName: 'nmap',
      thoughtProcess: 'Port scan on whole subnet timed out',
      status: 'FAILED',
      durationMs: 18000,
    },
  ];

  const resultTimeout = detectExecutionAnomalies(timeoutStep);
  assert.equal(resultTimeout.hasAnomaly, true);
  assert.equal(resultTimeout.errorType, 'TOOL_TIMEOUT');
});

test('generateDiagnostic, generateRefactorPatch, and createPreventionRule produce valid remediations', () => {
  const anomaly = {
    errorType: 'INFINITE_REASONING_LOOP' as const,
    stepIndex: 1,
    reason: 'Cyclical loop detected',
  };
  const step: AgentExecutionStep = {
    stepNumber: 2,
    phase: 'TOOL_INVOCATION',
    timestamp: '2026-10-18T10:00:00Z',
    thoughtProcess: 'Failed repeat call',
    status: 'FAILED',
    durationMs: 100,
  };

  const diagnostic = generateDiagnostic(anomaly, step);
  assert.equal(diagnostic.errorType, 'INFINITE_REASONING_LOOP');
  assert.equal(diagnostic.severity, 'CRITICAL');
  assert.ok(diagnostic.rootCauseAnalysis.length > 10);

  const patch = generateRefactorPatch(diagnostic);
  assert.equal(patch.strategy, 'LOOP_BREAK_DEBOUNCE');
  assert.ok(patch.codeDiff.afterCode.includes('attempts < 2'));
  assert.ok(patch.metricsImprovement.reliabilityScoreAfter > patch.metricsImprovement.reliabilityScoreBefore);

  const rule = createPreventionRule(diagnostic);
  assert.ok(rule.ruleCode.startsWith('PRV-INFI'));
  assert.equal(rule.active, true);
});
