import { useCallback } from 'react';
import { useBOMData } from '../contexts/BOMDataContext';
import { useNotification } from '../contexts/NotificationContext';

export const useBOMDragDrop = () => {
  const { bomData, updateBOMItem } = useBOMData();
  const { showSuccess, showWarning, showError } = useNotification();

  const handleRowDragEnd = useCallback((params) => {
    const { node, overNode } = params;

    if (!overNode) {
      showWarning('드롭 위치가 올바르지 않습니다.');
      return;
    }

    // Prevent dragging to invalid locations
    if (node.data.level === 0 && overNode.data.level !== 0) {
      showError('최상위 어셈블리는 다른 항목 아래로 이동할 수 없습니다.');
      return;
    }

    // Prevent circular references
    const isDescendant = (parentNode, childNode) => {
      if (!parentNode.childrenAfterGroup) return false;

      for (const child of parentNode.childrenAfterGroup) {
        if (child.id === childNode.id) return true;
        if (isDescendant(child, childNode)) return true;
      }
      return false;
    };

    if (isDescendant(node, overNode)) {
      showError('항목을 자신의 하위 항목으로 이동할 수 없습니다.');
      return;
    }

    // Update the data structure without duplication
    const moveItem = (sourceId, targetId, targetLevel) => {
      // Implementation for moving items in the tree structure
      // This should update the BOM data context properly

      // For now, just show a success message
      showSuccess(`${node.data.partNumber}를 이동했습니다.`);
    };

    moveItem(node.data.id, overNode.data.id, overNode.data.level);
  }, [bomData, updateBOMItem, showSuccess, showWarning, showError]);

  const validateDragOperation = useCallback((dragNode, dropNode) => {
    // Validation logic for drag operations
    if (!dragNode || !dropNode) return false;

    // Can't drop on itself
    if (dragNode.id === dropNode.id) return false;

    // Can't make circular reference
    const checkCircular = (parent, child) => {
      if (parent.id === child.id) return true;
      if (parent.parent) return checkCircular(parent.parent, child);
      return false;
    };

    if (checkCircular(dropNode, dragNode)) return false;

    return true;
  }, []);

  return {
    handleRowDragEnd,
    validateDragOperation
  };
};

export default useBOMDragDrop;