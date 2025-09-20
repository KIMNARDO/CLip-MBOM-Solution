import React, { useCallback } from 'react';
import { useBOM } from '../contexts/BOMContext';
import { useTheme } from '../contexts/ThemeContext';

/**
 * 사이드바 트리 뷰 컴포넌트
 * 그리드와 동기화된 트리 구조 표시
 */
export const Sidebar = ({ searchTerm = '' }) => {
  const { theme } = useTheme();
  const {
    itemsById,
    rootIds,
    expandedIds,
    selectedId,
    toggleExpanded,
    setSelected
  } = useBOM();

  /**
   * 검색어 매칭 확인
   */
  const matchesSearch = useCallback((item) => {
    if (!searchTerm) return true;
    const lowerSearch = searchTerm.toLowerCase();
    return (
      item.data.partNumber?.toLowerCase().includes(lowerSearch) ||
      item.data.partName?.toLowerCase().includes(lowerSearch)
    );
  }, [searchTerm]);

  // 레벨별 색상 (EnhancedLevelIndicator와 동일)
  const getLevelColor = useCallback((level) => {
    const colors = {
      dark: {
        0: { bg: 'rgba(102, 126, 234, 0.15)', border: '#667eea', text: '#667eea' },
        1: { bg: 'rgba(245, 87, 108, 0.15)', border: '#f5576c', text: '#f5576c' },
        2: { bg: 'rgba(0, 242, 254, 0.15)', border: '#00f2fe', text: '#00f2fe' },
        3: { bg: 'rgba(56, 249, 215, 0.15)', border: '#38f9d7', text: '#38f9d7' },
        4: { bg: 'rgba(254, 225, 64, 0.15)', border: '#fee140', text: '#fee140' },
        default: { bg: 'rgba(168, 237, 234, 0.15)', border: '#a8edea', text: '#a8edea' }
      },
      light: {
        0: { bg: 'rgba(102, 126, 234, 0.08)', border: '#667eea', text: '#667eea' },
        1: { bg: 'rgba(245, 87, 108, 0.08)', border: '#f5576c', text: '#f5576c' },
        2: { bg: 'rgba(79, 172, 254, 0.08)', border: '#4facfe', text: '#4facfe' },
        3: { bg: 'rgba(67, 233, 123, 0.08)', border: '#43e97b', text: '#43e97b' },
        4: { bg: 'rgba(250, 112, 154, 0.08)', border: '#fa709a', text: '#fa709a' },
        default: { bg: 'rgba(224, 224, 224, 0.3)', border: '#d0d0d0', text: '#666666' }
      }
    };

    const themeColors = theme === 'dark' ? colors.dark : colors.light;
    return themeColors[level] || themeColors.default;
  }, [theme]);

  /**
   * 트리 노드 렌더링 (재귀)
   */
  const renderNode = useCallback((item) => {
    // 검색어가 있을 때 매칭되지 않으면 렌더링 안 함
    const itemMatches = matchesSearch(item);
    const hasMatchingChildren = item.children.some(childId => {
      const child = itemsById[childId];
      return child && matchesSearch(child);
    });

    if (searchTerm && !itemMatches && !hasMatchingChildren) {
      return null;
    }

    const isExpanded = expandedIds.has(item.id) || searchTerm; // 검색 시 자동 펼침
    const isSelected = selectedId === item.id;
    const hasChildren = item.children.length > 0;

    return (
      <div key={item.id}>
        <div
          className={`sidebar-tree-item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${item.level * 16 + 8}px` }}
          onContextMenu={(e) => {
            e.preventDefault();
            setSelected(item.id);
          }}
        >
          {/* 펼침/접힘 아이콘 - Level 0에만 폴더, 나머지는 expand/collapse 아이콘 */}
          {item.level === 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleExpanded(item.id);
              }}
              className="sidebar-folder-icon"
            >
              {hasChildren && isExpanded ? '📂' : '📁'}
            </button>
          ) : (
            hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(item.id);
                }}
                className="sidebar-expand-btn"
              >
                {isExpanded ? '▾' : '▸'}
              </button>
            ) : (
              <span className="w-4 h-4 inline-block" />
            )
          )}

          {/* 아이템 정보 - 검색 매칭 시 하이라이트 */}
          <span className={`sidebar-item-text ${itemMatches && searchTerm ? 'search-match' : ''}`}>
            {item.data.partNumber || 'No Number'}
          </span>

          {/* 레벨 표시 */}
          <span
            className="sidebar-level-badge"
            style={{
              background: getLevelColor(item.level).bg,
              border: `1px solid ${getLevelColor(item.level).border}`,
              color: getLevelColor(item.level).text,
              borderRadius: '4px',
              padding: '1px 6px',
              fontSize: '10px',
              fontWeight: '600',
              marginLeft: '4px'
            }}
          >
            L{item.level}
          </span>

          {/* 자식 개수 표시 */}
          {hasChildren && (
            <span className="text-xs text-gray-400 ml-1">
              ({item.children.length})
            </span>
          )}
        </div>

        {/* 자식 노드들 (펼쳐진 경우) */}
        {isExpanded && hasChildren && (
          <div>
            {item.children.map(childId => {
              const child = itemsById[childId];
              if (!child) return null;
              const renderedChild = renderNode(child);
              return renderedChild;
            })}
          </div>
        )}
      </div>
    );
  }, [itemsById, expandedIds, selectedId, toggleExpanded, setSelected, matchesSearch, searchTerm, getLevelColor]);

  return (
    <div className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>

      <div className="py-2">
        {rootIds.length === 0 ? (
          <div className={`text-center py-4 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
            No items
          </div>
        ) : (
          <>
            {searchTerm && (
              <div className="px-4 py-1 text-xs text-blue-400 border-b border-gray-700 mb-2">
                검색결과: "{searchTerm}"
              </div>
            )}
            {rootIds.map(rootId => {
              const root = itemsById[rootId];
              if (!root) return null;
              const renderedRoot = renderNode(root);
              return renderedRoot;
            })}
          </>
        )}
      </div>
    </div>
  );
};