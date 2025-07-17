import { diffLines, diffWords, diffChars } from 'diff';
import { DocumentStructure, PreciseDifference, DocumentPosition, ComparisonResult, ComparisonStatistics, ComparisonSummary } from '../types/advanced';

export class AdvancedDiffEngine {
  static compareDocuments(leftDoc: DocumentStructure, rightDoc: DocumentStructure): ComparisonResult {
    const differences: PreciseDifference[] = [];
    
    // 多层次差异检测
    const lineDifferences = this.detectLineDifferences(leftDoc, rightDoc);
    const wordDifferences = this.detectWordDifferences(leftDoc, rightDoc);
    const structuralDifferences = this.detectStructuralDifferences(leftDoc, rightDoc);
    
    differences.push(...lineDifferences, ...wordDifferences, ...structuralDifferences);
    
    // 去重和优化
    const optimizedDifferences = this.optimizeDifferences(differences);
    
    // 计算统计信息
    const statistics = this.calculateStatistics(optimizedDifferences, leftDoc, rightDoc);
    const summary = this.generateSummary(optimizedDifferences, statistics);
    
    return {
      differences: optimizedDifferences,
      statistics,
      summary,
    };
  }

  private static detectLineDifferences(leftDoc: DocumentStructure, rightDoc: DocumentStructure): PreciseDifference[] {
    const differences: PreciseDifference[] = [];
    const leftContent = this.extractFullContent(leftDoc);
    const rightContent = this.extractFullContent(rightDoc);
    
    const lineDiffs = diffLines(leftContent, rightContent);
    
    let leftLineIndex = 0;
    let rightLineIndex = 0;
    let diffIndex = 0;

    lineDiffs.forEach((part) => {
      if (part.added) {
        const rightPosition = this.findPositionByLineIndex(rightDoc, rightLineIndex);
        differences.push({
          id: `line-add-${diffIndex++}`,
          type: 'addition',
          severity: this.calculateSeverity(part.value),
          category: 'text',
          description: `新增内容: ${part.value.substring(0, 50)}...`,
          leftContent: '',
          rightContent: part.value,
          leftPosition: rightPosition, // 使用右侧位置作为参考
          rightPosition,
          contextBefore: this.getContextBefore(rightDoc, rightPosition),
          contextAfter: this.getContextAfter(rightDoc, rightPosition),
          similarity: 0,
          confidence: 0.9,
        });
        rightLineIndex += (part.value.match(/\n/g) || []).length;
      } else if (part.removed) {
        const leftPosition = this.findPositionByLineIndex(leftDoc, leftLineIndex);
        differences.push({
          id: `line-del-${diffIndex++}`,
          type: 'deletion',
          severity: this.calculateSeverity(part.value),
          category: 'text',
          description: `删除内容: ${part.value.substring(0, 50)}...`,
          leftContent: part.value,
          rightContent: '',
          leftPosition,
          rightPosition: leftPosition, // 使用左侧位置作为参考
          contextBefore: this.getContextBefore(leftDoc, leftPosition),
          contextAfter: this.getContextAfter(leftDoc, leftPosition),
          similarity: 0,
          confidence: 0.9,
        });
        leftLineIndex += (part.value.match(/\n/g) || []).length;
      } else {
        // 对于未变化的部分，检查是否有词级别的差异
        const wordDiffs = this.detectWordLevelChanges(part.value, part.value, leftLineIndex, rightLineIndex, leftDoc, rightDoc);
        differences.push(...wordDiffs);
        
        const lineCount = (part.value.match(/\n/g) || []).length;
        leftLineIndex += lineCount;
        rightLineIndex += lineCount;
      }
    });

    return differences;
  }

  private static detectWordDifferences(leftDoc: DocumentStructure, rightDoc: DocumentStructure): PreciseDifference[] {
    const differences: PreciseDifference[] = [];
    
    // 按段落比较词级差异
    const leftParagraphs = this.extractParagraphs(leftDoc);
    const rightParagraphs = this.extractParagraphs(rightDoc);
    
    const maxLength = Math.max(leftParagraphs.length, rightParagraphs.length);
    
    for (let i = 0; i < maxLength; i++) {
      const leftPara = leftParagraphs[i] || '';
      const rightPara = rightParagraphs[i] || '';
      
      if (leftPara !== rightPara) {
        const wordDiffs = diffWords(leftPara, rightPara);
        let wordIndex = 0;
        
        wordDiffs.forEach((part, index) => {
          if (part.added || part.removed) {
            const position = this.findPositionByContent(
              part.added ? rightDoc : leftDoc,
              part.value,
              i
            );
            
            differences.push({
              id: `word-${part.added ? 'add' : 'del'}-${i}-${index}`,
              type: part.added ? 'addition' : 'deletion',
              severity: this.calculateWordSeverity(part.value),
              category: 'text',
              description: `${part.added ? '新增' : '删除'}词汇: ${part.value}`,
              leftContent: part.removed ? part.value : '',
              rightContent: part.added ? part.value : '',
              leftPosition: position,
              rightPosition: position,
              contextBefore: this.getWordContext(leftPara, wordIndex, -10),
              contextAfter: this.getWordContext(leftPara, wordIndex + part.value.length, 10),
              similarity: this.calculateWordSimilarity(leftPara, rightPara),
              confidence: 0.8,
            });
          }
          wordIndex += part.value.length;
        });
      }
    }
    
    return differences;
  }

