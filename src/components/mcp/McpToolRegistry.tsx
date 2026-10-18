import React, { useState } from 'react';
import { Wrench, Shield, Play, CheckCircle2, Terminal, Code2, AlertCircle } from 'lucide-react';
import { MCP_TOOLS } from '../../data/mcpToolsData.ts';
import { McpToolDefinition } from '../../types/agent.ts';

export const McpToolRegistry: React.FC = () => {
  const [tools] = useState<McpToolDefinition[]>(MCP_TOOLS);
  const [selectedTool, setSelectedTool] = useState<McpToolDefinition>(tools[0]);
  const [inputJson, setInputJson] = useState<string>(
    JSON.stringify({ domain: 'target-defense.corp', passiveOnly: true }, null, 2)
  );
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  const handleSelectTool = (tool: McpToolDefinition) => {
    setSelectedTool(tool);
    setExecutionOutput(null);

    // Provide default arguments matching the tool's required schema
    const defaultArgs: Record<string, unknown> = {};
    for (const [key, prop] of Object.entries(tool.inputSchema.properties)) {
      if (prop.default !== undefined) {
        defaultArgs[key] = prop.default;
      } else if (prop.type === 'string') {
        defaultArgs[key] = key.toLowerCase().includes('domain') ? 'target-defense.corp' : '198.51.100.14';
      } else if (prop.type === 'number') {
        defaultArgs[key] = 10;
      } else if (prop.type === 'boolean') {
        defaultArgs[key] = true;
      }
    }
    setInputJson(JSON.stringify(defaultArgs, null, 2));
  };

  const handleExecuteTool = () => {
    setIsExecuting(true);
    setExecutionOutput(null);

    setTimeout(() => {
      let parsedArgs: Record<string, any> = {};
      try {
        parsedArgs = JSON.parse(inputJson);
      } catch {
        setExecutionOutput(JSON.stringify({ error: 'Invalid JSON payload' }, null, 2));
        setIsExecuting(false);
        return;
      }

      // Generate realistic normalized output based on selected tool
      let response: Record<string, unknown> = {};
      if (selectedTool.name === 'run_amass') {
        response = {
          tool: 'amass',
          status: 'SUCCESS',
          executionTimeMs: 412,
          domain: parsedArgs.domain || 'target-defense.corp',
          discoveredSubdomains: [
            'api.target-defense.corp',
            'auth.target-defense.corp',
            'portal.target-defense.corp',
            'k8s-ingress.target-defense.corp',
          ],
          asns: ['AS64512 (Defense Global Transit)'],
          networkCidrs: ['198.51.100.0/24'],
        };
      } else if (selectedTool.name === 'run_dnsx') {
        response = {
          tool: 'dnsx',
          status: 'SUCCESS',
          executionTimeMs: 48,
          totalResolved: 3,
          resolutions: [
            { host: 'api.target-defense.corp', ip: '198.51.100.14', rcode: 'NOERROR' },
            { host: 'auth.target-defense.corp', ip: '198.51.100.18', rcode: 'NOERROR' },
            { host: 'mail.target-defense.corp', ip: '198.51.100.25', rcode: 'NOERROR' },
          ],
          wildcardsFiltered: 0,
        };
      } else if (selectedTool.name === 'run_nmap') {
        response = {
          tool: 'nmap',
          status: 'SUCCESS',
          executionTimeMs: 1240,
          target: parsedArgs.target || '198.51.100.14',
          openPorts: [
            { port: 80, protocol: 'tcp', service: 'http', product: 'nginx/1.24.0' },
            { port: 443, protocol: 'tcp', service: 'https', product: 'nginx/1.24.0' },
          ],
        };
      } else if (selectedTool.name === 'run_httpx') {
        response = {
          tool: 'httpx',
          status: 'SUCCESS',
          executionTimeMs: 110,
          hosts: [
            {
              url: 'https://api.target-defense.corp',
              status: 200,
              title: 'Enterprise API Gateway v2',
              technologies: ['FastAPI', 'Redis', 'Nginx'],
            },
          ],
        };
      } else {
        response = {
          tool: selectedTool.name,
          status: 'SUCCESS',
          executionTimeMs: 250,
          result: 'Execution simulated within isolated container environment.',
          echoInput: parsedArgs,
        };
      }

      setExecutionOutput(JSON.stringify(response, null, 2));
      setIsExecuting(false);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0a0e17] border border-slate-800 p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-purple-400" />
            <h1 className="text-base font-bold text-slate-100">MCP Tool Registry & Sandbox Runner</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Machine-readable JSON Schemas, strict container sandbox isolation, and live parameter execution testbed
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          <span>Registered: {tools.length} Tools</span>
          <span className="mx-2">·</span>
          <span className="text-emerald-400">MCP v1.2 Compliant</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Tool Selection List */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-3 space-y-1.5 h-fit">
          <div className="text-xs font-semibold text-slate-400 px-3 py-2 border-b border-slate-800/80 uppercase tracking-wider font-mono">
            Available Tools
          </div>

          <div className="space-y-1 pt-1">
            {tools.map((t) => {
              const isSelected = selectedTool.name === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => handleSelectTool(t)}
                  className={`w-full text-left px-3 py-2.5 rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border border-purple-800/60 text-purple-200'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-200">{t.name}</span>
                    <span className="text-[10px] font-mono text-purple-400">{t.category}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {t.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Tool Schema & Live Sandbox Runner */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tool Details & Security Specs */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold font-mono text-slate-100">{selectedTool.name}</h2>
                  <span className="text-xs font-mono text-slate-400">v{selectedTool.version}</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {selectedTool.description}
                </p>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-slate-400 shrink-0">
                <span className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Rate: {selectedTool.rateLimitPerMin}/min
                </span>
                <span className="bg-purple-950/40 text-purple-300 px-2 py-0.5 rounded border border-purple-800/40">
                  {selectedTool.sandboxMode}
                </span>
              </div>
            </div>

            {/* Permissions */}
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">Assigned Permissions:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedTool.permissions.map((perm) => (
                  <span key={perm} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            {/* Input Schema Properties */}
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-2">Input Arguments Schema:</span>
              <div className="space-y-1.5">
                {Object.entries(selectedTool.inputSchema.properties).map(([field, schema]) => (
                  <div key={field} className="flex items-start justify-between text-xs p-2 rounded bg-slate-900/40 border border-slate-800/60 font-mono">
                    <div>
                      <span className="text-purple-400 font-semibold">{field}</span>
                      <span className="text-slate-500 ml-1.5">({schema.type})</span>
                      {selectedTool.inputSchema.required.includes(field) && (
                        <span className="text-rose-400 ml-1.5 text-[10px]">required</span>
                      )}
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">{schema.description}</p>
                    </div>
                    {schema.default !== undefined && (
                      <span className="text-slate-500 text-[11px] shrink-0 ml-2">default: {String(schema.default)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Sandbox Execution Terminal */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-slate-200">Live MCP Sandbox Test Runner</h3>
              </div>
              <button
                onClick={handleExecuteTool}
                disabled={isExecuting}
                className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-900/40"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isExecuting ? 'Dispatching...' : 'Dispatch Tool'}</span>
              </button>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1 font-mono">Input JSON Arguments:</label>
              <textarea
                rows={4}
                value={inputJson}
                onChange={(e) => setInputJson(e.target.value)}
                className="w-full bg-[#080c14] border border-slate-800 rounded p-3 text-xs text-cyan-300 font-mono focus:outline-none focus:border-purple-600 leading-relaxed"
              />
            </div>

            {/* Normalized Execution Output */}
            {executionOutput && (
              <div className="space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="text-emerald-400">Normalized Output Response:</span>
                  <span>Sandbox Exit: 0</span>
                </div>
                <pre className="bg-[#080c14] border border-slate-800 p-3 rounded text-xs font-mono text-emerald-300 overflow-x-auto max-h-64 leading-relaxed">
                  {executionOutput}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
