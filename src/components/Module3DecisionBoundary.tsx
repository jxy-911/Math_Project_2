import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BoundaryPoint, PerceptronState } from '../types';
import { MathTex } from './MathTex';
import {
  Binary,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Zap,
  Sliders,
  CheckCircle2,
  TrendingUp,
  Target,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  playClickSound,
  playSliderTickSound,
  playMatchCelebrationSound,
} from '../utils/audio';

// Standard 2-class dataset distributed around a diagonal boundary
const INITIAL_POINTS: BoundaryPoint[] = [
  // Positive Class (1: Cobalt Blue)
  { id: 'p1', x1: 1.5, x2: 2.5, trueClass: 1 },
  { id: 'p2', x1: 2.5, x2: 3.8, trueClass: 1 },
  { id: 'p3', x1: 0.5, x2: 3.5, trueClass: 1 },
  { id: 'p4', x1: 3.2, x2: 1.8, trueClass: 1 },
  { id: 'p5', x1: 2.0, x2: 1.2, trueClass: 1 },
  { id: 'p6', x1: 3.8, x2: 4.2, trueClass: 1 },

  // Negative Class (0: Rose Crimson)
  { id: 'n1', x1: -1.5, x2: -1.0, trueClass: 0 },
  { id: 'n2', x1: -2.8, x2: -2.2, trueClass: 0 },
  { id: 'n3', x1: -0.8, x2: -3.0, trueClass: 0 },
  { id: 'n4', x1: -3.0, x2: 0.5, trueClass: 0 },
  { id: 'n5', x1: -2.0, x2: -0.5, trueClass: 0 },
  { id: 'n6', x1: 0.2, x2: -2.4, trueClass: 0 },
];

interface Module3Props {
  onOpenInspector: (formulaId: string) => void;
}

