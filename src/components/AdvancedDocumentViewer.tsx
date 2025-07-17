import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { DocumentStructure, PreciseDifference, DocumentPosition } from '../types/advanced';
import { ZoomIn, ZoomOut, RotateCcw, Search, BookOpen } from 'lucide-react';

interface AdvancedDocumentViewerProps {
  document: DocumentStructure;
  differences: PreciseDifference[];
  selectedDifference: string | null;
  title: string;
  side: 'left' | 'right';
  onScroll: (scrollTop: number) => void;
  scrollTop: number;
  syncScroll: boolean;
  onPositionUpdate?: (position: DocumentPosition) => void;
}

export const AdvancedDocumentViewer: React.FC<AdvancedDocumentViewerProps> = React.memo(({
  document,
  differences,
  selectedDifference,
  title,
  side,
  onScroll,
  scrollTop,
  syncScroll,
  onPositionUpdate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // 处理文档内容并应用差异高亮
  const processedContent = useMemo(() => {
    if (!document) return 'No content available';
    
    let content = document.pages.map(page => 
      `<div class="page-container" data-page="${page.pageNumber}">
        <div class="page-header">第 ${page.pageNumber} 页</div>
        <div class="page-content">${page.content}</div>
      </div>`
    ).join('\n');
    
    // 应用差异高亮
    if (differences.length > 0) {
      const sortedDiffs = [...differences]
        .filter(diff => {
          const diffContent = side === 'left' ? diff.leftContent : diff.rightContent;
          return diffContent && diffContent.trim().length > 0;
        })
        .sort((a, b) => {
          const aPos = side === 'left' ? a.leftPosition.absoluteOffset : a.rightPosition.absoluteOffset;
          const bPos = side === 'left' ? b.leftPosition.absoluteOffset : b.rightPosition.absoluteOffset;
          return bPos - aPos;
        });

      sortedDiffs.forEach((diff) => {
        const position = side === 'left' ? diff.leftPosition : diff.rightPosition;
        const diffContent = side === 'left' ? diff.leftContent : diff.rightContent;
        
        if (diffContent && position.absoluteOffset >= 0) {
          let className = 'diff-highlight ';
          switch (diff.type) {
            case 'addition':
              className += 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-l-4 border-green-500';
              break;
            case 'deletion':
              className += 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-l-4 border-red-500';
              break;
            case 'modification':
              className += 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-l-4 border-blue-500';
              break;
            case 'structure':
              className += 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 border-l-4 border-purple-500';
              break;
          }
          
          // 添加严重程度样式
          switch (diff.severity) {
            case 'critical':
              className += ' ring-2 ring-red-400 ring-opacity-50';
              break;
            case 'high':
              className += ' ring-2 ring-orange-400 ring-opacity-50';
              break;
          }
          
          if (selectedDifference === diff.id) {
            className += ' ring-4 ring-yellow-400 ring-opacity-75 shadow-lg';
          }
          
          const escapedContent = diffContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
          
          // 查找并替换内容
          const regex = new RegExp(diffContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
          content = content.replace(regex, 
            `<span class="${className}" data-diff-id="${diff.id}" data-position="${position.page}-${position.line}-${position.column}">${escapedContent}</span>`
          );
        }
      });
    }
    
    // 应用搜索高亮
    if (searchTerm.trim()) {
      const searchRegex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      content = content.replace(searchRegex, '<mark class="search-highlight bg-yellow-200 dark:bg-yellow-800">$1</mark>');
    }
    
    return content;
  }, [document, differences, selectedDifference, side, searchTerm]);

  // 滚动同步处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll || isScrollingRef.current) return;
    
    const scrollTop = e.currentTarget.scrollTop;
    onScroll(scrollTop);
    
    // 更新当前页面
    if (contentRef.current) {
      const pageElements = contentRef.current.querySelectorAll('.page-container');
      const containerRect = e.currentTarget.getBoundingClientRect();
      
      for (let i = 0; i < pageElements.length; i++) {
        const pageElement = pageElements[i] as HTMLElement;
        const pageRect = pageElement.getBoundingClientRect();
        
        if (pageRect.top <= containerRect.top + 100 && pageRect.bottom > containerRect.top + 100) {
          const pageNumber = parseInt(pageElement.dataset.page || '1');
          setCurrentPage(pageNumber);
          
          // 更新位置信息
          if (onPositionUpdate) {
            onPositionUpdate({
              page: pageNumber,
              line: 1,
              column: 1,
              offset: 0,
              absoluteOffset: 0,
            });
          }
          break;
        }
      }
    }
  }, [syncScroll, onScroll, onPositionUpdate]);

  // 应用外部滚动更新
  useEffect(() => {
    if (syncScroll && containerRef.current && containerRef.current.scrollTop !== scrollTop) {
      isScrollingRef.current = true;
      containerRef.current.scrollTop = scrollTop;
      
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }
  }, [scrollTop, syncScroll]);

  // 处理差异选择
  useEffect(() => {
    if (selectedDifference && contentRef.current) {
      const diffElement = contentRef.current.querySelector(
        `[data-diff-id="${selectedDifference}"]`
      );
      if (diffElement) {
        diffElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
      }
    }
  }, [selectedDifference]);

  // 缩放控制
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoomLevel(100);

  // 跳转到指定页面
  const goToPage = (pageNumber: number) => {
    if (contentRef.current) {
      const pageElement = contentRef.current.querySelector(`[data-page="${pageNumber}"]`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  if (!document) {
    return (
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No document loaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
      {/* 文档头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {document.name} • {(document.size / 1024).toFixed(1)} KB • {document.pageCount} 页
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="缩小"
              >
                <ZoomOut className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-400 px-2">
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="放大"
              >
                <ZoomIn className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
              <button
                onClick={handleZoomReset}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="重置缩放"
              >
                <RotateCcw className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
        
        {/* 搜索和导航 */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索文档内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <select
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {Array.from({ length: document.pageCount }, (_, i) => i + 1).map(page => (
                <option key={page} value={page}>第 {page} 页</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* 文档内容 */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: 'auto' }}
      >
        <div className="p-6">
          <div
            ref={contentRef}
            className="prose prose-sm max-w-none dark:prose-invert"
            style={{ 
              fontSize: `${zoomLevel}%`,
              lineHeight: '1.6',
              minHeight: '100%'
            }}
            dangerouslySetInnerHTML={{
              __html: processedContent
            }}
          />
        </div>
      </div>
    </div>
  );
});

AdvancedDocumentViewer.displayName = 'AdvancedDocumentViewer';