  private static detectStructuralDifferences(leftDoc: DocumentStructure, rightDoc: DocumentStructure): PreciseDifference[] {
    const differences: PreciseDifference[] = [];
    
    // 比较页面结构
    if (leftDoc.pageCount !== rightDoc.pageCount) {
      differences.push({
        id: 'struct-page-count',
        type: 'structure',
        severity: 'high',
        category: 'structure',
        description: `页面数量变化: ${leftDoc.pageCount} → ${rightDoc.pageCount}`,
        leftContent: `${leftDoc.pageCount} 页`,
        rightContent: `${rightDoc.pageCount} 页`,
        leftPosition: { page: 1, line: 1, column: 1, offset: 0, absoluteOffset: 0 },
        rightPosition: { page: 1, line: 1, column: 1, offset: 0, absoluteOffset: 0 },
        contextBefore: '',
        contextAfter: '',
        similarity: 0.5,
        confidence: 1.0,
      });
    }
    
    // 比较章节结构
    const leftSections = leftDoc.sections.map(s => s.title);
    const rightSections = rightDoc.sections.map(s => s.title);
    
    const sectionDiffs = diffLines(leftSections.join('\n'), rightSections.join('\n'));
    let sectionIndex = 0;
    
    sectionDiffs.forEach((part) => {
      if (part.added || part.removed) {
        differences.push({
          id: `struct-section-${sectionIndex++}`,
          type: part.added ? 'addition' : 'deletion',
          severity: 'medium',
          category: 'structure',
          description: `章节${part.added ? '新增' : '删除'}: ${part.value}`,
          leftContent: part.removed ? part.value : '',
          rightContent: part.added ? part.value : '',
          leftPosition: { page: 1, line: 1, column: 1, offset: 0, absoluteOffset: 0 },
          rightPosition: { page: 1, line: 1, column: 1, offset: 0, absoluteOffset: 0 },
          contextBefore: '',
          contextAfter: '',
          similarity: 0,
          confidence: 0.9,
        });
      }
    });
    
    return differences;
  }

  private static optimizeDifferences(differences: PreciseDifference[]): PreciseDifference[] {
    // 去重
    const uniqueDifferences = differences.filter((diff, index, array) => 
      array.findIndex(d => d.leftContent === diff.leftContent && d.rightContent === diff.rightContent) === index
    );
    
    // 按位置排序
    return uniqueDifferences.sort((a, b) => {
      if (a.leftPosition.page !== b.leftPosition.page) {
        return a.leftPosition.page - b.leftPosition.page;
      }
      if (a.leftPosition.line !== b.leftPosition.line) {
        return a.leftPosition.line - b.leftPosition.line;
      }
      return a.leftPosition.column - b.leftPosition.column;
    });
  }

  private static calculateStatistics(differences: PreciseDifference[], leftDoc: DocumentStructure, rightDoc: DocumentStructure): ComparisonStatistics {
    const stats: ComparisonStatistics = {
      totalDifferences: differences.length,
      additions: 0,
      deletions: 0,
      modifications: 0,
      formatChanges: 0,
      structureChanges: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      pageDistribution: new Map(),
      overallSimilarity: 0,
      averageConfidence: 0,
    };

    differences.forEach(diff => {
      // 按类型统计
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

      // 按类别统计
      switch (diff.category) {
        case 'format':
          stats.formatChanges++;
          break;
        case 'structure':
          stats.structureChanges++;
          break;
      }

      // 按严重程度统计
      switch (diff.severity) {
        case 'critical':
          stats.critical++;
          break;
        case 'high':
          stats.high++;
          break;
        case 'medium':
          stats.medium++;
          break;
        case 'low':
          stats.low++;
          break;
      }

      // 页面分布统计
      const page = diff.leftPosition.page;
      stats.pageDistribution.set(page, (stats.pageDistribution.get(page) || 0) + 1);
    });

    // 计算整体相似度
    const totalChars = Math.max(leftDoc.characterCount, rightDoc.characterCount);
    const changedChars = differences.reduce((sum, diff) => 
      sum + Math.max(diff.leftContent.length, diff.rightContent.length), 0);
    stats.overallSimilarity = Math.max(0, (totalChars - changedChars) / totalChars);

    // 计算平均置信度
    stats.averageConfidence = differences.reduce((sum, diff) => sum + diff.confidence, 0) / differences.length || 0;

    return stats;
  }

