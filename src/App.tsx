import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { DifferencesList } from './components/DifferencesList';
import { DocumentViewer } from './components/DocumentViewer';
import { useDocumentComparison } from './hooks/useDocumentComparison';
import { RefreshCw, AlertCircle } from 'lucide-react';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [selectedDifference, setSelectedDifference] = useState<string | null>(null);
  const [leftScrollTop, setLeftScrollTop] = useState(0);
  const [rightScrollTop, setRightScrollTop] = useState(0);
  const [syncScroll, setSyncScroll] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const {
    leftDocument,
    rightDocument,
    differences,
    stats,
    isLoading,
    errors,
    processFile,
    compareDocuments,
    clearComparison,
  } = useDocumentComparison();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (leftDocument && rightDocument) {
      compareDocuments();
    }
  }, [leftDocument, rightDocument, compareDocuments]);

  const handleFileSelect = useCallback(async (file: File, side: 'left' | 'right') => {
    try {
      await processFile(file, side);
    } catch (error) {
      console.error('Error processing file:', error);
    }
  }, [processFile]);

  const handleDifferenceSelect = useCallback((differenceId: string) => {
    setSelectedDifference(differenceId);
  }, []);

  const handleLeftScroll = useCallback((scrollTop: number) => {
    setLeftScrollTop(scrollTop);
    if (syncScroll) {
      setRightScrollTop(scrollTop);
    }
  }, [syncScroll]);

  const handleRightScroll = useCallback((scrollTop: number) => {
    setRightScrollTop(scrollTop);
    if (syncScroll) {
      setLeftScrollTop(scrollTop);
    }
  }, [syncScroll]);

  const toggleSyncScroll = useCallback(() => {
    setSyncScroll(prev => !prev);
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  const hasDocuments = leftDocument && rightDocument;
  const hasErrors = errors.left || errors.right;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
      
      {!hasDocuments ? (
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                上传文档进行对比
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                选择两个文档来分析它们之间的差异
              </p>
            </div>
            
            {hasErrors && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    文档处理错误
                  </h3>
                </div>
                {errors.left && (
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                    原始文档: {errors.left}
                  </p>
                )}
                {errors.right && (
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                    修改文档: {errors.right}
                  </p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FileUpload
                onFileSelect={(file) => handleFileSelect(file, 'left')}
                document={leftDocument}
                label="原始文档"
                isLoading={isLoading.left}
                error={errors.left}
              />
              <FileUpload
                onFileSelect={(file) => handleFileSelect(file, 'right')}
                document={rightDocument}
                label="修改文档"
                isLoading={isLoading.right}
                error={errors.right}
              />
            </div>
            
            {(leftDocument || rightDocument) && (
              <div className="mt-8 text-center">
                <button
                  onClick={clearComparison}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>清除并重新开始</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <DifferencesList
            differences={differences}
            stats={stats}
            selectedDifference={selectedDifference}
            onDifferenceSelect={handleDifferenceSelect}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
          />
          
          <div className="flex flex-1 min-w-0">
            <DocumentViewer
              document={leftDocument}
              differences={differences}
              selectedDifference={selectedDifference}
              title="原始文档"
              side="left"
              onScroll={handleLeftScroll}
              scrollTop={leftScrollTop}
              syncScroll={syncScroll}
            />
            
            <DocumentViewer
              document={rightDocument}
              differences={differences}
              selectedDifference={selectedDifference}
              title="修改文档"
              side="right"
              onScroll={handleRightScroll}
              scrollTop={rightScrollTop}
              syncScroll={syncScroll}
            />
          </div>
          
          <div className="absolute bottom-4 right-4 flex space-x-2 z-10">
            <button
              onClick={toggleSyncScroll}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${syncScroll
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }
              `}
            >
              {syncScroll ? '同步滚动 开' : '同步滚动 关'}
            </button>
            
            <button
              onClick={clearComparison}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
            >
              新建对比
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;