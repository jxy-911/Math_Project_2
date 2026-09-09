import React, { useState, useMemo, useCallback } from 'react';
import { MatrixPreset, MatrixSimilarityResult } from '../types';
import { MathTex } from './MathTex';
import {
  Eraser,
  RotateCcw,
  Sparkles,
  Trophy,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Info,
  Maximize2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  playMatrixCellSound,
  playMatchCelebrationSound,
  playClickSound,
} from '../utils/audio';

// Reference standard 6x6 template patterns
const PRESET_TEMPLATES: MatrixPreset[] = [
  {
    id: 'digit-7',
    name: "Digit '7'",
    description: 'Horizontal top bar with diagonal stem down to bottom-left',
    category: 'digit',
    grid: [
      [1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 1, 1],
      [0, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 1, 1, 0, 0, 0],
      [0, 1, 1, 0, 0, 0],
    ],
  },
  {
    id: 'digit-1',
    name: "Digit '1'",
    description: 'Vertical centered stroke with slight top serif',
    category: 'digit',
    grid: [
      [0, 0, 1, 1, 0, 0],
      [0, 1, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 0],
    ],
  },
  {
    id: 'symbol-plus',
    name: "Cross '+'",
    description: 'Horizontal and vertical bisecting lines',
    category: 'symbol',
    grid: [
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
    ],
  },
  {
    id: 'letter-t',
    name: "Letter 'T'",
    description: 'Wide horizontal top roof with central vertical pillar',
    category: 'symbol',
    grid: [
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 0, 0],
    ],
  },
  {
    id: 'diagonal-slash',
    name: "Diagonal '/'",
    description: '45-degree diagonal line from bottom-left to top-right',
    category: 'geometric',
    grid: [
      [0, 0, 0, 0, 1, 1],
      [0, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 0, 0],
      [0, 1, 1, 0, 0, 0],
      [1, 1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0, 0],
    ],
  },
  {
    id: 'square-box',
    name: 'Square Box',
    description: 'Hollow outer square border',
    category: 'geometric',
    grid: [
      [1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1],
    ],
  },
];

interface Module1Props {
  onOpenInspector: (formulaId: string) => void;
}

