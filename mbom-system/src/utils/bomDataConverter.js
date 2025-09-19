/**
 * BOM 데이터 변환 유틸리티
 * 평면 구조와 트리 구조 간의 변환을 담당
 */

/**
 * 평면 구조를 ag-Grid Tree Data 구조로 변환
 * @param {Array} flatData - 평면 구조의 BOM 데이터
 * @returns {Array} Tree Data 구조로 변환된 데이터
 */
export const convertToTreeData = (flatData) => {
  if (!flatData || !Array.isArray(flatData)) return [];

  // ID를 키로 하는 맵 생성
  const itemMap = new Map();
  flatData.forEach(item => {
    itemMap.set(item.id, { ...item, children: [] });
  });

  // 트리 구조 구성
  const roots = [];
  const processedItems = [];

  flatData.forEach(item => {
    const currentItem = itemMap.get(item.id);

    if (!item.parentId || item.level === 0) {
      // 루트 아이템
      roots.push(currentItem);
    } else {
      // 자식 아이템을 부모에 추가
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children.push(currentItem);
      }
    }
  });

  // Tree Data 형식으로 변환
  const convertToAgGridTree = (items, parentPath = []) => {
    const result = [];

    items.forEach(item => {
      const currentPath = [...parentPath, item.partNumber];

      // ag-Grid Tree Data 구조
      const treeItem = {
        ...item,
        path: currentPath,
        orgHierarchy: currentPath,
        treeLevel: currentPath.length - 1
      };

      result.push(treeItem);

      // 자식 요소 재귀 처리
      if (item.children && item.children.length > 0) {
        const childrenData = convertToAgGridTree(item.children, currentPath);
        result.push(...childrenData);
      }
    });

    return result;
  };

  return convertToAgGridTree(roots);
};

/**
 * Tree Data를 평면 구조로 변환
 * @param {Array} treeData - ag-Grid Tree Data 구조
 * @returns {Array} 평면 구조로 변환된 데이터
 */
export const convertToFlatData = (treeData) => {
  if (!treeData || !Array.isArray(treeData)) return [];

  const result = [];
  const pathToIdMap = new Map();
  let idCounter = 1;

  // 각 아이템을 평면 구조로 변환
  treeData.forEach(item => {
    const { path, orgHierarchy, treeLevel, ...rest } = item;

    // 경로를 기반으로 부모 ID 찾기
    const parentPath = path.slice(0, -1);
    const parentId = parentPath.length > 0
      ? pathToIdMap.get(parentPath.join('/'))
      : null;

    // 현재 아이템 ID 생성 또는 유지
    const itemId = item.id || idCounter++;
    pathToIdMap.set(path.join('/'), itemId);

    const flatItem = {
      ...rest,
      id: itemId,
      parentId,
      level: path.length - 1,
      children: [] // 나중에 채워질 예정
    };

    result.push(flatItem);
  });

  // children 배열 재구성
  const itemMap = new Map();
  result.forEach(item => {
    itemMap.set(item.id, item);
  });

  result.forEach(item => {
    if (item.parentId) {
      const parent = itemMap.get(item.parentId);
      if (parent) {
        parent.children.push(item);
      }
    }
  });

  return result;
};

/**
 * BOM 경로 생성
 * @param {Object} item - BOM 아이템
 * @param {Array} allItems - 전체 아이템 배열
 * @returns {Array} 경로 배열
 */
export const generatePath = (item, allItems) => {
  const path = [item.partNumber];
  let currentItem = item;

  while (currentItem.parentId) {
    const parent = allItems.find(i => i.id === currentItem.parentId);
    if (!parent) break;

    path.unshift(parent.partNumber);
    currentItem = parent;
  }

  return path;
};

/**
 * 레벨별로 BOM 데이터 그룹화
 * @param {Array} data - BOM 데이터
 * @returns {Object} 레벨별로 그룹화된 데이터
 */
export const groupByLevel = (data) => {
  return data.reduce((groups, item) => {
    const level = item.level || 0;
    if (!groups[level]) {
      groups[level] = [];
    }
    groups[level].push(item);
    return groups;
  }, {});
};

