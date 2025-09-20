import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { uid } from '../utils/id';

// flattenTree 함수들을 직접 구현
function flattenTree(itemsById, rootIds, expandedIds) {
  const out = [];

  const walk = (id) => {
    const node = itemsById[id];
    if (!node) return;

    out.push(node);

    if (expandedIds.has(id) && node.children.length > 0) {
      node.children.forEach(walk);
    }
  };

  rootIds.forEach(walk);
  return out;
}

function collectDescendantIds(itemsById, id) {
  const ids = [id];
  const item = itemsById[id];

  if (item && item.children.length > 0) {
    item.children.forEach(childId => {
      ids.push(...collectDescendantIds(itemsById, childId));
    });
  }

  return ids;
}

function recalculateLevels(itemsById, id, parentLevel) {
  const item = itemsById[id];
  if (!item) return;

  item.level = parentLevel + 1;

  if (item.children.length > 0) {
    item.children.forEach(childId => {
      recalculateLevels(itemsById, childId, item.level);
    });
  }
}

/**
 * BOM Context
 */
const BOMContext = createContext(null);

/**
 * BOM Context Hook
 */
export const useBOM = () => {
  const context = useContext(BOMContext);
  if (!context) {
    throw new Error('useBOM must be used within BOMProvider');
  }
  return context;
};

/**
 * 초기 샘플 데이터 생성
 */
