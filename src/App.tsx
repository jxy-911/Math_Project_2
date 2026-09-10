import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroCanvas } from './components/HeroCanvas';
import { Module1MatrixRecognizer } from './components/Module1MatrixRecognizer';
import { Module2KNNClustering } from './components/Module2KNNClustering';
import { Module3DecisionBoundary } from './components/Module3DecisionBoundary';
import { MathInspectorModal } from './components/MathInspectorModal';
import { ActiveModuleId } from './types';
import {
  Grid,
  Network,
  Binary,
  BookOpen,
  Sparkles,
  ArrowRight,
  Calculator,
  Compass,
  User,
  School,
  MapPin,
  Phone,
  Hash,
} from 'lucide-react';
import { playClickSound } from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveModuleId>('matrix');
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);

  // Keyboard shortcut (Escape closes modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedFormulaId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenInspector = (formulaId?: string) => {
    playClickSound();
    setSelectedFormulaId(formulaId || 'matrix-dot-product');
  };

  const handleSelectTab = (tab: ActiveModuleId) => {
    playClickSound();
    setActiveTab(tab);
    // Smooth scroll down to module container
    const el = document.getElementById('active-module-stage');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-navy-950 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar
        activeModule={activeTab}
        onSelectModule={handleSelectTab}
        onOpenInspector={handleOpenInspector}
      />

      {/* Hero Visualizer Section */}
      <HeroCanvas
        onSelectModule={handleSelectTab}
        onOpenInspector={handleOpenInspector}
      />

      {/* Interactive Exploration Anchor */}
      <main id="active-module-stage" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Module Selection Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSelectTab('matrix')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'matrix'
                  ? 'bg-blue-600 text-white shadow-xs scale-100'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>1. Pixel Matcher</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('knn')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'knn'
                  ? 'bg-blue-600 text-white shadow-xs scale-100'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>2. Nearest Neighbors</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab('boundary')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'boundary'
                  ? 'bg-blue-600 text-white shadow-xs scale-100'
                  : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100/80'
              }`}
            >
              <Binary className="w-4 h-4" />
              <span>3. The Dividing Line</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenInspector('euclidean-distance')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>10th-Grade Math Formulas</span>
          </button>
        </div>

        {/* Active Module Stage Render */}
        <div className="transition-all duration-300">
          {activeTab === 'matrix' && (
            <Module1MatrixRecognizer onOpenInspector={handleOpenInspector} />
          )}

          {activeTab === 'knn' && (
            <Module2KNNClustering onOpenInspector={handleOpenInspector} />
          )}

          {activeTab === 'boundary' && (
            <Module3DecisionBoundary onOpenInspector={handleOpenInspector} />
          )}
        </div>

        {/* Festival Showcase Highlights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-200/80">
          <div
            onClick={() => handleOpenInspector('matrix-dot-product')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Compass className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-navy-950 flex items-center justify-between">
              <span>10th-Grade Math Foundations</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Discover how Coordinate Geometry (Chapter 7), Linear Equations (Chapter 3), and Probability power Artificial Intelligence.
            </p>
          </div>

          <div
            onClick={() => handleOpenInspector('euclidean-distance')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calculator className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-navy-950 flex items-center justify-between">
              <span>Interactive Step-by-Step Math</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition-colors" />
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Plug in your own numbers to test the distance formula and see the Pythagoras theorem calculate in real time.
            </p>
          </div>

          <div
            onClick={() => handleOpenInspector('hyperplane-equation')}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-bold text-navy-950 flex items-center justify-between">
              <span>Friendly AI Math Helper</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ask any question in simple plain English to get easy, intuitive explanations with everyday real-world examples.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/90 backdrop-blur-md pt-8 pb-10 px-4 text-center text-xs text-slate-600 space-y-5">
        {/* Creator Info Card */}
        <div className="max-w-3xl mx-auto p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/40 to-sky-50/50 border border-slate-200/90 shadow-2xs text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-blue-700">
                  Project Creator & Presenter
                </div>
                <h3 className="text-sm sm:text-base font-bold text-navy-950">
                  Sheikh Tajbid Ahmmed Joy
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                <Hash className="w-3 h-3 text-blue-600" />
                <span>Roll: 10B-04 (2026)</span>
              </span>
              <a
                href="tel:01603428167"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                title="Contact Presenter"
              >
                <Phone className="w-3 h-3 text-blue-600" />
                <span>01603428167</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <School className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-navy-900">School:</span> St. Gregory's High School & College
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold text-navy-900">Location:</span> 82 Municipal Rd, Dhaka 1100
              </div>
            </div>
          </div>
        </div>

        {/* Festival & Copyright details */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-medium text-slate-600">
            <span>National Mathematics Festival</span>
            <span className="hidden sm:inline">•</span>
            <span>Category: Class-10 (Secondary Level)</span>
            <span className="hidden sm:inline">•</span>
            <span>Theme: Mathematics Behind Artificial Intelligence</span>
          </div>
          <p className="text-[11px] text-slate-400">
            © 2026 Sheikh Tajbid Ahmmed Joy • Built with TypeScript, React & KaTeX • All rights reserved.
          </p>
        </div>
      </footer>

      {/* Math Formula Inspector Modal */}
      {selectedFormulaId && (
        <MathInspectorModal
          formulaId={selectedFormulaId}
          onClose={() => setSelectedFormulaId(null)}
        />
      )}
    </div>
  );
}
