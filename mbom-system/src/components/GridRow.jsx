import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTrackedBOM } from '../hooks/useTrackedBOM';
import { useTheme } from '../contexts/ThemeContext';
import { DrawingPreview } from './DrawingPreview';
import EnhancedLevelIndicator from './level/EnhancedLevelIndicator';

/**
 * 그리드의 개별 행 컴포넌트
 * 인라인 편집, 펼침/접힘, 액션 버튼 포함
 */
export const GridRow = ({ item, columns, isSelected, index, searchTerm = '', onContextMenu, onPreview, onDragStart, onDragOver, onDragLeave, onDrop, isDragging, isRecentlyMoved }) => {
  const { theme } = useTheme();
  const {
    toggleExpanded,
    expandedIds,
    setSelected,
    addSiblingTracked,
    addChildTracked,
    deleteItemTracked,
    updateItemTracked,
    indent,
    outdent,
    moveAfter
  } = useTrackedBOM();

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [isBlinking, setIsBlinking] = useState(false);
  const rowRef = useRef(null);

  const isExpanded = expandedIds.has(item.id);
  const hasChildren = item.children.length > 0;

  // 선택되었을 때 깜빡임 효과 및 스크롤
  useEffect(() => {
    if (isSelected && rowRef.current) {
      // 스크롤하여 해당 행을 보이게 함
      rowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 깜빡임 효과 시작
      setIsBlinking(true);
      const timer = setTimeout(() => {
        setIsBlinking(false);
      }, 2400); // 2.4초간 깜빡임 (0.6s * 4회)

      return () => clearTimeout(timer);
    }
  }, [isSelected]);

  // 텍스트 하이라이트 함수
  const highlightText = (text, search) => {
    if (!text || !search) return text;

    const searchLower = search.toLowerCase();
    const textStr = String(text);
    const textLower = textStr.toLowerCase();
    const index = textLower.indexOf(searchLower);

    if (index === -1) return textStr;

    return (
      <span>
        {textStr.substring(0, index)}
        <span className="search-highlight">
          {textStr.substring(index, index + search.length)}
        </span>
        {textStr.substring(index + search.length)}
      </span>
    );
  };

  // 셀 편집 시작
  const startEdit = useCallback((field, value) => {
    setEditingField(field);
    setEditValue(String(value || ''));
  }, []);

  // 셀 편집 완료
  const finishEdit = useCallback(() => {
    if (editingField) {
      updateItemTracked(item.id, editingField, editValue);
      setEditingField(null);
    }
  }, [editingField, editValue, item.id, updateItemTracked]);

  // 셀 편집 취소
  const cancelEdit = useCallback(() => {
    setEditingField(null);
    setEditValue('');
  }, []);

  // 키보드 핸들러
  const handleKeyDown = useCallback((e, field) => {
    if (e.key === 'Enter') {
      finishEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      finishEdit();
      // 다음 셀로 이동 (추후 구현)
    }
  }, [finishEdit, cancelEdit]);

  // 삭제 확인
  const handleDelete = useCallback(() => {
    if (hasChildren) {
      if (confirm(`"${item.data.partName}"의 하위 항목까지 모두 삭제됩니다. 계속하시겠습니까?`)) {
        deleteItemTracked(item.id);
      }
    } else {
      deleteItemTracked(item.id);
    }
  }, [item.id, item.data.partName, hasChildren, deleteItemTracked]);

  return (
    <tr
      ref={rowRef}
      className={`
        transition-all cursor-move relative
        ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}
        ${isSelected ? (theme === 'dark' ? 'bg-blue-700/40' : 'bg-blue-200/70') : ''}
        ${index % 2 === 0 ? (theme === 'dark' ? 'bg-gray-900/30' : 'bg-gray-50/50') : ''}
        ${isDragging ? 'opacity-30 bg-yellow-500/20' : ''}
        ${isRecentlyMoved ? 'animate-pulse' : ''}
      `}
      style={{
        ...(isDragging && {
          boxShadow: '0 0 20px rgba(250, 204, 21, 0.5)',
          border: '2px solid #facc15'
        }),
        ...(isRecentlyMoved && {
          boxShadow: '0 0 15px rgba(34, 197, 94, 0.5)',
          outline: '2px solid #22c55e',
          outlineOffset: '-1px'
        }),
        ...(isBlinking && {
          animation: 'rowBlink 0.6s ease-in-out 4'
        })
      }}
      draggable="true"
      onDragStart={(e) => onDragStart && onDragStart(e, item)}
      onDragOver={(e) => onDragOver && onDragOver(e, item)}
      onDragLeave={(e) => onDragLeave && onDragLeave(e)}
      onDrop={(e) => onDrop && onDrop(e, item)}
      onContextMenu={(e) => {
        e.preventDefault();
        setSelected(item.id);
        onContextMenu(e);
      }}
    >
      {/* 첫 번째 컬럼: 트리 구조 */}
      <td className={`sticky left-0 z-10 px-1 py-1 border ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`}>
        <EnhancedLevelIndicator
          level={item.level || 0}
          hasChildren={hasChildren}
          isExpanded={isExpanded}
          onToggle={() => toggleExpanded(item.id)}
          partType={item.data.partType}
          itemCount={item.children ? item.children.length : 0}
          criticalPath={item.data.criticalPath}
          changeStatus={item.data.diff_status}
        />
      </td>

      {/* 데이터 컬럼들 - 순서에 따른 출력 */}
      {columns.map((col, index) => {
        const value = item.data[col.field];
        const isImageField = col.field === 'image';
        const is2DField = col.field === 'drawing2d';
        const is3DField = col.field === 'drawing3d';
        const isRequired = col.required && !value;

        return (
          <td
            key={col.field}
            className={`px-1 py-0.5 border text-xs ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-300'
            } ${
              isRequired ? (theme === 'dark' ? 'bg-pink-900/30' : 'bg-pink-100') : ''
            }`}
            style={{ width: col.width }}
          >
            {editingField === col.field ? (
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={finishEdit}
                onKeyDown={(e) => handleKeyDown(e, col.field)}
                className={`w-full px-1 py-0.5 rounded border outline-none text-xs ${theme === 'dark' ? 'bg-gray-800 border-blue-500 text-white' : 'bg-white border-blue-400 text-gray-900'}`}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : isImageField ? (
              <div className="text-center">
                {value ? '🖼️' : <button className={`text-xs ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>📁</button>}
              </div>
            ) : (is2DField || is3DField) ? (
              <div className="text-center">
                {value === 'Y' ? (
                  <button
                    className={`px-2 py-1 rounded ${theme === 'dark' ? 'text-green-400 hover:text-green-300 hover:bg-green-900/30' : 'text-green-600 hover:text-green-700 hover:bg-green-100'}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(is2DField ? '2D' : '3D', item.data.partNumber, item.data.partName);
                    }}
                    title={`View ${is2DField ? '2D' : '3D'} Drawing`}
                  >
                    {is2DField ? '📋' : '📦'} ✓
                  </button>
                ) : (
                  <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>-</span>
                )}
              </div>
            ) : (
              <div
                className={`cursor-text px-1 py-0.5 rounded ${
                  theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
                } ${
                  col.editable !== false ? '' : 'opacity-50'
                }`}
                onDoubleClick={() => {
                  if (col.editable !== false) {
                    startEdit(col.field, item.data[col.field]);
                  }
                }}
              >
                {highlightText(value || '-', searchTerm)}
              </div>
            )}
          </td>
        );
      })}

    </tr>
  );
};