function createInitialData() {
  const items = {};

  // 루트 아이템들
  const root1Id = uid();
  const root2Id = uid();
  const root3Id = uid();

  // ENGINE 어셈블리 (실제 현대자동차 엔진)
  items[root1Id] = {
    id: root1Id,
    parentId: null,
    children: [],
    level: 0,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-PE',
      partNumber: 'G4FG-2E000',
      sonPartNumber: 'G4FG-2E001',
      altPartNumber: '',
      partName: 'ENGINE ASSY-GAMMA 1.6 MPI',
      image: '🔧',
      material: 'Aluminum/Steel',
      surfaceTreatment: 'Powder Coating',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: 'EO-2024-001',
      changeNotice: 'CN-2024-023',
      type: 'ASSY',
      mfg1: 'Hyundai Powertech',
      mfg2: 'Hyundai WIA',
      mfg3: '',
      remarks: '1.6L MPI Gamma Engine',
      quantity: 1
    }
  };

  // TRANSMISSION 어셈블리 (실제 IVT 변속기)
  items[root2Id] = {
    id: root2Id,
    parentId: null,
    children: [],
    level: 0,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-TM',
      partNumber: 'A6GF1-2C000',
      sonPartNumber: '',
      altPartNumber: 'A6MF1-2C000',
      partName: 'TRANSAXLE ASSY-IVT',
      image: '⚙️',
      material: 'Aluminum/Steel',
      surfaceTreatment: 'Oil Resistant Coating',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: 'EO-2024-002',
      changeNotice: '',
      type: 'ASSY',
      mfg1: 'Hyundai Transys',
      mfg2: 'Hyundai Powertech',
      mfg3: '',
      remarks: 'IVT (Intelligent Variable Transmission)',
      quantity: 1
    }
  };

  // CHASSIS 어셈블리 (실제 섬시 프레임)
  items[root3Id] = {
    id: root3Id,
    parentId: null,
    children: [],
    level: 0,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-BD',
      partNumber: 'CN7-51100-2S000',
      sonPartNumber: '',
      altPartNumber: '',
      partName: 'FRAME ASSY-FRONT SUSPENSION',
      image: '🚗',
      material: 'High Tensile Steel',
      surfaceTreatment: 'E-Coating + Paint',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: 'EO-2024-003',
      changeNotice: 'CN-2024-015',
      type: 'ASSY',
      mfg1: 'Hyundai Steel',
      mfg2: 'Hyundai Mobis',
      mfg3: 'Sungwoo Hitech',
      remarks: 'Front Suspension Frame',
      quantity: 1
    }
  };

  // ENGINE의 자식들 - 실제 부품
  const block1Id = uid();
  const head1Id = uid();
  const pistonId = uid();
  const crankshaftId = uid();

  // 엔진 블록
  items[block1Id] = {
    id: block1Id,
    parentId: root1Id,
    children: [],
    level: 1,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-PE',
      partNumber: 'G4FG-11100-A',
      sonPartNumber: '',
      altPartNumber: 'G4FG-11100-B',
      partName: 'CYLINDER BLOCK',
      image: '🧊',
      material: 'Aluminum Alloy',
      surfaceTreatment: 'Honing + Anodizing',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: '',
      changeNotice: '',
      type: 'PART',
      mfg1: 'Hyundai WIA',
      mfg2: 'Doowon',
      mfg3: '',
      remarks: '4-Cylinder Block',
      quantity: 1
    }
  };

  // 실린더 헤드
  items[head1Id] = {
    id: head1Id,
    parentId: root1Id,
    children: [],
    level: 1,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-PE',
      partNumber: 'G4FG-11310-A',
      sonPartNumber: '',
      altPartNumber: '',
      partName: 'CYLINDER HEAD ASSY',
      image: '🔩',
      material: 'Aluminum Alloy',
      surfaceTreatment: 'CNC Machined',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: 'EO-2024-012',
      changeNotice: '',
      type: 'PART',
      mfg1: 'Hyundai WIA',
      mfg2: 'Sungwoo Hitech',
      mfg3: '',
      remarks: 'DOHC 16-Valve',
      quantity: 1
    }
  };

  // 피스톤 세트
  items[pistonId] = {
    id: pistonId,
    parentId: root1Id,
    children: [],
    level: 1,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-PE',
      partNumber: 'G4FG-23410-A',
      sonPartNumber: '',
      altPartNumber: '',
      partName: 'PISTON SET',
      image: '🎯',
      material: 'Aluminum Alloy',
      surfaceTreatment: 'Anodized',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: '',
      changeNotice: '',
      type: 'SET',
      mfg1: 'Dong Yang Piston',
      mfg2: 'Samkee',
      mfg3: '',
      remarks: 'Set of 4 Pistons',
      quantity: 4
    }
  };

  // 크랜크샤프트
  items[crankshaftId] = {
    id: crankshaftId,
    parentId: root1Id,
    children: [],
    level: 1,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-PE',
      partNumber: 'G4FG-11210-A',
      sonPartNumber: '',
      altPartNumber: '',
      partName: 'CRANKSHAFT ASSY',
      image: '🔄',
      material: 'Forged Steel',
      surfaceTreatment: 'Nitriding',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: '',
      changeNotice: '',
      type: 'PART',
      mfg1: 'Sungwoo Hitech',
      mfg2: 'Pyung Hwa',
      mfg3: '',
      remarks: '4-Cylinder Crankshaft',
      quantity: 1
    }
  };

  items[root1Id].children = [block1Id, head1Id, pistonId, crankshaftId];

  // TRANS의 자식들 - 실제 변속기 부품
  const gearId = uid();
  const torqueId = uid();
  const clutchId = uid();

  items[gearId] = {
    id: gearId,
    parentId: root2Id,
    children: [],
    level: 1,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-TM',
      partNumber: 'A6GF1-43100-A',
      sonPartNumber: '',
      altPartNumber: '',
      partName: 'GEAR SET-PLANETARY',
      image: '⚙️',
      material: 'Alloy Steel',
      surfaceTreatment: 'Carburizing',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: '',
      changeNotice: '',
      type: 'SET',
      mfg1: 'Hyundai Transys',
      mfg2: 'Sejong Industrial',
      mfg3: '',
      remarks: 'Planetary Gear Set',
      quantity: 1
    }
  };

  items[torqueId] = {
    id: torqueId,
    parentId: root2Id,
    children: [],
    level: 1,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-TM',
      partNumber: 'A6GF1-25100-A',
      sonPartNumber: '',
      altPartNumber: '',
      partName: 'TORQUE CONVERTER',
      image: '🌀',
      material: 'Steel/Aluminum',
      surfaceTreatment: 'Powder Coating',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: '',
      changeNotice: '',
      type: 'PART',
      mfg1: 'Hyundai Powertech',
      mfg2: 'Kapec',
      mfg3: '',
      remarks: 'Lock-up Torque Converter',
      quantity: 1
    }
  };

  items[clutchId] = {
    id: clutchId,
    parentId: root2Id,
    children: [],
    level: 1,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-TM',
      partNumber: 'A6GF1-41100-A',
      sonPartNumber: '',
      altPartNumber: '',
      partName: 'CLUTCH ASSY-MULTI PLATE',
      image: '🔗',
      material: 'Steel/Friction Material',
      surfaceTreatment: 'Heat Treatment',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: '',
      changeNotice: '',
      type: 'ASSY',
      mfg1: 'Pyung Hwa Valeo',
      mfg2: 'Seohan',
      mfg3: '',
      remarks: 'Multi-plate Wet Clutch',
      quantity: 1
    }
  };

  items[root2Id].children = [gearId, torqueId, clutchId];

  // CHASSIS의 자식들 - 실제 섬시 부품
  const suspensionId = uid();
  const brakeId = uid();
  const steeringId = uid();

  items[suspensionId] = {
    id: suspensionId,
    parentId: root3Id,
    children: [],
    level: 1,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-BD',
      partNumber: 'CN7-54610-2S000',
      sonPartNumber: '',
      altPartNumber: '',
      partName: 'STRUT ASSY-FRONT',
      image: '🎉',
      material: 'Steel/Aluminum',
      surfaceTreatment: 'E-Coating',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: '',
      changeNotice: '',
      type: 'ASSY',
      mfg1: 'Mando',
      mfg2: 'CTR',
      mfg3: '',
      remarks: 'MacPherson Strut',
      quantity: 2
    }
  };

  items[brakeId] = {
    id: brakeId,
    parentId: root3Id,
    children: [],
    level: 1,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-BD',
      partNumber: 'CN7-58110-2S000',
      sonPartNumber: '',
      altPartNumber: '',
      partName: 'BRAKE DISC-FRONT',
      image: '🛍️',
      material: 'Cast Iron',
      surfaceTreatment: 'Anti-rust Coating',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: '',
      changeNotice: '',
      type: 'PART',
      mfg1: 'Hyundai Sungwoo',
      mfg2: 'Kiriu',
      mfg3: '',
      remarks: 'Ventilated Disc',
      quantity: 2
    }
  };

  items[steeringId] = {
    id: steeringId,
    parentId: root3Id,
    children: [],
    level: 1,
    data: {
      customer: 'HYUNDAI',
      carModel: 'AVANTE CN7',
      project: 'CN7-BD',
      partNumber: 'CN7-56500-2S000',
      sonPartNumber: '',
      altPartNumber: '',
      partName: 'STEERING GEAR BOX ASSY',
      image: '🎯',
      material: 'Aluminum/Steel',
      surfaceTreatment: 'Anodizing',
      drawing2d: 'Y',
      drawing3d: 'Y',
      eoNo: 'EO-2024-008',
      changeNotice: '',
      type: 'ASSY',
      mfg1: 'Hyundai Mobis',
      mfg2: 'Mando',
      mfg3: '',
      remarks: 'R-MDPS (Motor Driven Power Steering)',
      quantity: 1
    }
  };

  items[root3Id].children = [suspensionId, brakeId, steeringId];

  // 초기 컬럼 정의 - EPL BOM 헤더 구조
  const columns = [
    { field: 'customer', header: '고객사', width: 80, editable: true },
    { field: 'carModel', header: '차종', width: 90, editable: true },
    { field: 'project', header: '프로젝트', width: 100, editable: true },
    { field: 'partNumber', header: '품번', width: 120, editable: true, required: true },
    { field: 'sonPartNumber', header: 'S/ON 품번', width: 120, editable: true },
    { field: 'altPartNumber', header: '대체품번', width: 120, editable: true },
    { field: 'partName', header: 'PART NAME', width: 180, editable: true, required: true },
    { field: 'quantity', header: 'U/S', width: 60, editable: true, required: true },
    { field: 'image', header: 'IMAGE', width: 80, editable: false },
    { field: 'material', header: '재질', width: 100, editable: true },
    { field: 'surfaceTreatment', header: '표면 처리', width: 100, editable: true },
    { field: 'drawing2d', header: '2D', width: 60, editable: false },
    { field: 'drawing3d', header: '3D', width: 60, editable: false },
    { field: 'eoNo', header: 'EO NO', width: 100, editable: true },
    { field: 'changeNotice', header: 'C/N', width: 80, editable: true },
    { field: 'type', header: '타입', width: 80, editable: true },
    { field: 'mfg1', header: '제품/제조1', width: 120, editable: true },
    { field: 'mfg2', header: '제품/제조2', width: 120, editable: true },
    { field: 'mfg3', header: '제품/제조3', width: 120, editable: true },
    { field: 'remarks', header: '비고', width: 150, editable: true }
  ];

  return {
    itemsById: items,
    rootIds: [root1Id, root2Id, root3Id],
    columns,
    expandedIds: new Set([root1Id, root2Id]), // 처음엔 일부만 펼침
    selectedId: null
  };
}

