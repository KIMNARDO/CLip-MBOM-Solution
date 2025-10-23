import React from 'react';
import { useTrackedBOM } from '../../hooks/useTrackedBOM';
import { ChevronRight, Package, AlertCircle } from 'lucide-react';

/**
 * BOM 계층 구조를 시각화하는 컴포넌트
 * 드래그앤드롭 후 계층 구조가 올바르게 유지되는지 확인
 */
export const HierarchyVisualizer = () => {
  const bom = useTrackedBOM();

  // 계층 구조 렌더링
  const renderHierarchy = (items, parentId = null, level = 0) => {
    const children = items.filter(item => item.parentId === parentId);

    return children.map(item => {
      const hasChildren = items.some(i => i.parentId === item.id);
      const childCount = items.filter(i => i.parentId === item.id).length;

      return (
        <div key={item.id} className="border-l-2 border-gray-200 ml-2">
          <div
            className={`flex items-center gap-2 p-2 hover:bg-gray-50 ${
              level === 0 ? 'bg-blue-50' :
              level === 1 ? 'bg-green-50' :
              level === 2 ? 'bg-yellow-50' :
              level === 3 ? 'bg-pink-50' : 'bg-gray-50'
            }`}
          >
            {/* Level 인디케이터 */}
            <div className={`px-2 py-1 rounded text-xs font-bold text-white ${
              level === 0 ? 'bg-blue-500' :
              level === 1 ? 'bg-green-500' :
              level === 2 ? 'bg-yellow-500' :
              level === 3 ? 'bg-pink-500' : 'bg-gray-500'
            }`}>
              L{level}
            </div>

            {/* 아이콘 */}
            {hasChildren ? (
              <Package className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}

            {/* 파트 정보 */}
            <div className="flex-1">
              <div className="font-medium text-sm">
                {item.data.partNumber}
              </div>
              <div className="text-xs text-gray-600">
                {item.data.partName || 'No name'}
                {childCount > 0 && (
                  <span className="ml-2 text-blue-600">
                    ({childCount} children)
                  </span>
                )}
              </div>
            </div>

            {/* 레벨 체크 - 자식이 부모보다 낮은 레벨이면 경고 */}
            {item.level <= (items.find(i => i.id === item.parentId)?.level ?? -1) && (
              <AlertCircle className="w-4 h-4 text-red-500" title="레벨 오류: 자식이 부모보다 같거나 낮은 레벨입니다" />
            )}
          </div>

          {/* 자식 렌더링 */}
          {hasChildren && (
            <div className="ml-4">
              {renderHierarchy(items, item.id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  // 통계 계산
  const stats = {
    total: bom.items.length,
    level0: bom.items.filter(i => i.level === 0).length,
    level1: bom.items.filter(i => i.level === 1).length,
    level2: bom.items.filter(i => i.level === 2).length,
    level3: bom.items.filter(i => i.level === 3).length,
    level4Plus: bom.items.filter(i => i.level >= 4).length,
  };

  // 레벨 불일치 검사
  const levelIssues = bom.items.filter(item => {
    if (!item.parentId) return false;
    const parent = bom.itemsById[item.parentId];
    return parent && item.level !== parent.level + 1;
  });

  return (
    <div className="fixed top-20 right-[420px] bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-96 max-h-[600px] overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">계층 구조 시각화</h3>

      {/* 통계 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-gray-600">전체:</span>
            <span className="font-bold ml-1">{stats.total}</span>
          </div>
          <div>
            <span className="text-blue-600">L0:</span>
            <span className="font-bold ml-1">{stats.level0}</span>
          </div>
          <div>
            <span className="text-green-600">L1:</span>
            <span className="font-bold ml-1">{stats.level1}</span>
          </div>
          <div>
            <span className="text-yellow-600">L2:</span>
            <span className="font-bold ml-1">{stats.level2}</span>
          </div>
          <div>
            <span className="text-pink-600">L3:</span>
            <span className="font-bold ml-1">{stats.level3}</span>
          </div>
          {stats.level4Plus > 0 && (
            <div>
              <span className="text-red-600">L4+:</span>
              <span className="font-bold ml-1">{stats.level4Plus}</span>
            </div>
          )}
        </div>
      </div>

      {/* 레벨 오류 경고 */}
      {levelIssues.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">
              레벨 불일치 발견: {levelIssues.length}개 항목
            </span>
          </div>
          <div className="mt-2 text-xs text-red-600">
            {levelIssues.slice(0, 3).map(item => (
              <div key={item.id}>
                {item.data.partNumber}: Level {item.level}
                (부모 Level {bom.itemsById[item.parentId]?.level ?? '?'})
              </div>
            ))}
            {levelIssues.length > 3 && (
              <div>... 외 {levelIssues.length - 3}개</div>
            )}
          </div>
        </div>
      )}

      {/* 계층 구조 트리 */}
      <div className="text-sm">
        {renderHierarchy(bom.items)}
      </div>

      {bom.items.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          BOM 데이터가 없습니다
        </div>
      )}
    </div>
  );
};