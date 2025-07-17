import { useState, useCallback, useEffect } from 'react';
import { DocumentStructure, PreciseDifference, ComparisonResult, ViewportState, NavigationState } from '../types/advanced';
import { AdvancedDocumentParser } from '../utils/advancedDocumentParser';
import { AdvancedDiffEngine } from '../utils/advancedDiffEngine';

export const useAdvancedComparison = () => {
  const [leftDocument, setLeftDocument] = useState<DocumentStructure | null>(null);
  const [rightDocument, setRightDocument] = useState<DocumentStructure | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState<{
    left: boolean;
    right: boolean;
    comparing: boolean;
  }>({
    left: false,
    right: false,
    comparing: false,
  });
  const [errors, setErrors] = useState<{
    left: string | null;
    right: string | null;
    comparison: string | null;
  }>({
    left: null,
    right: null,
    comparison: null,
  });

  const [viewportState, setViewportState] = useState<ViewportState>({
    leftScrollTop: 0,
    rightScrollTop: 0,
    leftVisibleRange: [0, 0],
    rightVisibleRange: [0, 0],
    selectedDifference: null,
    highlightedDifferences: [],
    syncScrolling: true,
    zoomLevel: 100,
  });

  const [navigationState, setNavigationState] = useState<NavigationState>({
    currentDifferenceIndex: -1,
    totalDifferences: 0,
    navigationHistory: [],
    bookmarks: [],
  });

  // 处理文档上传
  const processDocument = useCallback(async (file: File, side: 'left' | 'right') => {
    setIsLoading(prev => ({ ...prev, [side]: true }));
    setErrors(prev => ({ ...prev, [side]: null }));
    
    try {
      const document = await AdvancedDocumentParser.parseDocument(file);
      
      if (side === 'left') {
        setLeftDocument(document);
      } else {
        setRightDocument(document);
      }
      
      return document;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error(`处理${side === 'left' ? '左侧' : '右侧'}文档时出错:`, error);
      setErrors(prev => ({ ...prev, [side]: errorMessage }));
      throw error;
    } finally {
      setIsLoading(prev => ({ ...prev, [side]: false }));
    }
  }, []);

  // 执行文档比较
  const compareDocuments = useCallback(async () => {
    if (!leftDocument || !rightDocument) {
      setComparisonResult(null);
      return;
    }

    setIsLoading(prev => ({ ...prev, comparing: true }));
    setErrors(prev => ({ ...prev, comparison: null }));

    try {
      const result = AdvancedDiffEngine.compareDocuments(leftDocument, rightDocument);
      setComparisonResult(result);
      
      // 更新导航状态
      setNavigationState(prev => ({
        ...prev,
        totalDifferences: result.differences.length,
        currentDifferenceIndex: result.differences.length > 0 ? 0 : -1,
      }));

      // 如果有差异，自动选择第一个
      if (result.differences.length > 0) {
        setViewportState(prev => ({
          ...prev,
          selectedDifference: result.differences[0].id,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '比较过程中发生未知错误';
      console.error('文档比较错误:', error);
      setErrors(prev => ({ ...prev, comparison: errorMessage }));
    } finally {
      setIsLoading(prev => ({ ...prev, comparing: false }));
    }
  }, [leftDocument, rightDocument]);

  // 自动触发比较
  useEffect(() => {
    if (leftDocument && rightDocument) {
      compareDocuments();
    }
  }, [leftDocument, rightDocument, compareDocuments]);

  // 选择差异项
  const selectDifference = useCallback((differenceId: string) => {
    if (!comparisonResult) return;

    const index = comparisonResult.differences.findIndex(d => d.id === differenceId);
    if (index !== -1) {
      setViewportState(prev => ({
        ...prev,
        selectedDifference: differenceId,
      }));
      
      setNavigationState(prev => ({
        ...prev,
        currentDifferenceIndex: index,
        navigationHistory: [...prev.navigationHistory.slice(-9), differenceId],
      }));
    }
  }, [comparisonResult]);

  // 导航到下一个差异
  const navigateToNext = useCallback(() => {
    if (!comparisonResult || comparisonResult.differences.length === 0) return;

    const nextIndex = Math.min(
      navigationState.currentDifferenceIndex + 1,
      comparisonResult.differences.length - 1
    );
    
    const nextDifference = comparisonResult.differences[nextIndex];
    if (nextDifference) {
      selectDifference(nextDifference.id);
    }
  }, [comparisonResult, navigationState.currentDifferenceIndex, selectDifference]);

  // 导航到上一个差异
  const navigateToPrevious = useCallback(() => {
    if (!comparisonResult || comparisonResult.differences.length === 0) return;

    const prevIndex = Math.max(navigationState.currentDifferenceIndex - 1, 0);
    const prevDifference = comparisonResult.differences[prevIndex];
    if (prevDifference) {
      selectDifference(prevDifference.id);
    }
  }, [comparisonResult, navigationState.currentDifferenceIndex, selectDifference]);

  // 更新滚动状态
  const updateScrollState = useCallback((side: 'left' | 'right', scrollTop: number) => {
    setViewportState(prev => ({
      ...prev,
      [`${side}ScrollTop`]: scrollTop,
    }));
  }, []);

  // 切换滚动同步
  const toggleSyncScrolling = useCallback(() => {
    setViewportState(prev => ({
      ...prev,
      syncScrolling: !prev.syncScrolling,
    }));
  }, []);

  // 添加书签
  const addBookmark = useCallback((differenceId: string) => {
    setNavigationState(prev => ({
      ...prev,
      bookmarks: [...prev.bookmarks.filter(id => id !== differenceId), differenceId],
    }));
  }, []);

  // 移除书签
  const removeBookmark = useCallback((differenceId: string) => {
    setNavigationState(prev => ({
      ...prev,
      bookmarks: prev.bookmarks.filter(id => id !== differenceId),
    }));
  }, []);

  // 清除比较
  const clearComparison = useCallback(() => {
    setLeftDocument(null);
    setRightDocument(null);
    setComparisonResult(null);
    setErrors({ left: null, right: null, comparison: null });
    setViewportState({
      leftScrollTop: 0,
      rightScrollTop: 0,
      leftVisibleRange: [0, 0],
      rightVisibleRange: [0, 0],
      selectedDifference: null,
      highlightedDifferences: [],
      syncScrolling: true,
      zoomLevel: 100,
    });
    setNavigationState({
      currentDifferenceIndex: -1,
      totalDifferences: 0,
      navigationHistory: [],
      bookmarks: [],
    });
  }, []);

  // 导出比较结果
  const exportComparison = useCallback((format: 'json' | 'csv' | 'html') => {
    if (!comparisonResult) return;

    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(comparisonResult, null, 2);
        filename = 'document-comparison.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        const csvHeaders = ['类型', '严重程度', '描述', '页码', '行号', '左侧内容', '右侧内容'];
        const csvRows = comparisonResult.differences.map(diff => [
          diff.type,
          diff.severity,
          diff.description,
          diff.leftPosition.page,
          diff.leftPosition.line,
          `"${diff.leftContent.replace(/"/g, '""')}"`,
          `"${diff.rightContent.replace(/"/g, '""')}"`,
        ]);
        content = [csvHeaders, ...csvRows].map(row => row.join(',')).join('\n');
        filename = 'document-comparison.csv';
        mimeType = 'text/csv';
        break;
      case 'html':
        content = generateHTMLReport(comparisonResult);
        filename = 'document-comparison.html';
        mimeType = 'text/html';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [comparisonResult]);

  return {
    // 文档状态
    leftDocument,
    rightDocument,
    comparisonResult,
    
    // 加载和错误状态
    isLoading,
    errors,
    
    // 视图状态
    viewportState,
    navigationState,
    
    // 操作方法
    processDocument,
    compareDocuments,
    selectDifference,
    navigateToNext,
    navigateToPrevious,
    updateScrollState,
    toggleSyncScrolling,
    addBookmark,
    removeBookmark,
    clearComparison,
    exportComparison,
  };
};

// 生成HTML报告的辅助函数
function generateHTMLReport(result: ComparisonResult): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文档比较报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .difference { border: 1px solid #ddd; margin-bottom: 15px; padding: 15px; border-radius: 5px; }
        .addition { border-left: 4px solid #28a745; }
        .deletion { border-left: 4px solid #dc3545; }
        .modification { border-left: 4px solid #007bff; }
        .structure { border-left: 4px solid #6f42c1; }
        .content { background: #f8f9fa; padding: 10px; margin: 10px 0; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>文档比较报告</h1>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <h3>总体统计</h3>
            <p>总差异数: ${result.statistics.totalDifferences}</p>
            <p>相似度: ${(result.statistics.overallSimilarity * 100).toFixed(1)}%</p>
        </div>
        <div class="stat-card">
            <h3>变更类型</h3>
            <p>新增: ${result.statistics.additions}</p>
            <p>删除: ${result.statistics.deletions}</p>
            <p>修改: ${result.statistics.modifications}</p>
        </div>
        <div class="stat-card">
            <h3>严重程度</h3>
            <p>关键: ${result.statistics.critical}</p>
            <p>高: ${result.statistics.high}</p>
            <p>中: ${result.statistics.medium}</p>
            <p>低: ${result.statistics.low}</p>
        </div>
    </div>
    
    <h2>差异详情</h2>
    ${result.differences.map(diff => `
        <div class="difference ${diff.type}">
            <h4>${diff.description}</h4>
            <p><strong>位置:</strong> 第${diff.leftPosition.page}页, 第${diff.leftPosition.line}行</p>
            <p><strong>类型:</strong> ${diff.type} | <strong>严重程度:</strong> ${diff.severity}</p>
            ${diff.leftContent ? `<div class="content"><strong>原内容:</strong> ${diff.leftContent}</div>` : ''}
            ${diff.rightContent ? `<div class="content"><strong>新内容:</strong> ${diff.rightContent}</div>` : ''}
        </div>
    `).join('')}
</body>
</html>
  `;
}