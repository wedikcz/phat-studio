import React, { useState } from 'react';
import { Terminal, Send, Download, CheckCircle2, Copy, Radio } from 'lucide-react';
import { TargetDomain, SubdomainRecord, PortRecord, ActiveHostRecord, WhoisRecord } from '../../types/osint.ts';

interface ApiExplorerProps {
  targets: TargetDomain[];
  subdomains: SubdomainRecord[];
  ports: PortRecord[];
  activeHosts: ActiveHostRecord[];
  whoisData: WhoisRecord;
}

export const ApiExplorer: React.FC<ApiExplorerProps> = ({
  targets,
  subdomains,
  ports,
  activeHosts,
  whoisData,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/osint/subdomains');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [requestParam, setRequestParam] = useState<string>('domain=target-defense.corp');
  const [requestBody, setRequestBody] = useState<string>('{\n  "tool": "dnsx",\n  "domains": ["api.target-defense.corp"]\n}');
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseLatency, setResponseLatency] = useState<number | null>(null);
  const [responsePayload, setResponsePayload] = useState<string | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const endpoints = [
    { method: 'GET', path: '/api/v1/osint/targets', desc: 'List all in-scope target domains' },
    { method: 'GET', path: '/api/v1/osint/subdomains', desc: 'Retrieve discovered subdomains across Subfinder & Amass' },
    { method: 'GET', path: '/api/v1/osint/ports', desc: 'Retrieve Nmap open port scan records' },
    { method: 'GET', path: '/api/v1/osint/hosts', desc: 'Retrieve httpx probed active hosts and web stacks' },
    { method: 'GET', path: '/api/v1/osint/whois', desc: 'Query domain WHOIS registrar & expiration info' },
    { method: 'POST', path: '/api/v1/agent/self-correction/diagnose', desc: 'Execute automated agent flaw diagnosis & refactoring' },
    { method: 'POST', path: '/api/v1/mcp/tools/execute', desc: 'Dispatch sandboxed MCP tool execution' },
    { method: 'WS', path: '/ws/v1/osint/stream', desc: 'Real-time WebSocket event stream for reconnaissance telemetry' },
  ];

  const handleSelectEndpoint = (ep: typeof endpoints[0]) => {
    setSelectedEndpoint(ep.path);
    setMethod(ep.method === 'POST' ? 'POST' : 'GET');
    setResponsePayload(null);
    setResponseStatus(null);
    setResponseLatency(null);

    if (ep.path === '/api/v1/osint/subdomains') setRequestParam('domain=target-defense.corp');
    if (ep.path === '/api/v1/osint/ports') setRequestParam('target=target-defense.corp');
    if (ep.path === '/api/v1/osint/hosts') setRequestParam('target=target-defense.corp');
    if (ep.path === '/api/v1/osint/whois') setRequestParam('domain=target-defense.corp');
  };

  const handleSendRequest = () => {
    setIsSending(true);
    const start = performance.now();

    setTimeout(() => {
      let data: unknown = null;

      if (selectedEndpoint === '/api/v1/osint/targets') {
        data = { success: true, count: targets.length, targets };
      } else if (selectedEndpoint === '/api/v1/osint/subdomains') {
        data = { success: true, count: subdomains.length, subdomains };
      } else if (selectedEndpoint === '/api/v1/osint/ports') {
        data = { success: true, count: ports.length, ports };
      } else if (selectedEndpoint === '/api/v1/osint/hosts') {
        data = { success: true, count: activeHosts.length, activeHosts };
      } else if (selectedEndpoint === '/api/v1/osint/whois') {
        data = { success: true, whois: whoisData };
      } else if (selectedEndpoint === '/api/v1/agent/self-correction/diagnose') {
        data = {
          success: true,
          status: 'DIAGNOSED',
          refactorStrategy: 'LOOP_BREAK_DEBOUNCE',
          reliabilityGainPct: 64,
          preventionRuleId: 'PRV-LOOP-101',
        };
      } else if (selectedEndpoint === '/api/v1/mcp/tools/execute') {
        data = {
          success: true,
          tool: 'dnsx',
          status: 'SUCCESS',
          resolvedHosts: ['api.target-defense.corp -> 198.51.100.14'],
        };
      } else {
        data = {
          protocol: 'WebSocket',
          url: 'ws://localhost:3000/ws/v1/osint/stream',
          status: 'ACTIVE_SUBSCRIPTION',
          channels: ['subfinder', 'nmap', 'httpx', 'amass'],
        };
      }

      const elapsed = Math.round(performance.now() - start + 45);
      setResponseStatus(200);
      setResponseLatency(elapsed);
      setResponsePayload(JSON.stringify(data, null, 2));
      setIsSending(false);
    }, 250);
  };

  const handleExportOpenAPI = () => {
    const openapi = {
      openapi: '3.1.0',
      info: {
        title: 'PurpleHacker OSINT & Autonomous Agent API',
        version: '1.0.0',
        description: 'Complete programmatic API for real-time reconnaissance and agent self-correction.',
      },
      paths: {
        '/api/v1/osint/subdomains': {
          get: {
            summary: 'Discovered subdomains',
            parameters: [{ name: 'domain', in: 'query', required: true, schema: { type: 'string' } }],
          },
        },
        '/api/v1/osint/ports': {
          get: {
            summary: 'Nmap open port scans',
            parameters: [{ name: 'target', in: 'query', required: true, schema: { type: 'string' } }],
          },
        },
      },
    };

    const blob = new Blob([JSON.stringify(openapi, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'purplehacker-openapi-3.1.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyResponse = () => {
    if (responsePayload) {
      navigator.clipboard.writeText(responsePayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0a0e17] border border-slate-800 p-4 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <h1 className="text-base font-bold text-slate-100">REST API & WebSocket Explorer</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Production-grade RESTful interface, live response tester, and real-time streaming endpoint documentation
          </p>
        </div>

        <button
          onClick={handleExportOpenAPI}
          className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export OpenAPI 3.1</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Endpoints List */}
        <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-3 space-y-1 h-fit">
          <div className="text-xs font-semibold text-slate-400 px-3 py-2 border-b border-slate-800/80 uppercase tracking-wider font-mono">
            API Endpoints
          </div>

          <div className="space-y-1 pt-1">
            {endpoints.map((ep) => {
              const isSelected = selectedEndpoint === ep.path;
              return (
                <button
                  key={ep.path}
                  onClick={() => handleSelectEndpoint(ep)}
                  className={`w-full text-left px-3 py-2 rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/40 border border-purple-800/60 text-purple-200'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span
                      className={`font-bold ${
                        ep.method === 'GET'
                          ? 'text-cyan-400'
                          : ep.method === 'POST'
                          ? 'text-emerald-400'
                          : 'text-purple-400'
                      }`}
                    >
                      {ep.method}
                    </span>
                    <span className="truncate text-slate-200">{ep.path}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{ep.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Request & Response Tester */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-lg p-5 space-y-4">
            {/* Request Bar */}
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-xs font-bold px-2 py-1.5 rounded ${
                  method === 'GET'
                    ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50'
                    : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                }`}
              >
                {method}
              </span>
              <input
                type="text"
                readOnly
                value={selectedEndpoint}
                className="flex-1 bg-[#080c14] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none"
              />
              <button
                onClick={handleSendRequest}
                disabled={isSending}
                className="px-4 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-900/40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending...' : 'Send Request'}</span>
              </button>
            </div>

            {/* Query Params or Request Body */}
            {method === 'GET' ? (
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Query Parameters:</label>
                <input
                  type="text"
                  value={requestParam}
                  onChange={(e) => setRequestParam(e.target.value)}
                  className="w-full bg-[#080c14] border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-purple-600"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">JSON Request Body:</label>
                <textarea
                  rows={3}
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  className="w-full bg-[#080c14] border border-slate-800 rounded p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-purple-600"
                />
              </div>
            )}

            {/* Response Section */}
            {responsePayload && (
              <div className="space-y-2 pt-3 border-t border-slate-800 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold">HTTP {responseStatus} OK</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400">{responseLatency} ms</span>
                  </div>
                  <button
                    onClick={handleCopyResponse}
                    className="flex items-center gap-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Response'}</span>
                  </button>
                </div>

                <pre className="bg-[#080c14] border border-slate-800 p-4 rounded text-xs font-mono text-slate-200 overflow-x-auto max-h-96 leading-relaxed">
                  {responsePayload}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
