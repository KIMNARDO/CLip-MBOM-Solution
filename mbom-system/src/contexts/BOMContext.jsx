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

  // M-BOM 레벨 이동 - 타겟 앞으로
  const moveBefore = useCallback((id, beforeId, newLevel = null, newParentId = null) => {
    setState(prev => {
      const item = prev.itemsById[id];
      const beforeItem = prev.itemsById[beforeId];

      if (!item || !beforeItem) {
        console.error('Item not found:', !item ? id : beforeId);
        return prev;
      }

      // 자기 자신으로는 이동할 수 없음
      if (id === beforeId) {
        console.log('Cannot move item before itself');
        return prev;
      }

      const newItemsById = { ...prev.itemsById };
      let newRootIds = [...prev.rootIds];
      const newExpandedIds = new Set(prev.expandedIds);

      // 목표 레벨과 부모 (newParentId가 명시적으로 제공되면 그것을 사용, 아니면 beforeItem의 부모 사용)
      const targetLevel = newLevel !== null ? newLevel : beforeItem.level;
      const targetParentId = newParentId !== null ? newParentId : beforeItem.parentId;

      console.log('Moving item BEFORE:', {
        id,
        beforeId,
        currentLevel: item.level,
        targetLevel,
        targetParentId
      });

      // 1. 원래 위치에서 제거
      if (item.parentId) {
        const oldParent = newItemsById[item.parentId];
        if (oldParent) {
          const updatedOldParent = {
            ...oldParent,
            children: oldParent.children.filter(childId => childId !== id)
          };
          newItemsById[item.parentId] = updatedOldParent;
        }
      } else {
        newRootIds = newRootIds.filter(rootId => rootId !== id);
      }

      // 2. 새 위치에 추가 (beforeItem 앞)
      const currentItem = newItemsById[id] || item;

      // 루트 레벨로 이동
      if (targetLevel === 0) {
        newItemsById[id] = { ...currentItem, parentId: null, level: 0 };
        const beforeIndex = newRootIds.indexOf(beforeId);
        if (beforeIndex >= 0) {
          newRootIds.splice(beforeIndex, 0, id);
        } else {
          newRootIds.unshift(id);
        }
      }
      // 자식 레벨로 이동
      else if (targetParentId) {
        const newParent = newItemsById[targetParentId];
        if (newParent) {
          newItemsById[id] = { ...currentItem, parentId: targetParentId, level: targetLevel };

          const updatedNewParent = { ...newParent };
          if (!updatedNewParent.children) {
            updatedNewParent.children = [];
          }

          // 중복 제거 후 beforeItem 앞에 추가
          updatedNewParent.children = updatedNewParent.children.filter(cId => cId !== id);
          const beforeIndex = updatedNewParent.children.indexOf(beforeId);
          if (beforeIndex >= 0) {
            updatedNewParent.children.splice(beforeIndex, 0, id);
          } else {
            updatedNewParent.children.unshift(id);
          }

          newItemsById[targetParentId] = updatedNewParent;
          newExpandedIds.add(targetParentId);
        }
      }

      // 자식들의 레벨 재계산
      if (item.children && item.children.length > 0) {
        const recalculateChildLevels = (parentId, parentLevel) => {
          const parent = newItemsById[parentId];
          if (parent && parent.children) {
            parent.children.forEach(childId => {
              const child = newItemsById[childId];
              if (child) {
                newItemsById[childId] = { ...child, level: parentLevel + 1 };
                recalculateChildLevels(childId, parentLevel + 1);
              }
            });
          }
        };
        recalculateChildLevels(id, targetLevel);
      }

      return {
        ...prev,
        itemsById: newItemsById,
        rootIds: newRootIds,
        expandedIds: newExpandedIds
      };
    });
  }, []);

  // M-BOM 레벨 이동 - 타겟 뒤로
  const moveAfter = useCallback((id, afterId, newLevel = null, newParentId = null) => {
    setState(prev => {
      const item = prev.itemsById[id];
      const afterItem = afterId ? prev.itemsById[afterId] : null;

      if (!item) {
        console.error('Item not found:', id);
        return prev;
      }

      // 자기 자신으로는 이동할 수 없음
      if (id === afterId) {
        console.log('Cannot move item after itself');
        return prev;
      }

      const newItemsById = { ...prev.itemsById };
      let newRootIds = [...prev.rootIds];
      const newExpandedIds = new Set(prev.expandedIds);

      // 레벨 변경이 필요한 경우
      const targetLevel = newLevel !== null ? newLevel : (afterItem ? afterItem.level : item.level);

      console.log('Moving item:', {
        id,
        afterId,
        currentLevel: item.level,
        targetLevel,
        newParentId,
        currentParent: item.parentId
      });

      // 1. 원래 위치에서 제거
      if (item.parentId) {
        const oldParent = newItemsById[item.parentId];
        if (oldParent) {
          const updatedOldParent = {
            ...oldParent,
            children: oldParent.children.filter(childId => childId !== id)
          };
          newItemsById[item.parentId] = updatedOldParent;
        }
      } else {
        newRootIds = newRootIds.filter(rootId => rootId !== id);
      }

      // 2. 새 위치에 추가
      // 새 부모 결정
      let targetParentId = newParentId;

      if (!targetParentId && afterItem) {
        // 같은 레벨로 이동하는 경우
        if (targetLevel === afterItem.level) {
          targetParentId = afterItem.parentId;
        }
        // 자식 레벨로 이동하는 경우 (afterItem이 부모가 됨)
        else if (targetLevel === afterItem.level + 1) {
          targetParentId = afterItem.id;
        }
        // 부모 레벨로 이동하는 경우
        else if (targetLevel === afterItem.level - 1) {
          // afterItem의 부모의 부모를 찾아야 함
          const afterItemParent = afterItem.parentId ? newItemsById[afterItem.parentId] : null;
          targetParentId = afterItemParent ? afterItemParent.parentId : null;
        }
      }

      console.log('Determined targetParentId:', targetParentId);

      // 3. 아이템의 새 위치 설정
      const currentItem = newItemsById[id] || item;

      // 루트 레벨로 이동하는 경우
      if (targetLevel === 0) {
        newItemsById[id] = { ...currentItem, parentId: null, level: 0 };

        // 루트 배열에 추가
        if (afterItem) {
          const afterIndex = newRootIds.indexOf(afterId);
          if (afterIndex >= 0) {
            newRootIds.splice(afterIndex + 1, 0, id);
          } else {
            newRootIds.push(id);
          }
        } else {
          newRootIds.unshift(id);
        }
      }
      // 자식 레벨로 이동하는 경우
      else if (targetParentId) {
        const newParent = newItemsById[targetParentId];
        if (newParent) {
          // 아이템 업데이트
          newItemsById[id] = { ...currentItem, parentId: targetParentId, level: targetLevel };

          // 부모의 children 배열 업데이트
          const updatedNewParent = { ...newParent };
          if (!updatedNewParent.children) {
            updatedNewParent.children = [];
          }

          // 중복 제거 후 추가
          updatedNewParent.children = updatedNewParent.children.filter(cId => cId !== id);

          if (newParentId && !afterId) {
            // 명시적 부모 지정 시 맨 앞에 추가
            updatedNewParent.children.unshift(id);
          } else if (afterItem && targetLevel === afterItem.level) {
            // 같은 레벨에서 순서 조정
            const afterIndex = updatedNewParent.children.indexOf(afterId);
            if (afterIndex >= 0) {
              updatedNewParent.children.splice(afterIndex + 1, 0, id);
            } else {
              updatedNewParent.children.push(id);
            }
          } else {
            // 기본: 맨 뒤에 추가
            updatedNewParent.children.push(id);
          }

          newItemsById[targetParentId] = updatedNewParent;

          // 부모를 펼침
          newExpandedIds.add(targetParentId);
        }
      }
      else {
        console.error('Cannot determine target parent for level', targetLevel);
        return prev;
      }

      // 자식들의 레벨 재계산
      if (item.children && item.children.length > 0) {
        const recalculateChildLevels = (parentId, parentLevel) => {
          const parent = newItemsById[parentId];
          if (parent && parent.children) {
            parent.children.forEach(childId => {
              const child = newItemsById[childId];
              if (child) {
                newItemsById[childId] = { ...child, level: parentLevel + 1 };
                recalculateChildLevels(childId, parentLevel + 1);
              }
            });
          }
        };
        recalculateChildLevels(id, targetLevel);
      }

      // 이동 완료 확인
      const movedItem = newItemsById[id];
      console.log('Move completed. Item still exists:', !!movedItem);
      if (movedItem) {
        console.log('Moved item details:', {
          id: movedItem.id,
          parentId: movedItem.parentId,
          level: movedItem.level,
          partName: movedItem.data?.partName
        });
      } else {
        console.error('ERROR: Item disappeared after move!', id);
      }

      return {
        ...prev,
        itemsById: newItemsById,
        rootIds: newRootIds,
        expandedIds: newExpandedIds
      };
    });
  }, []);

  // 항목 복제 (같은 위치에 동일한 데이터로 새 항목 생성) - 자식 포함 옵션 추가
  const duplicateItem = useCallback((id, includeChildren = false) => {
    let resultId = null;
    setState(prev => {
      const item = prev.itemsById[id];
      if (!item) return prev;

      const newItemsById = { ...prev.itemsById };
      let newRootIds = [...prev.rootIds];
      const newExpandedIds = new Set(prev.expandedIds);

      // 재귀적으로 아이템과 자식들을 복제
      const duplicateRecursive = (sourceId, parentId = null, level = 0) => {
        const source = prev.itemsById[sourceId];
        if (!source) return null;

        const newId = uid();
        const newItem = {
          id: newId,
          parentId: parentId,
          level: level,
          data: {
            ...source.data,
            partNumber: `${source.data.partNumber}-COPY-${Date.now()}`,
            partName: `${source.data.partName} (복사본)`
          },
          children: []
        };

        newItemsById[newId] = newItem;

        // 자식 복제 (includeChildren이 true인 경우)
        if (includeChildren && source.children.length > 0) {
          source.children.forEach(childId => {
            const newChildId = duplicateRecursive(childId, newId, level + 1);
            if (newChildId) {
              newItem.children.push(newChildId);
            }
          });
          // 자식이 있는 항목은 자동으로 펼침
          newExpandedIds.add(newId);
        }

        return newId;
      };

      // 복제 실행
      const newId = duplicateRecursive(id, item.parentId, item.level);
      resultId = newId;

      // 부모가 있는 경우
      if (item.parentId) {
        const parent = { ...newItemsById[item.parentId] };
        const itemIndex = parent.children.indexOf(id);
        parent.children.splice(itemIndex + 1, 0, newId); // 원본 바로 뒤에 추가
        newItemsById[item.parentId] = parent;
      }

      // 루트인 경우
      if (!item.parentId) {
        const itemIndex = newRootIds.indexOf(id);
        newRootIds.splice(itemIndex + 1, 0, newId);
      }

      return {
        ...prev,
        itemsById: newItemsById,
        rootIds: newRootIds,
        expandedIds: newExpandedIds
      };
    });
    return resultId;
  }, []);

  // 항목 복사 (클립보드에 저장) - 자식 포함 옵션 추가
  const copyItem = useCallback((id, includeChildren = false) => {
    const item = state.itemsById[id];
    if (item) {
      const copiedData = {
        data: item.data,
        level: item.level,
        includeChildren: includeChildren
      };

      // 자식 포함 복사인 경우
      if (includeChildren && item.children.length > 0) {
        const collectChildren = (nodeId) => {
          const node = state.itemsById[nodeId];
          if (!node) return null;

          return {
            data: node.data,
            level: node.level,
            children: node.children.map(childId => collectChildren(childId)).filter(Boolean)
          };
        };

        copiedData.childrenData = item.children.map(childId => collectChildren(childId)).filter(Boolean);
      }

      sessionStorage.setItem('copiedBOMItem', JSON.stringify(copiedData));
      return true;
    }
    return false;
  }, [state.itemsById]);

  // 항목 붙여넣기 - 다른 레벨로도 가능하도록 개선
  const pasteItem = useCallback((targetId, forceLevel = false) => {
    const copiedData = sessionStorage.getItem('copiedBOMItem');
    if (!copiedData) return false;

    const { data, level, includeChildren, childrenData } = JSON.parse(copiedData);
    const targetItem = state.itemsById[targetId];

    if (!targetItem) return false;

    let success = false;
    setState(prev => {
      const newItemsById = { ...prev.itemsById };
      let newRootIds = [...prev.rootIds];
      const newExpandedIds = new Set(prev.expandedIds);

      // 새 항목 생성 함수
      const createItem = (itemData, parentId, itemLevel) => {
        const newId = uid();
        const newItem = {
          id: newId,
          data: {
            ...itemData,
            partNumber: `${itemData.partNumber}-${Date.now()}` // 중복 방지
          },
          level: itemLevel,
          parentId: parentId,
          children: []
        };
        newItemsById[newId] = newItem;
        return newId;
      };

      // 자식 포함 붙여넣기 처리
      const pasteWithChildren = (parentData, childrenList, parentId, baseLevel) => {
        const parentNewId = createItem(parentData, parentId, baseLevel);

        if (childrenList && childrenList.length > 0) {
          childrenList.forEach(child => {
            const childNewId = pasteWithChildren(
              child.data,
              child.children,
              parentNewId,
              baseLevel + 1
            );
            newItemsById[parentNewId].children.push(childNewId);
          });
          // 자식이 있는 항목은 자동으로 펼침
          newExpandedIds.add(parentNewId);
        }

        return parentNewId;
      };

      // 대상 레벨 결정
      const targetLevel = forceLevel ? targetItem.level : level;

      // 리프 노드이거나 forceLevel이 true인 경우 다른 레벨로도 붙여넣기 가능
      const isLeafNode = !includeChildren || !childrenData || childrenData.length === 0;

      if (isLeafNode || forceLevel) {
        let newId;

        if (includeChildren && childrenData) {
          // 자식 포함 붙여넣기
          newId = pasteWithChildren(data, childrenData, targetItem.parentId, targetLevel);
        } else {
          // 단일 항목 붙여넣기
          newId = createItem(data, targetItem.parentId, targetLevel);
        }

        // 타겟 아이템 뒤에 추가
        if (targetItem.parentId) {
          const parent = newItemsById[targetItem.parentId];
          const targetIndex = parent.children.indexOf(targetId);
          parent.children.splice(targetIndex + 1, 0, newId);
        } else {
          // 루트 레벨
          const targetIndex = newRootIds.indexOf(targetId);
          newRootIds.splice(targetIndex + 1, 0, newId);
        }
      } else if (targetItem.level === level) {
        // 같은 레벨로 붙여넣기 (기존 로직)
        let newId;

        if (includeChildren && childrenData) {
          newId = pasteWithChildren(data, childrenData, targetItem.parentId, level);
        } else {
          newId = createItem(data, targetItem.parentId, level);
        }

        // 타겟 아이템 뒤에 추가
        if (targetItem.parentId) {
          const parent = newItemsById[targetItem.parentId];
          const targetIndex = parent.children.indexOf(targetId);
          parent.children.splice(targetIndex + 1, 0, newId);
        } else {
          const targetIndex = newRootIds.indexOf(targetId);
          newRootIds.splice(targetIndex + 1, 0, newId);
        }
      } else {
        // 다른 레벨로 붙여넣기 불가
        return prev;
      }

      success = true;
      return {
        ...prev,
        itemsById: newItemsById,
        rootIds: newRootIds,
        expandedIds: newExpandedIds
      };
    });

    return success;
  }, [state.itemsById]);

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

  // Excel 데이터 설정 (계층 구조 데이터를 받아서 평면화하여 저장)
  const setFromExcel = useCallback((hierarchicalData) => {
    const newItemsById = {};
    const newRootIds = [];
    let idCounter = 0;

    // 재귀적으로 계층 구조를 평면화
    const processItem = (item, parentId = null, level = 0) => {
      const id = `excel-${++idCounter}`;

      // children을 제외한 나머지 데이터 복사
      const { children, ...itemData } = item;

      // 새 아이템 생성
      newItemsById[id] = {
        id,
        parentId,
        children: [],
        level,
        data: {
          ...itemData,
          partNumber: itemData.partNumber || `PART-${idCounter}`,
          partName: itemData.partName || '',
          quantity: itemData.quantity || 1,
          unit: itemData.unit || 'EA',
          material: itemData.material || '',
          weight: itemData.weight || 0,
          supplier: itemData.supplier || '',
          cost: itemData.cost || 0,
          leadTime: itemData.leadTime || 0,
          status: itemData.status || 'draft',
          notes: itemData.notes || '',
          icon: itemData.icon || '📦',
          operation: itemData.operation || '',
          workcenter: itemData.workcenter || ''
        }
      };

      // 루트 레벨인 경우 rootIds에 추가
      if (parentId === null) {
        newRootIds.push(id);
      } else {
        // 부모의 children 배열에 추가
        if (newItemsById[parentId]) {
          newItemsById[parentId].children.push(id);
        }
      }

      // 자식 아이템들 처리
      if (children && Array.isArray(children)) {
        children.forEach(child => {
          processItem(child, id, level + 1);
        });
      }

      return id;
    };

    // 모든 아이템 처리
    hierarchicalData.forEach(item => {
      processItem(item);
    });

    // 상태 업데이트
    setState(prev => ({
      ...prev,
      itemsById: newItemsById,
      rootIds: newRootIds,
      expandedIds: new Set(Object.keys(newItemsById)) // 모든 아이템 펼침
    }));

    return true;
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
    moveBefore,
    addColumn,
    removeColumn,
    setFromExcel,
    duplicateItem,
    copyItem,
    pasteItem
  };

  return (
    <BOMContext.Provider value={value}>
      {children}
    </BOMContext.Provider>
  );
};