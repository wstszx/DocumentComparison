export interface DocumentPosition {
  page: number;
  line: number;
  column: number;
  offset: number;
  absoluteOffset: number;
}

export interface PreciseDifference {
  id: string;
  type: 'addition' | 'deletion' | 'modification' | 'format' | 'structure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'text' | 'format' | 'structure' | 'metadata';
  
  // 内容信息
  description: string;
  leftContent: string;
  rightContent: string;
  
  // 精确位置信息
  leftPosition: DocumentPosition;
  rightPosition: DocumentPosition;
  
  // 上下文信息
  contextBefore: string;
  contextAfter: string;
  
  // 相似度分析
  similarity: number;
  confidence: number;
  
  // 渲染信息
  leftBoundingBox?: DOMRect;
  rightBoundingBox?: DOMRect;
}

export interface DocumentStructure {
  id: string;
  name: string;
  type: string;
  size: number;
  pageCount: number;
  lineCount: number;
  characterCount: number;
  
  // 结构化内容
  pages: DocumentPage[];
  sections: DocumentSection[];
  
  // 位置索引
  positionIndex: PositionIndex;
  
  // 元数据
  metadata: DocumentMetadata;
}

export interface DocumentPage {
  pageNumber: number;
  content: string;
  lines: DocumentLine[];
  height: number;
  width: number;
  renderOffset: number;
}

export interface DocumentLine {
  lineNumber: number;
  content: string;
  startOffset: number;
  endOffset: number;
  pageNumber: number;
}

export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  startPosition: DocumentPosition;
  endPosition: DocumentPosition;
  content: string;
}

export interface PositionIndex {
  offsetToPosition: Map<number, DocumentPosition>;
  positionToOffset: Map<string, number>;
  lineIndex: Map<number, DocumentLine>;
  pageIndex: Map<number, DocumentPage>;
}

export interface DocumentMetadata {
  title?: string;
  author?: string;
  createdDate?: Date;
  modifiedDate?: Date;
  language?: string;
  encoding?: string;
}

export interface ComparisonResult {
  differences: PreciseDifference[];
  statistics: ComparisonStatistics;
  summary: ComparisonSummary;
}

export interface ComparisonStatistics {
  totalDifferences: number;
  additions: number;
  deletions: number;
  modifications: number;
  formatChanges: number;
  structureChanges: number;
  
  // 按严重程度分类
  critical: number;
  high: number;
  medium: number;
  low: number;
  
  // 按页面分布
  pageDistribution: Map<number, number>;
  
  // 相似度统计
  overallSimilarity: number;
  averageConfidence: number;
}

export interface ComparisonSummary {
  majorChanges: string[];
  structuralChanges: string[];
  formatChanges: string[];
  recommendations: string[];
}

export interface ViewportState {
  leftScrollTop: number;
  rightScrollTop: number;
  leftVisibleRange: [number, number];
  rightVisibleRange: [number, number];
  selectedDifference: string | null;
  highlightedDifferences: string[];
  syncScrolling: boolean;
  zoomLevel: number;
}

export interface NavigationState {
  currentDifferenceIndex: number;
  totalDifferences: number;
  navigationHistory: string[];
  bookmarks: string[];
}