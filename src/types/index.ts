export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string;
  pages?: DocumentPage[];
  lastModified: number;
}

export interface DocumentPage {
  pageNumber: number;
  content: string;
  height: number;
}

export interface Difference {
  id: string;
  type: 'addition' | 'deletion' | 'modification';
  leftPosition: Position;
  rightPosition: Position;
  leftContent: string;
  rightContent: string;
  severity: 'low' | 'medium' | 'high';
  category: 'text' | 'format' | 'structure';
}

export interface Position {
  line: number;
  column: number;
  offset: number;
  page?: number;
}

export interface ComparisonStats {
  totalDifferences: number;
  additions: number;
  deletions: number;
  modifications: number;
  textChanges: number;
  formatChanges: number;
  structureChanges: number;
}

export interface DocumentViewState {
  scrollTop: number;
  zoom: number;
  selectedDifference: string | null;
}