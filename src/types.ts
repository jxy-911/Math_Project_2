// Types for the Mathematics Behind AI Simulation

export type ActiveModuleId = 'matrix' | 'knn' | 'boundary' | 'decisiontree';

export interface FormulaDetails {
  id: string;
  title: string;
  latex: string;
  class10Chapter: string;
  description: string;
  intuitiveExplanation: string;
  variables: { symbol: string; meaning: string; sampleVal?: string | number }[];
  aiApplication: string;
  interactiveParams?: Record<string, number | string>;
}

// Module 1: Matrix Pattern Recognition
export interface MatrixPreset {
  id: string;
  name: string;
  description: string;
  grid: number[][]; // 6x6 matrix of 0 or 1
  category: 'digit' | 'symbol' | 'geometric';
}

export interface MatrixSimilarityResult {
  dotProduct: number;
  normA: number;
  normB: number;
  cosineSimilarity: number; // 0 to 1
  percentage: number; // 0 to 100%
  matchingElements: number;
  totalElements: number;
  stepWiseProducts: number[][];
}

// Module 2: KNN Clustering & Euclidean Distance
export interface DataPoint {
  id: string;
  x: number; // 0 to 10
  y: number; // 0 to 10
  classLabel: 'A' | 'B';
}

export interface NeighborDistance {
  point: DataPoint;
  distance: number;
  dx: number;
  dy: number;
  dxSq: number;
  dySq: number;
  isNearestK: boolean;
}

// Module 3: Decision Boundary & Perceptron
export interface BoundaryPoint {
  id: string;
  x1: number; // -5 to +5
  x2: number; // -5 to +5
  trueClass: 1 | 0; // 1: Class positive (Cobalt), 0: Class negative (Rose)
}

export interface PerceptronState {
  w1: number;
  w2: number;
  bias: number;
}

// Module 4: Decision Tree
export interface TreeNode {
  id: string;
  feature?: 'x' | 'y';
  threshold?: number;
  isLeaf: boolean;
  predictedClass?: 'A' | 'B';
  samplesCount: number;
  classACount: number;
  classBCount: number;
  gini: number;
  leftChild?: TreeNode;
  rightChild?: TreeNode;
}
