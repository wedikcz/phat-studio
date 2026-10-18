import React, { useState } from 'react';
import { Play, Pause, Activity, Filter, ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { LiveWebSocketEvent, OsintTool } from '../types/osint.ts';

interface LiveStreamBarProps {
  events: LiveWebSocketEvent[];
  isStreaming: boolean;
  onToggleStreaming: () => void;
  speed: number;
  onChangeSpeed: (speed: number) => void;
  selectedToolFilter: OsintTool | 'all';
  onSelectToolFilter: (tool: OsintTool | 'all') => void;
}

export const LiveStreamBar: React.FC<LiveStreamBarProps> = ({
  events,
  isStreaming,
  onToggleStreaming,
  speed,
  onChangeSpeed,
  selectedToolFilter,
  onSelectToolFilter,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<LiveWebSocketEvent | null>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  const filteredEvents = selectedToolFilter === 'all'
    ? events
    : events.filter(e => e.tool === selectedToolFilter);

  const tools: Array<OsintTool | 'all'> = [
    'all',
    'subfinder',
    'amass',
    'dnsx',
    'httpx',
    'nmap',
    'katana',
    'whois',
  ];

  return (
    <div className="bg-[#0b0f19] border-b border-slate-800/80 px-6 py-2.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
      {/* Stream Status and Controls */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className={`w-3.5 h-3.5 ${isStreaming ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span className="font-mono text-slate-300">
            WS://live.osint-stream
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 font-mono">
            {isStreaming ? `${(1000 / speed).toFixed(1)} evt/s` : 'PAUSED'}
          </span>
        </div>

        <button
          onClick={onToggleStreaming}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
        >
          {isStreaming ? (
            <>
              <Pause className="w-3 h-3 text-amber-400" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3 h-3 text-emerald-400" />
              <span>Resume</span>
            </>
          )}
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-slate-500">Interval:</span>
          {[2000, 1000, 500].map(s => (
            <button
              key={s}
              onClick={() => onChangeSpeed(s)}
              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                speed === s ? 'bg-purple-900/60 text-purple-300 font-mono' : 'hover:text-slate-200'
              }`}
            >
              {s / 1000}s
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Latest Event Marquee */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end overflow-hidden">
        {/* Tool Filter Dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setFilterMenuOpen(!filterMenuOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
          >
            <Filter className="w-3 h-3 text-purple-400" />
            <span className="capitalize">{selectedToolFilter}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {filterMenuOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-[#0f172a] border border-slate-700 rounded shadow-xl py-1 z-50">
              {tools.map(tool => (
                <button
                  key={tool}
                  onClick={() => {
                    onSelectToolFilter(tool);
                    setFilterMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs capitalize hover:bg-purple-950/50 cursor-pointer ${
                    selectedToolFilter === tool ? 'text-purple-300 font-semibold bg-purple-950/30' : 'text-slate-300'
                  }`}
                >
                  {tool === 'all' ? 'All Tools' : tool}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Latest Stream Event Pill-Free Ticker */}
        {filteredEvents.length > 0 && (
          <div
            onClick={() => setSelectedEvent(filteredEvents[0])}
            className="flex items-center gap-2 max-w-lg truncate px-2.5 py-1 rounded bg-slate-900/70 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors"
            title="Click to inspect raw WebSocket payload"
          >
            {filteredEvents[0].severity === 'alert' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
            {filteredEvents[0].severity === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            {filteredEvents[0].severity === 'nominal' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
            {filteredEvents[0].severity === 'info' && <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
            
            <span className="font-mono text-slate-500 shrink-0">{filteredEvents[0].timestamp}</span>
            <span className="text-purple-400 font-mono shrink-0 uppercase">[{filteredEvents[0].tool}]</span>
            <span className="text-slate-200 truncate">{filteredEvents[0].summary}</span>
          </div>
        )}
      </div>

      {/* Raw Event Inspector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-700 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Live WebSocket Packet Inspection</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span className="font-mono">{selectedEvent.timestamp}</span>
                  <span>·</span>
                  <span className="font-mono uppercase text-purple-400">{selectedEvent.tool}</span>
                  <span>·</span>
                  <span>{selectedEvent.eventType}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-100 text-sm font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-300 mb-2">{selectedEvent.summary}</p>
              <pre className="bg-[#080c14] border border-slate-800 p-3 rounded text-xs font-mono text-cyan-300 overflow-x-auto max-h-64">
                {JSON.stringify(selectedEvent.payload, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