  private static generateSummary(differences: PreciseDifference[], statistics: ComparisonStatistics): ComparisonSummary {
    const majorChanges: string[] = [];
    const structuralChanges: string[] = [];
    const formatChanges: string[] = [];
    const recommendations: string[] = [];

    // 识别主要变化
    differences.filter(d => d.severity === 'high' || d.severity === 'critical')
      .slice(0, 5)
      .forEach(diff => {
        majorChanges.push(diff.description);
      });

    // 识别结构变化
    differences.filter(d => d.category === 'structure')
      .forEach(diff => {
        structuralChanges.push(diff.description);
      });

    // 识别格式变化
    differences.filter(d => d.category === 'format')
      .forEach(diff => {
        formatChanges.push(diff.description);
      });

    // 生成建议
    if (statistics.overallSimilarity < 0.5) {
      recommendations.push('文档差异较大，建议仔细审查所有变更');
    }
    if (statistics.structureChanges > 0) {
      recommendations.push('检测到结构性变化，请确认文档组织是否符合预期');
    }
    if (statistics.critical > 0) {
      recommendations.push('存在关键性差异，需要重点关注');
    }

    return {
      majorChanges,
      structuralChanges,
      formatChanges,
      recommendations,
    };
  }

  // 辅助方法
  private static extractFullContent(doc: DocumentStructure): string {
    return doc.pages.map(page => page.content).join('\n');
  }

  private static extractParagraphs(doc: DocumentStructure): string[] {
    const fullContent = this.extractFullContent(doc);
    return fullContent.split(/\n\s*\n/).filter(para => para.trim().length > 0);
  }

  private static findPositionByLineIndex(doc: DocumentStructure, lineIndex: number): DocumentPosition {
    let currentLine = 0;
    for (const page of doc.pages) {
      if (currentLine + page.lines.length > lineIndex) {
        const pageLineIndex = lineIndex - currentLine;
        const line = page.lines[pageLineIndex];
        return {
          page: page.pageNumber,
          line: line.lineNumber,
          column: 1,
          offset: 0,
          absoluteOffset: line.startOffset,
        };
      }
      currentLine += page.lines.length;
    }
    
    // 默认返回第一页第一行
    return { page: 1, line: 1, column: 1, offset: 0, absoluteOffset: 0 };
  }

  private static findPositionByContent(doc: DocumentStructure, content: string, paragraphIndex: number): DocumentPosition {
    // 简化实现，实际应该更精确
    return { page: 1, line: paragraphIndex + 1, column: 1, offset: 0, absoluteOffset: 0 };
  }

  private static getContextBefore(doc: DocumentStructure, position: DocumentPosition, length: number = 50): string {
    // 简化实现
    return '';
  }

  private static getContextAfter(doc: DocumentStructure, position: DocumentPosition, length: number = 50): string {
    // 简化实现
    return '';
  }

  private static getWordContext(text: string, position: number, length: number): string {
    const start = Math.max(0, position + (length < 0 ? length : 0));
    const end = Math.min(text.length, position + (length > 0 ? length : 0));
    return text.substring(start, end);
  }

  private static calculateSeverity(content: string): 'low' | 'medium' | 'high' | 'critical' {
    const length = content.trim().length;
    const lineCount = (content.match(/\n/g) || []).length;
    
    if (lineCount > 10 || length > 500) return 'critical';
    if (lineCount > 5 || length > 200) return 'high';
    if (lineCount > 1 || length > 50) return 'medium';
    return 'low';
  }

  private static calculateWordSeverity(word: string): 'low' | 'medium' | 'high' | 'critical' {
    if (word.length > 20) return 'medium';
    return 'low';
  }

  private static calculateWordSimilarity(left: string, right: string): number {
    // 简化的相似度计算
    const longer = left.length > right.length ? left : right;
    const shorter = left.length > right.length ? right : left;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}