export const Module3DecisionBoundary: React.FC<Module3Props> = ({ onOpenInspector }) => {
  // Weights and bias for w1*x1 + w2*x2 + b = 0
  const [weights, setWeights] = useState<PerceptronState>({
    w1: 1.2,
    w2: 1.0,
    bias: -0.5,
  });

  // Interactive Test Probe Point (x1, x2) in [-5, 5]
  const [probePoint, setProbePoint] = useState<{ x1: number; x2: number }>({
    x1: 1.5,
    x2: 1.5,
  });

  const [hasCelebrated, setHasCelebrated] = useState(false);

  const canvas2DRef = useRef<HTMLCanvasElement | null>(null);
  const sigmoidCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Calculate Net Linear Score z for probe point
  const probeZ = useMemo(() => {
    return weights.w1 * probePoint.x1 + weights.w2 * probePoint.x2 + weights.bias;
  }, [weights, probePoint]);

  // Sigmoid activation value sigma(z) = 1 / (1 + exp(-z))
  const probeSigmoid = useMemo(() => {
    return 1 / (1 + Math.exp(-probeZ));
  }, [probeZ]);

  // Classification accuracy calculation across dataset
  const classificationMetrics = useMemo(() => {
    let correct = 0;
    let truePos = 0;
    let falsePos = 0;
    let trueNeg = 0;
    let falseNeg = 0;

    INITIAL_POINTS.forEach((pt) => {
      const z = weights.w1 * pt.x1 + weights.w2 * pt.x2 + weights.bias;
      const predictedClass = z >= 0 ? 1 : 0;
      if (predictedClass === pt.trueClass) {
        correct++;
        if (pt.trueClass === 1) truePos++;
        else trueNeg++;
      } else {
        if (pt.trueClass === 1) falseNeg++;
        else falsePos++;
      }
    });

    const accuracy = Math.round((correct / INITIAL_POINTS.length) * 100);

    return {
      correct,
      total: INITIAL_POINTS.length,
      accuracy,
      truePos,
      falsePos,
      trueNeg,
      falseNeg,
    };
  }, [weights]);

  // Celebration on 100% accuracy
  useEffect(() => {
    if (classificationMetrics.accuracy === 100 && !hasCelebrated) {
      setHasCelebrated(true);
      playMatchCelebrationSound();
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#10B981', '#38BDF8'],
        });
      } catch {}
    } else if (classificationMetrics.accuracy < 100 && hasCelebrated) {
      setHasCelebrated(false);
    }
  }, [classificationMetrics.accuracy, hasCelebrated]);

  // Coordinate conversion between [-5, 5] and Canvas pixels
  const toCanvasX = (val: number, width: number) => ((val + 5) / 10) * width;
  const toCanvasY = (val: number, height: number) => height - ((val + 5) / 10) * height;
  const toDomainX = (px: number, width: number) => (px / width) * 10 - 5;
  const toDomainY = (py: number, height: number) => ((height - py) / height) * 10 - 5;

  // Render 2D Scatter Plot & Decision Line
  useEffect(() => {
    const canvas = canvas2DRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 380);
    const height = (canvas.height = canvas.width);

    ctx.clearRect(0, 0, width, height);

    // 1. Shaded Half-Planes (Positive zone > 0, Negative zone < 0)
    const step = 8;
    for (let px = 0; px < width; px += step) {
      for (let py = 0; py < height; py += step) {
        const x1 = toDomainX(px + step / 2, width);
        const x2 = toDomainY(py + step / 2, height);
        const score = weights.w1 * x1 + weights.w2 * x2 + weights.bias;
        if (score >= 0) {
          ctx.fillStyle = 'rgba(37, 99, 235, 0.08)'; // Cobalt positive
        } else {
          ctx.fillStyle = 'rgba(225, 29, 72, 0.08)'; // Rose negative
        }
        ctx.fillRect(px, py, step, step);
      }
    }

    // 2. Cartesian Axes & Grid
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;

    for (let i = -5; i <= 5; i++) {
      const cx = toCanvasX(i, width);
      const cy = toCanvasY(i, height);

      // Grid lines
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(width, cy);
      ctx.stroke();
    }

    // Main Axes (x=0 and y=0)
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0, width), 0);
    ctx.lineTo(toCanvasX(0, width), height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(0, height));
    ctx.lineTo(width, toCanvasY(0, height));
    ctx.stroke();

    // 3. Draw Decision Boundary Line: w1*x1 + w2*x2 + b = 0 => x2 = -(w1*x1 + b) / w2
    if (Math.abs(weights.w2) > 0.01) {
      const x1_start = -5;
      const x2_start = -(weights.w1 * x1_start + weights.bias) / weights.w2;

      const x1_end = 5;
      const x2_end = -(weights.w1 * x1_end + weights.bias) / weights.w2;

      ctx.beginPath();
      ctx.moveTo(toCanvasX(x1_start, width), toCanvasY(x2_start, height));
      ctx.lineTo(toCanvasX(x1_end, width), toCanvasY(x2_end, height));
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 6;
      ctx.shadowColor = 'rgba(15, 23, 42, 0.4)';
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Vertical line: x1 = -b / w1
      const x1_vert = -weights.bias / weights.w1;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x1_vert, width), 0);
      ctx.lineTo(toCanvasX(x1_vert, width), height);
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 4. Draw Data Points
    INITIAL_POINTS.forEach((pt) => {
      const px = toCanvasX(pt.x1, width);
      const py = toCanvasY(pt.x2, height);
      const z = weights.w1 * pt.x1 + weights.w2 * pt.x2 + weights.bias;
      const isCorrect = (z >= 0 ? 1 : 0) === pt.trueClass;

      ctx.beginPath();
      ctx.arc(px, py, 7.5, 0, Math.PI * 2);
      ctx.fillStyle = pt.trueClass === 1 ? '#2563EB' : '#E11D48';
      ctx.fill();
      ctx.strokeStyle = isCorrect ? '#FFFFFF' : '#F59E0B';
      ctx.lineWidth = isCorrect ? 2 : 3;
      ctx.stroke();
    });

    // 5. Draw Interactive Test Probe (Click / Drag Target)
    const prX = toCanvasX(probePoint.x1, width);
    const prY = toCanvasY(probePoint.x2, height);

    ctx.beginPath();
    ctx.arc(prX, prY, 14, 0, Math.PI * 2);
    ctx.fillStyle = probeZ >= 0 ? 'rgba(37, 99, 235, 0.25)' : 'rgba(225, 29, 72, 0.25)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(prX, prY, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('P', prX, prY);
  }, [weights, probePoint, probeZ]);

  // Render Sigmoid Activation Curve
  useEffect(() => {
    const canvas = sigmoidCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 320);
    const height = (canvas.height = 180);

    ctx.clearRect(0, 0, width, height);

    // Padding inside sigmoid plot
    const padX = 35;
    const padY = 25;
    const plotW = width - padX * 2;
    const plotH = height - padY * 2;

    const zMin = -6;
    const zMax = 6;

    const toSigX = (z: number) => padX + ((z - zMin) / (zMax - zMin)) * plotW;
    const toSigY = (val: number) => height - padY - val * plotH;

    // Grid lines for 0.0, 0.5, 1.0
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    [0, 0.5, 1].forEach((level) => {
      const y = toSigY(level);
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(width - padX, y);
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(level.toFixed(1), padX - 6, y + 3);
    });

    // Vertical line at z=0 (Decision threshold)
    const zeroX = toSigX(0);
    ctx.strokeStyle = '#CBD5E1';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(zeroX, padY);
    ctx.lineTo(zeroX, height - padY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#64748B';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('z=0 (50%)', zeroX, height - 8);

    // Draw Sigmoid S-Curve: sigma(z) = 1 / (1 + exp(-z))
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const z = zMin + (i / 100) * (zMax - zMin);
      const sig = 1 / (1 + Math.exp(-z));
      const sx = toSigX(z);
      const sy = toSigY(sig);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw Active Probe Point on Sigmoid Curve
    const clampedZ = Math.max(zMin, Math.min(zMax, probeZ));
    const dotX = toSigX(clampedZ);
    const dotY = toSigY(probeSigmoid);

    // Drop line from dot
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.5)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(dotX, height - padY);
    ctx.lineTo(dotX, dotY);
    ctx.lineTo(padX, dotY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Glowing dot
    ctx.beginPath();
    ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
    ctx.fillStyle = probeSigmoid >= 0.5 ? '#2563EB' : '#E11D48';
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [probeZ, probeSigmoid]);

  // Click on 2D plane to move test probe
  const handleScatterClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvas2DRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const x1 = Math.round(toDomainX(px, canvas.width) * 10) / 10;
    const x2 = Math.round(toDomainY(py, canvas.height) * 10) / 10;

    playClickSound();
    setProbePoint({ x1, x2 });
  };

  // Automated Single-Step Perceptron Learning Rule (Gradient / Weight Update)
  const handlePerceptronStep = () => {
    playClickSound();
    const lr = 0.35; // Learning rate
    // Find the first misclassified point
    const misclassified = INITIAL_POINTS.find((pt) => {
      const z = weights.w1 * pt.x1 + weights.w2 * pt.x2 + weights.bias;
      return (z >= 0 ? 1 : 0) !== pt.trueClass;
    });

    if (misclassified) {
      const pred =
        weights.w1 * misclassified.x1 + weights.w2 * misclassified.x2 + weights.bias >= 0 ? 1 : 0;
      const error = misclassified.trueClass - pred; // +1 or -1

      setWeights((prev) => ({
        w1: Math.round((prev.w1 + lr * error * misclassified.x1) * 100) / 100,
        w2: Math.round((prev.w2 + lr * error * misclassified.x2) * 100) / 100,
        bias: Math.round((prev.bias + lr * error) * 100) / 100,
      }));
    } else {
      // Already 100%
      playMatchCelebrationSound();
    }
  };

  const handleResetWeights = () => {
    playClickSound();
    setWeights({ w1: 1.2, w2: 1.0, bias: -0.5 });
  };

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/80 border border-slate-200/90 shadow-xs backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Module 3 of 4
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Class-10 NCERT Chapter 3: Linear Equations (ax + by + c = 0)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-950 mt-1">
            The Dividing Line: Separating Groups with a Straight Line
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            In Class-10, we learn that a straight line is written as a·x + b·y + c = 0. Slide the weights and bias to tilt and shift the line until all Blue dots are separated from Red dots!
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenInspector('hyperplane-equation');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-2xs transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Line Equation</span>
          </button>
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenInspector('sigmoid-activation');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-semibold border border-sky-200 shadow-2xs transition-all cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>Confidence %</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 2D Scatter Plot & Sliders (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                  <span>2D Separating Hyperplane</span>
                  <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Accuracy: {classificationMetrics.accuracy}%
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Formula: ({weights.w1})x₁ + ({weights.w2})x₂ + ({weights.bias}) = 0
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePerceptronStep}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Run one iteration of Perceptron Learning Rule"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Auto-Fit Line</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetWeights}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                  title="Reset Weights"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Canvas 2D Scatter Stage */}
            <div className="relative aspect-square w-full max-w-[380px] mx-auto rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs cursor-pointer">
              <canvas ref={canvas2DRef} onClick={handleScatterClick} className="w-full h-full block" />
            </div>
            <p className="text-[11px] text-center text-slate-400">
              Tip: Click anywhere on the graph to place the test point 'P'.
            </p>

            {/* Slider Controls for w1, w2, and b */}
            <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              {/* Slider w1 */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Weight 1 (w₁ - tilt with horizontal axis):</span>
                  <span className="font-mono text-blue-700 font-bold">{weights.w1.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.1"
                  value={weights.w1}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWeights((prev) => ({ ...prev, w1: val }));
                    playSliderTickSound(val * 10);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Slider w2 */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Weight 2 (w₂ - tilt with vertical axis):</span>
                  <span className="font-mono text-blue-700 font-bold">{weights.w2.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.1"
                  value={weights.w2}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWeights((prev) => ({ ...prev, w2: val }));
                    playSliderTickSound(val * 10);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Slider Bias */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Bias (b - shifts line up and down):</span>
                  <span className="font-mono text-blue-700 font-bold">{weights.bias.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.2"
                  value={weights.bias}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWeights((prev) => ({ ...prev, bias: val }));
                    playSliderTickSound(val * 5);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sigmoid Activation & Perceptron Probe (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Sigmoid Activation Function Display */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <span>Confidence Meter (Probability S-Curve)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  P = 1 / (1 + e^(-z)) turns distance from the line into 0% to 100% confidence
                </p>
              </div>

              {/* Probability Output Badge */}
              <div className="text-right">
                <div className="text-2xl font-mono font-extrabold text-blue-700">
                  {(probeSigmoid * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] uppercase font-semibold text-slate-400">
                  P(Class = 1)
                </span>
              </div>
            </div>

            {/* Sigmoid Canvas */}
            <div className="relative w-full rounded-xl bg-slate-50 border border-slate-200 overflow-hidden">
              <canvas ref={sigmoidCanvasRef} className="w-full h-[180px] block" />
            </div>

            {/* Probe Point Mathematical Readout */}
            <div className="p-4 rounded-xl bg-[#EEF4FB]/70 border border-sky-200/80 space-y-3 text-xs">
              <div className="font-bold text-navy-900 uppercase tracking-wider flex items-center justify-between">
                <span>Active Probe Test Point P:</span>
                <span className="font-mono text-slate-600">
                  ({probePoint.x1}, {probePoint.x2})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">Linear Score (z):</span>
                  <span className="text-sm font-bold text-navy-950">
                    z = {probeZ.toFixed(3)}
                  </span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-400 text-[10px] block">Sigmoid σ(z):</span>
                  <span className="text-sm font-bold text-blue-700">
                    {probeSigmoid.toFixed(4)}
                  </span>
                </div>
              </div>

              {/* Exact Step Breakdown */}
              <div className="p-2.5 rounded-lg bg-slate-900 text-sky-200 font-mono text-[11px] space-y-1">
                <div>
                  z = ({weights.w1} × {probePoint.x1}) + ({weights.w2} × {probePoint.x2}) + ({weights.bias}) = {probeZ.toFixed(2)}
                </div>
                <div className="text-emerald-300">
                  σ({probeZ.toFixed(2)}) = 1 / (1 + e^({(-probeZ).toFixed(2)})) = {probeSigmoid.toFixed(4)} → {probeSigmoid >= 0.5 ? 'Predict Class 1 (Cobalt)' : 'Predict Class 0 (Rose)'}
                </div>
              </div>
            </div>
          </div>

          {/* Confusion Matrix & Accuracy Breakdown */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-950 flex items-center justify-between">
              <span>Classifier Scorecard: Correct vs Mistakes</span>
              <span className="text-slate-500 font-mono text-xs">
                {classificationMetrics.correct} / {classificationMetrics.total} Correct ({classificationMetrics.accuracy}%)
              </span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                <div className="text-[10px] uppercase font-sans text-blue-700 font-semibold">Blue Correct</div>
                <div className="text-lg font-bold mt-0.5">{classificationMetrics.truePos}</div>
                <div className="text-[10px] text-blue-600 font-sans">Blue dots on Blue side</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <div className="text-[10px] uppercase font-sans text-rose-600 font-semibold">Mistake: Red as Blue</div>
                <div className="text-lg font-bold mt-0.5 text-rose-600">{classificationMetrics.falsePos}</div>
                <div className="text-[10px] text-slate-500 font-sans">Red dot crossed over to Blue</div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                <div className="text-[10px] uppercase font-sans text-rose-600 font-semibold">Mistake: Blue as Red</div>
                <div className="text-lg font-bold mt-0.5 text-rose-600">{classificationMetrics.falseNeg}</div>
                <div className="text-[10px] text-slate-500 font-sans">Blue dot crossed over to Red</div>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                <div className="text-[10px] uppercase font-sans text-rose-700 font-semibold">Red Correct</div>
                <div className="text-lg font-bold mt-0.5">{classificationMetrics.trueNeg}</div>
                <div className="text-[10px] text-rose-600 font-sans">Red dots on Red side</div>
              </div>
            </div>

            {/* Class-10 Connection */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Class-10 Math Connection:</strong> Slope of the line is m = -w₁/w₂ and y-intercept is c = -b/w₂. Adjusting w₁ tilts the line, and b moves it up or down!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
