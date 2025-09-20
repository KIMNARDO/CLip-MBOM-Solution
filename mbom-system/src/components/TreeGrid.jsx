import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useBOM } from '../contexts/BOMContext';
import { useTheme } from '../contexts/ThemeContext';
import { GridRow } from './GridRow';
import { ContextMenu } from './ContextMenu';
import { HeaderContextMenu } from './HeaderContextMenu';
import { ColumnManager } from './ColumnManager';
import { DrawingPreview } from './DrawingPreview';

/**
 * 트리 구조 데이터 그리드 컴포넌트
 * BOM 데이터를 테이블 형태로 표시하고 편집
 */
export const TreeGrid = ({ searchTerm = '' }) => {
  const { theme } = useTheme();
  const {
    visibleItems,
    columns: originalColumns,
    selectedId,
    maxLevel,
    expandToLevel,
    collapseFromLevel,
    expandAll,
    collapseAll
  } = useBOM();

  const [contextMenu, setContextMenu] = useState({ show: false, position: { x: 0, y: 0 }, itemId: null });
  const [headerContextMenu, setHeaderContextMenu] = useState({
    show: false,
    position: { x: 0, y: 0 },
    columnField: null,
    columnHeader: null,
    isRequired: false
  });
  const [columns, setColumns] = useState(originalColumns);
  const [visibleColumns, setVisibleColumns] = useState(originalColumns.map(c => c.field));
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [resizing, setResizing] = useState(null);
  const [draggingColumn, setDraggingColumn] = useState(null);
  const [drawingPreview, setDrawingPreview] = useState({ show: false, type: '', partNumber: '', partName: '' });
  const [visibleLevels, setVisibleLevels] = useState(3); // 표시할 레벨 버튼 수
  const tableRef = useRef(null);

  // 표시할 컬럼만 필터링 (순서 유지)
  const displayColumns = useMemo(() => {
    // columns의 순서를 유지하면서 visibleColumns에 포함된 것만 필터링
    return columns.filter(col => visibleColumns.includes(col.field));
  }, [columns, visibleColumns]);

  // originalColumns가 변경될 때 columns 업데이트
  useEffect(() => {
    setColumns(originalColumns);
  }, [originalColumns]);

  // 검색 필터링
  const filteredItems = useMemo(() => {
    if (!searchTerm) return visibleItems;

    const lowerSearch = searchTerm.toLowerCase();
    return visibleItems.filter(item => {
      return (
        item.data.partNumber?.toLowerCase().includes(lowerSearch) ||
        item.data.partName?.toLowerCase().includes(lowerSearch) ||
        item.data.material?.toLowerCase().includes(lowerSearch)
      );
    });
  }, [visibleItems, searchTerm]);

  // 컬럼 크기 조절 시작
  const handleMouseDown = useCallback((columnField, e) => {
    e.preventDefault();
    const index = columns.findIndex(col => col.field === columnField);
    if (index !== -1) {
      setResizing({ index, startX: e.pageX, startWidth: columns[index].width || 100 });
    }
  }, [columns]);

  // 마우스 이동 처리
  const handleMouseMove = useCallback((e) => {
    if (!resizing) return;

    const diff = e.pageX - resizing.startX;
    const newWidth = Math.max(40, resizing.startWidth + diff);

    setColumns(prev => {
      const newColumns = [...prev];
      newColumns[resizing.index] = { ...newColumns[resizing.index], width: newWidth };
      return newColumns;
    });
  }, [resizing]);

  // 마우스 떼기 처리
  const handleMouseUp = useCallback(() => {
    setResizing(null);
  }, []);

  // 마우스 이벤트 등록
  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing, handleMouseMove, handleMouseUp]);

  // 컬럼 드래그 시작
  const handleDragStart = useCallback((e, columnField) => {
    const index = columns.findIndex(col => col.field === columnField);
    if (index !== -1) {
      setDraggingColumn(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.target.innerHTML);
    }
  }, [columns]);

  // 컬럼 드래그 오버
  const handleDragOver = useCallback((e) => {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
  }, []);

  // 컬럼 드롭
  const handleDrop = useCallback((e, dropColumnField) => {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    const dropIndex = columns.findIndex(col => col.field === dropColumnField);
    if (draggingColumn !== null && draggingColumn !== dropIndex && dropIndex !== -1) {
      const newColumns = [...columns];
      const draggedColumn = newColumns[draggingColumn];
      newColumns.splice(draggingColumn, 1);
      newColumns.splice(dropIndex, 0, draggedColumn);
      setColumns(newColumns);
    }

    setDraggingColumn(null);
    return false;
  }, [draggingColumn, columns]);

  // 도면 미리보기 핸들러
  const handlePreview = useCallback((type, partNumber, partName) => {
    setDrawingPreview({ show: true, type, partNumber, partName });
  }, []);

  // 컬럼 삭제 핸들러
  const handleDeleteColumn = useCallback((columnField) => {
    // visibleColumns에서 제거
    setVisibleColumns(prev => prev.filter(field => field !== columnField));
  }, []);

  // 헤더 우클릭 핸들러
  const handleHeaderContextMenu = useCallback((e, columnField) => {
    e.preventDefault();
    const column = columns.find(c => c.field === columnField);
    if (column) {
      setHeaderContextMenu({
        show: true,
        position: { x: e.pageX, y: e.pageY },
        columnField: column.field,
        columnHeader: column.header,
        isRequired: column.required || false
      });
    }
  }, [columns]);

  // 컬럼 너비 자동 맞춤
  const handleAutoFitColumn = useCallback((columnField) => {
    // 컬럼 내용에 맞게 너비 자동 조정 (구현 예시)
    setColumns(prev => {
      const newColumns = [...prev];
      const index = newColumns.findIndex(c => c.field === columnField);
      if (index !== -1) {
        // 기본 자동 너비 설정 (실제로는 내용을 측정해야 함)
        newColumns[index] = { ...newColumns[index], width: 150 };
      }
      return newColumns;
    });
  }, []);

  // 컬럼 너비 초기화
  const handleResetColumnWidth = useCallback((columnField) => {
    const originalColumn = originalColumns.find(c => c.field === columnField);
    if (originalColumn) {
      setColumns(prev => {
        const newColumns = [...prev];
        const index = newColumns.findIndex(c => c.field === columnField);
        if (index !== -1) {
          newColumns[index] = { ...newColumns[index], width: originalColumn.width || 100 };
        }
        return newColumns;
      });
    }
  }, [originalColumns]);

  // 컬럼 헤더 그룹 정보
  const columnGroups = [
    { title: '기본 정보', columns: ['customer', 'carModel', 'project'] },
    { title: '품번 정보', columns: ['partNumber', 'sonPartNumber', 'altPartNumber'] },
    { title: '제질 정보', columns: ['material', 'surfaceTreatment'], bgColor: theme === 'dark' ? 'bg-yellow-800' : 'bg-yellow-200' },
    { title: '도면', columns: ['drawing2d', 'drawing3d'] },
    { title: '변경', columns: ['eoNo', 'changeNotice'] },
    { title: '제품/제조', columns: ['mfg1', 'mfg2', 'mfg3'] }
  ];

  // 컬럼이 어떤 그룹에 속하는지 찾기
  const getColumnGroup = (field) => {
    return columnGroups.find(group => group.columns.includes(field));
  };

  // 동적 헤더 렌더링
  const renderHeaders = () => {
    const topHeaders = [];
    const bottomHeaders = [];
    let currentGroup = null;
    let groupStartIdx = 0;
    let groupColCount = 0;

    displayColumns.forEach((col, idx) => {
      const group = getColumnGroup(col.field);

      // rowSpan이 2인 독립 컬럼들
      if (['partName', 'image', 'type', 'remarks', 'quantity'].includes(col.field)) {
        // 그룹이 있었다면 종료
        if (currentGroup) {
          topHeaders.push(
            <th key={currentGroup.title}
                colSpan={groupColCount}
                className={`px-2 py-1 border text-center ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'} ${currentGroup.bgColor || ''}`}>
              {currentGroup.title}
            </th>
          );
          currentGroup = null;
          groupColCount = 0;
        }

        // rowSpan 헤더 추가
        topHeaders.push(
          <th key={col.field}
              rowSpan="2"
              className={`px-2 py-1 border text-center relative cursor-move group transition-colors ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700/50' : 'border-gray-300 hover:bg-gray-200/50'} ${
                col.field === 'quantity' ? (theme === 'dark' ? 'bg-orange-800' : 'bg-orange-200') : ''
              }`}
              style={{ width: col.width || 100 }}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, col.field)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.field)}
              onContextMenu={(e) => handleHeaderContextMenu(e, col.field)}>
            {col.header}
            <div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize ${theme === 'dark' ? 'hover:bg-blue-500' : 'hover:bg-blue-400'}`}
                 onMouseDown={(e) => handleMouseDown(col.field, e)} />
          </th>
        );
      } else if (group) {
        // 그룹에 속하는 컬럼
        if (currentGroup !== group) {
          // 이전 그룹 종료
          if (currentGroup) {
            topHeaders.push(
              <th key={currentGroup.title}
                  colSpan={groupColCount}
                  className={`px-2 py-1 border text-center ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'} ${currentGroup.bgColor || ''}`}>
                {currentGroup.title}
              </th>
            );
          }
          // 새 그룹 시작
          currentGroup = group;
          groupStartIdx = idx;
          groupColCount = 1;
        } else {
          groupColCount++;
        }

        // 하단 헤더 추가
        bottomHeaders.push(
          <th key={col.field}
              className={`px-2 py-1 border text-center relative cursor-move group transition-colors ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700/50' : 'border-gray-300 hover:bg-gray-200/50'} ${
                group.bgColor ? (theme === 'dark' ? group.bgColor.replace('bg-yellow-800', 'bg-yellow-900') : group.bgColor.replace('bg-yellow-200', 'bg-yellow-100')) : ''
              }`}
              style={{ width: col.width || 100 }}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, col.field)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.field)}
              onContextMenu={(e) => handleHeaderContextMenu(e, col.field)}>
            {col.header}
            <div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize ${theme === 'dark' ? 'hover:bg-blue-500' : 'hover:bg-blue-400'}`}
                 onMouseDown={(e) => handleMouseDown(col.field, e)} />
          </th>
        );
      }
    });

    // 마지막 그룹 처리
    if (currentGroup) {
      topHeaders.push(
        <th key={currentGroup.title}
            colSpan={groupColCount}
            className={`px-2 py-1 border border-gray-600 text-center ${currentGroup.bgColor || ''}`}>
          {currentGroup.title}
        </th>
      );
    }

    return { topHeaders, bottomHeaders };
  };

  const { topHeaders, bottomHeaders } = renderHeaders();

  return (
    <div className={`flex-1 overflow-auto ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`} ref={tableRef}>
      <div className="min-w-full">
        <table
          className="w-full border-collapse"
          style={{ userSelect: resizing ? 'none' : 'auto' }}
          onContextMenu={(e) => {
            // 빈 공간 우클릭 처리 (테이블이나 tbody 직접 클릭 시)
            if (e.target.closest('tbody') && !e.target.closest('tr')) {
              e.preventDefault();
              setContextMenu({
                show: true,
                position: { x: e.pageX, y: e.pageY },
                itemId: null  // itemId가 null이면 루트 추가 메뉴 표시
              });
            }
          }}>
          <thead className={`sticky top-0 z-20 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
            {/* 상단 그룹 헤더 */}
            <tr className={`text-xs ${theme === 'dark' ? 'bg-blue-900 text-white' : 'bg-blue-100 text-gray-900'}`}>
              <th rowSpan="2" className={`sticky left-0 z-30 px-1 py-1 border w-[60px] ${theme === 'dark' ? 'bg-blue-900 border-gray-600' : 'bg-blue-100 border-gray-300'}`}>
                <div className="flex flex-col items-center gap-0.5">
                  {/* 상단: Level 타이틀 */}
                  <div className="text-[10px] font-normal mb-0.5">
                    Level
                  </div>

                  {/* 중단: 숫자 버튼들 (0-3 기본) */}
                  <div className="flex items-center gap-[1px]">
                    {[...Array(Math.min(4, maxLevel + 1))].map((_, level) => (
                      <button
                        key={level}
                        onClick={() => expandToLevel(level)}
                        className={`w-3 h-3 text-[9px] border flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-500' : 'bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-400'}`}
                        title={`Expand to level ${level}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>

                  {/* 하단: 전역 컨트롤 (-/+) */}
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <button
                      onClick={collapseAll}
                      className={`w-4 h-3 text-[10px] border flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-500' : 'bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-400'}`}
                      title="Collapse all"
                    >
                      -
                    </button>
                    <button
                      onClick={expandAll}
                      className={`w-4 h-3 text-[10px] border flex items-center justify-center transition-colors ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-500' : 'bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-400'}`}
                      title="Expand all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </th>
              {topHeaders}
            </tr>
            {/* 하단 개별 헤더 */}
            <tr className={`text-xs ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-50 text-gray-900'}`}>
              {bottomHeaders}
            </tr>
          </thead>

          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={displayColumns.length + 1}
                  className={`text-center py-8 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}
                >
                  데이터가 없습니다. 루트 항목을 추가하세요.
                </td>
              </tr>
            ) : (
              filteredItems.map((item, index) => (
                <GridRow
                  key={item.id}
                  item={item}
                  columns={displayColumns}
                  isSelected={selectedId === item.id}
                  index={index}
                  searchTerm={searchTerm}
                  onPreview={handlePreview}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({
                      show: true,
                      position: { x: e.pageX, y: e.pageY },
                      itemId: item.id
                    });
                  }}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 컨텍스트 메뉴 */}
      <ContextMenu
        show={contextMenu.show}
        position={contextMenu.position}
        itemId={contextMenu.itemId}
        onClose={() => setContextMenu({ show: false, position: { x: 0, y: 0 }, itemId: null })}
        onColumnManager={() => setShowColumnManager(true)}
      />

      {/* 헤더 컨텍스트 메뉴 */}
      <HeaderContextMenu
        show={headerContextMenu.show}
        position={headerContextMenu.position}
        columnField={headerContextMenu.columnField}
        columnHeader={headerContextMenu.columnHeader}
        isRequired={headerContextMenu.isRequired}
        onClose={() => setHeaderContextMenu({
          show: false,
          position: { x: 0, y: 0 },
          columnField: null,
          columnHeader: null,
          isRequired: false
        })}
        onDelete={handleDeleteColumn}
        onColumnManager={() => setShowColumnManager(true)}
        onAutoFit={handleAutoFitColumn}
        onResetWidth={handleResetColumnWidth}
      />

      {/* 컬럼 관리 다이얼로그 */}
      <ColumnManager
        show={showColumnManager}
        columns={columns}
        visibleColumns={visibleColumns}
        onClose={() => setShowColumnManager(false)}
        onApply={(selected) => setVisibleColumns(selected)}
      />

      {/* 도면 미리보기 */}
      <DrawingPreview
        show={drawingPreview.show}
        type={drawingPreview.type}
        partNumber={drawingPreview.partNumber}
        partName={drawingPreview.partName}
        onClose={() => setDrawingPreview({ show: false, type: '', partNumber: '', partName: '' })}
      />
    </div>
  );
};