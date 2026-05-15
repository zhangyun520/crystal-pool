"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, GitBranch, Orbit, Sparkles } from "lucide-react";
import { type EdgeRelation, type Phase } from "@/lib/domain";

export type GraphNode = {
  id: string;
  title: string;
  body: string;
  phase: Phase;
  crystallizationScore: number;
  emotionHa: number;
  tags: string[];
};

export type GraphEdge = {
  id: string;
  fromId: string;
  toId: string;
  relation: EdgeRelation;
  weight: number;
  from: { title: string };
  to: { title: string };
};

const phasePalette: Record<
  Phase,
  { fill: string; glow: string; stroke: string; text: string; ring: string }
> = {
  gas: {
    fill: "#e0f2fe",
    glow: "#38bdf8",
    stroke: "#7dd3fc",
    text: "#075985",
    ring: "#bae6fd",
  },
  liquid: {
    fill: "#ccfbf1",
    glow: "#2dd4bf",
    stroke: "#5eead4",
    text: "#115e59",
    ring: "#99f6e4",
  },
  seed: {
    fill: "#fef3c7",
    glow: "#f59e0b",
    stroke: "#fbbf24",
    text: "#78350f",
    ring: "#fde68a",
  },
  crystal: {
    fill: "#ecfccb",
    glow: "#a3e635",
    stroke: "#bef264",
    text: "#365314",
    ring: "#d9f99d",
  },
  fossil: {
    fill: "#e7e5e4",
    glow: "#a8a29e",
    stroke: "#d6d3d1",
    text: "#44403c",
    ring: "#e7e5e4",
  },
  dissolved: {
    fill: "#ede9fe",
    glow: "#a78bfa",
    stroke: "#c4b5fd",
    text: "#4c1d95",
    ring: "#ddd6fe",
  },
};

const phaseOrder: Phase[] = ["gas", "liquid", "seed", "crystal", "fossil", "dissolved"];

function shortTitle(title: string) {
  return title.length > 18 ? `${title.slice(0, 18)}...` : title;
}

const relationPalette: Record<EdgeRelation, { color: string; label: string }> = {
  resonates_with: { color: "#67e8f9", label: "resonance" },
  contradicts: { color: "#fb7185", label: "tension" },
  triggers: { color: "#facc15", label: "trigger" },
  derives_from: { color: "#86efac", label: "lineage" },
  hardens_into: { color: "#bef264", label: "hardening" },
  dissolves_into: { color: "#c4b5fd", label: "dissolve" },
  ha_softens: { color: "#fdba74", label: "ha soften" },
};

function relationColor(relation: EdgeRelation) {
  return relationPalette[relation].color;
}

function graphNumber(value: number) {
  return Math.round(value * 1000) / 1000;
}

function crystalPoints(x: number, y: number, size: number) {
  const top = y - size * 0.95;
  const right = x + size * 0.82;
  const bottom = y + size;
  const left = x - size * 0.82;
  const shoulderY = y - size * 0.25;
  return [
    [x, top],
    [right, shoulderY],
    [x + size * 0.52, bottom],
    [x, y + size * 0.66],
    [x - size * 0.52, bottom],
    [left, shoulderY],
  ]
    .map(([pointX, pointY]) => `${graphNumber(pointX)},${graphNumber(pointY)}`)
    .join(" ");
}

function edgePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
  index: number,
) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const bend = index % 2 === 0 ? 28 : -28;
  const cx = graphNumber(midX - (dy / length) * bend);
  const cy = graphNumber(midY + (dx / length) * bend);
  return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
}

