import React, { useMemo } from 'react';
import { Plus, Minus, Edit, AlertTriangle, Info, FileText, Layout, Type, ChevronRight, ChevronDown } from 'lucide-react';
import { PreciseDifference, ComparisonStatistics, ComparisonSummary } from '../types/advanced';

interface PreciseDifferencesListProps {
  differences: PreciseDifference[];
  statistics: ComparisonStatistics;
  summary: ComparisonSummary;
  selectedDifference: string | null;
  onDifferenceSelect: (differenceId: string) => void;
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
  currentIndex: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const PreciseDifferencesList: React.FC<PreciseDifferencesListProps> = React.memo(({
  differences,
  statistics,
  summary,
  selectedDifference,
  onDifferenceSelect,
  onNavigateNext,
  onNavigatePrevious,
  currentIndex,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(new Set(['summary', 'differences']));
  const [filterType, setFilterType] = React.useState<string>('all');
  const [filterSeverity, setFilterSeverity] = React.useState<string>('all');

  const filteredDifferences = useMemo(() => {
    return differences.filter(diff => {
      const typeMatch = filterType === 'all' || diff.type === filterType;
      const severityMatch = filterSeverity === 'all' || diff.severity === filterSeverity;
      return typeMatch && severityMatch;
    });
  }, [differences, filterType, filterSeverity]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-3 w-3 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-3 w-3 text-orange-600" />;
      case 'medium':
        return <Info className="h-3 w-3 text-yellow-600" />;
      case 'low':
        return <Info className="h-3 w-3 text-blue-600" />;
      default:
        return <Info className="h-3 w-3 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'addition':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'deletion':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'modification':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'structure':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200';
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
            {statistics.totalDifferences} 差异
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            差异分析
          </h2>
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <Layout className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* 导航控制 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={onNavigatePrevious}
              disabled={currentIndex <= 0}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              上一个
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {currentIndex + 1} / {filteredDifferences.length}
            </span>
            <button
              onClick={onNavigateNext}
              disabled={currentIndex >= filteredDifferences.length - 1}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              下一个
            </button>
          </div>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="font-semibold text-green-600">{statistics.additions}</div>
            <div className="text-gray-600 dark:text-gray-400">新增</div>
          </div>
          <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <div className="font-semibold text-red-600">{statistics.deletions}</div>
            <div className="text-gray-600 dark:text-gray-400">删除</div>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className="font-semibold text-blue-600">{statistics.modifications}</div>
            <div className="text-gray-600 dark:text-gray-400">修改</div>
          </div>
          <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
            <div className="font-semibold text-purple-600">{statistics.structureChanges}</div>
            <div className="text-gray-600 dark:text-gray-400">结构</div>
          </div>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">类型过滤</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">全部类型</option>
              <option value="addition">新增</option>
              <option value="deletion">删除</option>
              <option value="modification">修改</option>
              <option value="structure">结构</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">严重程度</label>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="all">全部程度</option>
              <option value="critical">关键</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>
        </div>
      </div>

      {/* 摘要部分 */}
      <div className="border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={() => toggleSection('summary')}
          className="w-full p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
        >
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">对比摘要</span>
          {expandedSections.has('summary') ? 
            <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" /> :
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          }
        </button>
        {expandedSections.has('summary') && (
          <div className="px-3 pb-3 space-y-2">
            <div className="text-xs">
              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">相似度</div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${statistics.overallSimilarity * 100}%` }}
                ></div>
              </div>
              <div className="text-gray-600 dark:text-gray-400 mt-1">
                {(statistics.overallSimilarity * 100).toFixed(1)}%
              </div>
            </div>
            
            {summary.recommendations.length > 0 && (
              <div className="text-xs">
                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">建议</div>
                <ul className="space-y-1">
                  {summary.recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index} className="text-gray-600 dark:text-gray-400 flex items-start">
                      <span className="w-1 h-1 bg-gray-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 差异列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredDifferences.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            {filterType === 'all' && filterSeverity === 'all' ? '未发现差异' : '没有符合条件的差异'}
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredDifferences.map((diff, index) => (
              <button
                key={diff.id}
                onClick={() => onDifferenceSelect(diff.id)}
                className={`
                  w-full text-left p-3 rounded-lg border transition-all
                  ${selectedDifference === diff.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`flex items-center space-x-2 px-2 py-1 rounded border ${getTypeColor(diff.type)}`}>
                    {getTypeIcon(diff.type)}
                    <span className="text-xs font-medium">
                      {diff.type === 'addition' ? '新增' : 
                       diff.type === 'deletion' ? '删除' : 
                       diff.type === 'modification' ? '修改' : '结构'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getSeverityIcon(diff.severity)}
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getSeverityColor(diff.severity)}`}>
                      {diff.severity === 'critical' ? '关键' :
                       diff.severity === 'high' ? '高' :
                       diff.severity === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">
                    {diff.description}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>第 {diff.leftPosition.page} 页</span>
                    <span>•</span>
                    <span>第 {diff.leftPosition.line} 行</span>
                    <span>•</span>
                    <div className="flex items-center space-x-1">
                      {getCategoryIcon(diff.category)}
                      <span>
                        {diff.category === 'text' ? '文本' : 
                         diff.category === 'format' ? '格式' : '结构'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {diff.leftContent && (
                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded border-l-2 border-red-500">
                      <span className="font-medium">- </span>
                      {diff.leftContent.substring(0, 80)}
                      {diff.leftContent.length > 80 && '...'}
                    </div>
                  )}
                  {diff.rightContent && (
                    <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded border-l-2 border-green-500">
                      <span className="font-medium">+ </span>
                      {diff.rightContent.substring(0, 80)}
                      {diff.rightContent.length > 80 && '...'}
                    </div>
                  )}
                </div>
                
                {diff.confidence < 0.8 && (
                  <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    置信度: {(diff.confidence * 100).toFixed(0)}%
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

PreciseDifferencesList.displayName = 'PreciseDifferencesList';