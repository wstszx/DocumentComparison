import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { DocumentFile, Difference } from '../types';

interface DocumentViewerProps {
  document: DocumentFile;
  differences: Difference[];
  selectedDifference: string | null;
  title: string;
  side: 'left' | 'right';
  onScroll: (scrollTop: number) => void;
  scrollTop: number;
  syncScroll: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = React.memo(({
  document,
  differences,
  selectedDifference,
  title,
  side,
  onScroll,
  scrollTop,
  syncScroll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  // Memoize processed content to prevent unnecessary recalculations
  const processedContent = useMemo(() => {
    if (!document?.content) return 'No content available';
    
    let content = document.content;
    
    // Apply highlighting for differences
    if (differences.length > 0) {
      // Sort differences by offset in reverse order to avoid position shifts
      const sortedDiffs = [...differences]
        .filter(diff => {
          const diffContent = side === 'left' ? diff.leftContent : diff.rightContent;
          return diffContent && diffContent.trim().length > 0;
        })
        .sort((a, b) => {
          const aPos = side === 'left' ? a.leftPosition.offset : a.rightPosition.offset;
          const bPos = side === 'left' ? b.leftPosition.offset : b.rightPosition.offset;
          return bPos - aPos;
        });

      sortedDiffs.forEach((diff) => {
        const position = side === 'left' ? diff.leftPosition : diff.rightPosition;
        const diffContent = side === 'left' ? diff.leftContent : diff.rightContent;
        
        if (diffContent && position.offset >= 0 && position.offset < content.length) {
          const before = content.substring(0, position.offset);
          const after = content.substring(position.offset + diffContent.length);
          
          let className = 'diff-highlight ';
          switch (diff.type) {
            case 'addition':
              className += 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-l-2 border-green-500';
              break;
            case 'deletion':
              className += 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-l-2 border-red-500';
              break;
            case 'modification':
              className += 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-l-2 border-blue-500';
              break;
          }
          
          if (selectedDifference === diff.id) {
            className += ' ring-2 ring-yellow-400 ring-opacity-75';
          }
          
          const escapedContent = diffContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
          
          content = before + 
            `<span class="${className}" data-diff-id="${diff.id}">${escapedContent}</span>` + 
            after;
        }
      });
    }
    
    return content;
  }, [document?.content, differences, selectedDifference, side]);

  // Handle scroll synchronization
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll || isScrollingRef.current) return;
    
    const scrollTop = e.currentTarget.scrollTop;
    onScroll(scrollTop);
  }, [syncScroll, onScroll]);

  // Apply external scroll updates
  useEffect(() => {
    if (syncScroll && containerRef.current && containerRef.current.scrollTop !== scrollTop) {
      isScrollingRef.current = true;
      containerRef.current.scrollTop = scrollTop;
      
      // Reset scrolling flag after a short delay
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 100);
    }
  }, [scrollTop, syncScroll]);

  // Handle difference selection
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
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {document.name} • {(document.size / 1024).toFixed(1)} KB
        </p>
      </div>
      
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: 'auto' }}
      >
        <div className="p-6">
          <div
            ref={contentRef}
            className="prose prose-sm max-w-none dark:prose-invert font-mono text-sm leading-relaxed"
            style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
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

DocumentViewer.displayName = 'DocumentViewer';