export function GraphView({
  nodes,
  edges,
  initialSelectedId,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  initialSelectedId?: string;
}) {
  const [selectedId, setSelectedId] = useState(
    nodes.some((node) => node.id === initialSelectedId)
      ? initialSelectedId
      : nodes[0]?.id,
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const activeId = hoveredId ?? selectedId;
  const selectedNode = nodes.find((node) => node.id === selectedId);
  const width = 1080;
  const height = 720;
  const centerX = width / 2;
  const centerY = height / 2;
  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    if (nodes.length === 0) return map;
    if (nodes.length === 1) {
      map.set(nodes[0].id, { x: centerX, y: centerY });
      return map;
    }

    const phaseCounts = new Map<Phase, number>();
    nodes.forEach((node, index) => {
      const phaseIndex = phaseOrder.indexOf(node.phase);
      const phaseCount = phaseCounts.get(node.phase) ?? 0;
      phaseCounts.set(node.phase, phaseCount + 1);
      const angle =
        -Math.PI / 2 +
        (index / nodes.length) * Math.PI * 2 +
        phaseIndex * 0.19 +
        phaseCount * 0.08;
      const phaseRadius = 0.46 - Math.min(phaseIndex, 5) * 0.035;
      const scorePull = Math.min(0.28, node.crystallizationScore / 440);
      const haPush = Math.min(0.08, node.emotionHa / 120);
      const radiusX = width * (phaseRadius - scorePull + haPush);
      const radiusY = height * (phaseRadius * 0.72 - scorePull * 0.45 + haPush);
      map.set(node.id, {
        x: graphNumber(centerX + Math.cos(angle) * radiusX),
        y: graphNumber(centerY + Math.sin(angle) * radiusY),
      });
    });
    return map;
  }, [centerX, centerY, nodes]);

  const connectedEdges = selectedNode
    ? edges.filter(
        (edge) => edge.fromId === selectedNode.id || edge.toId === selectedNode.id,
      )
    : [];
  const relationStrength = connectedEdges.reduce((sum, edge) => sum + edge.weight, 0);
  const avgScore = nodes.length
    ? Math.round(
        nodes.reduce((sum, node) => sum + node.crystallizationScore, 0) /
          nodes.length,
      )
    : 0;
  const highHaCount = nodes.filter((node) => node.emotionHa >= 6).length;

  function isConnected(edge: GraphEdge, nodeId?: string) {
    return Boolean(nodeId && (edge.fromId === nodeId || edge.toId === nodeId));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-lg border border-stone-300/80 bg-stone-950 shadow-2xl shadow-stone-950/10">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-stone-950 px-4 py-3 text-sm text-stone-200">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-md bg-lime-300 text-stone-950">
              <Orbit size={17} aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-white">Meaning Field</p>
              <p className="text-xs text-stone-400">
                phase orbit / relation energy / ha pressure
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <GraphMetric label="nodes" value={nodes.length} />
            <GraphMetric label="avg score" value={avgScore} />
            <GraphMetric label="high ha" value={highHaCount} />
          </div>
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="Crystal relation graph"
          className="h-auto w-full bg-stone-950"
        >
          <defs>
            <radialGradient id="fieldGlow" cx="50%" cy="48%" r="62%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.26" />
              <stop offset="38%" stopColor="#84cc16" stopOpacity="0.11" />
              <stop offset="100%" stopColor="#0c0a09" stopOpacity="0.96" />
            </radialGradient>
            <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width={width} height={height} fill="#0c0a09" />
          <rect width={width} height={height} fill="url(#fieldGlow)" />
          {phaseOrder.map((phase, index) => (
            <ellipse
              key={phase}
              cx={centerX}
              cy={centerY}
              rx={graphNumber(width * (0.42 - index * 0.035))}
              ry={graphNumber(height * (0.31 - index * 0.024))}
              fill="none"
              stroke={phasePalette[phase].ring}
              strokeOpacity={0.12}
              strokeWidth={1}
              strokeDasharray={index % 2 === 0 ? "7 11" : "2 10"}
            />
          ))}
          <line x1={80} x2={width - 80} y1={centerY} y2={centerY} stroke="#f5f5f4" strokeOpacity="0.06" />
          <line x1={centerX} x2={centerX} y1={70} y2={height - 70} stroke="#f5f5f4" strokeOpacity="0.06" />
          {nodes.length === 0 ? (
            <text
              x={centerX}
              y={centerY}
              textAnchor="middle"
              className="fill-stone-300 text-[18px]"
            >
              No active graph nodes match these filters.
            </text>
          ) : null}
          {edges.map((edge, index) => {
            const from = positions.get(edge.fromId);
            const to = positions.get(edge.toId);
            if (!from || !to) return null;
            const highlighted = isConnected(edge, activeId);
            const path = edgePath(from, to, index);
            return (
              <g key={edge.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={relationColor(edge.relation)}
                  strokeWidth={Math.max(1.3, edge.weight * 1.8)}
                  strokeOpacity={activeId ? (highlighted ? 0.9 : 0.13) : 0.5}
                  strokeLinecap="round"
                  filter={highlighted ? "url(#softGlow)" : undefined}
                />
                <path id={`edge-label-${edge.id}`} d={path} fill="none" stroke="none" />
                {highlighted ? (
                  <text className="fill-stone-100 text-[11px]">
                    <textPath href={`#edge-label-${edge.id}`} startOffset="50%" textAnchor="middle">
                      {edge.relation} · {edge.weight}
                    </textPath>
                  </text>
                ) : null}
              </g>
            );
          })}
          {nodes.map((node) => {
            const position = positions.get(node.id);
            if (!position) return null;
            const size = 17 + Math.min(30, node.crystallizationScore / 2.8);
            const palette = phasePalette[node.phase];
            const selected = selectedId === node.id;
            const hovered = hoveredId === node.id;
            const dimmed = activeId && activeId !== node.id;
            const connectedToActive =
              activeId &&
              edges.some(
                (edge) =>
                  isConnected(edge, activeId) &&
                  (edge.fromId === node.id || edge.toId === node.id),
              );
            const opacity = !dimmed || connectedToActive ? 1 : 0.36;
            return (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                aria-label={`Select ${node.title}`}
                className="cursor-pointer outline-none"
                onClick={() => setSelectedId(node.id)}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedId(node.id);
                  }
                }}
                opacity={opacity}
              >
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={size + 20 + node.emotionHa * 1.2}
                  fill={palette.glow}
                  opacity={selected || hovered ? 0.2 : 0.08}
                  filter="url(#softGlow)"
                />
                {selected || hovered ? (
                  <circle
                    cx={position.x}
                    cy={position.y}
                    r={size + 13}
                    fill="none"
                    stroke={selected ? "#fef08a" : "#99f6e4"}
                    strokeWidth={selected ? 3 : 2}
                    strokeDasharray={selected ? "2 6" : "6 7"}
                  />
                ) : null}
                <polygon
                  points={crystalPoints(position.x, position.y, size)}
                  fill={palette.fill}
                  stroke={selected ? "#fef08a" : palette.stroke}
                  strokeWidth={selected ? 2.4 : 1.4}
                  filter={selected || hovered ? "url(#softGlow)" : undefined}
                />
                <path
                  d={`M ${position.x} ${position.y - size * 0.95} L ${position.x} ${position.y + size * 0.66} M ${position.x - size * 0.82} ${position.y - size * 0.25} L ${position.x + size * 0.82} ${position.y - size * 0.25}`}
                  stroke={palette.stroke}
                  strokeOpacity="0.65"
                  strokeWidth="0.9"
                />
                <text
                  x={position.x}
                  y={position.y + 4}
                  textAnchor="middle"
                  className="pointer-events-none fill-stone-950 text-[12px] font-bold"
                >
                  {Math.round(node.crystallizationScore)}
                </text>
                <text
                  x={position.x}
                  y={position.y + size + 22}
                  textAnchor="middle"
                  className="pointer-events-none fill-stone-100 text-[12px] font-semibold"
                >
                  {shortTitle(node.title)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <aside className="rounded-lg border border-stone-200 bg-white p-5 shadow-xl shadow-stone-950/5">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-stone-950 text-lime-200">
            <Sparkles size={16} aria-hidden />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Selected Node</h2>
            <p className="text-xs text-stone-500">phase signature and visible edges</p>
          </div>
        </div>
        {selectedNode ? (
          <div className="mt-4 grid gap-4">
            <div>
              <p className="text-xl font-semibold leading-tight text-stone-950">
                {selectedNode.title}
              </p>
              <p className="mt-2 line-clamp-4 text-sm leading-6 text-stone-600">
                {selectedNode.body}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-md border border-stone-100 bg-stone-50 p-3">
                <p className="text-xs text-stone-500">phase</p>
                <p className="mt-1 font-semibold">{selectedNode.phase}</p>
              </div>
              <div className="rounded-md border border-stone-100 bg-stone-50 p-3">
                <p className="text-xs text-stone-500">score</p>
                <p className="mt-1 font-semibold">
                  {Math.round(selectedNode.crystallizationScore)}
                </p>
              </div>
              <div className="rounded-md border border-stone-100 bg-stone-50 p-3">
                <p className="text-xs text-stone-500">ha</p>
                <p className="mt-1 font-semibold">{selectedNode.emotionHa}</p>
              </div>
            </div>
            <div className="rounded-md border border-stone-100 bg-stone-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">relation field</span>
                <span className="font-semibold text-stone-950">
                  {connectedEdges.length} edges / w{relationStrength.toFixed(1)}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-lime-400"
                  style={{
                    width: `${Math.min(100, relationStrength * 18)}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedNode.tags.length ? (
                selectedNode.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-[#eef7d0] px-2 py-1 text-xs text-stone-700"
                  >
                    {tag}
                  </span>
                ))
              ) : (
                <span className="text-sm text-stone-500">No tags.</span>
              )}
            </div>
            <Link
              href={`/nodes/${selectedNode.id}`}
              className="inline-flex h-10 w-fit items-center gap-2 rounded-md bg-stone-950 px-3 text-sm font-semibold text-white"
            >
              <ExternalLink size={15} aria-hidden />
              Open Node Detail
            </Link>
            <div className="border-t border-stone-200 pt-4">
              <div className="flex items-center gap-2">
                <GitBranch size={16} aria-hidden className="text-stone-500" />
                <p className="font-semibold text-stone-950">Visible relations</p>
              </div>
              <div className="mt-3 grid gap-2">
                {connectedEdges.length === 0 ? (
                  <p className="text-sm text-stone-500">
                    No visible edges under the current filters.
                  </p>
                ) : (
                  connectedEdges.map((edge) => (
                    <div
                      key={edge.id}
                      className="rounded-md border border-stone-200 bg-white p-3 text-sm shadow-sm"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className="mt-1 size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: relationColor(edge.relation) }}
                        />
                        <div>
                          <p className="font-medium text-stone-950">
                            {edge.fromId === selectedNode.id ? "to" : "from"}{" "}
                            {edge.fromId === selectedNode.id
                              ? edge.to.title
                              : edge.from.title}
                          </p>
                          <p className="mt-1 text-stone-600">
                            {edge.relation} · weight {edge.weight}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-md bg-stone-50 p-3 text-sm text-stone-600">
            No node is available under the current filters.
          </p>
        )}
      </aside>
    </div>
  );
}

function GraphMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-right">
      <p className="font-mono text-[13px] font-semibold text-white">{value}</p>
      <p className="text-[10px] uppercase tracking-normal text-stone-400">{label}</p>
    </div>
  );
}