/**
 * BOM 트리 검증
 * @param {Array} data - BOM 데이터
 * @returns {Object} 검증 결과
 */
export const validateBOMTree = (data) => {
  const errors = [];
  const warnings = [];

  // Level 0 항목 확인
  const level0Items = data.filter(item => item.level === 0);
  if (level0Items.length === 0) {
    errors.push('Level 0 (최상위) 항목이 없습니다');
  }

  // 수량 검증
  level0Items.forEach(item => {
    if (item.quantity !== 1) {
      warnings.push(`Level 0 항목 ${item.partNumber}의 수량은 1이어야 합니다`);
    }
  });

  // 순환 참조 검증
  const visited = new Set();
  const recursionStack = new Set();

  const checkCycle = (itemId) => {
    visited.add(itemId);
    recursionStack.add(itemId);

    const item = data.find(i => i.id === itemId);
    if (item && item.children) {
      for (const child of item.children) {
        if (!visited.has(child.id)) {
          checkCycle(child.id);
        } else if (recursionStack.has(child.id)) {
          errors.push(`순환 참조 발견: ${item.partNumber} -> ${child.partNumber}`);
        }
      }
    }

    recursionStack.delete(itemId);
  };

  level0Items.forEach(item => {
    if (!visited.has(item.id)) {
      checkCycle(item.id);
    }
  });

  // 필수 필드 검증
  data.forEach(item => {
    if (!item.partNumber) {
      errors.push(`ID ${item.id} 항목에 품번이 없습니다`);
    }
    if (!item.description) {
      warnings.push(`${item.partNumber}: 품명이 없습니다`);
    }
    if (item.level > 0 && (!item.quantity || item.quantity <= 0)) {
      errors.push(`${item.partNumber}: 수량이 올바르지 않습니다`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * BOM 데이터 정렬
 * @param {Array} data - BOM 데이터
 * @param {String} sortBy - 정렬 기준 필드
 * @param {String} order - 정렬 순서 (asc/desc)
 * @returns {Array} 정렬된 데이터
 */
export const sortBOMData = (data, sortBy = 'partNumber', order = 'asc') => {
  const sortedData = [...data];

  sortedData.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // 숫자 변환 시도
    if (!isNaN(aValue) && !isNaN(bValue)) {
      aValue = Number(aValue);
      bValue = Number(bValue);
    }

    if (order === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return sortedData;
};

/**
 * BOM 데이터 필터링
 * @param {Array} data - BOM 데이터
 * @param {Object} filters - 필터 조건
 * @returns {Array} 필터링된 데이터
 */
export const filterBOMData = (data, filters) => {
  return data.filter(item => {
    // 상태 필터
    if (filters.status && filters.status !== 'all') {
      if (item.status !== filters.status) return false;
    }

    // 레벨 필터
    if (filters.level !== undefined) {
      if (item.level !== filters.level) return false;
    }

    // 검색어 필터
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesSearch =
        item.partNumber?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.supplier?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;
    }

    // 변경 상태 필터
    if (filters.changedOnly) {
      if (!item.changed) return false;
    }

    return true;
  });
};

/**
 * BOM 총 비용 계산
 * @param {Array} data - BOM 데이터
 * @returns {Number} 총 비용
 */
export const calculateTotalCost = (data) => {
  const calculateItemCost = (item) => {
    const itemCost = (item.cost || 0) * (item.quantity || 1);

    if (item.children && item.children.length > 0) {
      const childrenCost = item.children.reduce((total, child) => {
        return total + calculateItemCost(child);
      }, 0);

      return itemCost + childrenCost;
    }

    return itemCost;
  };

  // Level 0 항목들의 비용 합산
  const level0Items = data.filter(item => item.level === 0);
  return level0Items.reduce((total, item) => {
    return total + calculateItemCost(item);
  }, 0);
};

export default {
  convertToTreeData,
  convertToFlatData,
  generatePath,
  groupByLevel,
  validateBOMTree,
  sortBOMData,
  filterBOMData,
  calculateTotalCost
};