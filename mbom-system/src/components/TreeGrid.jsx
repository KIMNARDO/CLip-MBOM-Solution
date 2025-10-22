import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useTrackedBOM } from '../hooks/useTrackedBOM';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { GridRow } from './GridRow';
import { ContextMenu } from './ContextMenu';
import { HeaderContextMenu } from './HeaderContextMenu';
import { ColumnManager } from './ColumnManager';
import { DrawingPreview } from './DrawingPreview';
import AddColumnDialog from './dialogs/AddColumnDialog';
import ConfirmDialog from './dialogs/ConfirmDialog';

/**
 * 트리 구조 데이터 그리드 컴포넌트
 * BOM 데이터를 테이블 형태로 표시하고 편집
 */
export const TreeGrid = ({ searchTerm = '' }) => {
  const { theme } = useTheme();
  const { showInfo, showWarning } = useNotification();
  const {
    visibleItems,
    columns: originalColumns,
    selectedId,
    maxLevel,
    expandToLevel,
    collapseFromLevel,
    expandAll,
    collapseAll,
    moveAfterTracked,
    moveBeforeTracked,
    copyItem,
    pasteItem,
    duplicateItem,
    deleteItemTracked,
    itemsById
  } = useTrackedBOM();

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
  const [draggingRow, setDraggingRow] = useState(null);
  const [dragOverRow, setDragOverRow] = useState(null);
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const [previewLevel, setPreviewLevel] = useState(null);
  const [drawingPreview, setDrawingPreview] = useState({ show: false, type: '', partNumber: '', partName: '' });
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    onCancel: () => {}
  });
  const [pendingMove, setPendingMove] = useState(null);
  const [visibleLevels, setVisibleLevels] = useState(3); // 표시할 레벨 버튼 수
  const [showAddColumnDialog, setShowAddColumnDialog] = useState(false);
  const [recentlyMovedId, setRecentlyMovedId] = useState(null); // 최근 이동된 아이템 추적
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

  // 디버깅: 레벨별 아이템 수 확인
  useEffect(() => {
    const levelCounts = {};
    visibleItems.forEach(item => {
      const level = item.level || 0;
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });
    console.log('레벨별 아이템 수:', levelCounts);
    console.log('전체 아이템:', visibleItems);
  }, [visibleItems]);

  // 초기 로드 시 모든 레벨 확장
  useEffect(() => {
    // 최대 레벨 3까지 확장
    expandToLevel(3);
  }, [expandToLevel]);


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

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + C: 복사
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedId) {
        e.preventDefault();
        const item = itemsById[selectedId];
        if (item) {
          const hasChildren = item.children && item.children.length > 0;
          // Shift 키를 함께 누르면 자식 포함 복사
          if (copyItem(selectedId, e.shiftKey && hasChildren)) {
            const message = e.shiftKey && hasChildren
              ? `"${item.data.partName}" 및 하위 항목들이 클립보드에 복사되었습니다.`
              : `"${item.data.partName}"이(가) 클립보드에 복사되었습니다.`;
            showInfo(message);
          }
        }
      }

      // Ctrl/Cmd + V: 붙여넣기
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && selectedId) {
        e.preventDefault();
        const copiedData = sessionStorage.getItem('copiedBOMItem');
        if (copiedData) {
          // Shift 키를 함께 누르면 강제로 레벨 변경하여 붙여넣기
          if (pasteItem(selectedId, e.shiftKey)) {
            const message = e.shiftKey
              ? '항목이 다른 레벨로 붙여넣기되었습니다.'
              : '항목이 붙여넣기되었습니다.';
            showInfo(message);
          } else {
            showWarning('붙여넣기에 실패했습니다.');
          }
        }
      }

      // Ctrl/Cmd + D: 복제
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        const item = itemsById[selectedId];
        if (item) {
          const hasChildren = item.children && item.children.length > 0;
          // Shift 키를 함께 누르면 자식 포함 복제
          duplicateItem(selectedId, e.shiftKey && hasChildren);
          const message = e.shiftKey && hasChildren
            ? `"${item.data.partName}" 및 하위 항목들이 복제되었습니다.`
            : `"${item.data.partName}"이(가) 복제되었습니다.`;
          showInfo(message);
        }
      }

      // Delete: 삭제
      if (e.key === 'Delete' && selectedId) {
        e.preventDefault();
        const item = itemsById[selectedId];
        if (item) {
          const hasChildren = item.children && item.children.length > 0;
          setConfirmDialog({
            show: true,
            title: '항목 삭제 확인',
            message: hasChildren
              ? `"${item.data.partName}"의 하위 항목까지 모두 삭제됩니다.\n계속하시겠습니까?`
              : `"${item.data.partName}"을(를) 삭제하시겠습니까?`,
            type: 'danger',
            confirmText: '삭제',
            cancelText: '취소',
            onConfirm: () => {
              deleteItemTracked(selectedId);
              showInfo(`"${item.data.partName}"이(가) 삭제되었습니다.`);
              setConfirmDialog(prev => ({ ...prev, show: false }));
            },
            onCancel: () => {
              setConfirmDialog(prev => ({ ...prev, show: false }));
            }
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedId, itemsById, showInfo, showWarning, copyItem, pasteItem, duplicateItem, deleteItemTracked]);

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

  // 행 드래그 시작
  const handleRowDragStart = useCallback((e, item) => {
    console.log('🎯 Drag start:', {
      id: item.id,
      name: item.data.partName,
      level: item.level,
      parentId: item.parentId,
      partNumber: item.data.partNumber
    });
    setDraggingRow(item);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.id);
    // 드래그 이미지 설정
    const dragImage = e.currentTarget.cloneNode(true);
    dragImage.style.opacity = '0.5';
    dragImage.style.position = 'absolute';
    dragImage.style.top = '-1000px';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, e.clientX - e.currentTarget.getBoundingClientRect().left, 20);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, []);

  // 행 드래그 오버
  const handleRowDragOver = useCallback((e, targetItem) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // 드래그 중인 아이템이 있을 때만 예상 레벨 계산
    if (draggingRow && targetItem) {
      setDragOverTarget(targetItem);

      // 예상 레벨 계산
      let expectedLevel = draggingRow.level;

      // 같은 레벨인 경우 유지
      if (draggingRow.level === targetItem.level) {
        expectedLevel = draggingRow.level;
      }
      // 아이템이 바로 위 부모 레벨로 이동하는 경우 (자식 포함 가능)
      else if (draggingRow.level === targetItem.level + 1) {
        // Level 2 → Level 1 부모
        if (draggingRow.level === 2 && targetItem.level === 1) {
          expectedLevel = 2; // Level 2 유지
        }
        // Level 3 → Level 2 부모
        else if (draggingRow.level === 3 && targetItem.level === 2) {
          expectedLevel = 3; // Level 3 유지
        }
        // Level 1 → Level 0 부모
        else if (draggingRow.level === 1 && targetItem.level === 0) {
          expectedLevel = 1; // Level 1 유지
        }
        else {
          expectedLevel = null; // 이동 불가
        }
      }
      else {
        expectedLevel = null; // 이동 불가
      }

      setPreviewLevel(expectedLevel);
    }

    // 드래그 오버 색상
    let borderColor = '#4facfe'; // 파란색

    // 드래그 오버 표시
    if (e.currentTarget.tagName === 'TR') {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;

      // 위쪽 절반에 있으면 위에 표시, 아래쪽 절반에 있으면 아래에 표시
      if (y < height / 2) {
        e.currentTarget.style.borderTop = `3px solid ${borderColor}`;
        e.currentTarget.style.borderBottom = '';
      } else {
        e.currentTarget.style.borderTop = '';
        e.currentTarget.style.borderBottom = `3px solid ${borderColor}`;
      }

      // 배경색 변경
      e.currentTarget.style.backgroundColor = 'rgba(79, 172, 254, 0.1)';
    }
  }, [draggingRow]);

  // 행 드래그 리브
  const handleRowDragLeave = useCallback((e) => {
    if (e.currentTarget.tagName === 'TR') {
      e.currentTarget.style.borderTop = '';
      e.currentTarget.style.borderBottom = '';
      e.currentTarget.style.backgroundColor = ''; // 배경색 초기화
    }
    setDragOverTarget(null);
    setPreviewLevel(null);
  }, []);

  // 행 드롭
  const handleRowDrop = useCallback((e, targetItem) => {
    e.preventDefault();
    e.stopPropagation();

    // 드래그 오버 스타일 제거
    if (e.currentTarget.tagName === 'TR') {
      e.currentTarget.style.borderTop = '';
      e.currentTarget.style.borderBottom = '';
      e.currentTarget.style.backgroundColor = ''; // 배경색 초기화
    }

    console.log('🔄 TreeGrid Version: 2.0 - Multi-level movement enabled');
    console.log('📍 Drop target:', {
      id: targetItem.id,
      name: targetItem.data.partName,
      level: targetItem.level,
      parentId: targetItem.parentId,
      partNumber: targetItem.data.partNumber
    });
    console.log('📦 Dragging item:', draggingRow ? {
      id: draggingRow.id,
      name: draggingRow.data.partName,
      level: draggingRow.level,
      parentId: draggingRow.parentId,
      partNumber: draggingRow.data.partNumber
    } : null);

    if (draggingRow && draggingRow.id !== targetItem.id) {
      // 자기 자신의 자손으로 이동하는 것은 방지 (순환 참조 방지)
      const isDescendant = (parentId, childId) => {
        if (!parentId) return false;
        const parent = itemsById[parentId];
        if (!parent) return false;
        if (parent.id === childId) return true;
        return parent.children.some(c => isDescendant(c, childId));
      };

      if (isDescendant(draggingRow.id, targetItem.id)) {
        console.log('❌ 자기 자신의 하위로는 이동할 수 없습니다');
        showWarning('자기 자신의 하위 항목으로는 이동할 수 없습니다.');
        setDraggingRow(null);
        return;
      }

      // 드롭 위치에 따라 이동 방식 결정
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;
      const dropPosition = y < height / 2 ? 'before' : 'after';

      console.log('Drop position:', dropPosition, 'Y:', y, 'Height:', height);

      // BOM 설계 원칙에 따른 이동 규칙 결정
      const draggingLevel = draggingRow.level;
      const targetLevel = targetItem.level;
      const targetParentId = targetItem.parentId;
      const hasChildren = draggingRow.children && draggingRow.children.length > 0;

      // 실제 이동 위치를 정확하게 파악
      let destinationLevel = targetLevel; // 기본적으로 타겟과 같은 레벨
      let destinationParentId = targetParentId; // 기본적으로 타겟과 같은 부모

      let newLevel = draggingLevel; // 기본적으로 현재 레벨 유지
      let newParentId = null;
      let moveBefore = dropPosition === 'before';
      let moveAsChild = false;
      let validMove = true;
      let warningMessage = '';

      // 디버깅: 실제 이동 위치 확인
      console.log('🎯 이동 분석:', {
        draggingItem: draggingRow.data.partNumber,
        draggingLevel: draggingLevel,
        targetItem: targetItem.data.partNumber,
        targetLevel: targetLevel,
        targetParent: targetParentId,
        dropPosition: dropPosition
      });

      // 기본 이동 규칙 적용
      // 일반 드래그는 타겟과 같은 위치(형제)로 이동
      destinationLevel = targetLevel;
      destinationParentId = targetParentId;

      // 같은 레벨끼리 이동 (자식 여부 무관)
      if (draggingLevel === destinationLevel) {
          newLevel = draggingLevel; // 레벨 유지
          newParentId = destinationParentId; // 타겟과 같은 부모

          console.log('✅ 같은 레벨 이동:', {
            from: `Level ${draggingLevel}`,
            to: `Level ${destinationLevel}`,
            newParent: destinationParentId
          });
        }
        // 다른 레벨로 이동 시도
        else {
          // Level 2 아이템이 Level 1 부모로 이동하는 경우 - 자동으로 자식이 됨 (자식 포함 가능)
          if (draggingLevel === 2 && destinationLevel === 1) {
            // Level 2는 Level 1의 자식이 되는 것이 자연스러운 계층 구조
            newLevel = 2; // Level 2 유지
            newParentId = targetItem.id; // 타겟 Level 1이 부모가 됨
            moveAsChild = true;
            moveBefore = false;

            console.log('✅ Level 2 → Level 1 부모로 이동 (자식 포함):', {
              item: draggingRow.data.partNumber,
              newParent: targetItem.data.partNumber,
              level: 'Level 2 유지',
              withChildren: hasChildren
            });
          }
          // Level 3 아이템이 Level 2 부모로 이동하는 경우 - 자동으로 자식이 됨 (자식 포함 가능)
          else if (draggingLevel === 3 && destinationLevel === 2) {
            // Level 3는 Level 2의 자식이 되는 것이 자연스러운 계층 구조
            newLevel = 3; // Level 3 유지
            newParentId = targetItem.id; // 타겟 Level 2가 부모가 됨
            moveAsChild = true;
            moveBefore = false;

            console.log('✅ Level 3 → Level 2 부모로 이동 (자식 포함):', {
              item: draggingRow.data.partNumber,
              newParent: targetItem.data.partNumber,
              level: 'Level 3 유지',
              withChildren: hasChildren
            });
          }
          // Level 1 아이템이 Level 0 부모로 이동하는 경우 - 자동으로 자식이 됨 (자식 포함 가능)
          else if (draggingLevel === 1 && destinationLevel === 0) {
            // Level 1은 Level 0의 자식이 되는 것이 자연스러운 계층 구조
            newLevel = 1; // Level 1 유지
            newParentId = targetItem.id; // 타겟 Level 0이 부모가 됨
            moveAsChild = true;
            moveBefore = false;

            console.log('✅ Level 1 → Level 0 부모로 이동 (자식 포함):', {
              item: draggingRow.data.partNumber,
              newParent: targetItem.data.partNumber,
              level: 'Level 1 유지',
              withChildren: hasChildren
            });
          }
          // 그 외의 경우는 레벨 변경 불가
          else {
            validMove = false;
            // 더 명확한 메시지로 변경
            warningMessage = `Level ${draggingLevel} 아이템을 Level ${destinationLevel} 위치로 직접 이동할 수 없습니다.`;
          }
        }

      // 부모가 자식 레벨이 될 수 없는지 검증
      if (validMove && hasChildren && newLevel > draggingLevel) {
        validMove = false;
        warningMessage = '자식이 있는 부모는 더 낮은 레벨(자식 레벨)로 이동할 수 없습니다.';
      }

      // 이동 불가능한 경우 경고 표시
      if (!validMove) {
        console.log('❌ 이동 불가:', warningMessage);
        showWarning(warningMessage);
        setDraggingRow(null);
        setDragOverRow(null);
        return;
      }

      console.log('✅ 아이템 이동:', {
        from: draggingRow.data.partNumber,
        to: targetItem.data.partNumber,
        fromLevel: draggingLevel,
        toLevel: newLevel,
        levelChange: draggingLevel !== newLevel ? `Level ${draggingLevel} → Level ${newLevel}` : 'Level 유지',
        fromParent: draggingRow.parentId,
        toParent: newParentId,
        moveAsChild: moveAsChild,
        moveBefore: moveBefore,
        hasChildren: hasChildren,
        childCount: draggingRow.children ? draggingRow.children.length : 0
      });

      // moveAfterTracked에 새 레벨과 새 부모 전달
      if (moveAsChild) {
        // 타겟의 자식으로 이동하는 경우
        moveAfterTracked(draggingRow.id, null, newLevel, newParentId);
        showInfo(`"${draggingRow.data.partName}"을(를) "${targetItem.data.partName}"의 자식으로 이동했습니다.`);
      } else if (moveBefore) {
        // 타겟 앞으로 이동
        moveBeforeTracked(draggingRow.id, targetItem.id, newLevel, newParentId);
        if (draggingLevel !== newLevel) {
          showInfo(`"${draggingRow.data.partName}"을(를) Level ${draggingLevel}에서 Level ${newLevel}로 이동했습니다.`);
        } else {
          showInfo(`"${draggingRow.data.partName}"을(를) "${targetItem.data.partName}" 앞으로 이동했습니다.`);
        }
      } else {
        // 타겟 뒤로 이동
        moveAfterTracked(draggingRow.id, targetItem.id, newLevel, newParentId);
        if (draggingLevel !== newLevel) {
          showInfo(`"${draggingRow.data.partName}"을(를) Level ${draggingLevel}에서 Level ${newLevel}로 이동했습니다.`);
        } else {
          showInfo(`"${draggingRow.data.partName}"을(를) "${targetItem.data.partName}" 뒤로 이동했습니다.`);
        }
      }

      // 이동 완료된 아이템 하이라이트
      setRecentlyMovedId(draggingRow.id);
      // 3초 후 하이라이트 제거
      setTimeout(() => {
        setRecentlyMovedId(null);
      }, 3000);
    }

    setDraggingRow(null);
    setDragOverRow(null);
  }, [draggingRow, moveAfterTracked, moveBeforeTracked, showInfo, showWarning, itemsById]);

  // 도면 미리보기 핸들러
  const handlePreview = useCallback((type, partNumber, partName) => {
    setDrawingPreview({ show: true, type, partNumber, partName });
  }, []);

  // 컬럼 삭제 핸들러
  const handleDeleteColumn = useCallback((columnField) => {
    // visibleColumns에서 제거
    setVisibleColumns(prev => prev.filter(field => field !== columnField));
  }, []);

  // 컬럼 추가 핸들러
  const handleAddColumn = useCallback((newColumn) => {
    // 새 컬럼을 columns에 추가
    setColumns(prev => [...prev, newColumn]);
    // 새 컬럼을 visibleColumns에도 추가
    setVisibleColumns(prev => [...prev, newColumn.field]);
    setShowAddColumnDialog(false);
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

      // 특정 독립 컬럼들은 항상 rowSpan=2로 처리
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
      } else {
        // 그룹에 속하지 않고 특정 필드도 아닌 경우 (새로 추가된 컬럼 등)
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

        // rowSpan 2인 독립 헤더로 추가
        topHeaders.push(
          <th key={col.field}
              rowSpan="2"
              className={`px-2 py-1 border text-center relative cursor-move group transition-colors ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700/50' : 'border-gray-300 hover:bg-gray-200/50'}`}
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
    <div className={`flex-1 overflow-auto relative ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}
         ref={tableRef}
         style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', overflowX: 'auto' }}>
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
                  onDragStart={handleRowDragStart}
                  onDragOver={handleRowDragOver}
                  onDragLeave={handleRowDragLeave}
                  onDrop={handleRowDrop}
                  isDragging={draggingRow?.id === item.id}
                  isRecentlyMoved={recentlyMovedId === item.id}
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
        onAddColumn={() => setShowAddColumnDialog(true)}
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
        onAddColumn={() => setShowAddColumnDialog(true)}
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

      {/* 열 추가 다이얼로그 */}
      <AddColumnDialog
        isOpen={showAddColumnDialog}
        onClose={() => setShowAddColumnDialog(false)}
        onAddColumn={handleAddColumn}
        existingColumns={columns}
      />

      {/* 확인 대화상자 */}
      <ConfirmDialog
        show={confirmDialog.show}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
      />
    </div>
  );
};