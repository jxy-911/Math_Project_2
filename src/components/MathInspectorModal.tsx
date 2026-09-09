import React, { useState } from 'react';
import { CLASS_10_FORMULAS } from '../data/formulas';
import { MathTex } from './MathTex';
import { X, Sparkles, BookOpen, Brain, RefreshCw, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface MathInspectorModalProps {
  formulaId: string | null;
  onClose: () => void;
  contextValues?: Record<string, number | string>;
}

export const MathInspectorModal: React.FC<MathInspectorModalProps> = ({
  formulaId,
  onClose,
  contextValues,
}) => {
  const currentFormula = formulaId ? CLASS_10_FORMULAS[formulaId] || CLASS_10_FORMULAS['matrix-dot-product'] : CLASS_10_FORMULAS['matrix-dot-product'];

  // Interactive sandbox state for live arithmetic calculation
  const [paramA, setParamA] = useState<number>(3);
  const [paramB, setParamB] = useState<number>(4);
  const [paramC, setParamC] = useState<number>(-2);

  // Gemini AI explanation state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [studentQuestion, setStudentQuestion] = useState('');
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  const fetchAiExplanation = async (customQ?: string) => {
    playClickSound();
    setAiLoading(true);
    setAiResult(null);
    try {
      const queryToSend = customQ || studentQuestion || 'How does this Class-10 formula power modern Artificial Intelligence?';
      const res = await fetch('/api/ai-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formulaTitle: currentFormula.title,
          formulaLatex: currentFormula.latex,
          class10Concept: currentFormula.class10Chapter,
          userQuery: queryToSend,
          numericValues: contextValues || { a: paramA, b: paramB, c: paramC },
        }),
      });

      let data;
      if (res.ok) {
        data = await res.json();
      } else {
        // Static hosting fallback (e.g. GitHub Pages without a Node backend)
        data = {
          success: true,
          isOfflineFallback: true,
          explanation: `### Class-10 Math Insight: ${currentFormula.title}

#### 1. Formula & Meaning
$$\\large ${currentFormula.latex}$$

#### 2. Class-10 Curriculum Connection: ${currentFormula.class10Chapter}
In 10th-grade mathematics, we discover how equations and geometric graphs describe the world around us. In modern Artificial Intelligence, algorithms like neural networks, nearest neighbors, and decision boundaries use these exact same arithmetic calculations to classify handwriting, understand speech, and make smart decisions!

#### 3. How AI Uses This Today
- **Input Features**: Every sensor reading or pixel becomes a number ($x_1, x_2, \\dots$).
- **Simple Math Operations**: The computer uses basic addition, multiplication, and square roots to measure how close an unknown pattern is to known training examples.
- **Instant Decision**: Just like drawing a dividing line on graph paper, AI calculates a single number to decide which group the input belongs to!`,
        };
      }
      setAiResult(data.explanation);
      setIsOfflineFallback(Boolean(data.isOfflineFallback));
    } catch {
      // Fallback for static deployment environments (e.g. GitHub Pages)
      setAiResult(`### Class-10 Math Insight: ${currentFormula.title}

#### 1. Formula & Meaning
$$\\large ${currentFormula.latex}$$

#### 2. Class-10 Curriculum Connection: ${currentFormula.class10Chapter}
In 10th-grade mathematics, we discover how equations and coordinate geometry describe patterns. When an AI classifies images or predicts outcomes, it calculates these exact arithmetic relations millions of times per second!

#### 3. How AI Uses This Today
- **Input Features**: Every pixel or data measurement is treated as a coordinate $(x, y)$.
- **Simple Arithmetic**: Distances, products, and inequalities determine the most likely category.`);
      setIsOfflineFallback(true);
    } finally {
      setAiLoading(false);
    }
  };

  // Compute live sandbox demo based on formula
  const getLiveCalculationDemo = () => {
    switch (currentFormula.id) {
      case 'matrix-dot-product': {
        const prod = paramA * paramB + paramC * 5;
        return (
          <div className="space-y-2 text-xs font-mono bg-slate-900 text-sky-200 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400 font-sans text-[11px] font-semibold">Live Dot Product Step-by-Step:</div>
            <div>Vector A: [{paramA}, {paramC}]</div>
            <div>Vector B: [{paramB}, 5]</div>
            <div className="text-emerald-300 font-bold">
              A · B = ({paramA} × {paramB}) + ({paramC} × 5) = {paramA * paramB} + {paramC * 5} = {prod}
            </div>
          </div>
        );
      }
      case 'euclidean-distance': {
        const dx = paramB - paramA;
        const dy = paramC - 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return (
          <div className="space-y-2 text-xs font-mono bg-slate-900 text-sky-200 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400 font-sans text-[11px] font-semibold">Live Euclidean Distance (Class-10 Ch-7):</div>
            <div>Point P: ({paramA}, 2) | Point Q: ({paramB}, {paramC})</div>
            <div>Δx = ({paramB} - {paramA}) = {dx} → (Δx)² = {dx * dx}</div>
            <div>Δy = ({paramC} - 2) = {dy} → (Δy)² = {dy * dy}</div>
            <div className="text-emerald-300 font-bold">
              d = √({dx * dx} + {dy * dy}) = √{dx * dx + dy * dy} ≈ {dist.toFixed(3)}
            </div>
          </div>
        );
      }
      case 'hyperplane-equation': {
        const z = paramA * 2 + paramB * 3 + paramC;
        return (
          <div className="space-y-2 text-xs font-mono bg-slate-900 text-sky-200 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400 font-sans text-[11px] font-semibold">Live Linear Evaluation (Class-10 Ch-3):</div>
            <div>Weights: w₁ = {paramA}, w₂ = {paramB} | Bias: b = {paramC}</div>
            <div>Test Point: (x₁ = 2, x₂ = 3)</div>
            <div className="text-emerald-300 font-bold">
              z = ({paramA} × 2) + ({paramB} × 3) + ({paramC}) = {z}
            </div>
            <div className="text-slate-300">
              Classification Decision: {z >= 0 ? 'Positive Half-Plane (Class 1)' : 'Negative Half-Plane (Class 0)'}
            </div>
          </div>
        );
      }
      case 'sigmoid-activation': {
        const z = paramC;
        const sig = 1 / (1 + Math.exp(-z));
        return (
          <div className="space-y-2 text-xs font-mono bg-slate-900 text-sky-200 p-3 rounded-lg border border-slate-700">
            <div className="text-slate-400 font-sans text-[11px] font-semibold">Live Sigmoid Probability Output:</div>
            <div>Input Linear Score z = {z}</div>
            <div>e^(-z) = e^({-z}) ≈ {Math.exp(-z).toFixed(4)}</div>
            <div className="text-emerald-300 font-bold">
              σ(z) = 1 / (1 + {Math.exp(-z).toFixed(4)}) ≈ {sig.toFixed(4)} ({(sig * 100).toFixed(1)}% Confidence)
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-950/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-gradient-to-r from-sky-50/70 to-blue-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              𝚯
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-950 flex items-center gap-2">
                <span>Class-10 Math Inspector</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Curriculum Deep Dive
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-mono">{currentFormula.class10Chapter}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-navy-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-navy-900 text-sm">
          {/* Main Formula Card */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 text-center space-y-2">
            <div className="text-xs uppercase font-bold tracking-wider text-blue-700">
              {currentFormula.title}
            </div>
            <div className="py-2 overflow-x-auto text-lg text-navy-950">
              <MathTex formula={currentFormula.latex} block />
            </div>
            <p className="text-xs text-slate-600 max-w-xl mx-auto">
              {currentFormula.description}
            </p>
          </div>

          {/* Intuitive Class-10 Explanation */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Class-10 Intuitive Breakdown
            </h3>
            <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              {currentFormula.intuitiveExplanation}
            </p>
          </div>

          {/* Variables Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Variables & Symbols Breakdown
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100/80 text-navy-900 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Symbol</th>
                    <th className="p-2.5">Meaning in Secondary Math</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 bg-white">
                  {currentFormula.variables.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      <td className="p-2.5 font-mono text-blue-700 font-bold whitespace-nowrap">
                        <MathTex formula={v.symbol} />
                      </td>
                      <td className="p-2.5 text-slate-700">{v.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Calculation Sandbox */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Interactive Step-by-Step Calculation</span>
              <span className="text-[11px] font-normal text-slate-400">Modify inputs below:</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <label className="flex flex-col text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span>Value A ({paramA})</span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={paramA}
                  onChange={(e) => setParamA(Number(e.target.value))}
                  className="mt-1 accent-blue-600 cursor-pointer"
                />
              </label>
              <label className="flex flex-col text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span>Value B ({paramB})</span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={paramB}
                  onChange={(e) => setParamB(Number(e.target.value))}
                  className="mt-1 accent-blue-600 cursor-pointer"
                />
              </label>
              <label className="flex flex-col text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <span>Value C / Bias ({paramC})</span>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  value={paramC}
                  onChange={(e) => setParamC(Number(e.target.value))}
                  className="mt-1 accent-blue-600 cursor-pointer"
                />
              </label>
            </div>
            {getLiveCalculationDemo()}
          </div>

          {/* AI Connection Card */}
          <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/60 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                Where is this used in Artificial Intelligence?
              </div>
              <p className="mt-1 text-xs text-sky-800 leading-relaxed">
                {currentFormula.aiApplication}
              </p>
            </div>
          </div>

          {/* AI Deep Thinking Mentor Section */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-purple-600" />
                Gemini 3.1 Pro Math Mentor (High Thinking Mode)
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                ThinkingLevel: HIGH
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Ask any question to receive a high-level mathematical breakdown directly connecting this Class-10 formula to artificial intelligence architectures.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={studentQuestion}
                onChange={(e) => setStudentQuestion(e.target.value)}
                placeholder="e.g. Why does normalizing the dot product prevent large patterns from cheating?"
                className="flex-1 px-3 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                onKeyDown={(e) => e.key === 'Enter' && fetchAiExplanation()}
              />
              <button
                type="button"
                onClick={() => fetchAiExplanation()}
                disabled={aiLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {aiLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask AI</span>
                  </>
                )}
              </button>
            </div>

            {/* AI Explanation Box */}
            {aiResult && (
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 text-xs text-navy-900 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-purple-200/60 pb-2">
                  <div className="flex items-center gap-1 text-purple-800 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Gemini 3.1 Pro Pedagogical Analysis</span>
                  </div>
                  {isOfflineFallback && (
                    <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded font-mono">
                      Curriculum Reference Mode
                    </span>
                  )}
                </div>
                <div className="whitespace-pre-line leading-relaxed text-slate-700">
                  {aiResult}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>National Math Festival (Class-10 Category)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-navy-900 font-semibold cursor-pointer"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
