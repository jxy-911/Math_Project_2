import React, { useState, useMemo } from 'react';
import { MathTex } from './MathTex';
import {
  GitBranch,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingDown,
  Layers,
} from 'lucide-react';
import { playClickSound, playSliderTickSound } from '../utils/audio';

interface SampleItem {
  id: string;
  name: string;
  studyHours: number; // 0 to 10
  attendance: number; // 0 to 100
  actualOutcome: 'Pass' | 'Fail';
}

const STUDENT_DATASET: SampleItem[] = [
  { id: 's1', name: 'Student 1', studyHours: 8.5, attendance: 90, actualOutcome: 'Pass' },
  { id: 's2', name: 'Student 2', studyHours: 7.0, attendance: 85, actualOutcome: 'Pass' },
  { id: 's3', name: 'Student 3', studyHours: 6.2, attendance: 75, actualOutcome: 'Pass' },
  { id: 's4', name: 'Student 4', studyHours: 5.5, attendance: 80, actualOutcome: 'Pass' },
  { id: 's5', name: 'Student 5', studyHours: 7.8, attendance: 65, actualOutcome: 'Pass' },
  { id: 's6', name: 'Student 6', studyHours: 4.8, attendance: 95, actualOutcome: 'Pass' },

  { id: 's7', name: 'Student 7', studyHours: 2.5, attendance: 40, actualOutcome: 'Fail' },
  { id: 's8', name: 'Student 8', studyHours: 3.2, attendance: 50, actualOutcome: 'Fail' },
  { id: 's9', name: 'Student 9', studyHours: 1.8, attendance: 60, actualOutcome: 'Fail' },
  { id: 's10', name: 'Student 10', studyHours: 4.0, attendance: 45, actualOutcome: 'Fail' },
  { id: 's11', name: 'Student 11', studyHours: 2.0, attendance: 30, actualOutcome: 'Fail' },
  { id: 's12', name: 'Student 12', studyHours: 3.5, attendance: 55, actualOutcome: 'Fail' },
];

interface Module4Props {
  onOpenInspector: (formulaId: string) => void;
}

