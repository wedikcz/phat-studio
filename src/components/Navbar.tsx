import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onTriggerScan: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, onTriggerScan }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'overview', label: 'OSINT Hub' },
    { id: 'subdomains', label: 'Subdomains' },
    { id: 'ports', label: 'Port Spectrum' },
    { id: 'active-hosts', label: 'Active Hosts' },
    { id: 'crawler-whois', label: 'Crawler & WHOIS' },
    { id: 'self-correction', label: 'Self-Correction' },
    { id: 'mcp-registry', label: 'MCP & Tools' },
    { id: 'api-docs', label: 'REST API' },
  ];

  return (
    <>
      <header className="flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 py-3.5 bg-[#0b0f19] border-b border-slate-800 shrink-0 sticky top-0 z-30">
        {/* Mobile menu toggle & Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-slate-100 p-1 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('overview');
            }}
            className="text-base font-bold tracking-tight text-slate-100 hover:text-purple-400 transition-colors whitespace-nowrap shrink-0"
          >
            PurpleHacker Studio
          </a>
        </div>

        {/* Zone 2: 4–5 clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onSelectTab(link.id)}
              className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === link.id
                  ? 'text-purple-400 underline underline-offset-8 decoration-2 decoration-purple-500'
                  : ''
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onTriggerScan}
            className="px-3.5 md:px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 active:bg-purple-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-purple-900/40"
          >
            New Recon Scan
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0e17] border-b border-slate-800 px-4 py-3 space-y-1.5 z-40">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onSelectTab(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded text-xs font-medium cursor-pointer ${
                activeTab === link.id
                  ? 'bg-purple-950/60 text-purple-300 font-bold'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
};

