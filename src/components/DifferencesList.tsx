import React from 'react';
import { Plus, Minus, Edit, FileText, Layout, Type } from 'lucide-react';
import { Difference, ComparisonStats } from '../types';

interface DifferencesListProps {
  differences: Difference[];
  stats: ComparisonStats;
  selectedDifference: string | null;
  onDifferenceSelect: (differenceId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const DifferencesList: React.FC<DifferencesListProps> = React.memo(({
  differences,
  stats,
  selectedDifference,
  onDifferenceSelect,
  isCollapsed,
  onToggleCollapse,
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'addition':
        return <Plus className="h-4 w-4" />;
      case 'deletion':
        return <Minus className="h-4 w-4" />;
      case 'modification':
        return <Edit className="h-4 w-4" />;
      default:
        return <Edit className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'text':
        return <Type className="h-3 w-3" />;
      case 'format':
        return <FileText className="h-3 w-3" />;
      case 'structure':
        return <Layout className="h-3 w-3" />;
      default:
        return <Type className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'addition':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'deletion':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'modification':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
        <button
          onClick={onToggleCollapse}
          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-gray-700 transition-colors"
        >
          <Layout className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center space-y-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 transform -rotate-90 whitespace-nowrap">
            {stats.totalDifferences} 差异
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            差异列表
          </h2>
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <Layout className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-green-600">{stats.additions}</div>
            <div className="text-gray-600 dark:text-gray-400">新增</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-red-600">{stats.deletions}</div>
            <div className="text-gray-600 dark:text-gray-400">删除</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-600">{stats.modifications}</div>
            <div className="text-gray-600 dark:text-gray-400">修改</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {differences.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            未发现差异
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {differences.map((diff) => (
              <button
                key={diff.id}
                onClick={() => onDifferenceSelect(diff.id)}
                className={`
                  w-full text-left p-3 rounded-lg border transition-all
                  ${selectedDifference === diff.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex items-center space-x-2 px-2 py-1 rounded ${getTypeColor(diff.type)}`}>
                    {getTypeIcon(diff.type)}
                    <span className="text-sm font-medium capitalize">
                      {diff.type === 'addition' ? '新增' : diff.type === 'deletion' ? '删除' : '修改'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getCategoryIcon(diff.category)}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {diff.category === 'text' ? '文本' : diff.category === 'format' ? '格式' : '结构'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {diff.leftContent && (
                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                      - {diff.leftContent.substring(0, 50)}
                      {diff.leftContent.length > 50 && '...'}
                    </div>
                  )}
                  {diff.rightContent && (
                    <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
                      + {diff.rightContent.substring(0, 50)}
                      {diff.rightContent.length > 50 && '...'}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  第 {diff.leftPosition.line + 1} 行 • {diff.severity === 'high' ? '高' : diff.severity === 'medium' ? '中' : '低'} 严重性
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

DifferencesList.displayName = 'DifferencesList';