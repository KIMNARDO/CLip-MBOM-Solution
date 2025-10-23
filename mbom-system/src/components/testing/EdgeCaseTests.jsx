import React, { useState, useCallback } from 'react';
import { useTrackedBOM } from '../../hooks/useTrackedBOM';
import { AlertTriangle, Shield, Zap, Database } from 'lucide-react';

/**
 * Edge case and error scenario testing for drag-and-drop
 * Tests boundary conditions, error handling, and performance
 */
export const EdgeCaseTests = () => {
  const bom = useTrackedBOM();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  // Edge case test scenarios
  const edgeCaseTests = [
    {
      id: 'self-drop',
      name: '자기 자신에게 드롭',
      category: 'validation',
      description: '아이템을 자기 자신에게 드롭하는 경우',
      test: () => {
        const item = bom.itemsById[3];
        if (!item) return { success: false, error: '테스트 데이터 없음' };

        const initialIndex = bom.items.findIndex(i => i.id === 3);

        try {
          // Attempt to move item onto itself
          bom.moveAfterTracked(3, 3);
          const newIndex = bom.items.findIndex(i => i.id === 3);

          return {
            success: initialIndex === newIndex,
            message: '자기 자신에게 드롭은 무시됨 (정상)'
          };
        } catch (error) {
          return {
            success: true,
            message: '자기 자신에게 드롭 방지됨'
          };
        }
      }
    },
    {
      id: 'circular-dependency',
      name: '순환 참조 방지',
      category: 'validation',
      description: '부모를 자식으로 이동하여 순환 참조 생성 시도',
      test: () => {
        const parent = bom.itemsById[2]; // ENG-BLOCK-SYS-001
        const child = bom.itemsById[3]; // CYL-ASM-001 (child of 2)

        if (!parent || !child) return { success: false, error: '테스트 데이터 없음' };

        try {
          // Attempt to move parent under its own child
          bom.moveAfterTracked(2, 3, 3, 3); // Try to make parent a child of its child

          // Check if circular dependency was created
          const updatedParent = bom.itemsById[2];
          const hasCircular = updatedParent.parentId === 3;

          return {
            success: !hasCircular,
            message: hasCircular ? '순환 참조 생성됨 (오류)' : '순환 참조 방지됨 (정상)'
          };
        } catch (error) {
          return {
            success: true,
            message: '순환 참조 예외 처리됨'
          };
        }
      }
    },
    {
      id: 'null-target',
      name: 'Null 타겟 처리',
      category: 'error',
      description: '존재하지 않는 타겟으로 이동',
      test: () => {
        const item = bom.itemsById[3];
        if (!item) return { success: false, error: '테스트 데이터 없음' };

        try {
          // Attempt to move to non-existent target
          bom.moveAfterTracked(3, 99999);

          return {
            success: false,
            message: '존재하지 않는 타겟 이동이 허용됨 (오류)'
          };
        } catch (error) {
          return {
            success: true,
            message: 'Null 타겟 예외 처리됨'
          };
        }
      }
    },
    {
      id: 'max-level-depth',
      name: '최대 레벨 깊이 제한',
      category: 'boundary',
      description: 'Level 3 이상으로 중첩 시도',
      test: () => {
        const level3Item = bom.itemsById[4]; // PISTON-001 (Level 3)

        if (!level3Item) return { success: false, error: '테스트 데이터 없음' };

        try {
          // Try to create Level 4 by moving item under Level 3
          const valve = bom.itemsById[20]; // VALVE-001
          if (!valve) return { success: false, error: 'VALVE 데이터 없음' };

          bom.moveAfterTracked(20, 4, 4, 4); // Try to make Level 4

          const updatedValve = bom.itemsById[20];
          const isLevel4 = updatedValve.level === 4;

          return {
            success: !isLevel4 || updatedValve.level <= 3,
            message: isLevel4 ? 'Level 4 생성됨 (경고)' : 'Level 3 제한 유지됨 (정상)'
          };
        } catch (error) {
          return {
            success: true,
            message: '최대 깊이 제한 적용됨'
          };
        }
      }
    },
    {
      id: 'rapid-moves',
      name: '연속 빠른 이동',
      category: 'performance',
      description: '짧은 시간 내 여러 번 이동',
      test: async () => {
        const startTime = performance.now();
        const moveCount = 10;

        try {
          for (let i = 0; i < moveCount; i++) {
            // Alternate moving item 3 back and forth
            if (i % 2 === 0) {
              bom.moveAfterTracked(3, 6);
            } else {
              bom.moveBeforeTracked(3, 6);
            }
          }

          const endTime = performance.now();
          const duration = endTime - startTime;
          const avgTime = duration / moveCount;

          return {
            success: avgTime < 50, // Should be under 50ms per move
            message: `${moveCount}회 이동 완료: 평균 ${avgTime.toFixed(2)}ms/이동`
          };
        } catch (error) {
          return {
            success: false,
            error: `연속 이동 중 오류: ${error.message}`
          };
        }
      }
    },
    {
      id: 'empty-parent',
      name: '빈 부모에서 이동',
      category: 'edge',
      description: '자식이 없는 부모의 처리',
      test: () => {
        // Find an item without children
        const itemWithoutChildren = Object.values(bom.itemsById).find(
          item => !item.children || item.children.length === 0
        );

        if (!itemWithoutChildren) {
          return { success: true, message: '모든 아이템이 자식을 가짐' };
        }

        try {
          // Try to expand/collapse empty parent
          bom.toggleExpanded(itemWithoutChildren.id);

          return {
            success: true,
            message: '빈 부모 토글 처리됨'
          };
        } catch (error) {
          return {
            success: false,
            error: `빈 부모 처리 오류: ${error.message}`
          };
        }
      }
    },
    {
      id: 'large-dataset',
      name: '대용량 데이터 처리',
      category: 'performance',
      description: '많은 아이템 동시 처리',
      test: () => {
        const itemCount = bom.items.length;
        const startTime = performance.now();

        try {
          // Expand all items
          bom.expandAll();

          // Collapse all items
          bom.collapseAll();

          const endTime = performance.now();
          const duration = endTime - startTime;

          return {
            success: duration < 100, // Should complete under 100ms
            message: `${itemCount}개 아이템 전체 확장/축소: ${duration.toFixed(2)}ms`
          };
        } catch (error) {
          return {
            success: false,
            error: `대용량 처리 오류: ${error.message}`
          };
        }
      }
    },
    {
      id: 'undo-redo',
      name: 'Undo/Redo 스택 테스트',
      category: 'functionality',
      description: '변경사항 추적 및 되돌리기',
      test: () => {
        // This would test undo/redo if implemented
        const hasUndoRedo = typeof bom.undo === 'function' && typeof bom.redo === 'function';

        if (!hasUndoRedo) {
          return {
            success: false,
            message: 'Undo/Redo 기능 미구현 (향후 개발 필요)'
          };
        }

        try {
          // Make a change
          const initialState = JSON.stringify(bom.items);
          bom.moveAfterTracked(3, 6);

          // Undo
          bom.undo();
          const afterUndo = JSON.stringify(bom.items);

          // Redo
          bom.redo();
          const afterRedo = JSON.stringify(bom.items);

          return {
            success: initialState === afterUndo,
            message: 'Undo/Redo 작동 확인'
          };
        } catch (error) {
          return {
            success: false,
            error: 'Undo/Redo 테스트 실패'
          };
        }
      }
    }
  ];

  // Run single test
  const runTest = useCallback(async (test) => {
    try {
      const result = await test.test();
      return {
        ...test,
        ...result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ...test,
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }, []);

  // Run all tests
  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setTestResults([]);

    const results = [];
    for (const test of edgeCaseTests) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const result = await runTest(test);
      results.push(result);
      setTestResults([...results]);
    }

    setIsRunning(false);
  }, [edgeCaseTests, runTest]);

  // Group tests by category
  const testsByCategory = edgeCaseTests.reduce((acc, test) => {
    if (!acc[test.category]) acc[test.category] = [];
    acc[test.category].push(test);
    return acc;
  }, {});

  // Category icons
  const categoryIcons = {
    validation: <Shield className="w-4 h-4" />,
    error: <AlertTriangle className="w-4 h-4" />,
    performance: <Zap className="w-4 h-4" />,
    boundary: <Database className="w-4 h-4" />,
    edge: <AlertTriangle className="w-4 h-4" />,
    functionality: <Shield className="w-4 h-4" />
  };

  // Category colors
  const categoryColors = {
    validation: 'blue',
    error: 'red',
    performance: 'yellow',
    boundary: 'purple',
    edge: 'orange',
    functionality: 'green'
  };

  return (
    <div className="fixed top-20 left-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-96 max-h-[600px] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">엣지 케이스 테스트</h3>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            isRunning
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600'
          }`}
        >
          {isRunning ? '테스트 중...' : '모든 테스트 실행'}
        </button>
      </div>

      {/* Test Categories */}
      {Object.entries(testsByCategory).map(([category, tests]) => (
        <div key={category} className="mb-4">
          <div className={`flex items-center gap-2 mb-2 text-sm font-medium text-${categoryColors[category]}-700`}>
            {categoryIcons[category]}
            <span className="capitalize">{category} 테스트</span>
          </div>
          <div className="space-y-2">
            {tests.map(test => {
              const result = testResults.find(r => r.id === test.id);
              return (
                <div
                  key={test.id}
                  className={`p-2 rounded border ${
                    result
                      ? result.success
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="font-medium text-sm text-gray-900">{test.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{test.description}</div>
                  {result && (
                    <div className={`text-xs mt-2 ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                      {result.error || result.message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Test Summary */}
      {testResults.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-sm font-medium text-gray-700">테스트 요약</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-green-50 p-2 rounded">
              <div className="text-green-700 font-medium">성공</div>
              <div className="text-green-900 text-lg">{testResults.filter(r => r.success).length}</div>
            </div>
            <div className="bg-red-50 p-2 rounded">
              <div className="text-red-700 font-medium">실패</div>
              <div className="text-red-900 text-lg">{testResults.filter(r => !r.success).length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};