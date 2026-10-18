import React, { useState } from 'react';
import {
  Cpu,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  GitCompare,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Play,
  RotateCcw,
  Sparkles,
  Bug,
  Code2,
} from 'lucide-react';
import { AgentScenarioPreset, PreventionRule, AgentExecutionStep } from '../../types/agent.ts';
import { AGENT_SCENARIOS, INITIAL_PREVENTION_RULES } from '../../data/sampleAgentScenarios.ts';
import {
  detectExecutionAnomalies,
  generateDiagnostic,
  generateRefactorPatch,
  createPreventionRule,
} from '../../utils/selfCorrectionEngine.ts';

export const SelfCorrectionLab: React.FC = () => {
  const [scenarios] = useState<AgentScenarioPreset[]>(AGENT_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(scenarios[0].id);
  const [rules, setRules] = useState<PreventionRule[]>(INITIAL_PREVENTION_RULES);
  const [isPatchApplied, setIsPatchApplied] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [customInputPrompt, setCustomInputPrompt] = useState<string>('');
  const [customAnalysisActive, setCustomAnalysisActive] = useState<boolean>(false);

  const activeScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];

  const handleApplyPatch = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsPatchApplied(true);
      setIsSimulating(false);
    }, 700);
  };

  const handleReset = () => {
    setIsPatchApplied(false);
    setCustomAnalysisActive(false);
  };

  const handleCommitRule = () => {
    const newRule = createPreventionRule(activeScenario.diagnostic);
    if (!rules.some(r => r.ruleCode === newRule.ruleCode)) {
      setRules([newRule, ...rules]);
    }
  };

  const handleAnalyzeCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputPrompt.trim()) return;
    setCustomAnalysisActive(true);
    setIsPatchApplied(false);
  };

  return (
    <div className="space-y-6">
      {/* Header and Scenario Selector */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-[#0a0e17] border border-slate-800 p-4 rounded-lg">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <h1 className="text-base font-bold text-slate-100">
              Autonomous Agent Self-Correction & Automated Refactoring Studio
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic anomaly detection, iterative reasoning self-reflection, automated code refactoring, and recurrence prevention rulebook
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Scenario:</span>
          <select
            value={selectedScenarioId}
            onChange={(e) => {
              setSelectedScenarioId(e.target.value);
              setIsPatchApplied(false);
              setCustomAnalysisActive(false);
            }}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-purple-600 cursor-pointer font-medium"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenario Overview Banner */}
      <div className="bg-[#0b0f19] border border-slate-800 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-purple-400 font-semibold">{activeScenario.title}</span>
              <span>·</span>
              <span className="text-rose-400">Error Pattern: {activeScenario.expectedError}</span>
              <span>·</span>
              <span>Target: {activeScenario.targetDomain}</span>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
              {activeScenario.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isPatchApplied ? (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Flaw</span>
              </button>
            ) : (
              <button
                onClick={handleApplyPatch}
                disabled={isSimulating}
                className="px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-900/40"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Refactoring Agent Code...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Trigger Automated Self-Correction</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step-by-Step Agent Execution & Reflection Timeline */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">Agent Reasoning & Execution Replay</h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {isPatchApplied ? 'Status: Auto-Refactored & Recovered' : 'Status: Flaw Detected in Trace'}
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {activeScenario.steps.map((step) => {
            const isFailed = step.status === 'FAILED';
            return (
              <div
                key={step.stepNumber}
                className={`p-3.5 rounded border transition-colors ${
                  isFailed && !isPatchApplied
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : 'bg-slate-900/50 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-purple-400 font-semibold">Step {step.stepNumber}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-300 uppercase">{step.phase}</span>
                    {step.toolName && (
                      <>
                        <span className="text-slate-500">·</span>
                        <span className="text-cyan-400 font-medium">Tool: {step.toolName}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span>{step.durationMs}ms</span>
                    <span
                      className={`font-semibold ${
                        isFailed && !isPatchApplied ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isFailed && !isPatchApplied ? 'FAILED' : 'NOMINAL'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-2 font-mono bg-[#080c14] p-2 rounded border border-slate-800/70">
                  {step.thoughtProcess}
                </p>

                {step.inputPayload && (
                  <div className="mt-2 text-[11px] font-mono text-slate-400">
                    <span className="text-slate-500">Input Payload: </span>
                    <span className="text-slate-300">{JSON.stringify(step.inputPayload)}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* If Patch Applied: Render the Recovered Execution Step */}
          {isPatchApplied && (
            <div className="p-3.5 rounded border bg-emerald-950/20 border-emerald-800/60 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-emerald-400 font-bold">Step {activeScenario.steps.length + 1} (Recovered)</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-300 uppercase">AUTO_REFACTOR_EXECUTION</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-cyan-400 font-medium">Verified Pipeline</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-emerald-400">
                  <span>340ms</span>
                  <span className="font-semibold">RECOVERED & PASSED</span>
                </div>
              </div>

              <p className="text-xs text-emerald-200 mt-2 font-mono bg-[#080c14] p-2 rounded border border-emerald-900/60">
                Self-reflection completed: Circuit breaker engaged. Injected passive enumeration fallback and rate-limited DNSX resolver. Subdomain tree successfully populated with 48 live nodes without remote packet drop.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Self-Reflection & Root Cause Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-slate-200">Anomaly Diagnosis & Root Cause</h3>
            </div>
            <span className="text-xs font-mono text-rose-400 font-bold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
              Severity: {activeScenario.diagnostic.severity}
            </span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Symptom Summary:</span>
              <p className="text-slate-300 mt-0.5 leading-relaxed">
                {activeScenario.diagnostic.symptomSummary}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-slate-500 font-medium block">Root Cause Analysis:</span>
              <p className="text-slate-300 mt-0.5 leading-relaxed font-mono text-[11px] bg-slate-900/60 p-2 rounded">
                {activeScenario.diagnostic.rootCauseAnalysis}
              </p>
            </div>
          </div>
        </div>

        {/* Self-Reflection & Lessons Learned */}
        <div className="bg-[#0b0f19] border border-slate-800 p-5 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-200">Self-Reflection & Learned Lessons</h3>
            </div>
            <span className="text-xs font-mono text-purple-300">
              Impact Score: {activeScenario.diagnostic.impactScore}/100
            </span>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            <div>
              <span className="text-slate-500 font-medium block">Strategic Lesson Learned:</span>
              <p className="text-purple-200 mt-1 leading-relaxed bg-purple-950/20 border border-purple-900/40 p-2.5 rounded">
                {activeScenario.diagnostic.lessonsLearned}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400 text-xs">Save rule to prevent future recurrence?</span>
              <button
                onClick={handleCommitRule}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Commit to Memory Rulebook</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Automated Refactoring Proposal & Side-by-Side Code Diff */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Automated Refactoring Patch ({activeScenario.refactorPatch.codeDiff.fileName})
              </h3>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Refactoring Strategy: <span className="font-mono text-purple-300">{activeScenario.refactorPatch.strategy}</span>
            </div>
          </div>

          {/* Metric Improvement Badges */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-400">
              ↓ {activeScenario.refactorPatch.metricsImprovement.latencyReductionPct}% Latency
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-cyan-400">
              {activeScenario.refactorPatch.metricsImprovement.reliabilityScoreBefore}% → {activeScenario.refactorPatch.metricsImprovement.reliabilityScoreAfter}% Reliability
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-purple-300">
              ↓ {activeScenario.refactorPatch.metricsImprovement.resourceCostSavedPct}% Resources
            </span>
          </div>
        </div>

        {/* Changes Summary */}
        <div className="space-y-1 text-xs">
          <span className="text-slate-400 font-medium">Applied Refactoring Modifications:</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
            {activeScenario.refactorPatch.codeDiff.changesSummary.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-300 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Side-by-Side Code Diff */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Before Code */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="text-rose-400">Original Flawed Implementation</span>
              <span>Before</span>
            </div>
            <pre className="bg-[#080c14] border border-rose-900/40 p-3.5 rounded text-xs font-mono text-rose-300/90 overflow-x-auto leading-relaxed max-h-72">
              {activeScenario.refactorPatch.codeDiff.beforeCode}
            </pre>
          </div>

          {/* After Code */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="text-emerald-400">Self-Corrected Refactored Code</span>
              <span>After</span>
            </div>
            <pre className="bg-[#080c14] border border-emerald-900/40 p-3.5 rounded text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed max-h-72">
              {activeScenario.refactorPatch.codeDiff.afterCode}
            </pre>
          </div>
        </div>
      </div>

      {/* Prevention Rulebook & Memory Store */}
      <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Agent Recurrence Prevention Rulebook ({rules.length} Active Rules)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Persistent Rule Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-4 font-mono">Rule Code</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Trigger Condition</th>
                <th className="py-2.5 px-4">Enforced Remediation Action</th>
                <th className="py-2.5 px-4 text-right">Prevented Recurrences</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-purple-400 font-semibold">
                    {rule.ruleCode}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-300">
                    {rule.category}
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {rule.condition}
                  </td>
                  <td className="py-2.5 px-4 text-emerald-300 font-mono text-[11px]">
                    {rule.enforcedAction}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-cyan-400 font-bold tabular-nums">
                    {rule.preventionCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Custom Anomaly Diagnostics Simulator */}
      <div className="bg-[#0a0e17] border border-slate-800 rounded-lg p-5 space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Test Custom Agent Flaw or Failure Trace</h3>
        <p className="text-xs text-slate-400">
          Paste an error log, infinite loop symptom, or tool argument to test the self-correction engine:
        </p>

        <form onSubmit={handleAnalyzeCustom} className="space-y-3">
          <textarea
            rows={3}
            placeholder="e.g. Error: Tool 'nmap' timed out after 30000ms while scanning 10.0.0.0/16 subnet; or Schema validation failed on input..."
            value={customInputPrompt}
            onChange={(e) => setCustomInputPrompt(e.target.value)}
            className="w-full bg-[#080c14] border border-slate-800 rounded p-3 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-purple-600"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors cursor-pointer"
            >
              Run Anomaly Diagnostic
            </button>
          </div>
        </form>

        {customAnalysisActive && (
          <div className="mt-4 p-4 rounded bg-[#0b0f19] border border-purple-800/60 space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Self-Reflection Diagnostic Synthesized</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-mono">
              Diagnosis: Input matches pattern for TOOL_TIMEOUT / SCOPE_CONCURRENCY_BURST. Automated Refactoring: Splitting CIDR sweep into chunks of /28 and injecting pre-flight DNSX live host verification. Prevention Rule PRV-TOUT-991 generated.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
