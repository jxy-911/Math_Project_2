import React, { useState } from 'react';
import { ActiveModuleId } from '../types';
import {
  Grid3X3,
  Network,
  Binary,
  Volume2,
  VolumeX,
  GraduationCap,
  Sparkles,
  Calculator,
} from 'lucide-react';
import { playClickSound, setSoundMuted, getSoundMuted } from '../utils/audio';

interface NavbarProps {
  activeModule: ActiveModuleId;
  onSelectModule: (mod: ActiveModuleId) => void;
  onOpenInspector: (formulaId?: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  onOpenInspector,
}) => {
  const [muted, setMutedState] = useState(() => getSoundMuted());

  const toggleSound = () => {
    const next = !muted;
    setMutedState(next);
    setSoundMuted(next);
    if (!next) {
      playClickSound();
    }
  };

  const navItems: { id: ActiveModuleId; label: string; icon: React.FC<{ className?: string }>; badge: string }[] = [
    {
      id: 'matrix',
      label: '1. Pixel Matcher',
      icon: Grid3X3,
      badge: 'Grid Matching',
    },
    {
      id: 'knn',
      label: '2. Nearest Neighbors',
      icon: Network,
      badge: 'Distance Formula',
    },
    {
      id: 'boundary',
      label: '3. The Dividing Line',
      icon: Binary,
      badge: 'Straight Line',
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <span className="font-mono font-bold text-lg">𝚯</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-bold text-navy-950 tracking-tight">
                  Math Behind AI
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                  Class-10
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                National Math Festival • Pattern Recognition & Decision Making
              </p>
            </div>
          </div>

          {/* Module Switcher Tabs for Desktop */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#F1F5F9]/80 p-1 rounded-xl border border-slate-200/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    playClickSound();
                    onSelectModule(item.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200/90'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Utility Tools: Math Inspector, Sound, Guide */}
          <div className="flex items-center gap-2">
            {/* Quick Math Guide */}
            <button
              type="button"
              onClick={() => {
                playClickSound();
                onOpenInspector();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50/70 hover:bg-sky-100/80 text-sky-800 text-xs font-semibold transition-all cursor-pointer"
              title="Open 10th-Grade Math Concepts"
            >
              <Calculator className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">10th-Grade Math</span>
            </button>

            {/* Sound Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                muted
                  ? 'border-slate-200 text-slate-400 bg-white hover:text-slate-700'
                  : 'border-blue-200 text-blue-600 bg-blue-50/60 hover:bg-blue-100/60'
              }`}
              title={muted ? 'Unmute tactile sound feedback' : 'Mute tactile sound feedback'}
              aria-label="Toggle Sound Effects"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Sub-Nav */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto py-2 gap-1 border-t border-slate-100 text-xs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  playClickSound();
                  onSelectModule(item.id);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md whitespace-nowrap text-xs font-medium cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 bg-slate-100/70 hover:bg-slate-200/70'
                }`}
              >
                <Icon className="w-3 h-3 shrink-0" />
                <span>{item.label.split('. ')[1]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
