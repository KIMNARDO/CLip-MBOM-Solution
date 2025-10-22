import { useCallback } from 'react';
import { useBOM } from '../contexts/BOMContext';
import { useApproval } from '../contexts/ApprovalContext';
import { useNotification } from '../contexts/NotificationContext';

/**
 * BOM 작업을 추적하는 커스텀 훅
 * 모든 CRUD 작업을 ApprovalContext에 기록
 */
export const useTrackedBOM = () => {
  const bom = useBOM();
  const { trackChange } = useApproval();
  const { showInfo } = useNotification();

  // 추적된 아이템 추가
  const addItemTracked = useCallback((parentId = null) => {
    const result = bom.addSibling(parentId);

    if (result) {
      trackChange('create', {
        parentId,
        partNumber: 'NEW_PART',
        partName: '새 부품',
        description: '새로운 부품이 추가되었습니다'
      });
      showInfo('변경사항이 "작성 중" 상태로 저장되었습니다.');
    }

    return result;
  }, [bom, trackChange, showInfo]);

  // 추적된 아이템 수정
  const updateItemTracked = useCallback((id, field, value) => {
    const item = bom.itemsById[id];
    const oldValue = item?.data[field];

    bom.updateCell(id, field, value);

    if (item) {
      trackChange('update', {
        id,
        partNumber: item.data.partNumber,
        partName: item.data.partName,
        field,
        oldValue,
        newValue: value,
        description: `${field} 필드가 "${oldValue}"에서 "${value}"로 변경되었습니다`
      });
      showInfo('변경사항이 "작성 중" 상태로 저장되었습니다.');
    }
  }, [bom, trackChange, showInfo]);

  // 추적된 아이템 삭제
  const deleteItemTracked = useCallback((id) => {
    console.log('deleteItemTracked called with id:', id);
    const item = bom.itemsById[id];
    console.log('Item to delete:', item);

    if (item) {
      const deletedData = {
        id,
        partNumber: item.data.partNumber,
        partName: item.data.partName,
        level: item.level,
        description: `부품 "${item.data.partName}"이(가) 삭제되었습니다`
      };

      console.log('Calling bom.deleteItem with id:', id);
      bom.deleteItem(id);

      console.log('Tracking delete change');
      trackChange('delete', deletedData);
      showInfo('변경사항이 "작성 중" 상태로 저장되었습니다.');
      console.log('Delete completed');
    } else {
      console.error('Item not found for id:', id);
    }
  }, [bom, trackChange, showInfo]);

  // 추적된 자식 추가
  const addChildTracked = useCallback((parentId) => {
    const result = bom.addChild(parentId);

    if (result) {
      const parent = bom.itemsById[parentId];
      trackChange('create', {
        parentId,
        parentPartNumber: parent?.data.partNumber,
        parentPartName: parent?.data.partName,
        partNumber: 'NEW_CHILD',
        partName: '새 하위 부품',
        description: `"${parent?.data.partName}"에 하위 부품이 추가되었습니다`
      });
      showInfo('변경사항이 "작성 중" 상태로 저장되었습니다.');
    }

    return result;
  }, [bom, trackChange, showInfo]);

  // 추적된 형제 추가
  const addSiblingTracked = useCallback((id) => {
    const result = bom.addSibling(id);

    if (result) {
      const sibling = bom.itemsById[id];
      trackChange('create', {
        siblingId: id,
        siblingPartNumber: sibling?.data.partNumber,
        siblingPartName: sibling?.data.partName,
        partNumber: 'NEW_SIBLING',
        partName: '새 형제 부품',
        description: `"${sibling?.data.partName}"의 형제 부품이 추가되었습니다`
      });
      showInfo('변경사항이 "작성 중" 상태로 저장되었습니다.');
    }

    return result;
  }, [bom, trackChange, showInfo]);

  // 추적된 루트 추가
  const addRootTracked = useCallback(() => {
    const result = bom.addRoot();

    if (result) {
      trackChange('create', {
        partNumber: 'NEW_ROOT',
        partName: '새 루트 BOM',
        level: 0,
        description: '새로운 루트 BOM이 추가되었습니다'
      });
      showInfo('변경사항이 "작성 중" 상태로 저장되었습니다.');
    }

    return result;
  }, [bom, trackChange, showInfo]);

  // 추적된 Excel 데이터 설정
  const setFromExcelTracked = useCallback((hierarchicalData) => {
    const result = bom.setFromExcel(hierarchicalData);

    if (result) {
      trackChange('import', {
        description: 'Excel 파일에서 BOM 데이터를 가져왔습니다',
        itemCount: hierarchicalData.length
      });
      showInfo('Excel 데이터가 가져오기되었습니다. "작성 중" 상태로 저장되었습니다.');
    }

    return result;
  }, [bom, trackChange, showInfo]);

  // 추적된 행 이동 - 타겟 뒤로 (레벨 변경 지원)
  const moveAfterTracked = useCallback((id, afterId, newLevel = null, newParentId = null) => {
    const item = bom.itemsById[id];
    const afterItem = afterId ? bom.itemsById[afterId] : null;

    bom.moveAfter(id, afterId, newLevel, newParentId);

    if (item) {
      const levelChanged = newLevel !== null && newLevel !== item.level;

      trackChange('move', {
        id,
        afterId,
        partNumber: item.data.partNumber,
        partName: item.data.partName,
        afterPartNumber: afterItem?.data.partNumber,
        afterPartName: afterItem?.data.partName,
        oldLevel: item.level,
        newLevel: newLevel || item.level,
        newParentId: newParentId,
        description: levelChanged
          ? `"${item.data.partName}"을(를) Level ${item.level}에서 Level ${newLevel}로 이동했습니다`
          : afterItem
            ? `"${item.data.partName}"을(를) "${afterItem.data.partName}" 뒤로 이동했습니다`
            : `"${item.data.partName}"을(를) 이동했습니다`
      });

      if (levelChanged) {
        showInfo(`레벨이 변경되었습니다. Level ${item.level} → Level ${newLevel}`);
      } else {
        showInfo('항목 순서가 변경되었습니다. "작성 중" 상태로 저장되었습니다.');
      }
    }
  }, [bom, trackChange, showInfo]);

  // 추적된 행 이동 - 타겟 앞으로 (레벨 변경 지원)
  const moveBeforeTracked = useCallback((id, beforeId, newLevel = null, newParentId = null) => {
    const item = bom.itemsById[id];
    const beforeItem = bom.itemsById[beforeId];

    if (item && beforeItem) {
      // moveBefore 구현 (newParentId 전달)
      bom.moveBefore(id, beforeId, newLevel, newParentId);

      const levelChanged = newLevel !== null && newLevel !== item.level;

      trackChange('move', {
        id,
        beforeId,
        partNumber: item.data.partNumber,
        partName: item.data.partName,
        beforePartNumber: beforeItem.data.partNumber,
        beforePartName: beforeItem.data.partName,
        oldLevel: item.level,
        newLevel: newLevel || item.level,
        description: levelChanged
          ? `"${item.data.partName}"을(를) Level ${item.level}에서 Level ${newLevel}로 이동했습니다`
          : `"${item.data.partName}"을(를) "${beforeItem.data.partName}" 앞으로 이동했습니다`
      });

      if (levelChanged) {
        showInfo(`레벨이 변경되었습니다. Level ${item.level} → Level ${newLevel}`);
      } else {
        showInfo('항목 순서가 변경되었습니다. "작성 중" 상태로 저장되었습니다.');
      }
    }
  }, [bom, trackChange, showInfo]);

  // 추적된 항목 복제
  const duplicateItemTracked = useCallback((id, includeChildren = false) => {
    const item = bom.itemsById[id];

    if (!item) {
      return null;
    }

    const result = bom.duplicateItem(id, includeChildren);

    if (result) {
      const message = includeChildren && item.children && item.children.length > 0
        ? `"${item.data.partName}" 및 하위 항목들이 복제되었습니다`
        : `"${item.data.partName}"이(가) 복제되었습니다`;

      trackChange('create', {
        id: result,
        sourceId: id,
        partNumber: item.data.partNumber,
        partName: item.data.partName,
        level: item.level,
        includeChildren,
        description: message
      });

      showInfo('변경사항이 "작성 중" 상태로 저장되었습니다.');
    }

    return result;
  }, [bom, trackChange, showInfo]);

  return {
    // 기존 BOM context의 모든 기능
    ...bom,

    // 추적된 CRUD 작업들
    addItemTracked,
    updateItemTracked,
    deleteItemTracked,
    addChildTracked,
    addSiblingTracked,
    addRootTracked,
    setFromExcelTracked,
    moveAfterTracked,
    moveBeforeTracked,
    duplicateItemTracked,

    // 기존 함수들도 유지 (필요시 직접 사용 가능)
    addSibling: bom.addSibling,
    addChild: bom.addChild,
    deleteItem: bom.deleteItem,
    updateCell: bom.updateCell,
    addRoot: bom.addRoot,
    setFromExcel: bom.setFromExcel,
    moveAfter: bom.moveAfter,

    // 복사/붙여넣기/복제 함수들
    copyItem: bom.copyItem,
    pasteItem: bom.pasteItem,
    duplicateItem: bom.duplicateItem
  };
};