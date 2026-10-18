import React from 'react';
import {
  LayoutDashboard,
  Globe2,
  Radio,
  Server,
  Compass,
  Cpu,
  Wrench,
  Terminal,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  targetCount: number;
  openPortCount: number;
  cveCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  openPortCount,
  cveCount,
}) => {
  const navItems = [
    {
      id: 'overview',
      label: 'Intelligence Hub',
      icon: LayoutDashboard,
      hint: 'Consolidated attack surface',
    },
    {
      id: 'subdomains',
      label: 'Subdomain Matrix',
      icon: Globe2,
      hint: 'Subfinder · Amass · DNSX',
    },
    {
      id: 'ports',
      label: 'Port Spectrum',
      icon: Radio,
      badge: openPortCount > 0 ? `${openPortCount} open` : undefined,
      hint: 'Nmap service fingerprint',
    },
    {
      id: 'active-hosts',
      label: 'Active Probes',
      icon: Server,
      hint: 'httpx · Web stacks · SSL',
    },
    {
      id: 'crawler-whois',
      label: 'Crawler & WHOIS',
      icon: Compass,
      hint: 'Katana spider · Registrar',
    },
    {
      id: 'self-correction',
      label: 'Self-Correction Lab',
      icon: Cpu,
      badge: cveCount > 0 ? 'Self-Healing' : undefined,
      hint: 'Autonomous refactoring',
    },
    {
      id: 'mcp-registry',
      label: 'MCP Tool Registry',
      icon: Wrench,
      hint: 'Schemas · Permissions',
    },
    {
      id: 'api-docs',
      label: 'REST API & Stream',
      icon: Terminal,
      hint: 'OpenAPI 3.1 & WebSocket',
    },
  ];

  return (
    <aside className="max-md:hidden flex w-64 bg-[#0a0e17] border-r border-slate-800/80 p-3 flex-col justify-between shrink-0 h-full overflow-y-auto">
      <div className="space-y-4">
        {/* Workspace Context */}
        <div className="px-3 py-2 border-b border-slate-800/60 pb-3">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">Active Workspace</div>
          <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate">
            Target Defense Corp
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1 font-mono">
            <span>Scope: Infrastructure</span>
            <span>·</span>
            <span className="text-purple-400">BAS Active</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-purple-950/40 text-purple-300 border border-purple-800/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-medium leading-none truncate">{item.label}</div>
                    <div className="text-[10px] text-slate-500 mt-1 truncate">{item.hint}</div>
                  </div>
                </div>

                {item.badge && (
                  <span className="text-[10px] font-mono text-purple-300 shrink-0 ml-1">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Security Engine Health Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 px-3 py-2 text-xs text-slate-400 bg-slate-900/40 rounded-md">
        <div className="flex items-center justify-between font-mono text-[11px]">
          <span className="text-slate-500">Autonomous BAS</span>
          <span className="text-emerald-400">Zero-Token</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
          <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
          <span>Self-Correction Active</span>
        </div>
      </div>
    </aside>
  );
};
