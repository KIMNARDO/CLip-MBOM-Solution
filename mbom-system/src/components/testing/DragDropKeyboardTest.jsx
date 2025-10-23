import React, { useEffect, useState } from 'react';
import { useTrackedBOM } from '../../hooks/useTrackedBOM';
import { Info, Keyboard, Mouse } from 'lucide-react';

/**
 * Visual keyboard and mouse state indicator for drag-drop testing
 * Shows real-time keyboard modifier states and mouse position
 */
export const DragDropKeyboardTest = () => {
  const bom = useTrackedBOM();
  const [keyState, setKeyState] = useState({
    shift: false,
    alt: false,
    ctrl: false
  });
  const [mouseState, setMouseState] = useState({
    dragging: false,
    position: { x: 0, y: 0 },
    overElement: null
  });
  const [lastAction, setLastAction] = useState('');

  useEffect(() => {
    // Keyboard event handlers
    const handleKeyDown = (e) => {
      setKeyState(prev => ({
        ...prev,
        shift: e.shiftKey,
        alt: e.altKey,
        ctrl: e.ctrlKey
      }));

      // Log keyboard action
      if (e.shiftKey || e.altKey || e.ctrlKey) {
        const keys = [];
        if (e.shiftKey) keys.push('Shift');
        if (e.altKey) keys.push('Alt');
        if (e.ctrlKey) keys.push('Ctrl');
        setLastAction(`키 눌림: ${keys.join(' + ')}`);
      }
    };

    const handleKeyUp = (e) => {
      setKeyState(prev => ({
        ...prev,
        shift: e.shiftKey,
        alt: e.altKey,
        ctrl: e.ctrlKey
      }));
    };

    // Mouse event handlers
    const handleMouseMove = (e) => {
      setMouseState(prev => ({
        ...prev,
        position: { x: e.clientX, y: e.clientY }
      }));
    };

    const handleDragStart = (e) => {
      setMouseState(prev => ({
        ...prev,
        dragging: true,
        overElement: e.target.textContent || e.target.id
      }));
      setLastAction(`드래그 시작: ${e.target.textContent || '요소'}`);
    };

    const handleDragEnd = (e) => {
      setMouseState(prev => ({
        ...prev,
        dragging: false
      }));
      setLastAction(`드래그 종료`);
    };

    const handleDragOver = (e) => {
      if (e.target.dataset.itemId) {
        setMouseState(prev => ({
          ...prev,
          overElement: e.target.textContent || e.target.dataset.itemId
        }));
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('dragover', handleDragOver);

    return () => {
      // Cleanup
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('dragover', handleDragOver);
    };
  }, []);

  // Determine expected behavior based on key state
  const getExpectedBehavior = () => {
    if (keyState.shift) {
      return '하위 레벨로 이동 (자식으로 만들기)';
    } else if (keyState.alt) {
      return '상위 레벨로 이동 (부모 레벨로 올리기)';
    } else {
      return '같은 레벨 내 순서 변경';
    }
  };

  return (
    <div className="fixed top-20 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Keyboard className="w-5 h-5" />
        키보드 & 마우스 상태
      </h3>

      {/* Keyboard State */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">키보드 상태</div>
        <div className="flex gap-2">
          <div
            className={`px-3 py-2 rounded border-2 text-sm font-medium transition-all ${
              keyState.shift
                ? 'bg-blue-500 text-white border-blue-600 scale-110'
                : 'bg-gray-100 text-gray-500 border-gray-300'
            }`}
          >
            Shift
          </div>
          <div
            className={`px-3 py-2 rounded border-2 text-sm font-medium transition-all ${
              keyState.alt
                ? 'bg-green-500 text-white border-green-600 scale-110'
                : 'bg-gray-100 text-gray-500 border-gray-300'
            }`}
          >
            Alt
          </div>
          <div
            className={`px-3 py-2 rounded border-2 text-sm font-medium transition-all ${
              keyState.ctrl
                ? 'bg-purple-500 text-white border-purple-600 scale-110'
                : 'bg-gray-100 text-gray-500 border-gray-300'
            }`}
          >
            Ctrl
          </div>
        </div>
      </div>

      {/* Mouse State */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Mouse className="w-4 h-4" />
          마우스 상태
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">드래그 중:</span>
            <span className={`font-medium ${mouseState.dragging ? 'text-green-600' : 'text-gray-400'}`}>
              {mouseState.dragging ? '예' : '아니오'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">위치:</span>
            <span className="text-gray-700">
              X: {mouseState.position.x}, Y: {mouseState.position.y}
            </span>
          </div>
          {mouseState.overElement && (
            <div className="flex justify-between">
              <span className="text-gray-600">대상:</span>
              <span className="text-gray-700 truncate ml-2" title={mouseState.overElement}>
                {mouseState.overElement}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Expected Behavior */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm font-medium text-blue-900 mb-1 flex items-center gap-1">
          <Info className="w-4 h-4" />
          예상 동작
        </div>
        <div className="text-sm text-blue-700">
          {getExpectedBehavior()}
        </div>
      </div>

      {/* Last Action */}
      {lastAction && (
        <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
          마지막 동작: {lastAction}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-1">
          <div>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Shift</kbd> + 드래그: 하위 레벨로</div>
          <div>• <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Alt</kbd> + 드래그: 상위 레벨로</div>
          <div>• 일반 드래그: 같은 레벨 내 이동</div>
        </div>
      </div>
    </div>
  );
};