export const Module1MatrixRecognizer: React.FC<Module1Props> = ({ onOpenInspector }) => {
  const [gridSize] = useState(6);
  // User drawn grid: 6x6 matrix of 0 or 1
  const [userGrid, setUserGrid] = useState<number[][]>(() =>
    Array(6).fill(0).map(() => Array(6).fill(0))
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('digit-7');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [drawMode, setDrawMode] = useState<1 | 0>(1); // 1 = draw, 0 = erase
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const activeTemplate = useMemo(
    () => PRESET_TEMPLATES.find((t) => t.id === selectedTemplateId) || PRESET_TEMPLATES[0],
    [selectedTemplateId]
  );

  // Compute live matrix dot product and cosine similarity
  const similarityResult: MatrixSimilarityResult = useMemo(() => {
    let dotProduct = 0;
    let sumSqA = 0;
    let sumSqB = 0;
    let matchingElements = 0;
    const totalElements = gridSize * gridSize;
    const stepWiseProducts: number[][] = [];

    for (let r = 0; r < gridSize; r++) {
      const rowProducts: number[] = [];
      for (let c = 0; c < gridSize; c++) {
        const a = userGrid[r][c] || 0;
        const b = activeTemplate.grid[r][c] || 0;
        const prod = a * b;
        dotProduct += prod;
        sumSqA += a * a;
        sumSqB += b * b;
        if (a === b) matchingElements++;
        rowProducts.push(prod);
      }
      stepWiseProducts.push(rowProducts);
    }

    const normA = Math.sqrt(sumSqA);
    const normB = Math.sqrt(sumSqB);
    const denominator = normA * normB;
    const cosineSimilarity = denominator > 0 ? dotProduct / denominator : 0;
    const percentage = Math.min(Math.round(cosineSimilarity * 100), 100);

    return {
      dotProduct,
      normA,
      normB,
      cosineSimilarity,
      percentage,
      matchingElements,
      totalElements,
      stepWiseProducts,
    };
  }, [userGrid, activeTemplate, gridSize]);

  // Check celebration trigger
  const handleCellToggle = useCallback(
    (r: number, c: number, overrideVal?: 1 | 0) => {
      setUserGrid((prev) => {
        const next = prev.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            if (rowIdx === r && colIdx === c) {
              const newVal = overrideVal !== undefined ? overrideVal : cell === 1 ? 0 : 1;
              playMatrixCellSound(newVal === 1, r * 6 + c);
              return newVal;
            }
            return cell;
          })
        );
        return next;
      });
    },
    []
  );

  // Trigger celebration confetti when similarity crosses threshold
  const checkHighSimilarityCelebration = useCallback((pct: number) => {
    if (pct >= 85 && !hasCelebrated) {
      setHasCelebrated(true);
      playMatchCelebrationSound();
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#2563EB', '#38BDF8', '#10B981'],
        });
      } catch {}
    } else if (pct < 70 && hasCelebrated) {
      setHasCelebrated(false);
    }
  }, [hasCelebrated]);

  // Clear Grid
  const clearGrid = () => {
    playClickSound();
    setUserGrid(Array(6).fill(0).map(() => Array(6).fill(0)));
    setHasCelebrated(false);
  };

  // Copy template directly to user grid for quick testing
  const copyTemplateToCanvas = () => {
    playClickSound();
    setUserGrid(activeTemplate.grid.map((row) => [...row]));
    checkHighSimilarityCelebration(100);
  };

  // Invert user grid
  const invertGrid = () => {
    playClickSound();
    setUserGrid((prev) => prev.map((row) => row.map((cell) => (cell === 1 ? 0 : 1))));
  };

  // Load a preset template
  const handleSelectTemplate = (id: string) => {
    playClickSound();
    setSelectedTemplateId(id);
    setHasCelebrated(false);
  };

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/80 border border-slate-200/90 shadow-xs backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Module 1 of 4
            </span>
            <span className="text-xs text-slate-500 font-medium">Class-10 Number Grids & Pixel Matching</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-950 mt-1">
            Pixel Pattern Matcher: How Computers Read Drawings
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Computers turn images into a grid of numbers: 1 for ink and 0 for blank paper. Compare your sketch against templates by counting overlapping pixels!
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playClickSound();
            onOpenInspector('matrix-dot-product');
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-2xs transition-all shrink-0 cursor-pointer self-start sm:self-center"
        >
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>10th-Grade Math: Overlapping Pixels</span>
        </button>
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Drawing Canvas (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-navy-950">1. Interactive Pixel Canvas</h3>
                <p className="text-xs text-slate-500">Draw with cursor (Click or Drag)</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearGrid}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium cursor-pointer"
                  title="Clear Canvas"
                >
                  <Eraser className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={invertGrid}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs font-medium cursor-pointer"
                  title="Invert 0/1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={copyTemplateToCanvas}
                  className="px-2 py-1 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold cursor-pointer"
                  title="Load Target Template to Canvas"
                >
                  Auto-Fill Target
                </button>
              </div>
            </div>

            {/* 6x6 Grid Canvas */}
            <div
              className="relative aspect-square max-w-[320px] mx-auto p-3 rounded-2xl bg-[#EEF4FB] border-2 border-slate-200 shadow-inner select-none cursor-pointer"
              onMouseDown={() => setIsMouseDown(true)}
              onMouseUp={() => setIsMouseDown(false)}
              onMouseLeave={() => setIsMouseDown(false)}
            >
              <div className="grid grid-cols-6 grid-rows-6 gap-1.5 w-full h-full">
                {userGrid.map((row, r) =>
                  row.map((val, c) => {
                    const isTargetActive = activeTemplate.grid[r][c] === 1;
                    const isBothActive = val === 1 && isTargetActive;
                    return (
                      <button
                        key={`${r}-${c}`}
                        type="button"
                        aria-label={`Pixel row ${r + 1} column ${c + 1}`}
                        onMouseDown={() => {
                          const nextVal = val === 1 ? 0 : 1;
                          setDrawMode(nextVal);
                          handleCellToggle(r, c, nextVal);
                        }}
                        onMouseEnter={() => {
                          if (isMouseDown) {
                            handleCellToggle(r, c, drawMode);
                          }
                        }}
                        className={`relative rounded-lg transition-all duration-150 flex items-center justify-center font-mono text-[10px] font-bold ${
                          val === 1
                            ? isBothActive
                              ? 'bg-blue-600 text-white shadow-xs scale-95 ring-2 ring-emerald-400'
                              : 'bg-navy-900 text-white shadow-xs scale-95'
                            : isTargetActive
                            ? 'bg-white/80 border border-dashed border-sky-300 text-sky-400 hover:bg-sky-50'
                            : 'bg-white/90 border border-slate-200/70 text-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        <span>{val}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Matrix Flattening Indicator */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-600 font-semibold">
                <span>Vector Representation A (36 elements):</span>
                <span className="font-mono text-blue-600">{userGrid.flat().filter((x) => x === 1).length} active pixels</span>
              </div>
              <div className="font-mono text-[10px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200 overflow-x-auto whitespace-nowrap">
                A = [{userGrid.flat().join(', ')}]ᵀ
              </div>
            </div>
          </div>

          {/* Reference Template Selector */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                Select Reference Template (B)
              </h3>
              <span className="text-[11px] text-slate-500">6 Presets Available</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {PRESET_TEMPLATES.map((tpl) => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-navy-950">{tpl.name}</span>
                      {isSelected && <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </div>
                    {/* Mini thumbnail */}
                    <div className="grid grid-cols-6 gap-0.5 w-12 h-12 bg-slate-100 p-0.5 rounded border border-slate-200">
                      {tpl.grid.map((row, tr) =>
                        row.map((cell, tc) => (
                          <div
                            key={`${tr}-${tc}`}
                            className={`rounded-[1px] ${
                              cell === 1 ? 'bg-blue-600' : 'bg-transparent'
                            }`}
                          />
                        ))
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Mathematical Dot Product & Similarity Engine (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Score & Cosine Similarity Dashboard */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <span>2. Vector Dot Product Similarity Engine</span>
                  {similarityResult.percentage >= 85 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-emerald-600" /> Pattern Matched!
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500">
                  Target: <strong className="text-navy-900">{activeTemplate.name}</strong> • Cosine Similarity Formula: cos(θ) = (A · B) / (||A|| × ||B||)
                </p>
              </div>

              {/* Match Percentage Pill */}
              <div className="flex items-baseline gap-1 self-start sm:self-center">
                <span className="text-3xl font-extrabold text-navy-950 font-mono tracking-tight">
                  {similarityResult.percentage}%
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase">Match</span>
              </div>
            </div>

            {/* Similarity Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Normalized Cosine Similarity:</span>
                <span className="font-mono text-blue-700 font-bold">
                  {similarityResult.cosineSimilarity.toFixed(4)} / 1.0000
                </span>
              </div>
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    similarityResult.percentage >= 85
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : similarityResult.percentage >= 60
                      ? 'bg-gradient-to-r from-blue-600 to-sky-400'
                      : 'bg-gradient-to-r from-amber-500 to-orange-400'
                  }`}
                  style={{ width: `${Math.max(similarityResult.percentage, 3)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0% (Orthogonal)</span>
                <span>50% (Partial overlap)</span>
                <span>100% (Exact match)</span>
              </div>
            </div>

            {/* Step-by-Step Dot Product Formula Breakdown */}
            <div className="p-4 rounded-xl bg-[#EEF4FB]/70 border border-sky-200/80 space-y-3">
              <div className="text-xs font-bold text-navy-900 uppercase tracking-wider flex items-center justify-between">
                <span>Step-by-Step Class-10 Arithmetic Derivation:</span>
                <button
                  type="button"
                  onClick={() => onOpenInspector('cosine-similarity')}
                  className="text-[11px] text-sky-700 hover:text-sky-900 underline font-semibold cursor-pointer"
                >
                  Inspect Theory
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {/* Dot product box */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="text-slate-500 text-[11px]">1. Scalar Dot Product</div>
                  <div className="font-mono font-bold text-navy-950 text-sm mt-0.5">
                    A · B = {similarityResult.dotProduct}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Σ (A_i × B_i) overlapping pixels</div>
                </div>

                {/* Norm A */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="text-slate-500 text-[11px]">2. Input Magnitude ||A||</div>
                  <div className="font-mono font-bold text-navy-950 text-sm mt-0.5">
                    ||A|| = {similarityResult.normA.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">√({Math.round(similarityResult.normA ** 2)} active ink)</div>
                </div>

                {/* Norm B */}
                <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                  <div className="text-slate-500 text-[11px]">3. Template Magnitude ||B||</div>
                  <div className="font-mono font-bold text-navy-950 text-sm mt-0.5">
                    ||B|| = {similarityResult.normB.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">√({Math.round(similarityResult.normB ** 2)} target ink)</div>
                </div>
              </div>

              {/* Formula substitution box */}
              <div className="p-3 rounded-lg bg-slate-900 text-sky-200 font-mono text-xs overflow-x-auto space-y-1">
                <div className="text-slate-400 font-sans text-[11px]">Class-10 Math Calculation:</div>
                <div className="text-white">
                  Match = {similarityResult.dotProduct} matching squares ÷ ({similarityResult.normA.toFixed(1)} × {similarityResult.normB.toFixed(1)} size factor)
                  {similarityResult.normA * similarityResult.normB > 0
                    ? ` ≈ ${(similarityResult.cosineSimilarity * 100).toFixed(1)}% Match`
                    : ' = 0% (Canvas Empty)'}
                </div>
              </div>
            </div>

            {/* Live Elementwise Product Visualizer ($A_{ij} \times B_{ij}$) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Elementwise Multiplication Grid (A_ij × B_ij)
                </h4>
                <span className="text-[11px] text-slate-500 font-mono">
                  Green = Product 1 (Match) • Gray = 0
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="grid grid-cols-6 gap-1 w-full max-w-[240px] mx-auto">
                  {similarityResult.stepWiseProducts.map((row, r) =>
                    row.map((prod, c) => (
                      <div
                        key={`prod-${r}-${c}`}
                        className={`aspect-square rounded flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                          prod === 1
                            ? 'bg-emerald-500 text-white shadow-xs ring-1 ring-emerald-600 scale-105'
                            : userGrid[r][c] === 1 && activeTemplate.grid[r][c] === 0
                            ? 'bg-rose-100 text-rose-600 border border-rose-200'
                            : 'bg-white text-slate-300 border border-slate-200'
                        }`}
                        title={`Row ${r}, Col ${c}: ${userGrid[r][c]} × ${activeTemplate.grid[r][c]} = ${prod}`}
                      >
                        {prod}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Festival Challenge Banner */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <strong>Festival Challenge:</strong> Can you draw a variation of the Digit '7' that scores above <strong>85%</strong> without coloring every single cell? Notice how cosine normalization prevents cheating by penalizing extra ink!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
