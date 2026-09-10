import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DataPoint, NeighborDistance } from '../types';
import { MathTex } from './MathTex';
import {
  Network,
  HelpCircle,
  RotateCcw,
  PlusCircle,
  Sparkles,
  TrendingUp,
  MapPin,
  CheckCircle2,
  Sliders,
  Layers,
} from 'lucide-react';
import { playClickSound, playSliderTickSound } from '../utils/audio';

// Default starter dataset in a 10x10 coordinate plane
const INITIAL_DATA_POINTS: DataPoint[] = [
  // Class A (Cobalt Blue: e.g. "Low Blood Sugar / Healthy")
  { id: 'a1', x: 2.2, y: 3.1, classLabel: 'A' },
  { id: 'a2', x: 2.8, y: 4.5, classLabel: 'A' },
  { id: 'a3', x: 3.5, y: 2.2, classLabel: 'A' },
  { id: 'a4', x: 4.0, y: 3.8, classLabel: 'A' },
  { id: 'a5', x: 1.8, y: 6.2, classLabel: 'A' },
  { id: 'a6', x: 3.2, y: 5.5, classLabel: 'A' },

  // Class B (Rose Crimson: e.g. "High Blood Sugar / Risk")
  { id: 'b1', x: 6.5, y: 7.2, classLabel: 'B' },
  { id: 'b2', x: 7.8, y: 6.1, classLabel: 'B' },
  { id: 'b3', x: 8.2, y: 8.4, classLabel: 'B' },
  { id: 'b4', x: 6.0, y: 8.5, classLabel: 'B' },
  { id: 'b5', x: 7.1, y: 4.8, classLabel: 'B' },
  { id: 'b6', x: 8.8, y: 5.5, classLabel: 'B' },
];

interface Module2Props {
  onOpenInspector: (formulaId: string) => void;
}

