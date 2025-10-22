import React, { useState, useEffect, useRef } from 'react';
import { useTrackedBOM } from '../hooks/useTrackedBOM';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmDialog from './dialogs/ConfirmDialog';

/**
 * 컨텍스트 메뉴 컴포넌트
 * 우클릭 시 나타나는 메뉴
 */
export const ContextMenu = ({ show, position, itemId, onClose, onColumnManager, onAddColumn }) => {
  const menuRef = useRef(null);
  const { theme } = useTheme();
  const { showInfo, showWarning } = useNotification();
  const {
    addSiblingTracked,
    addChildTracked,
    deleteItemTracked,
    indent,
    outdent,
    itemsById,
    addRootTracked,
    duplicateItemTracked,
    copyItem,
    pasteItem
  } = useTrackedBOM();

  const [showCopySubmenu, setShowCopySubmenu] = useState(false);
  const [showPasteSubmenu, setShowPasteSubmenu] = useState(false);
  const [showDuplicateSubmenu, setShowDuplicateSubmenu] = useState(false);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
    onCancel: () => {}
  });

  // 메뉴 위치 자동 조정 (화면 밖으로 나가지 않도록)
  useEffect(() => {
    if (show && menuRef.current) {
      const menuRect = menuRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let adjustedX = position.x;
      let adjustedY = position.y;

      // 오른쪽으로 나가는 경우
      if (position.x + menuRect.width > windowWidth) {
        adjustedX = windowWidth - menuRect.width - 10;
      }

      // 아래로 나가는 경우
      if (position.y + menuRect.height > windowHeight) {
        adjustedY = windowHeight - menuRect.height - 10;
      }

      // 위로 나가는 경우
      if (adjustedY < 0) {
        adjustedY = 10;
      }

      // 왼쪽으로 나가는 경우
      if (adjustedX < 0) {
        adjustedX = 10;
      }

      setAdjustedPosition({ x: adjustedX, y: adjustedY });
    }
  }, [show, position]);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [show, onClose]);

  console.log('ContextMenu render:', { show, itemId, position });

  if (!show) return null;

  const item = itemId ? itemsById[itemId] : null;
  console.log('ContextMenu item:', item);

  const hasChildren = item && item.children && item.children.length > 0;
  const isLeafNode = !hasChildren;
  const copiedItem = sessionStorage.getItem('copiedBOMItem');
  const hasCopiedItem = !!copiedItem;

  const handleAction = (action) => {
    action();
    onClose();
  };

  const handleDelete = () => {
    console.log('Delete button clicked for item:', itemId);
    console.log('Item data:', item);

    // 확인 대화상자 표시
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
        console.log('Delete confirmed for item:', itemId);
        deleteItemTracked(itemId);
        showInfo(`"${item.data.partName}"이(가) 삭제되었습니다.`);
        setConfirmDialog(prev => ({ ...prev, show: false }));
        onClose(); // 삭제 완료 후 메뉴 닫기
      },
      onCancel: () => {
        console.log('Delete cancelled');
        setConfirmDialog(prev => ({ ...prev, show: false }));
      }
    });
  };

  const handleCopy = (includeChildren = false) => {
    console.log('Copying item:', itemId, 'includeChildren:', includeChildren);
    const result = copyItem(itemId, includeChildren);
    console.log('Copy result:', result);

    if (result) {
      const message = includeChildren && hasChildren
        ? `"${item.data.partName}" 및 하위 항목들이 클립보드에 복사되었습니다.`
        : `"${item.data.partName}"이(가) 클립보드에 복사되었습니다.`;
      showInfo(message);
    } else {
      showWarning('복사에 실패했습니다.');
    }
    onClose();
  };

  const handlePaste = (forceLevel = false) => {
    console.log('Pasting to item:', itemId, 'forceLevel:', forceLevel);
    const result = pasteItem(itemId, forceLevel);
    console.log('Paste result:', result);

    if (result) {
      const message = forceLevel
        ? '항목이 다른 레벨로 붙여넣기되었습니다.'
        : '항목이 붙여넣기되었습니다.';
      showInfo(message);
    } else {
      showWarning('붙여넣기에 실패했습니다.');
    }
    onClose();
  };

  const handleDuplicate = (includeChildren = false) => {
    console.log('Duplicating item:', itemId, 'includeChildren:', includeChildren);
    const result = duplicateItemTracked(itemId, includeChildren);
    console.log('Duplicate result:', result);

    if (result) {
      const successMessage = includeChildren && hasChildren
        ? `"${item.data.partName}" 및 하위 항목들이 복제되었습니다.`
        : `"${item.data.partName}"이(가) 복제되었습니다.`;
      showInfo(successMessage);
    } else {
      showWarning('복제에 실패했습니다.');
    }

    onClose();
  };

  return (
    <>
    {!confirmDialog.show && (
    <div
      ref={menuRef}
      className={`fixed z-50 rounded shadow-lg py-1 ${theme === 'dark' ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'}`}
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`
      }}
    >
      {!itemId && (
        <button
          onClick={() => handleAction(() => addRootTracked())}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
        >
          <span className="text-yellow-400">📦</span>
          루트 BOM 추가
        </button>
      )}

      {itemId && (
        <button
          onClick={() => handleAction(() => addSiblingTracked(itemId))}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
        >
          <span className="text-blue-400">➕</span>
          형제 추가
        </button>
      )}

      {itemId && (
        <button
          onClick={() => handleAction(() => addChildTracked(itemId))}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
        >
          <span className="text-green-400">➕</span>
          자식 추가
        </button>
      )}

      <div className="border-t border-gray-700 my-1" />

      {itemId && (
        <>
          <div className="relative"
               onMouseEnter={() => setShowCopySubmenu(true)}
               onMouseLeave={() => setShowCopySubmenu(false)}>
            <button
              onClick={() => {
                if (!hasChildren) {
                  handleCopy(false);
                } else {
                  setShowCopySubmenu(!showCopySubmenu);
                }
              }}
              className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
            >
              <span className="flex items-center gap-2">
                <span className="text-blue-400">📋</span>
                복사
              </span>
              {hasChildren && <span className="text-xs">▶</span>}
            </button>

            {showCopySubmenu && hasChildren && (
              <div
                className={`absolute left-full top-0 ml-1 rounded shadow-lg py-1 z-50 ${theme === 'dark' ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'}`}
                style={{ minWidth: '150px', zIndex: 1001 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm whitespace-nowrap ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
                >
                  현재 항목만
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(true);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm whitespace-nowrap ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
                >
                  하위 항목 포함
                </button>
              </div>
            )}
          </div>

          <div className="relative"
               onMouseEnter={() => setShowPasteSubmenu(true)}
               onMouseLeave={() => setShowPasteSubmenu(false)}>
            <button
              onClick={() => {
                if (!hasCopiedItem) return;
                if (!isLeafNode) {
                  handlePaste(false);
                } else {
                  setShowPasteSubmenu(!showPasteSubmenu);
                }
              }}
              disabled={!hasCopiedItem}
              className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${!hasCopiedItem ? 'opacity-50 cursor-not-allowed' : ''} ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
            >
              <span className="flex items-center gap-2">
                <span className="text-green-400">📄</span>
                붙여넣기
              </span>
              {hasCopiedItem && isLeafNode && <span className="text-xs">▶</span>}
            </button>

            {showPasteSubmenu && hasCopiedItem && isLeafNode && (
              <div
                className={`absolute left-full top-0 ml-1 rounded shadow-lg py-1 z-50 ${theme === 'dark' ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'}`}
                style={{ minWidth: '150px', zIndex: 1001 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePaste(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm whitespace-nowrap ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
                >
                  같은 레벨로
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePaste(true);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm whitespace-nowrap ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
                >
                  현재 위치로 (레벨 변경)
                </button>
              </div>
            )}
          </div>

          <div className="relative"
               onMouseEnter={() => setShowDuplicateSubmenu(true)}
               onMouseLeave={() => setShowDuplicateSubmenu(false)}>
            <button
              onClick={() => {
                if (!hasChildren) {
                  handleDuplicate(false);
                } else {
                  setShowDuplicateSubmenu(!showDuplicateSubmenu);
                }
              }}
              className={`w-full px-4 py-2 text-left text-sm flex items-center justify-between ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
            >
              <span className="flex items-center gap-2">
                <span className="text-yellow-400">📑</span>
                복제
              </span>
              {hasChildren && <span className="text-xs">▶</span>}
            </button>

            {showDuplicateSubmenu && hasChildren && (
              <div
                className={`absolute left-full top-0 ml-1 rounded shadow-lg py-1 z-50 ${theme === 'dark' ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'}`}
                style={{ minWidth: '150px', zIndex: 1001 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm whitespace-nowrap ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
                >
                  현재 항목만
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate(true);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm whitespace-nowrap ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
                >
                  하위 항목 포함
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <div className="border-t border-gray-700 my-1" />

      {itemId && (
        <>
          <button
            onClick={() => handleAction(() => indent(itemId))}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
          >
            <span className="text-purple-400">→</span>
            들여쓰기
          </button>

          <button
            onClick={() => handleAction(() => outdent(itemId))}
            className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
          >
            <span className="text-purple-400">←</span>
            내어쓰기
          </button>
        </>
      )}

      <div className="border-t border-gray-700 my-1" />

      <button
        onClick={() => {
          onColumnManager();
          onClose();
        }}
        className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 flex items-center gap-2"
      >
        <span>⚙️</span>
        컬럼 관리
      </button>

      {onAddColumn && (
        <button
          onClick={() => {
            onAddColumn();
            onClose();
          }}
          className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100'}`}
        >
          <span>📊</span>
          컬럼 추가
        </button>
      )}

      <div className="border-t border-gray-700 my-1" />

      {itemId && (
        <button
          onClick={(e) => {
            console.log('Delete menu button clicked!');
            e.stopPropagation();
            handleDelete();
          }}
          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
        >
          <span>🗑️</span>
          삭제
        </button>
      )}
    </div>
    )}

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
    </>
  );
};