import { diffLines, diffChars, diffWords } from 'diff';
import { Difference, Position, ComparisonStats } from '../types';

export class DiffEngine {
  static generateDifferences(leftContent: string, rightContent: string): Difference[] {
    if (!leftContent && !rightContent) return [];
    
    const differences: Difference[] = [];
    
    // First, try line-based diff
    const lineDiffs = diffLines(leftContent || '', rightContent || '');
    
    let leftLine = 0;
    let rightLine = 0;
    let leftOffset = 0;
    let rightOffset = 0;
    let diffIndex = 0;

    lineDiffs.forEach((part) => {
      if (part.added) {
        differences.push({
          id: `diff-add-${diffIndex++}`,
          type: 'addition',
          leftPosition: {
            line: leftLine,
            column: 0,
            offset: leftOffset,
          },
          rightPosition: {
            line: rightLine,
            column: 0,
            offset: rightOffset,
          },
          leftContent: '',
          rightContent: part.value,
          severity: this.calculateSeverity(part.value),
          category: this.categorizeChange(part.value),
        });
        rightLine += (part.value.match(/\n/g) || []).length;
        rightOffset += part.value.length;
      } else if (part.removed) {
        differences.push({
          id: `diff-del-${diffIndex++}`,
          type: 'deletion',
          leftPosition: {
            line: leftLine,
            column: 0,
            offset: leftOffset,
          },
          rightPosition: {
            line: rightLine,
            column: 0,
            offset: rightOffset,
          },
          leftContent: part.value,
          rightContent: '',
          severity: this.calculateSeverity(part.value),
          category: this.categorizeChange(part.value),
        });
        leftLine += (part.value.match(/\n/g) || []).length;
        leftOffset += part.value.length;
      } else {
        // For unchanged parts, check for word-level differences
        const wordDiffs = diffWords(part.value, part.value);
        
        wordDiffs.forEach((wordPart) => {
          if (wordPart.added || wordPart.removed) {
            differences.push({
              id: `diff-mod-${diffIndex++}`,
              type: 'modification',
              leftPosition: {
                line: leftLine,
                column: 0,
                offset: leftOffset,
              },
              rightPosition: {
                line: rightLine,
                column: 0,
                offset: rightOffset,
              },
              leftContent: wordPart.removed ? wordPart.value : '',
              rightContent: wordPart.added ? wordPart.value : '',
              severity: this.calculateSeverity(wordPart.value),
              category: this.categorizeChange(wordPart.value),
            });
          }
        });
        
        const lineCount = (part.value.match(/\n/g) || []).length;
        leftLine += lineCount;
        rightLine += lineCount;
        leftOffset += part.value.length;
        rightOffset += part.value.length;
      }
    });

    return differences;
  }

  static calculateStats(differences: Difference[]): ComparisonStats {
    const stats: ComparisonStats = {
      totalDifferences: differences.length,
      additions: 0,
      deletions: 0,
      modifications: 0,
      textChanges: 0,
      formatChanges: 0,
      structureChanges: 0,
    };

    differences.forEach(diff => {
      switch (diff.type) {
        case 'addition':
          stats.additions++;
          break;
        case 'deletion':
          stats.deletions++;
          break;
        case 'modification':
          stats.modifications++;
          break;
      }

      switch (diff.category) {
        case 'text':
          stats.textChanges++;
          break;
        case 'format':
          stats.formatChanges++;
          break;
        case 'structure':
          stats.structureChanges++;
          break;
      }
    });

    return stats;
  }

  private static calculateSeverity(content: string): 'low' | 'medium' | 'high' {
    const length = content.trim().length;
    const lineCount = (content.match(/\n/g) || []).length;
    
    if (lineCount > 5 || length > 100) return 'high';
    if (lineCount > 1 || length > 20) return 'medium';
    return 'low';
  }

  private static categorizeChange(content: string): 'text' | 'format' | 'structure' {
    // Check for structural changes (multiple line breaks, indentation)
    if (content.includes('\n\n') || content.match(/^\s+/m)) return 'structure';
    
    // Check for formatting markers
    if (content.match(/[*_\[\]`#]/)) return 'format';
    
    // Default to text change
    return 'text';
  }
}