export const Module2KNNClustering: React.FC<Module2Props> = ({ onOpenInspector }) => {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(INITIAL_DATA_POINTS);
  // Query point coordinates (0 to 10)
  const [queryPoint, setQueryPoint] = useState<{ x: number; y: number }>({ x: 5.0, y: 5.0 });
  const [kValue, setKValue] = useState<number>(3);
  const [addingClass, setAddingClass] = useState<'A' | 'B'>('A');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [isDraggingQuery, setIsDraggingQuery] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute all Euclidean distances from query point
  const sortedDistances: NeighborDistance[] = useMemo(() => {
    const list = dataPoints.map((pt) => {
      const dx = pt.x - queryPoint.x;
      const dy = pt.y - queryPoint.y;
      const dxSq = dx * dx;
      const dySq = dy * dy;
      const distance = Math.sqrt(dxSq + dySq);
      return {
        point: pt,
        distance,
        dx,
        dy,
        dxSq,
        dySq,
        isNearestK: false,
      };
    });

    list.sort((a, b) => a.distance - b.distance);

    // Flag the top K
    for (let i = 0; i < Math.min(kValue, list.length); i++) {
      list[i].isNearestK = true;
    }

    return list;
  }, [dataPoints, queryPoint, kValue]);

  // Voting analysis
  const votingResult = useMemo(() => {
    const topK = sortedDistances.slice(0, kValue);
    const votesA = topK.filter((n) => n.point.classLabel === 'A').length;
    const votesB = topK.filter((n) => n.point.classLabel === 'B').length;
    const predictedClass: 'A' | 'B' = votesA >= votesB ? 'A' : 'B';
    const confidence = topK.length > 0 ? (Math.max(votesA, votesB) / topK.length) * 100 : 0;

    return {
      votesA,
      votesB,
      predictedClass,
      confidence: Math.round(confidence),
    };
  }, [sortedDistances, kValue]);

  // Coordinate Conversion Helpers (0..10 domain to Canvas pixels)
  const toCanvasX = (val: number, width: number) => (val / 10) * width;
  const toCanvasY = (val: number, height: number) => height - (val / 10) * height;
  const toDomainX = (px: number, width: number) => Math.max(0, Math.min(10, (px / width) * 10));
  const toDomainY = (py: number, height: number) =>
    Math.max(0, Math.min(10, ((height - py) / height) * 10));

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    const height = (canvas.height = canvas.width); // Keep 1:1 aspect ratio

    ctx.clearRect(0, 0, width, height);

    // 1. Render Background Decision Voronoi / Heatmap if enabled
    if (showHeatmap) {
      const step = Math.max(8, Math.floor(width / 35));
      for (let px = 0; px < width; px += step) {
        for (let py = 0; py < height; py += step) {
          const gx = toDomainX(px + step / 2, width);
          const gy = toDomainY(py + step / 2, height);

          // Find K nearest for this grid cell
          const cellDists = dataPoints.map((pt) => {
            const d = Math.hypot(pt.x - gx, pt.y - gy);
            return { d, label: pt.classLabel };
          });
          cellDists.sort((a, b) => a.d - b.d);
          const topK = cellDists.slice(0, kValue);
          const cA = topK.filter((x) => x.label === 'A').length;
          const cB = topK.filter((x) => x.label === 'B').length;

          if (cA > cB) {
            ctx.fillStyle = 'rgba(37, 99, 235, 0.08)'; // Cobalt zone
          } else if (cB > cA) {
            ctx.fillStyle = 'rgba(225, 29, 72, 0.08)'; // Rose zone
          } else {
            ctx.fillStyle = 'rgba(148, 163, 184, 0.05)'; // Boundary tie
          }
          ctx.fillRect(px, py, step, step);
        }
      }
    }

    // 2. Draw Cartesian Grid Lines & Axis Numbers (0 to 10)
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px "JetBrains Mono", monospace';

    for (let i = 0; i <= 10; i++) {
      const cx = toCanvasX(i, width);
      const cy = toCanvasY(i, height);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();

      // Numbers
      if (i > 0 && i < 10) {
        ctx.fillText(i.toString(), cx + 3, height - 4);
        ctx.fillText(i.toString(), 4, cy - 3);
      }
    }

    // 3. Draw Distance Vector Lines from Query Point to nearest K
    const qx = toCanvasX(queryPoint.x, width);
    const qy = toCanvasY(queryPoint.y, height);

    sortedDistances.forEach((n, idx) => {
      const px = toCanvasX(n.point.x, width);
      const py = toCanvasY(n.point.y, height);

      if (n.isNearestK) {
        // Glowing connector line for top K
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.moveTo(qx, qy);
        ctx.lineTo(px, py);
        ctx.strokeStyle =
          n.point.classLabel === 'A' ? 'rgba(37, 99, 235, 0.85)' : 'rgba(225, 29, 72, 0.85)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw distance badge along the midpoint
        const mx = (qx + px) / 2;
        const my = (qy + py) / 2;
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.arc(mx, my, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`#${idx + 1}`, mx, my);
      }
    });

    // 4. Draw Radius Enclosing Circle of K-th neighbor
    if (sortedDistances.length >= kValue && kValue > 0) {
      const kthDist = sortedDistances[kValue - 1].distance;
      const rPx = (kthDist / 10) * width;
      ctx.beginPath();
      ctx.arc(qx, qy, rPx, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Draw Dataset Points
    dataPoints.forEach((pt) => {
      const px = toCanvasX(pt.x, width);
      const py = toCanvasY(pt.y, height);
      const isNearest = sortedDistances.slice(0, kValue).some((n) => n.point.id === pt.id);

      // Outer glow for nearest
      if (isNearest) {
        ctx.beginPath();
        ctx.arc(px, py, 14, 0, Math.PI * 2);
        ctx.fillStyle =
          pt.classLabel === 'A' ? 'rgba(37, 99, 235, 0.25)' : 'rgba(225, 29, 72, 0.25)';
        ctx.fill();
      }

      // Point circle
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = pt.classLabel === 'A' ? '#2563EB' : '#E11D48';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label inside point
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px "Plus Jakarta Sans", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pt.classLabel, px, py);
    });

    // 6. Draw Interactive Query Point (Q)
    ctx.beginPath();
    ctx.arc(qx, qy, 16, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(2, 132, 199, 0.2)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(qx, qy, 9, 0, Math.PI * 2);
    ctx.fillStyle = votingResult.predictedClass === 'A' ? '#1D4ED8' : '#BE123C';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', qx, qy);
  }, [dataPoints, queryPoint, kValue, sortedDistances, showHeatmap, votingResult]);

  // Handle canvas click / drag
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const clickX = toDomainX(px, canvas.width);
    const clickY = toDomainY(py, canvas.height);

    // If near query point, start dragging
    const distToQ = Math.hypot(clickX - queryPoint.x, clickY - queryPoint.y);
    if (distToQ < 1.0) {
      setIsDraggingQuery(true);
    } else {
      // Move query point directly to click
      setQueryPoint({
        x: Math.round(clickX * 10) / 10,
        y: Math.round(clickY * 10) / 10,
      });
      playClickSound();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingQuery) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const clickX = toDomainX(px, canvas.width);
    const clickY = toDomainY(py, canvas.height);

    setQueryPoint({
      x: Math.round(clickX * 10) / 10,
      y: Math.round(clickY * 10) / 10,
    });
  };

  const handleCanvasMouseUp = () => {
    setIsDraggingQuery(false);
  };

  // Add a new training point
  const handleAddPointAtQuery = () => {
    playClickSound();
    const newPt: DataPoint = {
      id: `pt-${Date.now()}`,
      x: queryPoint.x,
      y: queryPoint.y,
      classLabel: addingClass,
    };
    setDataPoints((prev) => [...prev, newPt]);
  };

  // Reset to default
  const handleReset = () => {
    playClickSound();
    setDataPoints(INITIAL_DATA_POINTS);
    setQueryPoint({ x: 5.0, y: 5.0 });
    setKValue(3);
  };

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/80 border border-slate-200/90 shadow-xs backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Module 2 of 3
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Class-10 NCTB Chapter 11: Coordinate Geometry (Distance Formula)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-950 mt-1">
            Nearest Neighbors: Classifying with the Distance Formula
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Click or drag the unknown point '?' across the graph paper. The computer uses the distance formula d = √((x₂-x₁)² + (y₂-y₁)²) to find the closest neighbors and lets them vote!
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playClickSound();
            onOpenInspector('euclidean-distance');
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-2xs transition-all shrink-0 cursor-pointer self-start sm:self-center"
        >
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>10th-Grade Math: Distance Formula</span>
        </button>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive 2D Coordinate Canvas (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                  <span>Cartesian Feature Space</span>
                  <span className="font-mono text-xs font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    Query Q({queryPoint.x}, {queryPoint.y})
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Click or drag query point '?' to relocate</p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    showHeatmap
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                  title="Toggle Decision Region Heatmap"
                >
                  <Layers className="w-3.5 h-3.5 inline mr-1" />
                  Zones
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="Reset Points"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas Coordinate Plane */}
            <div className="relative aspect-square w-full max-w-[420px] mx-auto rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
              <canvas
                ref={canvasRef}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                className="w-full h-full block cursor-crosshair"
              />
            </div>

            {/* Add Point Controls */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700">Add point at cursor:</span>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white">
                  <button
                    type="button"
                    onClick={() => setAddingClass('A')}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      addingClass === 'A'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-navy-900'
                    }`}
                  >
                    Class A (Blue)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddingClass('B')}
                    className={`px-2 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      addingClass === 'B'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-navy-900'
                    }`}
                  >
                    Class B (Red)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddPointAtQuery}
                  className="px-3 py-1 rounded-lg bg-navy-900 hover:bg-navy-800 text-white font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Insert</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: K-Value Slider, Voting Decision & Distance Leaderboard (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Voting Result Card */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <span>KNN Classification Decision</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      votingResult.predictedClass === 'A'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    Class {votingResult.predictedClass} Predicted
                  </span>
                </h3>
                <p className="text-xs text-slate-500">Based on majority vote of the $K$ closest points</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-mono font-extrabold text-navy-950">
                  {votingResult.confidence}%
                </span>
                <span className="block text-[10px] uppercase font-semibold text-slate-400">
                  Confidence
                </span>
              </div>
            </div>

            {/* Interactive Slider for K */}
            <div className="space-y-2 p-3.5 rounded-xl bg-[#EEF4FB]/70 border border-sky-200/80">
              <div className="flex justify-between items-center text-xs font-bold text-navy-900">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-600" />
                  Select Neighborhood Size ($K$):
                </span>
                <span className="font-mono text-sm px-2.5 py-0.5 bg-blue-600 text-white rounded-md shadow-2xs">
                  K = {kValue}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max={Math.min(dataPoints.length, 9)}
                step="2" // Odd numbers to avoid ties
                value={kValue}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setKValue(val);
                  playSliderTickSound(val);
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>K=1 (Most Sensitive)</span>
                <span>K=3</span>
                <span>K=5</span>
                <span>K=7 (Smooth Boundary)</span>
              </div>
            </div>

            {/* Voting Vote Tally Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="text-blue-700">Class A: {votingResult.votesA} Votes</span>
                <span className="text-rose-700">Class B: {votingResult.votesB} Votes</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200">
                <div
                  className="h-full bg-blue-600 transition-all duration-200"
                  style={{ width: `${(votingResult.votesA / kValue) * 100}%` }}
                />
                <div
                  className="h-full bg-rose-600 transition-all duration-200"
                  style={{ width: `${(votingResult.votesB / kValue) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Live Euclidean Distance Leaderboard Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy-950 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Live Euclidean Distance Ranking: d = √(Δx² + Δy²)
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">Sorted Ascending</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[220px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="p-2">Rank</th>
                    <th className="p-2">Class</th>
                    <th className="p-2">Coordinates</th>
                    <th className="p-2">Δx² + Δy²</th>
                    <th className="p-2">Distance (d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-mono">
                  {sortedDistances.map((n, idx) => (
                    <tr
                      key={n.point.id}
                      className={
                        n.isNearestK
                          ? n.point.classLabel === 'A'
                            ? 'bg-blue-50/70 font-semibold text-blue-900'
                            : 'bg-rose-50/70 font-semibold text-rose-900'
                          : 'text-slate-600 hover:bg-slate-50'
                      }
                    >
                      <td className="p-2">
                        {n.isNearestK ? (
                          <span className="px-1.5 py-0.5 rounded bg-navy-900 text-white text-[10px]">
                            #{idx + 1}
                          </span>
                        ) : (
                          `#${idx + 1}`
                        )}
                      </td>
                      <td className="p-2 font-sans font-bold">
                        <span
                          className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle ${
                            n.point.classLabel === 'A' ? 'bg-blue-600' : 'bg-rose-600'
                          }`}
                        />
                        {n.point.classLabel}
                      </td>
                      <td className="p-2">
                        ({n.point.x.toFixed(1)}, {n.point.y.toFixed(1)})
                      </td>
                      <td className="p-2 text-slate-500">
                        {n.dxSq.toFixed(1)} + {n.dySq.toFixed(1)}
                      </td>
                      <td className="p-2 font-bold text-navy-950">{n.distance.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Festival Note */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Class-10 Coordinate Geometry Connection:</strong> Notice that when K=1, the boundary directly creates a Voronoi diagram. As K increases to 5, single noisy outlier points get outvoted by the majority, demonstrating statistical noise filtration!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
