import React, { useEffect, useRef, useState } from 'react';
import { MathTex } from './MathTex';
import { ArrowRight, Sparkles, BookOpen, Layers } from 'lucide-react';
import { playClickSound } from '../utils/audio';

interface HeroCanvasProps {
  onSelectModule: (moduleId: 'matrix' | 'knn' | 'boundary' | 'decisiontree') => void;
  onOpenInspector: (formulaId: string) => void;
}

export const HeroCanvas: React.FC<HeroCanvasProps> = ({
  onSelectModule,
  onOpenInspector,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeFormulaIdx, setActiveFormulaIdx] = useState(0);

  const formulas = [
    { id: 'matrix-dot-product', label: '1. Pixel Overlap', tex: 'A \\cdot B = \\text{Matches}' },
    { id: 'euclidean-distance', label: '2. Distance Formula', tex: 'd = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}' },
    { id: 'hyperplane-equation', label: '3. Dividing Line', tex: 'ax + by + c = 0' },
    { id: 'sigmoid-activation', label: '4. Confidence %', tex: '0\\% \\le P \\le 100\\%' },
    { id: 'decision-tree-split', label: '5. Yes/No Rules', tex: 'x \\ge \\text{Threshold}' },
  ];

  // Rotate formulas smoothly
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFormulaIdx((prev) => (prev + 1) % formulas.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [formulas.length]);

  // Canvas background simulation of glowing nodes & connecting distance vectors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    const mouse = { x: -1000, y: -1000, radius: 140 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Particle nodes representing multi-dimensional data coordinates
    const nodeCount = Math.min(Math.floor((width * height) / 9500), 55);
    const nodes = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.75,
      vy: (Math.random() - 0.5) * 0.75,
      radius: Math.random() * 2.5 + 2,
      baseAlpha: Math.random() * 0.4 + 0.4,
      hue: Math.random() > 0.4 ? 217 : 199, // Cobalt (217) or Cyan (199)
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw vector connection lines based on Euclidean Distance
      const maxDistance = 110;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.35;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(37, 99, 235, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Mouse proximity interaction
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const mdx = mouse.x - node.x;
        const mdy = mouse.y - node.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (mdist < mouse.radius) {
          const force = (1 - mdist / mouse.radius) * 1.5;
          node.x -= (mdx / (mdist || 1)) * force;
          node.y -= (mdy / (mdist || 1)) * force;

          // Connecting line to mouse cursor
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - mdist / mouse.radius) * 0.55})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Update node position
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Draw glowing mathematical node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${node.hue}, 90%, 55%, ${node.baseAlpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${node.hue}, 90%, 50%, 0.6)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <section className="relative overflow-hidden pt-12 pb-14 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-gradient-to-b from-[#EEF4FB]/70 via-[#F8FAFC] to-[#F8FAFC]">
      {/* Floating Canvas in background */}
      <div className="absolute inset-0 pointer-events-auto">
        <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair opacity-85" />
      </div>

      {/* Radial soft glow backdrop */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-300/20 via-sky-300/15 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto text-center pointer-events-none">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-200 bg-white/90 text-navy-800 text-xs sm:text-sm font-semibold shadow-xs mb-6 backdrop-blur-md pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>National Mathematics Festival • Category: Class-10</span>
          <span className="text-slate-300">|</span>
          <span className="text-sky-700 font-mono font-medium">Interactive AI Foundations</span>
        </div>

        {/* Main Title with Blue Milk Aesthetic */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy-950 max-w-4xl mx-auto leading-[1.15]">
          Mathematics Behind <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-blue-700 via-sky-600 to-cyan-500 bg-clip-text text-transparent drop-shadow-xs">
            Artificial Intelligence
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Uncovering how standard Class-10 Coordinate Geometry, Linear Equations,
          and Probability power computer vision, nearest-neighbor clustering, and neural decision boundaries.
        </p>

        {/* Interactive Formula Ticker */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 pointer-events-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Core Equation Ticker:
          </span>
          {formulas.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                playClickSound();
                onOpenInspector(item.id);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-all border ${
                idx === activeFormulaIdx
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-105'
                  : 'bg-white/80 text-navy-800 border-slate-200/80 hover:border-sky-300 hover:bg-sky-50'
              }`}
            >
              <span className="opacity-75 mr-1 font-sans">{item.label}:</span>
              <MathTex formula={item.tex} />
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              playClickSound();
              onSelectModule('matrix');
            }}
            className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-sky-200" />
            <span>Launch Matrix Simulator</span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound();
              onOpenInspector('matrix-dot-product');
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/90 hover:bg-white text-navy-900 border border-slate-200/90 font-semibold text-sm shadow-xs hover:border-sky-300 hover:shadow-sm transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-sky-600" />
            <span>10th-Grade Math Concepts</span>
          </button>
        </div>
      </div>
    </section>
  );
};