export const Module4DecisionTree: React.FC<Module4Props> = ({ onOpenInspector }) => {
  // Decision split thresholds
  const [rootThreshold, setRootThreshold] = useState<number>(5.0); // Study hours threshold
  const [leftThreshold, setLeftThreshold] = useState<number>(50); // Attendance threshold for low study hours
  const [rightThreshold, setRightThreshold] = useState<number>(70); // Attendance threshold for high study hours

  // Test Student probe
  const [testStudyHours, setTestStudyHours] = useState<number>(6.0);
  const [testAttendance, setTestAttendance] = useState<number>(80);

  // Compute Gini impurity helper: Gini = 1 - (p_pass^2 + p_fail^2)
  const computeGini = (samples: SampleItem[]) => {
    if (samples.length === 0) return 0;
    const passCount = samples.filter((s) => s.actualOutcome === 'Pass').length;
    const failCount = samples.filter((s) => s.actualOutcome === 'Fail').length;
    const pPass = passCount / samples.length;
    const pFail = failCount / samples.length;
    return 1 - (pPass * pPass + pFail * pFail);
  };

  // Node partitions computation
  const treeNodes = useMemo(() => {
    // Root Node (all 12 students)
    const rootGini = computeGini(STUDENT_DATASET);

    // Root Split: Study Hours >= rootThreshold
    const rightBranch = STUDENT_DATASET.filter((s) => s.studyHours >= rootThreshold);
    const leftBranch = STUDENT_DATASET.filter((s) => s.studyHours < rootThreshold);

    const rightGini = computeGini(rightBranch);
    const leftGini = computeGini(leftBranch);

    // Left Sub-branches (Study Hours < rootThreshold): Attendance >= leftThreshold
    const leftLeftLeaf = leftBranch.filter((s) => s.attendance < leftThreshold); // Fail leaf
    const leftRightLeaf = leftBranch.filter((s) => s.attendance >= leftThreshold);

    // Right Sub-branches (Study Hours >= rootThreshold): Attendance >= rightThreshold
    const rightLeftLeaf = rightBranch.filter((s) => s.attendance < rightThreshold);
    const rightRightLeaf = rightBranch.filter((s) => s.attendance >= rightThreshold); // Pass leaf

    return {
      root: { samples: STUDENT_DATASET, gini: rootGini },
      left: { samples: leftBranch, gini: leftGini },
      right: { samples: rightBranch, gini: rightGini },
      leftLeftLeaf: { samples: leftLeftLeaf, gini: computeGini(leftLeftLeaf) },
      leftRightLeaf: { samples: leftRightLeaf, gini: computeGini(leftRightLeaf) },
      rightLeftLeaf: { samples: rightLeftLeaf, gini: computeGini(rightLeftLeaf) },
      rightRightLeaf: { samples: rightRightLeaf, gini: computeGini(rightRightLeaf) },
    };
  }, [rootThreshold, leftThreshold, rightThreshold]);

  // Evaluate test student through the conditional tree
  const testStudentPath = useMemo(() => {
    const isRootHigh = testStudyHours >= rootThreshold;
    let finalLeaf = '';
    let predictedOutcome: 'Pass' | 'Fail' = 'Pass';

    if (isRootHigh) {
      if (testAttendance >= rightThreshold) {
        finalLeaf = 'Right-Right (High Study & High Attendance)';
        predictedOutcome = 'Pass';
      } else {
        finalLeaf = 'Right-Left (High Study & Lower Attendance)';
        predictedOutcome = 'Pass';
      }
    } else {
      if (testAttendance >= leftThreshold) {
        finalLeaf = 'Left-Right (Low Study & High Attendance)';
        predictedOutcome = 'Pass';
      } else {
        finalLeaf = 'Left-Left (Low Study & Low Attendance)';
        predictedOutcome = 'Fail';
      }
    }

    return {
      isRootHigh,
      finalLeaf,
      predictedOutcome,
    };
  }, [testStudyHours, testAttendance, rootThreshold, leftThreshold, rightThreshold]);

  const handleReset = () => {
    playClickSound();
    setRootThreshold(5.0);
    setLeftThreshold(50);
    setRightThreshold(70);
  };

  return (
    <div className="space-y-6">
      {/* Module Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white/80 border border-slate-200/90 shadow-xs backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Module 4 of 4
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Class-10 Probability, Inequalities & Decision Rules
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-navy-950 mt-1">
            20-Questions Tree: How Computers Make Decisions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
            Computers make decisions just like a game of 20 Questions using simple Yes/No questions (e.g. Study Hours &ge; 5?). Adjust the sliders to see how each question sorts students into cleaner groups!
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playClickSound();
            onOpenInspector('decision-tree-split');
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 shadow-2xs transition-all shrink-0 cursor-pointer self-start sm:self-center"
        >
          <HelpCircle className="w-4 h-4 text-blue-600" />
          <span>10th-Grade Math: Decision Rules</span>
        </button>
      </div>

      {/* Main Grid: Flowchart Tree + Orthogonal Partition Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Tree Flowchart (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-navy-950 flex items-center gap-2">
                  <span>Decision Flowchart Architecture</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Sliders below modify the threshold boundaries in real time
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                title="Reset Tree Thresholds"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tree Diagram */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs font-mono">
              {/* Level 0: Root Node */}
              <div className="flex justify-center">
                <div className="w-64 p-3 rounded-xl bg-white border-2 border-blue-600 shadow-sm text-center space-y-1">
                  <div className="text-[11px] font-sans font-bold text-blue-700 uppercase">
                    Root Gate: Study Hours
                  </div>
                  <div className="font-bold text-navy-950 text-sm">
                    Is Study Hours &ge; {rootThreshold.toFixed(1)} hrs?
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans flex justify-between px-1">
                    <span>N={treeNodes.root.samples.length} Students</span>
                    <span className="font-mono text-blue-600 font-bold">
                      Gini={treeNodes.root.gini.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connecting Branch Arrows */}
              <div className="flex justify-around text-center text-[11px] font-sans font-semibold text-slate-500">
                <div className="flex flex-col items-center">
                  <span className="text-rose-600 font-bold">No (&lt; {rootThreshold} hrs)</span>
                  <div className="w-0.5 h-4 bg-slate-300" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-blue-600 font-bold">Yes (&ge; {rootThreshold} hrs)</span>
                  <div className="w-0.5 h-4 bg-slate-300" />
                </div>
              </div>

              {/* Level 1: Internal Nodes */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Branch */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-[10px] font-sans font-bold text-slate-600 uppercase">
                    Split 2A: Low Study Group
                  </div>
                  <div className="font-bold text-navy-950 text-xs">
                    Attendance &ge; {leftThreshold}%?
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans flex justify-between">
                    <span>N={treeNodes.left.samples.length}</span>
                    <span className="font-mono text-purple-700">
                      Gini={treeNodes.left.gini.toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* Right Branch */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <div className="text-[10px] font-sans font-bold text-slate-600 uppercase">
                    Split 2B: High Study Group
                  </div>
                  <div className="font-bold text-navy-950 text-xs">
                    Attendance &ge; {rightThreshold}%?
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans flex justify-between">
                    <span>N={treeNodes.right.samples.length}</span>
                    <span className="font-mono text-purple-700">
                      Gini={treeNodes.right.gini.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Connecting Leaves Arrows */}
              <div className="flex justify-between px-6 text-center text-[10px] text-slate-400 font-sans">
                <span>&darr; No</span>
                <span>&darr; Yes</span>
                <span>&darr; No</span>
                <span>&darr; Yes</span>
              </div>

              {/* Level 2: Decision Leaves */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                {/* Leaf 1: Fail */}
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                  <div className="font-sans font-bold text-[11px]">FAIL</div>
                  <div className="text-[10px] text-rose-700 font-sans">
                    N={treeNodes.leftLeftLeaf.samples.length}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">
                    Gini={treeNodes.leftLeftLeaf.gini.toFixed(2)}
                  </div>
                </div>

                {/* Leaf 2: Pass */}
                <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-900">
                  <div className="font-sans font-bold text-[11px]">PASS</div>
                  <div className="text-[10px] text-sky-700 font-sans">
                    N={treeNodes.leftRightLeaf.samples.length}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">
                    Gini={treeNodes.leftRightLeaf.gini.toFixed(2)}
                  </div>
                </div>

                {/* Leaf 3: Pass */}
                <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-900">
                  <div className="font-sans font-bold text-[11px]">PASS</div>
                  <div className="text-[10px] text-sky-700 font-sans">
                    N={treeNodes.rightLeftLeaf.samples.length}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">
                    Gini={treeNodes.rightLeftLeaf.gini.toFixed(2)}
                  </div>
                </div>

                {/* Leaf 4: Pass (Pure) */}
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <div className="font-sans font-bold text-[11px]">PASS</div>
                  <div className="text-[10px] text-emerald-700 font-sans">
                    N={treeNodes.rightRightLeaf.samples.length}
                  </div>
                  <div className="text-[9px] font-mono text-emerald-700 font-bold">
                    Gini={treeNodes.rightRightLeaf.gini.toFixed(2)} (Pure)
                  </div>
                </div>
              </div>
            </div>

            {/* Threshold Sliders */}
            <div className="space-y-3 p-4 rounded-xl bg-[#EEF4FB]/70 border border-sky-200/80 text-xs">
              <div className="font-bold text-navy-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                Interactive Split Threshold Adjusters:
              </div>

              {/* Slider Root */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Root Cut: Study Hours Threshold:</span>
                  <span className="font-mono text-blue-700 font-bold">{rootThreshold.toFixed(1)} hrs</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="8.0"
                  step="0.5"
                  value={rootThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRootThreshold(val);
                    playSliderTickSound(val * 10);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Slider Left */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Left Sub-Cut: Low Study Attendance Threshold:</span>
                  <span className="font-mono text-blue-700 font-bold">{leftThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="70"
                  step="5"
                  value={leftThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLeftThreshold(val);
                    playSliderTickSound(val);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Slider Right */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Right Sub-Cut: High Study Attendance Threshold:</span>
                  <span className="font-mono text-blue-700 font-bold">{rightThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="90"
                  step="5"
                  value={rightThreshold}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRightThreshold(val);
                    playSliderTickSound(val);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 2D Orthogonal Partition Map & Sample Tester (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Test Student Classification Probe */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-navy-950">Test Case Probe Simulator</h3>
                <p className="text-xs text-slate-500">Walk an unseen student down the decision path</p>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  testStudentPath.predictedOutcome === 'Pass'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {testStudentPath.predictedOutcome} Predicted
              </span>
            </div>

            {/* Sliders for Test Student */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Test Student Study Hours:</span>
                  <span className="font-mono text-navy-950 font-bold">{testStudyHours.toFixed(1)} hrs</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={testStudyHours}
                  onChange={(e) => setTestStudyHours(Number(e.target.value))}
                  className="w-full accent-navy-900 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Test Student Attendance Rate:</span>
                  <span className="font-mono text-navy-950 font-bold">{testAttendance}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={testAttendance}
                  onChange={(e) => setTestAttendance(Number(e.target.value))}
                  className="w-full accent-navy-900 cursor-pointer"
                />
              </div>
            </div>

            {/* Path Traverse Card */}
            <div className="p-3.5 rounded-xl bg-slate-900 text-sky-200 text-xs font-mono space-y-1.5">
              <div className="text-slate-400 font-sans text-[11px] font-semibold">
                Path Evaluation Trace:
              </div>
              <div>
                1. Study Hours = {testStudyHours} hrs &rarr; {testStudentPath.isRootHigh ? 'Right Branch (High)' : 'Left Branch (Low)'}
              </div>
              <div>
                2. Attendance = {testAttendance}% &rarr; {testStudentPath.finalLeaf}
              </div>
              <div className="text-emerald-300 font-bold pt-1 border-t border-slate-700">
                Decision Result: {testStudentPath.predictedOutcome.toUpperCase()}
              </div>
            </div>
          </div>

            {/* 2D Orthogonal Partition Map */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-950 flex items-center justify-between">
              <span>Graph Paper View: Simple Straight Cuts</span>
              <span className="text-[11px] text-slate-400 font-mono">Horizontal & Vertical Cuts</span>
            </h4>

            {/* Visual 2D Box showing orthogonal partitioning */}
            <div className="relative aspect-video w-full rounded-xl bg-slate-100 border border-slate-200 p-2 overflow-hidden flex flex-col justify-between text-[10px] font-mono">
              {/* Top half (High Study Hours) */}
              <div className="flex-1 flex gap-1 border-b-2 border-blue-600 relative">
                <div
                  className="h-full bg-sky-100/80 rounded p-1 border-r border-dashed border-sky-400 flex flex-col justify-center items-center text-sky-800"
                  style={{ width: `${100 - rightThreshold}%` }}
                >
                  <span>Pass</span>
                  <span className="text-[9px] text-slate-500">&lt; {rightThreshold}%</span>
                </div>
                <div className="flex-1 bg-emerald-100/90 rounded p-1 flex flex-col justify-center items-center text-emerald-800 font-bold">
                  <span>Pass (100% Pure)</span>
                  <span className="text-[9px] text-emerald-600">&ge; {rightThreshold}%</span>
                </div>
                <div className="absolute -left-1 bottom-0 translate-y-1/2 bg-blue-600 text-white px-1 rounded text-[9px] z-10">
                  Cut: {rootThreshold} hrs
                </div>
              </div>

              {/* Bottom half (Low Study Hours) */}
              <div className="flex-1 flex gap-1 pt-1">
                <div
                  className="h-full bg-rose-100/80 rounded p-1 border-r border-dashed border-rose-400 flex flex-col justify-center items-center text-rose-800 font-bold"
                  style={{ width: `${leftThreshold}%` }}
                >
                  <span>Fail (100% Pure)</span>
                  <span className="text-[9px] text-rose-600">&lt; {leftThreshold}%</span>
                </div>
                <div className="flex-1 bg-sky-100/80 rounded p-1 flex flex-col justify-center items-center text-sky-800">
                  <span>Pass</span>
                  <span className="text-[9px] text-slate-500">&ge; {leftThreshold}%</span>
                </div>
              </div>
            </div>

            {/* Class-10 Note */}
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Class-10 Math Connection:</strong> Unlike the diagonal straight line in Module 3 (ax + by + c = 0), a Decision Tree uses simple horizontal and vertical cuts (e.g. Study Hours &ge; 5 or Attendance &ge; 70%) to create neat rectangular boxes!
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