/**
 * BOM Provider Component
 */
export const BOMProvider = ({ children }) => {
  const [state, setState] = useState(createInitialData);

  // 화면에 보이는 아이템 계산 (메모화)
  const visibleItems = useMemo(() =>
    flattenTree(state.itemsById, state.rootIds, state.expandedIds),
    [state.itemsById, state.rootIds, state.expandedIds]
  );

  // 선택 변경
  const setSelected = useCallback((id) => {
    setState(prev => ({ ...prev, selectedId: id }));
  }, []);

  // 펼침/접힘 토글
  const toggleExpanded = useCallback((id) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedIds);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      return { ...prev, expandedIds: newExpanded };
    });
  }, []);

  // 모두 펼치기
  const expandAll = useCallback(() => {
    setState(prev => {
      const allIds = new Set(Object.keys(prev.itemsById));
      return { ...prev, expandedIds: allIds };
    });
  }, []);

  // 모두 접기
  const collapseAll = useCallback(() => {
    setState(prev => ({ ...prev, expandedIds: new Set() }));
  }, []);

  // 특정 레벨까지 확장
  const expandToLevel = useCallback((targetLevel) => {
    setState(prev => {
      const newExpanded = new Set();

      // 모든 아이템을 순회하며 targetLevel 이하의 레벨을 확장
      Object.entries(prev.itemsById).forEach(([id, item]) => {
        if (item.level <= targetLevel && item.children.length > 0) {
          newExpanded.add(id);
        }
      });

      return { ...prev, expandedIds: newExpanded };
    });
  }, []);

  // 특정 레벨까지 축소
  const collapseFromLevel = useCallback((targetLevel) => {
    setState(prev => {
      const newExpanded = new Set();

      // targetLevel보다 작은 레벨의 아이템만 확장 상태 유지
      prev.expandedIds.forEach(id => {
        const item = prev.itemsById[id];
        if (item && item.level < targetLevel) {
          newExpanded.add(id);
        }
      });

      return { ...prev, expandedIds: newExpanded };
    });
  }, []);

  // 최대 레벨 계산
  const maxLevel = useMemo(() => {
    let max = 0;
    Object.values(state.itemsById).forEach(item => {
      if (item.level > max) {
        max = item.level;
      }
    });
    return max;
  }, [state.itemsById]);

  // 새 루트 추가
  const addRoot = useCallback(() => {
    const newId = uid();
    setState(prev => {
      const newItem = {
        id: newId,
        parentId: null,
        children: [],
        level: 0,
        data: {
          customer: '',
          carModel: '',
          project: '',
          partNumber: `NEW-${Date.now()}`,
          sonPartNumber: '',
          altPartNumber: '',
          partName: 'New Assembly',
          image: '',
          material: '',
          surfaceTreatment: '',
          drawing2d: '',
          drawing3d: '',
          eoNo: '',
          changeNotice: '',
          type: 'ASSY',
          mfg1: '',
          mfg2: '',
          mfg3: '',
          remarks: '',
          quantity: 1
        }
      };

      return {
        ...prev,
        itemsById: { ...prev.itemsById, [newId]: newItem },
        rootIds: [...prev.rootIds, newId]
      };
    });
    return newId;
  }, []);

  // 형제 추가
  const addSibling = useCallback((targetId) => {
    const newId = uid();
    setState(prev => {
      const target = prev.itemsById[targetId];
      if (!target) return prev;

      const newItem = {
        id: newId,
        parentId: target.parentId,
        children: [],
        level: target.level,
        data: {
          customer: '',
          carModel: '',
          project: '',
          partNumber: `NEW-${Date.now()}`,
          sonPartNumber: '',
          altPartNumber: '',
          partName: 'New Part',
          image: '',
          material: '',
          surfaceTreatment: '',
          drawing2d: '',
          drawing3d: '',
          eoNo: '',
          changeNotice: '',
          type: 'PART',
          mfg1: '',
          mfg2: '',
          mfg3: '',
          remarks: '',
          quantity: 1
        }
      };

      const newItems = { ...prev.itemsById, [newId]: newItem };
      let newRootIds = [...prev.rootIds];

      // 부모가 있으면 부모의 children에 추가
      if (target.parentId) {
        const parent = { ...newItems[target.parentId] };
        const index = parent.children.indexOf(targetId);
        parent.children = [...parent.children];
        parent.children.splice(index + 1, 0, newId);
        newItems[target.parentId] = parent;
      } else {
        // 루트 레벨이면 rootIds에 추가
        const index = newRootIds.indexOf(targetId);
        newRootIds.splice(index + 1, 0, newId);
      }

      return {
        ...prev,
        itemsById: newItems,
        rootIds: newRootIds
      };
    });
    return newId;
  }, []);

  // 자식 추가
  const addChild = useCallback((parentId) => {
    const newId = uid();
    setState(prev => {
      const parent = prev.itemsById[parentId];
      if (!parent) return prev;

      const newItem = {
        id: newId,
        parentId,
        children: [],
        level: parent.level + 1,
        data: {
          customer: '',
          carModel: '',
          project: '',
          partNumber: `NEW-${Date.now()}`,
          sonPartNumber: '',
          altPartNumber: '',
          partName: 'New Part',
          image: '',
          material: '',
          surfaceTreatment: '',
          drawing2d: '',
          drawing3d: '',
          eoNo: '',
          changeNotice: '',
          type: 'PART',
          mfg1: '',
          mfg2: '',
          mfg3: '',
          remarks: '',
          quantity: 1
        }
      };

      const newParent = { ...parent, children: [...parent.children, newId] };
      const newExpanded = new Set(prev.expandedIds);
      newExpanded.add(parentId); // 부모를 자동으로 펼침

      return {
        ...prev,
        itemsById: {
          ...prev.itemsById,
          [newId]: newItem,
          [parentId]: newParent
        },
        expandedIds: newExpanded
      };
    });
    return newId;
  }, []);

  // 아이템 삭제 (서브트리 포함)
  const deleteItem = useCallback((id) => {
    setState(prev => {
      const item = prev.itemsById[id];
      if (!item) return prev;

      // 삭제할 모든 ID 수집 (자손 포함)
      const idsToDelete = collectDescendantIds(prev.itemsById, id);

      // 새로운 items 객체 생성 (삭제 대상 제외)
      const newItems = { ...prev.itemsById };
      idsToDelete.forEach(deleteId => delete newItems[deleteId]);

      // 부모의 children 배열에서 제거
      if (item.parentId) {
        const parent = { ...newItems[item.parentId] };
        parent.children = parent.children.filter(childId => childId !== id);
        newItems[item.parentId] = parent;
      }

      // rootIds에서 제거 (루트인 경우)
      const newRootIds = prev.rootIds.filter(rootId => rootId !== id);

      // expandedIds에서 제거
      const newExpanded = new Set(prev.expandedIds);
      idsToDelete.forEach(deleteId => newExpanded.delete(deleteId));

      return {
        ...prev,
        itemsById: newItems,
        rootIds: newRootIds,
        expandedIds: newExpanded,
        selectedId: idsToDelete.includes(prev.selectedId || '') ? null : prev.selectedId
      };
    });
  }, []);

  // 셀 업데이트
  const updateCell = useCallback((id, field, value) => {
    setState(prev => {
      const item = prev.itemsById[id];
      if (!item) return prev;

      const newItem = {
        ...item,
        data: { ...item.data, [field]: value }
      };

      return {
        ...prev,
        itemsById: { ...prev.itemsById, [id]: newItem }
      };
    });
  }, []);

  // Indent (들여쓰기) - 이전 형제를 새 부모로
  const indent = useCallback((id) => {
    setState(prev => {
      const item = prev.itemsById[id];
      if (!item) return prev;

      // 화면 순서에서 이전 형제 찾기
      const visible = flattenTree(prev.itemsById, prev.rootIds, prev.expandedIds);
      const currentIndex = visible.findIndex(v => v.id === id);
      if (currentIndex <= 0) return prev; // 첫 번째면 불가

      const prevItem = visible[currentIndex - 1];

      // 이전 아이템이 같은 부모의 형제인지 확인
      if (prevItem.parentId !== item.parentId || prevItem.level !== item.level) {
        return prev; // 같은 레벨 형제가 아니면 불가
      }

      const newItems = { ...prev.itemsById };

      // 현재 부모에서 제거
      if (item.parentId) {
        const oldParent = { ...newItems[item.parentId] };
        oldParent.children = oldParent.children.filter(cid => cid !== id);
        newItems[item.parentId] = oldParent;
      } else {
        // 루트에서 제거
        const newRootIds = prev.rootIds.filter(rid => rid !== id);
        setState(p => ({ ...p, rootIds: newRootIds }));
      }

      // 새 부모에 추가
      const newParent = { ...newItems[prevItem.id] };
      newParent.children = [...newParent.children, id];
      newItems[prevItem.id] = newParent;

      // 아이템의 parentId와 level 업데이트
      const updatedItem = { ...newItems[id] };
      updatedItem.parentId = prevItem.id;
      updatedItem.level = prevItem.level + 1;
      newItems[id] = updatedItem;

      // 자손들의 레벨 재계산
      recalculateLevels(newItems, id, prevItem.level);

      // 새 부모 자동 펼침
      const newExpanded = new Set(prev.expandedIds);
      newExpanded.add(prevItem.id);

      return {
        ...prev,
        itemsById: newItems,
        expandedIds: newExpanded
      };
    });
  }, []);

  // Outdent (내어쓰기) - 부모의 부모로 이동
  const outdent = useCallback((id) => {
    setState(prev => {
      const item = prev.itemsById[id];
      if (!item || !item.parentId) return prev; // 루트는 불가

      const parent = prev.itemsById[item.parentId];
      if (!parent) return prev;

      const newItems = { ...prev.itemsById };

      // 현재 부모에서 제거
      const oldParent = { ...newItems[item.parentId] };
      const indexInParent = oldParent.children.indexOf(id);
      oldParent.children = oldParent.children.filter(cid => cid !== id);
      newItems[item.parentId] = oldParent;

      // 새로운 위치 결정
      if (parent.parentId) {
        // 부모의 부모가 있는 경우
        const grandParent = { ...newItems[parent.parentId] };
        const parentIndex = grandParent.children.indexOf(parent.id);
        grandParent.children = [...grandParent.children];
        grandParent.children.splice(parentIndex + 1, 0, id);
        newItems[parent.parentId] = grandParent;

        // 아이템 업데이트
        const updatedItem = { ...newItems[id] };
        updatedItem.parentId = parent.parentId;
        updatedItem.level = parent.level;
        newItems[id] = updatedItem;
      } else {
        // 부모가 루트인 경우
        const parentIndex = prev.rootIds.indexOf(parent.id);
        const newRootIds = [...prev.rootIds];
        newRootIds.splice(parentIndex + 1, 0, id);

        // 아이템 업데이트
        const updatedItem = { ...newItems[id] };
        updatedItem.parentId = null;
        updatedItem.level = 0;
        newItems[id] = updatedItem;

        setState(p => ({ ...p, rootIds: newRootIds }));
      }

      // 자손들의 레벨 재계산
      const updatedItem = newItems[id];
      if (updatedItem.children.length > 0) {
        updatedItem.children.forEach(childId => {
          recalculateLevels(newItems, childId, updatedItem.level);
        });
      }

      return { ...prev, itemsById: newItems };
    });
  }, []);

  // 같은 부모 내에서 순서 이동
  const moveAfter = useCallback((id, afterId) => {
    setState(prev => {
      const item = prev.itemsById[id];
      if (!item) return prev;

      if (item.parentId) {
        // 부모가 있는 경우
        const parent = { ...prev.itemsById[item.parentId] };
        const children = [...parent.children];
        const currentIndex = children.indexOf(id);

        if (currentIndex === -1) return prev;

        children.splice(currentIndex, 1); // 현재 위치에서 제거

        if (afterId === null) {
          children.unshift(id); // 맨 앞으로
        } else {
          const afterIndex = children.indexOf(afterId);
          if (afterIndex === -1) return prev;
          children.splice(afterIndex + 1, 0, id); // afterId 다음에 삽입
        }

        parent.children = children;

        return {
          ...prev,
          itemsById: { ...prev.itemsById, [item.parentId]: parent }
        };
      } else {
        // 루트 레벨인 경우
        const rootIds = [...prev.rootIds];
        const currentIndex = rootIds.indexOf(id);

        if (currentIndex === -1) return prev;

        rootIds.splice(currentIndex, 1);

        if (afterId === null) {
          rootIds.unshift(id);
        } else {
          const afterIndex = rootIds.indexOf(afterId);
          if (afterIndex === -1) return prev;
          rootIds.splice(afterIndex + 1, 0, id);
        }

        return { ...prev, rootIds };
      }
    });
  }, []);

  // 컬럼 추가
  const addColumn = useCallback((field, header) => {
    setState(prev => {
      const newColumn = { field, header, editable: true };

      // 모든 아이템의 data에 새 필드 추가 (기본값)
      const newItems = { ...prev.itemsById };
      Object.values(newItems).forEach(item => {
        if (!(field in item.data)) {
          item.data = { ...item.data, [field]: '' };
        }
      });

      return {
        ...prev,
        columns: [...prev.columns, newColumn],
        itemsById: newItems
      };
    });
  }, []);

  // 컬럼 제거
  const removeColumn = useCallback((field) => {
    setState(prev => ({
      ...prev,
      columns: prev.columns.filter(col => col.field !== field)
    }));
  }, []);

  const value = {
    ...state,
    visibleItems,
    maxLevel,
    setSelected,
    toggleExpanded,
    expandAll,
    collapseAll,
    expandToLevel,
    collapseFromLevel,
    addRoot,
    addSibling,
    addChild,
    deleteItem,
    updateCell,
    indent,
    outdent,
    moveAfter,
    addColumn,
    removeColumn
  };

  return (
    <BOMContext.Provider value={value}>
      {children}
    </BOMContext.Provider>
  );
};