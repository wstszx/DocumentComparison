import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { PreciseDifferencesList } from './components/PreciseDifferencesList';
import { AdvancedDocumentViewer } from './components/AdvancedDocumentViewer';
import { useAdvancedComparison } from './hooks/useAdvancedComparison';
import { RefreshCw, AlertCircle, Download, Settings, BarChart3 } from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const {
    leftDocument,
    rightDocument,
    comparisonResult,
    isLoading,
    errors,
    viewportState,
    navigationState,
    processDocument,
    selectDifference,
    navigateToNext,
    navigateToPrevious,
    updateScrollState,
    toggleSyncScrolling,
    clearComparison,
    exportComparison,
  } = useAdvancedComparison();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleFileSelect = useCallback(async (file: File, side: 'left' | 'right') => {
    try {
      await processDocument(file, side);
    } catch (error) {
      console.error('文件处理错误:', error);
    }
  }, [processDocument]);

  const handleLeftScroll = useCallback((scrollTop: number) => {
    updateScrollState('left', scrollTop);
    if (viewportState.syncScrolling) {
      updateScrollState('right', scrollTop);
    }
  }, [updateScrollState, viewportState.syncScrolling]);

  const handleRightScroll = useCallback((scrollTop: number) => {
    updateScrollState('right', scrollTop);
    if (viewportState.syncScrolling) {
      updateScrollState('left', scrollTop);
    }
  }, [updateScrollState, viewportState.syncScrolling]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const hasDocuments = leftDocument && rightDocument;
  const hasErrors = errors.left || errors.right || errors.comparison;
  const isComparing = isLoading.comparing;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      
      {!hasDocuments ? (
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                高级文档差异对比系统
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                上传两个文档进行精确的差异分析
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                支持 PDF、Word 和文本文件，提供详细的位置定位和智能导航
              </p>
            </div>
            
            {hasErrors && (
              <div className="mb-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-center space-x-3 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                    文档处理错误
                  </h3>
                </div>
                {errors.left && (
                  <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      原始文档错误:
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.left}
                    </p>
                  </div>
                )}
                {errors.right && (
                  <div className="mb-3 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      修改文档错误:
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.right}
                    </p>
                  </div>
                )}
                {errors.comparison && (
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      比较过程错误:
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {errors.comparison}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <FileUpload
                onFileSelect={(file) => handleFileSelect(file, 'left')}
                document={leftDocument ? {
                  id: leftDocument.id,
                  name: leftDocument.name,
                  type: leftDocument.type,
                  size: leftDocument.size,
                  content: leftDocument.pages.map(p => p.content).join('\n'),
                  lastModified: 0,
                } : undefined}
                label="原始文档"
                isLoading={isLoading.left}
                error={errors.left}
              />
              <FileUpload
                onFileSelect={(file) => handleFileSelect(file, 'right')}
                document={rightDocument ? {
                  id: rightDocument.id,
                  name: rightDocument.name,
                  type: rightDocument.type,
                  size: rightDocument.size,
                  content: rightDocument.pages.map(p => p.content).join('\n'),
                  lastModified: 0,
                } : undefined}
                label="修改文档"
                isLoading={isLoading.right}
                error={errors.right}
              />
            </div>
            
            {isComparing && (
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-3 px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-blue-800 dark:text-blue-200 font-medium">
                    正在进行高级差异分析...
                  </span>
                </div>
              </div>
            )}
            
            {(leftDocument || rightDocument) && (
              <div className="text-center">
                <button
                  onClick={clearComparison}
                  className="inline-flex items-center space-x-3 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  <RefreshCw className="h-5 w-5" />
                  <span>清除并重新开始</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <PreciseDifferencesList
            differences={comparisonResult?.differences || []}
            statistics={comparisonResult?.statistics || {
              totalDifferences: 0,
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
            }}
            summary={comparisonResult?.summary || {
              majorChanges: [],
              structuralChanges: [],
              formatChanges: [],
              recommendations: [],
            }}
            selectedDifference={viewportState.selectedDifference}
            onDifferenceSelect={selectDifference}
            onNavigateNext={navigateToNext}
            onNavigatePrevious={navigateToPrevious}
            currentIndex={navigationState.currentDifferenceIndex}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
          />
          
          <div className="flex flex-1 min-w-0">
            <AdvancedDocumentViewer
              document={leftDocument}
              differences={comparisonResult?.differences || []}
              selectedDifference={viewportState.selectedDifference}
              title="原始文档"
              side="left"
              onScroll={handleLeftScroll}
              scrollTop={viewportState.leftScrollTop}
              syncScroll={viewportState.syncScrolling}
            />
            
            <AdvancedDocumentViewer
              document={rightDocument}
              differences={comparisonResult?.differences || []}
              selectedDifference={viewportState.selectedDifference}
              title="修改文档"
              side="right"
              onScroll={handleRightScroll}
              scrollTop={viewportState.rightScrollTop}
              syncScroll={viewportState.syncScrolling}
            />
          </div>
          
          {/* 浮动控制面板 */}
          <div className="absolute bottom-6 right-6 flex flex-col space-y-3 z-10">
            {/* 导出菜单 */}
            {showExportMenu && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 mb-2">
                <button
                  onClick={() => {
                    exportComparison('json');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  导出为 JSON
                </button>
                <button
                  onClick={() => {
                    exportComparison('csv');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  导出为 CSV
                </button>
                <button
                  onClick={() => {
                    exportComparison('html');
                    setShowExportMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  导出为 HTML 报告
                </button>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={toggleSyncScrolling}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg
                  ${viewportState.syncScrolling
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                {viewportState.syncScrolling ? '同步滚动 开' : '同步滚动 关'}
              </button>
              
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-lg border border-gray-200 dark:border-gray-700 flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>导出</span>
              </button>
              
              <button
                onClick={clearComparison}
                className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium shadow-lg border border-gray-200 dark:border-gray-700"
              >
                新建对比
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;