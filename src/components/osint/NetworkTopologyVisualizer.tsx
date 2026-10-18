import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Search,
  ShieldAlert,
  Server,
  Globe2,
  Radio,
  ExternalLink,
  Copy,
  CheckCircle2,
  X,
  Layers,
} from 'lucide-react';
import type { TargetDomain, SubdomainRecord, ActiveHostRecord, PortRecord } from '../../types/osint.ts';
import { buildTopologyGraph, TopologyNode, TopologyLink } from '../../utils/topologyEngine.ts';

interface NetworkTopologyVisualizerProps {
  target: TargetDomain;
  subdomains: SubdomainRecord[];
  activeHosts: ActiveHostRecord[];
  ports: PortRecord[];
}

export const NetworkTopologyVisualizer: React.FC<NetworkTopologyVisualizerProps> = ({
  target,
  subdomains,
  activeHosts,
  ports,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'web' | 'infra'>('all');
  const [copied, setCopied] = useState<boolean>(false);

  // Build raw topology data
  const rawGraph = useMemo(() => {
    return buildTopologyGraph(target, subdomains, activeHosts, ports);
  }, [target, subdomains, activeHosts, ports]);

  // Filter graph based on active filter
  const filteredGraph = useMemo(() => {
    if (filterType === 'all') return rawGraph;

    let allowedNodeIds = new Set<string>();
    // Root is always included
    allowedNodeIds.add(`root-${target.domain}`);

    if (filterType === 'critical') {
      // Keep critical/warning nodes and their ancestors
      for (const node of rawGraph.nodes) {
        if (node.riskLevel === 'critical' || node.riskLevel === 'warning') {
          allowedNodeIds.add(node.id);
          // find ancestor host
          if (node.type === 'port' && node.details.ip) {
            allowedNodeIds.add(`ip-${node.details.ip}`);
            // find ancestor subdomain
            if (node.details.fqdn) {
              allowedNodeIds.add(`sub-${node.details.fqdn}`);
            }
          }
        }
      }
    } else if (filterType === 'web') {
      for (const node of rawGraph.nodes) {
        if (node.type === 'port' && (node.details.port === 80 || node.details.port === 443 || node.details.port === 8080 || node.details.port === 8443)) {
          allowedNodeIds.add(node.id);
          if (node.details.ip) allowedNodeIds.add(`ip-${node.details.ip}`);
          if (node.details.fqdn) allowedNodeIds.add(`sub-${node.details.fqdn}`);
        }
      }
    } else if (filterType === 'infra') {
      for (const node of rawGraph.nodes) {
        if (node.type === 'port' && [21, 22, 25, 53, 1194, 3306, 5432, 6379, 8200].includes(node.details.port || 0)) {
          allowedNodeIds.add(node.id);
          if (node.details.ip) allowedNodeIds.add(`ip-${node.details.ip}`);
          if (node.details.fqdn) allowedNodeIds.add(`sub-${node.details.fqdn}`);
        }
      }
    }

    const filteredNodes = rawGraph.nodes.filter(n => allowedNodeIds.has(n.id));
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredLinks = rawGraph.links.filter(l => {
      const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;
      return filteredNodeIds.has(sId) && filteredNodeIds.has(tId);
    });

    return {
      nodes: filteredNodes,
      links: filteredLinks,
      stats: rawGraph.stats,
    };
  }, [rawGraph, filterType, target.domain]);

  // D3 force simulation setup
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 960;
    const height = 480;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', [0, 0, width, height]);

    // Zoom container
    const g = svg.append('g').attr('class', 'topology-viewport');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Deep copy nodes and links for D3 mutation
    const nodes: TopologyNode[] = filteredGraph.nodes.map(d => ({ ...d }));
    const links: TopologyLink[] = filteredGraph.links.map(d => ({
      ...d,
      source: typeof d.source === 'object' ? (d.source as any).id : d.source,
      target: typeof d.target === 'object' ? (d.target as any).id : d.target,
    }));

    // Simulation
    const simulation = d3.forceSimulation<TopologyNode>(nodes)
      .force('link', d3.forceLink<TopologyNode, TopologyLink>(links)
        .id((d) => d.id)
        .distance((d) => (d.type === 'root_to_sub' ? 90 : d.type === 'sub_to_host' ? 65 : 45))
        .strength(0.8)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => d.radius + 14));

    // Render Links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d) => {
        if (d.type === 'root_to_sub') return '#a855f755';
        if (d.type === 'sub_to_host') return '#38bdf844';
        return '#06b6d433';
      })
      .attr('stroke-width', (d) => (d.type === 'root_to_sub' ? 2 : 1.5))
      .attr('stroke-dasharray', (d) => (d.type === 'host_to_port' ? '2,2' : 'none'));

    // Render Nodes Group
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, TopologyNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Glowing halo for critical vulnerability nodes
    node.filter(d => d.riskLevel === 'critical')
      .append('circle')
      .attr('r', d => d.radius + 7)
      .attr('fill', '#f43f5e22')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '3,3');

    // Main Circle
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', '#080c14')
      .attr('stroke-width', 2);

    // Node Labels
    node.append('text')
      .text(d => d.name)
      .attr('x', d => d.radius + 5)
      .attr('y', 4)
      .attr('font-size', d => (d.type === 'root' ? '12px' : d.type === 'subdomain' ? '10px' : '9px'))
      .attr('font-family', 'monospace')
      .attr('font-weight', d => (d.type === 'root' ? 'bold' : 'normal'))
      .attr('fill', d => (d.riskLevel === 'critical' ? '#fda4af' : '#cbd5e1'))
      .attr('pointer-events', 'none');

    // Click handler to select node
    node.on('click', (event, d) => {
      event.stopPropagation();
      setSelectedNode(d);
    });

    svg.on('click', () => {
      setSelectedNode(null);
    });

    // Update coordinates on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredGraph]);

  const handleZoom = (factor: number) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, factor);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    const width = containerRef.current.clientWidth || 960;
    const height = 480;
    svg.transition().duration(400).call(
      d3.zoom<SVGSVGElement, unknown>().transform as any,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(0.85).translate(-width / 2, -height / 2)
    );
  };

  const handleCopyFqdn = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0a0e17] border border-slate-800 rounded-lg overflow-hidden space-y-0">
      {/* Topology Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Interactive Network Topology Visualizer (D3 Attack Surface)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Force-directed graph of subdomains, hosts, and active port connections with real-time risk classification
          </p>
        </div>

        {/* View Controls & Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Filter Segmented Buttons */}
          <div className="flex items-center gap-1 bg-[#080c14] border border-slate-800 p-1 rounded-lg">
            {[
              { id: 'all', label: 'All Entities' },
              { id: 'critical', label: 'Vulnerabilities & Risk' },
              { id: 'web', label: 'Web (80/443)' },
              { id: 'infra', label: 'Infra (SSH/VPN/DB)' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                  filterType === f.id
                    ? 'bg-purple-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1 bg-[#080c14] border border-slate-800 rounded p-1">
            <button
              onClick={() => handleZoom(1.3)}
              className="p-1 hover:text-white text-slate-400 cursor-pointer rounded"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(0.7)}
              className="p-1 hover:text-white text-slate-400 cursor-pointer rounded"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 hover:text-white text-slate-400 cursor-pointer rounded"
              title="Center & Reset View"
              aria-label="Center & Reset View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area with Interactive Graph & Legend */}
      <div ref={containerRef} className="relative w-full h-[480px] bg-[#070a12] select-none">
        {/* Subtle Background Grid */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* SVG Canvas */}
        <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top-Right Legend */}
        <div className="absolute top-3 right-3 bg-[#0b0f19]/90 border border-slate-800/80 rounded-md p-2.5 text-[11px] font-mono text-slate-300 backdrop-blur-sm space-y-1.5 shadow-xl">
          <div className="text-slate-500 font-sans font-medium text-[10px] uppercase">Node Legend</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#a855f7]" />
            <span>Root Domain ({target.domain})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8]" />
            <span>Subdomain Node</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            <span>Resolved Host IP</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
            <span>Standard Port</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e] ring-2 ring-[#f43f5e]/40" />
            <span className="text-rose-400 font-bold">CVE Alert Port</span>
          </div>
        </div>

        {/* Floating Quick Stats */}
        <div className="absolute bottom-3 left-3 bg-[#0b0f19]/90 border border-slate-800/80 rounded-md px-3 py-1.5 text-xs font-mono text-slate-400 backdrop-blur-sm flex items-center gap-3">
          <span>Nodes: <strong className="text-slate-200">{filteredGraph.nodes.length}</strong></span>
          <span>·</span>
          <span>Edges: <strong className="text-slate-200">{filteredGraph.links.length}</strong></span>
          <span>·</span>
          <span>Critical: <strong className="text-rose-400">{filteredGraph.stats.criticalNodes}</strong></span>
        </div>

        {/* Node Inspector Drawer (Rendered when node clicked) */}
        {selectedNode && (
          <div className="absolute top-3 left-3 max-w-sm w-full bg-[#0f172a] border border-slate-700 rounded-lg p-4 space-y-3 shadow-2xl backdrop-blur-md animate-in fade-in z-20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                {selectedNode.type === 'root' && <Globe2 className="w-4 h-4 text-purple-400" />}
                {selectedNode.type === 'subdomain' && <Globe2 className="w-4 h-4 text-cyan-400" />}
                {selectedNode.type === 'host' && <Server className="w-4 h-4 text-emerald-400" />}
                {selectedNode.type === 'port' && <Radio className="w-4 h-4 text-rose-400" />}
                <span className="text-xs font-bold text-slate-100 uppercase font-mono">
                  {selectedNode.type} Node Details
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono cursor-pointer"
                aria-label="Close inspector"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 font-mono text-[11px] block">Identifier / FQDN:</span>
                <div className="flex items-center justify-between font-mono font-semibold text-slate-200 mt-0.5">
                  <span className="truncate">{selectedNode.details.fqdn || selectedNode.name}</span>
                  <button
                    onClick={() => handleCopyFqdn(selectedNode.details.fqdn || selectedNode.name)}
                    className="text-slate-400 hover:text-white p-1 cursor-pointer"
                    title="Copy"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {selectedNode.details.ip && (
                <div className="pt-1.5 border-t border-slate-800/60">
                  <span className="text-slate-500 font-mono text-[11px] block">Resolved IP Address:</span>
                  <span className="font-mono text-cyan-400">{selectedNode.details.ip}</span>
                </div>
              )}

              {selectedNode.details.port && (
                <div className="pt-1.5 border-t border-slate-800/60">
                  <span className="text-slate-500 font-mono text-[11px] block">Service & Protocol:</span>
                  <span className="font-mono text-slate-200 font-medium">
                    Port {selectedNode.details.port}/{selectedNode.details.protocol || 'tcp'} ({selectedNode.details.service})
                  </span>
                </div>
              )}

              {selectedNode.details.banner && (
                <div className="pt-1.5 border-t border-slate-800/60">
                  <span className="text-slate-500 font-mono text-[11px] block">Detected Banner:</span>
                  <span className="font-mono text-slate-300 text-[11px]">{selectedNode.details.banner}</span>
                </div>
              )}

              {selectedNode.details.vulnerabilities && selectedNode.details.vulnerabilities.length > 0 && (
                <div className="pt-1.5 border-t border-slate-800/60 bg-rose-950/30 p-2 rounded border border-rose-900/50">
                  <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs font-mono">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{selectedNode.details.vulnerabilities[0].cve}</span>
                  </div>
                  <div className="text-[11px] text-rose-300 mt-1 font-mono">
                    CVSS Score: {selectedNode.details.vulnerabilities[0].score} · Severity: {selectedNode.details.vulnerabilities[0].severity}
                  </div>
                </div>
              )}

              {selectedNode.details.technologies && selectedNode.details.technologies.length > 0 && (
                <div className="pt-1.5 border-t border-slate-800/60">
                  <span className="text-slate-500 font-mono text-[11px] block">Web Technologies:</span>
                  <div className="flex flex-wrap gap-1 text-[11px] text-slate-300 mt-1">
                    {selectedNode.details.technologies.map((t, idx) => (
                      <span key={t}>
                        {t}{idx < selectedNode.details.technologies!.length - 1 && <span className="text-slate-600 ml-1">/</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedNode(null)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
