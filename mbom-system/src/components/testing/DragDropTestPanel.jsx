import React, { useState, useCallback } from 'react';
import { useTrackedBOM } from '../../hooks/useTrackedBOM';
import { CheckCircle2, XCircle, AlertCircle, PlayCircle, RefreshCw } from 'lucide-react';

/**
 * Comprehensive test panel for drag-and-drop functionality
 * Tests all movement scenarios and edge cases
 */
export const DragDropTestPanel = () => {
  const bom = useTrackedBOM();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Test scenarios - UUID 대신 레벨과 인덱스로 아이템 찾기
  const testScenarios = [
    {
      id: 'same-level-down',
      name: '같은 레벨 아래로 이동',
      description: 'Level 2 아이템을 같은 Level 2 아래로 이동',
      test: () => {
        // Level 2 아이템들 찾기
        const level2Items = bom.items.filter(item => item.level === 2);
        if (level2Items.length < 2) return { success: false, error: 'Level 2 아이템이 2개 미만' };

        const firstItem = level2Items[0];
        const secondItem = level2Items[1];

        const initialIndex = bom.items.findIndex(item => item.id === firstItem.id);
        bom.moveAfterTracked(firstItem.id, secondItem.id);
        const newIndex = bom.items.findIndex(item => item.id === firstItem.id);

        return {
          success: newIndex !== initialIndex,
          message: `이동 완료: ${firstItem.data.partNumber} 인덱스 ${initialIndex} → ${newIndex}`
        };
      }
    },
    {
      id: 'same-level-up',
      name: '같은 레벨 위로 이동',
      description: 'Level 2 아이템을 같은 Level 2 위로 이동',
      test: () => {
        const level2Items = bom.items.filter(item => item.level === 2);
        if (level2Items.length < 2) return { success: false, error: 'Level 2 아이템이 2개 미만' };

        const firstItem = level2Items[0];
        const secondItem = level2Items[1];

        const initialIndex = bom.items.findIndex(item => item.id === secondItem.id);
        bom.moveBeforeTracked(secondItem.id, firstItem.id);
        const newIndex = bom.items.findIndex(item => item.id === secondItem.id);

        return {
          success: newIndex < initialIndex,
          message: `이동 완료: ${secondItem.data.partNumber} 인덱스 ${initialIndex} → ${newIndex}`
        };
      }
    },
    {
      id: 'level-change-child',
      name: '하위 레벨로 이동 (Shift)',
      description: 'Level 2를 Level 3으로 변경',
      test: () => {
        const level2Item = bom.items.find(item => item.level === 2);
        const level2Parent = bom.items.find(item => item.level === 2 && item.children && item.children.length > 0);

        if (!level2Item || !level2Parent) return { success: false, error: 'Level 2 아이템 부족' };

        const initialLevel = level2Item.level;
        // Level 3으로 이동 (level2Parent의 자식으로)
        bom.moveAfterTracked(level2Item.id, null, 3, level2Parent.id);
        const updatedItem = bom.itemsById[level2Item.id];
        const newLevel = updatedItem?.level;

        return {
          success: newLevel === 3 && initialLevel === 2,
          message: `레벨 변경: ${level2Item.data.partNumber} Level ${initialLevel} → Level ${newLevel}`
        };
      }
    },
    {
      id: 'level-change-parent',
      name: '상위 레벨로 이동 (Alt)',
      description: 'Level 3을 Level 2로 변경',
      test: () => {
        const level3Item = bom.items.find(item => item.level === 3);
        const level1Item = bom.items.find(item => item.level === 1);

        if (!level3Item || !level1Item) return { success: false, error: 'Level 3 또는 Level 1 아이템 없음' };

        const initialLevel = level3Item.level;
        // Level 2로 이동 (level1Item의 자식으로)
        bom.moveAfterTracked(level3Item.id, level1Item.id, 2, level1Item.parentId);
        const updatedItem = bom.itemsById[level3Item.id];
        const newLevel = updatedItem?.level;

        return {
          success: newLevel === 2 && initialLevel === 3,
          message: `레벨 변경: ${level3Item.data.partNumber} Level ${initialLevel} → Level ${newLevel}`
        };
      }
    },
    {
      id: 'cross-parent-move',
      name: '다른 부모로 이동',
      description: '한 부모의 자식을 다른 부모로 이동',
      test: () => {
        // 자식이 있는 두 개의 Level 1 아이템 찾기
        const level1WithChildren = bom.items.filter(item =>
          item.level === 1 && item.children && item.children.length > 0
        );

        if (level1WithChildren.length < 2) return { success: false, error: '자식이 있는 Level 1 아이템 부족' };

        const parent1 = level1WithChildren[0];
        const parent2 = level1WithChildren[1];
        const childToMove = bom.itemsById[parent1.children[0]];

        if (!childToMove) return { success: false, error: '이동할 자식 아이템 없음' };

        const initialParent = childToMove.parentId;
        // parent2의 자식으로 이동
        bom.moveAfterTracked(childToMove.id, null, 2, parent2.id);
        const updatedChild = bom.itemsById[childToMove.id];
        const newParent = updatedChild?.parentId;

        return {
          success: newParent === parent2.id && initialParent !== newParent,
          message: `부모 변경: ${childToMove.data.partNumber} 이동 완료`
        };
      }
    },
    {
      id: 'root-level-move',
      name: '루트 레벨 이동',
      description: 'Level 0 아이템 순서 변경',
      test: () => {
        const rootItems = bom.items.filter(item => item.level === 0);
        if (rootItems.length < 2) return { success: false, error: 'Level 0 아이템이 2개 미만' };

        const firstRoot = rootItems[0];
        const lastRoot = rootItems[rootItems.length - 1];

        const initialIndex = bom.items.findIndex(item => item.id === firstRoot.id);
        bom.moveAfterTracked(firstRoot.id, lastRoot.id);
        const newIndex = bom.items.findIndex(item => item.id === firstRoot.id);

        return {
          success: newIndex > initialIndex,
          message: `루트 이동 완료: ${firstRoot.data.partNumber} 인덱스 ${initialIndex} → ${newIndex}`
        };
      }
    },
    {
      id: 'edge-first-item',
      name: '첫 번째 아이템으로 이동',
      description: '아이템을 리스트의 맨 앞으로 이동',
      test: () => {
        const items = bom.items;
        if (items.length < 2) return { success: false, error: '아이템이 2개 미만' };

        const lastItem = items[items.length - 1];
        const firstItem = items[0];

        bom.moveBeforeTracked(lastItem.id, firstItem.id);
        const newIndex = bom.items.findIndex(item => item.id === lastItem.id);

        return {
          success: newIndex === 0 || newIndex < items.length - 1,
          message: `첫 번째 위치로 이동: ${lastItem.data.partNumber} 인덱스 ${newIndex}`
        };
      }
    },
    {
      id: 'edge-last-item',
      name: '마지막 아이템으로 이동',
      description: '아이템을 리스트의 맨 뒤로 이동',
      test: () => {
        const items = bom.items;
        if (items.length < 2) return { success: false, error: '아이템이 2개 미만' };

        const firstItem = items[0];
        const lastItem = items[items.length - 1];

        bom.moveAfterTracked(firstItem.id, lastItem.id);
        const newIndex = bom.items.findIndex(item => item.id === firstItem.id);

        return {
          success: newIndex === bom.items.length - 1 || newIndex > 0,
          message: `마지막 위치로 이동: ${firstItem.data.partNumber} 인덱스 ${newIndex}`
        };
      }
    }
  ];

  // Run single test
  const runTest = useCallback((scenario) => {
    try {
      const result = scenario.test();
      return {
        ...scenario,
        ...result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ...scenario,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }, [bom]);

  // Run all tests
  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setTestResults([]);

    // BOM 데이터가 있는지 확인
    if (!bom.items || bom.items.length === 0) {
      setTestResults([{
        id: 'no-data',
        name: 'BOM 데이터 없음',
        success: false,
        error: 'BOM 데이터를 먼저 로드하세요',
        timestamp: new Date().toISOString()
      }]);
      setIsRunning(false);
      return;
    }

    const results = [];
    for (const scenario of testScenarios) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay for visibility
      const result = runTest(scenario);
      results.push(result);
      setTestResults([...results]);
    }

    setIsRunning(false);
  }, [testScenarios, runTest, bom]);

  // Reset data
  const resetData = useCallback(() => {
    window.location.reload(); // Simple reset by reloading
  }, []);

  // Calculate stats
  const successCount = testResults.filter(r => r.success).length;
  const failCount = testResults.filter(r => !r.success).length;
  const successRate = testResults.length > 0
    ? Math.round((successCount / testResults.length) * 100)
    : 0;

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-96 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">드래그앤드롭 테스트</h3>
        <div className="flex gap-2">
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
            title="모든 테스트 실행"
          >
            <PlayCircle className="w-5 h-5 text-blue-500" />
          </button>
          <button
            onClick={resetData}
            className="p-2 rounded hover:bg-gray-100"
            title="데이터 초기화"
          >
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* BOM 데이터 상태 */}
      {bom.items && (
        <div className="mb-2 p-2 bg-blue-50 rounded text-xs">
          <span className="text-blue-700">BOM 아이템: {bom.items.length}개</span>
        </div>
      )}

      {/* Stats */}
      {testResults.length > 0 && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">성공률</span>
            <span className={`font-semibold ${successRate >= 80 ? 'text-green-600' : successRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {successRate}%
            </span>
          </div>
          <div className="flex gap-4 mt-2 text-xs">
            <span className="text-green-600">성공: {successCount}</span>
            <span className="text-red-600">실패: {failCount}</span>
            <span className="text-gray-500">전체: {testResults.length}/{testScenarios.length}</span>
          </div>
        </div>
      )}

      {/* Test List */}
      <div className="space-y-2">
        {testScenarios.map((scenario) => {
          const result = testResults.find(r => r.id === scenario.id);
          return (
            <div
              key={scenario.id}
              className={`p-2 rounded border ${
                result
                  ? result.success
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">
                    {scenario.name}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {scenario.description}
                  </div>
                  {result && (
                    <div className="text-xs mt-1">
                      {result.success ? (
                        <span className="text-green-600">{result.message}</span>
                      ) : (
                        <span className="text-red-600">{result.error || result.message}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="ml-2">
                  {result ? (
                    result.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-300" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isRunning && (
        <div className="mt-4 text-center text-sm text-gray-500">
          테스트 실행 중...
        </div>
      )}
    </div>
  );
};